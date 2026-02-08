import { Todo } from '../types/todo';
import { Budget, MonthlyGoal, AccountBalances } from '../types/budget';
import { Investment } from '../types/investment';
import { Savings } from '../types/savings';
import {
    loadTodos, saveTodos,
    loadBudgets, saveBudgets,
    loadCategories, saveCategories,
    loadFixedExpenseCategories, saveFixedExpenseCategories,
    loadMonthlyGoals, saveMonthlyGoals,
    loadAccounts, saveAccounts,
    loadAccountBalances, saveAccountBalances,
    loadInvestments, saveInvestments,
    loadSavings, saveSavings,
} from '../utils/storage';
import { getMissingSavingsPayments } from '../utils/savingsCalculator';
import {
    isGroupConnected,
    getCurrentGroupCode,
    getCurrentUserName,
    getCurrentUid,
    ensureAuthenticated,
    subscribeToSharedBudgetsAsync,
    subscribeToSharedTodosAsync,
    subscribeToSharedAccountsAsync,
    addSharedBudget,
    updateSharedBudget,
    deleteSharedBudget,
    addSharedTodo,
    updateSharedTodo,
    deleteSharedTodo,
    toggleSharedTodoComplete,
    saveSharedAccounts,
    getSharedAccounts,
    fetchMyBudgets,
    fetchMyTodos,
    SharedBudget,
    SharedTodo,
    SharedAccounts,
    AccountOwnership,
} from '../firebase';

type Listener = () => void;
type Unsubscribe = () => void;

/**
 * AppDataStore - Singleton class that centralizes all app data management.
 *
 * Responsibilities:
 *  - Single source of truth for todos, budgets, categories, accounts, goals
 *  - Debounced persistence to AsyncStorage (prevents excessive I/O)
 *  - Observer pattern for React integration (notify on state changes)
 *  - Encapsulated CRUD operations with immutable state updates
 */
export class AppDataStore {
    // ── Singleton ──────────────────────────────────────────────
    private static _instance: AppDataStore;

    private constructor() {}

    static getInstance(): AppDataStore {
        if (!AppDataStore._instance) {
            AppDataStore._instance = new AppDataStore();
        }
        return AppDataStore._instance;
    }

    // ── Private State ──────────────────────────────────────────
    private _todos: Todo[] = [];
    private _budgets: Budget[] = [];
    private _categories: string[] = [];
    private _accounts: string[] = [];
    private _fixedCategories: string[] = [];
    private _monthlyGoals: MonthlyGoal = {};
    private _accountBalances: AccountBalances = {};
    private _accountOwners: AccountOwnership = {};  // 통장 소유자 정보
    private _investments: Investment[] = [];
    private _savings: Savings[] = [];
    private _isLoaded = false;

    // ── Group Sync State ────────────────────────────────────────
    private _isGroupConnected = false;
    private _groupCode: string | null = null;
    private _userName: string | null = null;
    private _budgetUnsubscribe: Unsubscribe | null = null;
    private _todoUnsubscribe: Unsubscribe | null = null;
    private _accountUnsubscribe: Unsubscribe | null = null;

    private _saveTimers = new Map<string, ReturnType<typeof setTimeout>>();
    private _listeners = new Set<Listener>();

    private static readonly DEBOUNCE_MS = 500;

    // ── Public Getters (read-only access) ──────────────────────
    get todos(): Todo[] { return this._todos; }
    get budgets(): Budget[] { return this._budgets; }
    get categories(): string[] { return this._categories; }
    get accounts(): string[] { return this._accounts; }
    get fixedCategories(): string[] { return this._fixedCategories; }
    get monthlyGoals(): MonthlyGoal { return this._monthlyGoals; }
    get accountBalances(): AccountBalances { return this._accountBalances; }
    get accountOwners(): AccountOwnership { return this._accountOwners; }
    get investments(): Investment[] { return this._investments; }
    get savings(): Savings[] { return this._savings; }
    get isLoaded(): boolean { return this._isLoaded; }
    get isGroupConnected(): boolean { return this._isGroupConnected; }
    get groupCode(): string | null { return this._groupCode; }
    get userName(): string | null { return this._userName; }

    // ── Observer Pattern ───────────────────────────────────────
    subscribe(listener: Listener): () => void {
        this._listeners.add(listener);
        return () => { this._listeners.delete(listener); };
    }

    private notify(): void {
        this._listeners.forEach(fn => fn());
    }

    // ── Debounced Persistence ──────────────────────────────────
    private debouncedSave(key: string, saveFn: () => Promise<void>): void {
        const existing = this._saveTimers.get(key);
        if (existing !== undefined) clearTimeout(existing);
        this._saveTimers.set(key, setTimeout(() => {
            saveFn();
            this._saveTimers.delete(key);
        }, AppDataStore.DEBOUNCE_MS));
    }

    // ── Initial Data Load ──────────────────────────────────────
    async loadAll(): Promise<void> {
        const [todos, budgets, categories, fixedCategories, monthlyGoals, accounts, accountBalances, investments, savings] =
            await Promise.all([
                loadTodos(),
                loadBudgets(),
                loadCategories(),
                loadFixedExpenseCategories(),
                loadMonthlyGoals(),
                loadAccounts(),
                loadAccountBalances(),
                loadInvestments(),
                loadSavings(),
            ]);

        this._todos = todos;
        this._budgets = budgets;
        this._categories = categories;
        this._fixedCategories = fixedCategories;
        this._monthlyGoals = monthlyGoals;
        this._accounts = accounts;
        this._accountBalances = accountBalances;
        this._investments = investments;
        this._savings = savings;
        this._isLoaded = true;

        // 적금 자동 납입 체크 및 생성
        await this.checkAndCreateSavingsPayments();

        this.notify();

        // 그룹 연결 상태 확인 및 동기화 시작
        await this.checkAndStartGroupSync();
    }

    // ── Savings Auto-Payment ────────────────────────────────────
    private async checkAndCreateSavingsPayments(): Promise<void> {
        // 그룹 연결 중일 때는 로컬 자동 생성 스킵 (그룹에서는 별도 처리 필요)
        if (this._isGroupConnected) return;

        const missingPayments = getMissingSavingsPayments(this._savings, this._budgets);

        if (missingPayments.length === 0) return;

        // savingsId로 적금 정보를 빠르게 찾기 위한 맵
        const savingsMap = new Map(this._savings.map(s => [s.id, s]));

        // 누락된 납입 기록을 가계부에 추가
        const newBudgets: Budget[] = missingPayments.map(payment => {
            const savings = savingsMap.get(payment.savingsId);
            return {
                id: `savings_${payment.savingsId}_${payment.paymentMonth}_${Date.now()}`,
                title: `${payment.bankName} ${payment.savingsName}`,
                money: payment.monthlyAmount,
                date: payment.paymentDate,
                type: 'EXPENSE' as const,
                category: '저축',
                account: savings?.linkedAccountName,  // 연결된 적금 통장으로 입금
                savingsId: payment.savingsId,
                savingsPaymentDate: payment.paymentMonth,
            };
        });

        this._budgets = [...this._budgets, ...newBudgets];

        // 저장
        await saveBudgets(this._budgets);

        console.log(`적금 자동 납입 ${newBudgets.length}건 생성됨`);
    }

    // ── Group Sync Methods ─────────────────────────────────────
    async checkAndStartGroupSync(): Promise<void> {
        try {
            const connected = await isGroupConnected();
            if (connected) {
                await this.startGroupSync();
            }
        } catch (error) {
            console.error('Group sync check error:', error);
        }
    }

    async startGroupSync(): Promise<void> {
        try {
            await ensureAuthenticated();
            const groupCode = await getCurrentGroupCode();
            const userName = await getCurrentUserName();

            if (!groupCode) return;

            this._isGroupConnected = true;
            this._groupCode = groupCode;
            this._userName = userName;

            // 기존 구독 해제
            this.stopGroupSync();

            // Budget 실시간 구독
            this._budgetUnsubscribe = await subscribeToSharedBudgetsAsync(
                (sharedBudgets: SharedBudget[]) => {
                    this._budgets = sharedBudgets.map(sb => this.sharedBudgetToLocal(sb));
                    this.notify();
                },
                (error) => console.error('Budget sync error:', error)
            ) || null;

            // Todo 실시간 구독
            this._todoUnsubscribe = await subscribeToSharedTodosAsync(
                (sharedTodos: SharedTodo[]) => {
                    this._todos = sharedTodos.map(st => this.sharedTodoToLocal(st));
                    this.notify();
                },
                (error) => console.error('Todo sync error:', error)
            ) || null;

            // 통장 실시간 구독
            this._accountUnsubscribe = await subscribeToSharedAccountsAsync(
                (sharedAccounts: SharedAccounts) => {
                    this._accounts = sharedAccounts.accounts || [];
                    this._accountBalances = sharedAccounts.balances || {};
                    this._accountOwners = sharedAccounts.owners || {};
                    this.notify();
                },
                (error) => console.error('Account sync error:', error)
            ) || null;

            this.notify();
        } catch (error) {
            console.error('Start group sync error:', error);
        }
    }

    stopGroupSync(): void {
        if (this._budgetUnsubscribe) {
            this._budgetUnsubscribe();
            this._budgetUnsubscribe = null;
        }
        if (this._todoUnsubscribe) {
            this._todoUnsubscribe();
            this._todoUnsubscribe = null;
        }
        if (this._accountUnsubscribe) {
            this._accountUnsubscribe();
            this._accountUnsubscribe = null;
        }
    }

    async disconnectGroup(): Promise<void> {
        // 나가기 전에 그룹 코드 저장 (내 데이터 조회용)
        const groupCode = this._groupCode;

        this.stopGroupSync();
        this._isGroupConnected = false;
        this._groupCode = null;
        this._userName = null;

        // 내가 작성한 데이터만 Firebase에서 가져오기
        if (groupCode) {
            try {
                const [mySharedBudgets, mySharedTodos] = await Promise.all([
                    fetchMyBudgets(groupCode),
                    fetchMyTodos(groupCode),
                ]);

                // SharedBudget → Budget 변환
                const myBudgets: Budget[] = mySharedBudgets.map(sb => this.sharedBudgetToLocal(sb));

                // SharedTodo → Todo 변환
                const myTodos: Todo[] = mySharedTodos.map(st => this.sharedTodoToLocal(st));

                this._budgets = myBudgets;
                this._todos = myTodos;

                // 로컬에도 저장
                await Promise.all([
                    saveBudgets(myBudgets),
                    saveTodos(myTodos),
                ]);
            } catch (error) {
                console.error('내 데이터 가져오기 실패:', error);
                // 실패 시 빈 배열로 초기화
                this._budgets = [];
                this._todos = [];
            }
        } else {
            // 그룹 코드 없으면 빈 배열
            this._budgets = [];
            this._todos = [];
        }

        this.notify();
    }

    // ── Conversion Helpers ─────────────────────────────────────
    private sharedBudgetToLocal(sb: SharedBudget): Budget {
        return {
            id: sb.id,
            title: sb.authorName,
            money: Math.abs(sb.money),
            date: sb.date,
            type: sb.money >= 0 ? 'INCOME' : 'EXPENSE',
            category: sb.category,
            account: sb.account,
        };
    }

    private sharedTodoToLocal(st: SharedTodo): Todo {
        return {
            id: st.id,
            title: st.title,
            type: st.type,
            completed: st.completed,
            recurringDay: st.recurringDay,
            monthlyRecurringDay: st.monthlyRecurringDay,
            deadline: st.deadline,
            specificDate: st.specificDate,
            dateRangeStart: st.dateRangeStart,
            dateRangeEnd: st.dateRangeEnd,
            createdAt: new Date(st.createdAt).toISOString(),
        };
    }

    private localBudgetToShared(budget: Budget): Omit<SharedBudget, 'id' | 'author' | 'authorName' | 'createdAt' | 'updatedAt'> {
        return {
            money: budget.type === 'EXPENSE' ? -Math.abs(budget.money) : Math.abs(budget.money),
            date: budget.date,
            account: budget.account || '',
            category: budget.category,
        };
    }

    private localTodoToShared(todo: Todo): Omit<SharedTodo, 'id' | 'author' | 'authorName' | 'createdAt' | 'updatedAt'> {
        return {
            title: todo.title,
            type: todo.type,
            completed: todo.completed,
            recurringDay: todo.recurringDay,
            monthlyRecurringDay: todo.monthlyRecurringDay,
            deadline: todo.deadline,
            specificDate: todo.specificDate,
            dateRangeStart: todo.dateRangeStart,
            dateRangeEnd: todo.dateRangeEnd,
        };
    }

    // ── Todo CRUD ──────────────────────────────────────────────
    addTodo(todo: Todo): void {
        if (this._isGroupConnected) {
            // Firebase에 추가 (실시간 구독이 로컬 상태 업데이트)
            addSharedTodo(this.localTodoToShared(todo)).catch(console.error);
        } else {
            this._todos = [...this._todos, todo];
            this.notify();
            this.debouncedSave('todos', () => saveTodos(this._todos));
        }
    }

    updateTodo(id: string, updater: (todo: Todo) => Todo): void {
        const existingTodo = this._todos.find(t => t.id === id);
        if (!existingTodo) return;

        const updatedTodo = updater(existingTodo);

        if (this._isGroupConnected) {
            updateSharedTodo(id, this.localTodoToShared(updatedTodo)).catch(console.error);
        } else {
            this._todos = this._todos.map(t => t.id === id ? updatedTodo : t);
            this.notify();
            this.debouncedSave('todos', () => saveTodos(this._todos));
        }
    }

    deleteTodo(id: string): void {
        if (this._isGroupConnected) {
            deleteSharedTodo(id).catch(console.error);
        } else {
            this._todos = this._todos.filter(t => t.id !== id);
            this.notify();
            this.debouncedSave('todos', () => saveTodos(this._todos));
        }
    }

    toggleTodo(id: string): void {
        const todo = this._todos.find(t => t.id === id);
        if (!todo) return;

        if (this._isGroupConnected) {
            toggleSharedTodoComplete(id, !todo.completed).catch(console.error);
        } else {
            this._todos = this._todos.map(t =>
                t.id === id ? { ...t, completed: !t.completed } : t
            );
            this.notify();
            this.debouncedSave('todos', () => saveTodos(this._todos));
        }
    }

    // ── Budget CRUD ────────────────────────────────────────────
    addBudget(budget: Budget): void {
        if (this._isGroupConnected) {
            // Firebase에 추가 (실시간 구독이 로컬 상태 업데이트)
            addSharedBudget(this.localBudgetToShared(budget)).catch(console.error);
        } else {
            this._budgets = [...this._budgets, budget];
            this.notify();
            this.debouncedSave('budgets', () => saveBudgets(this._budgets));
        }
    }

    updateBudget(id: string, updates: Partial<Budget>): void {
        if (this._isGroupConnected) {
            const existingBudget = this._budgets.find(b => b.id === id);
            if (existingBudget) {
                const updatedBudget = { ...existingBudget, ...updates };
                updateSharedBudget(id, this.localBudgetToShared(updatedBudget)).catch(console.error);
            }
        } else {
            this._budgets = this._budgets.map(b =>
                b.id === id ? { ...b, ...updates } : b
            );
            this.notify();
            this.debouncedSave('budgets', () => saveBudgets(this._budgets));
        }
    }

    deleteBudget(id: string): void {
        if (this._isGroupConnected) {
            deleteSharedBudget(id).catch(console.error);
        } else {
            this._budgets = this._budgets.filter(b => b.id !== id);
            this.notify();
            this.debouncedSave('budgets', () => saveBudgets(this._budgets));
        }
    }

    // ── Category Management ────────────────────────────────────
    addCategory(category: string): void {
        this._categories = [...this._categories, category];
        this.notify();
        this.debouncedSave('categories', () => saveCategories(this._categories));
    }

    saveCategoriesAndFixed(cats: string[], fixed: string[]): void {
        this._categories = cats;
        this._fixedCategories = fixed;
        this.notify();
        this.debouncedSave('categories', () => saveCategories(this._categories));
        this.debouncedSave('fixedCategories', () => saveFixedExpenseCategories(this._fixedCategories));
    }

    // ── Account Management ─────────────────────────────────────
    addAccount(account: string): void {
        this._accounts = [...this._accounts, account];

        // 그룹 연결 시 현재 사용자를 소유자로 설정
        if (this._isGroupConnected) {
            const uid = getCurrentUid();
            if (uid) {
                this._accountOwners = { ...this._accountOwners, [account]: uid };
            }
            saveSharedAccounts(this._accounts, this._accountBalances, this._accountOwners).catch(console.error);
        }

        this.notify();
        this.debouncedSave('accounts', () => saveAccounts(this._accounts));
    }

    saveAccountsAndBalances(accs: string[], balances: AccountBalances): void {
        this._accounts = accs;
        this._accountBalances = balances;

        // 삭제된 통장의 소유자 정보도 제거
        const newOwners: AccountOwnership = {};
        for (const acc of accs) {
            if (this._accountOwners[acc]) {
                newOwners[acc] = this._accountOwners[acc];
            }
        }
        this._accountOwners = newOwners;

        this.notify();

        if (this._isGroupConnected) {
            // 그룹 연결 시 Firebase에 저장
            saveSharedAccounts(accs, balances, this._accountOwners).catch(console.error);
        }

        this.debouncedSave('accounts', () => saveAccounts(this._accounts));
        this.debouncedSave('accountBalances', () => saveAccountBalances(this._accountBalances));
    }

    // ── Monthly Goals ──────────────────────────────────────────
    setMonthlyGoal(monthKey: string, amount: number): void {
        this._monthlyGoals = { ...this._monthlyGoals, [monthKey]: amount };
        this.notify();
        this.debouncedSave('monthlyGoals', () => saveMonthlyGoals(this._monthlyGoals));
    }

    // ── Investment CRUD ───────────────────────────────────────
    addInvestment(investment: Investment): void {
        this._investments = [...this._investments, investment];
        this.notify();
        this.debouncedSave('investments', () => saveInvestments(this._investments));
    }

    updateInvestment(id: string, updates: Partial<Investment>): void {
        this._investments = this._investments.map(inv =>
            inv.id === id ? { ...inv, ...updates, updatedAt: new Date().toISOString() } : inv
        );
        this.notify();
        this.debouncedSave('investments', () => saveInvestments(this._investments));
    }

    deleteInvestment(id: string): void {
        this._investments = this._investments.filter(inv => inv.id !== id);
        this.notify();
        this.debouncedSave('investments', () => saveInvestments(this._investments));
    }

    // ── Savings CRUD ──────────────────────────────────────────
    addSavings(savings: Savings): void {
        this._savings = [...this._savings, savings];

        // 연결된 통장 자동 생성
        if (savings.linkedAccountName && !this._accounts.includes(savings.linkedAccountName)) {
            this._accounts = [...this._accounts, savings.linkedAccountName];
            // 초기 잔액 설정
            if (savings.initialBalance && savings.initialBalance > 0) {
                this._accountBalances = {
                    ...this._accountBalances,
                    [savings.linkedAccountName]: savings.initialBalance,
                };
                this.debouncedSave('accountBalances', () => saveAccountBalances(this._accountBalances));
            }

            // 그룹 연결 시 현재 사용자를 소유자로 설정
            if (this._isGroupConnected) {
                const uid = getCurrentUid();
                if (uid) {
                    this._accountOwners = { ...this._accountOwners, [savings.linkedAccountName]: uid };
                }
                saveSharedAccounts(this._accounts, this._accountBalances, this._accountOwners).catch(console.error);
            }

            this.debouncedSave('accounts', () => saveAccounts(this._accounts));
        }

        this.notify();
        this.debouncedSave('savings', () => saveSavings(this._savings));

        // 새 적금 추가 시 자동 납입 생성 (정기적금만)
        if (!this._isGroupConnected && savings.type === 'INSTALLMENT_SAVINGS') {
            this.createSavingsPaymentsForSingle(savings);
        }
    }

    // 단일 적금에 대한 자동 납입 생성
    private async createSavingsPaymentsForSingle(savings: Savings): Promise<void> {
        const missingPayments = getMissingSavingsPayments([savings], this._budgets);

        if (missingPayments.length === 0) return;

        const newBudgets: Budget[] = missingPayments.map(payment => ({
            id: `savings_${payment.savingsId}_${payment.paymentMonth}_${Date.now()}`,
            title: `${payment.bankName} ${payment.savingsName}`,
            money: payment.monthlyAmount,
            date: payment.paymentDate,
            type: 'EXPENSE' as const,
            category: '저축',
            account: savings.linkedAccountName,  // 연결된 적금 통장으로 입금
            savingsId: payment.savingsId,
            savingsPaymentDate: payment.paymentMonth,
        }));

        this._budgets = [...this._budgets, ...newBudgets];
        this.notify();
        this.debouncedSave('budgets', () => saveBudgets(this._budgets));
    }

    updateSavings(id: string, updates: Partial<Savings>): void {
        this._savings = this._savings.map(s =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
        );
        this.notify();
        this.debouncedSave('savings', () => saveSavings(this._savings));
    }

    deleteSavings(id: string, deleteRelatedBudgets: boolean = true, deleteLinkedAccount: boolean = true): void {
        const savingsToDelete = this._savings.find(s => s.id === id);
        this._savings = this._savings.filter(s => s.id !== id);

        // 관련 가계부 항목도 삭제
        if (deleteRelatedBudgets && !this._isGroupConnected) {
            this._budgets = this._budgets.filter(b => b.savingsId !== id);
            this.debouncedSave('budgets', () => saveBudgets(this._budgets));
        }

        // 연결된 통장도 삭제
        if (deleteLinkedAccount && savingsToDelete?.linkedAccountName) {
            const accountName = savingsToDelete.linkedAccountName;
            this._accounts = this._accounts.filter(a => a !== accountName);
            const newBalances = { ...this._accountBalances };
            delete newBalances[accountName];
            this._accountBalances = newBalances;
            this.debouncedSave('accounts', () => saveAccounts(this._accounts));
            this.debouncedSave('accountBalances', () => saveAccountBalances(this._accountBalances));

            // 그룹 연결 시 Firebase에도 저장
            if (this._isGroupConnected) {
                saveSharedAccounts(this._accounts, this._accountBalances).catch(console.error);
            }
        }

        this.notify();
        this.debouncedSave('savings', () => saveSavings(this._savings));
    }
}
