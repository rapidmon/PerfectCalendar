import { Todo } from '../types/todo';
import { Budget, MonthlyGoal } from '../types/budget';
import { Investment } from '../types/investment';
import { Savings } from '../types/savings';
import { FixedExpense } from '../types/fixedExpense';
import {
    loadTodos, saveTodos,
    loadBudgets, saveBudgets,
    loadCategories, saveCategories,
    loadFixedExpenseCategories, saveFixedExpenseCategories,
    loadMonthlyGoals, saveMonthlyGoals,
    loadAccounts, saveAccounts,
    savePreGroupAccounts, loadPreGroupAccounts, clearPreGroupAccounts,
    loadInvestments, saveInvestments,
    loadSavings, saveSavings,
    loadFixedExpenses, saveFixedExpenses as saveFixedExpensesToStorage,
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
    deleteSharedBudgetsBatch,
    addSharedBudgetsBatch,
    addSharedTodo,
    updateSharedTodo,
    deleteSharedTodo,
    deleteSharedTodosBatch,
    toggleSharedTodoComplete,
    saveSharedAccounts,
    getSharedAccounts,
    fetchMyBudgets,
    fetchMyTodos,
    subscribeToSharedCategoriesAsync,
    saveSharedCategories,
    getSharedCategories,
    subscribeToGroupAsync,
    saveSharedFixedExpenses,
    subscribeToSharedFixedExpensesAsync,
    SharedBudget,
    SharedTodo,
    SharedAccounts,
    SharedCategories,
    SharedFixedExpenses,
    AccountOwnership,
    Group,
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
    private _accountOwners: AccountOwnership = {};  // 통장 소유자 정보
    private _investments: Investment[] = [];
    private _savings: Savings[] = [];
    private _fixedExpenseSchedules: FixedExpense[] = [];
    private _isLoaded = false;

    // ── Group Sync State ────────────────────────────────────────
    private _isGroupConnected = false;
    private _groupCode: string | null = null;
    private _userName: string | null = null;
    private _memberNames: { [uid: string]: string } = {};
    private _memberColors: { [uid: string]: string } = {};
    private _budgetUnsubscribe: Unsubscribe | null = null;
    private _todoUnsubscribe: Unsubscribe | null = null;
    private _accountUnsubscribe: Unsubscribe | null = null;
    private _categoryUnsubscribe: Unsubscribe | null = null;
    private _groupUnsubscribe: Unsubscribe | null = null;
    private _fixedExpenseUnsubscribe: Unsubscribe | null = null;
    private _syncInProgress = false;
    private _fixingOrphans = false;
    private _recentlyDeletedAccounts = new Set<string>();

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
    get accountOwners(): AccountOwnership { return this._accountOwners; }
    get investments(): Investment[] { return this._investments; }
    get savings(): Savings[] { return this._savings; }
    get fixedExpenseSchedules(): FixedExpense[] { return this._fixedExpenseSchedules; }
    get isLoaded(): boolean { return this._isLoaded; }
    get isGroupConnected(): boolean { return this._isGroupConnected; }
    get groupCode(): string | null { return this._groupCode; }
    get userName(): string | null { return this._userName; }
    get memberNames(): { [uid: string]: string } { return this._memberNames; }
    get memberColors(): { [uid: string]: string } { return this._memberColors; }

    // ── Observer Pattern ───────────────────────────────────────
    subscribe(listener: Listener): () => void {
        this._listeners.add(listener);
        return () => { this._listeners.delete(listener); };
    }

    private notify(): void {
        this._listeners.forEach(fn => fn());
    }

    // ── Debounced Persistence ──────────────────────────────────
    private _pendingSaves = new Map<string, () => Promise<void>>();

    private debouncedSave(key: string, saveFn: () => Promise<void>): void {
        const existing = this._saveTimers.get(key);
        if (existing !== undefined) clearTimeout(existing);
        this._pendingSaves.set(key, saveFn);
        this._saveTimers.set(key, setTimeout(() => {
            const fn = this._pendingSaves.get(key);
            this._saveTimers.delete(key);
            this._pendingSaves.delete(key);
            if (fn) fn().catch(console.error);
        }, AppDataStore.DEBOUNCE_MS));
    }

    /** 앱 백그라운드/종료 전 호출 — 대기 중인 저장을 즉시 실행 */
    async flushPendingSaves(): Promise<void> {
        const promises: Promise<void>[] = [];
        for (const [key, timer] of this._saveTimers) {
            clearTimeout(timer);
            this._saveTimers.delete(key);
        }
        for (const [key, fn] of this._pendingSaves) {
            this._pendingSaves.delete(key);
            promises.push(fn().catch(console.error) as Promise<void>);
        }
        await Promise.all(promises);
    }

    // ── Initial Data Load ──────────────────────────────────────
    async loadAll(): Promise<void> {
        const [todos, budgets, categories, fixedCategories, monthlyGoals, accounts, investments, savings, fixedExpenseSchedules] =
            await Promise.all([
                loadTodos(),
                loadBudgets(),
                loadCategories(),
                loadFixedExpenseCategories(),
                loadMonthlyGoals(),
                loadAccounts(),
                loadInvestments(),
                loadSavings(),
                loadFixedExpenses(),
            ]);

        this._todos = todos;
        this._budgets = budgets;
        this._categories = categories;
        this._fixedCategories = fixedCategories;
        this._monthlyGoals = monthlyGoals;
        this._accounts = accounts;
        this._investments = investments;
        this._savings = savings;
        this._fixedExpenseSchedules = fixedExpenseSchedules;
        this._isLoaded = true;

        // 적금 자동 납입 체크 및 생성
        await this.checkAndCreateSavingsPayments();

        // 고정지출 자동 생성 체크
        await this.checkAndCreateFixedExpensePayments();

        this.notify();

        // 그룹 연결 상태 확인 및 동기화 시작
        await this.checkAndStartGroupSync();
    }

    // ── Savings Auto-Payment ────────────────────────────────────
    private async checkAndCreateSavingsPayments(): Promise<void> {
        const missingPayments = getMissingSavingsPayments(this._savings, this._budgets);

        if (missingPayments.length === 0) return;

        // savingsId로 적금 정보를 빠르게 찾기 위한 맵
        const savingsMap = new Map(this._savings.map(s => [s.id, s]));

        // 누락된 납입 기록을 가계부에 추가
        const newBudgets: Budget[] = missingPayments.map(payment => {
            const linkedSavings = savingsMap.get(payment.savingsId);
            return {
                id: `savings_${payment.savingsId}_${payment.paymentMonth}_${Date.now()}`,
                title: `${payment.bankName} ${payment.savingsName}`,
                money: payment.monthlyAmount,
                date: payment.paymentDate,
                type: 'INCOME' as const,
                category: '저축',
                account: linkedSavings?.linkedAccountName || '',
                savingsId: payment.savingsId,
                savingsPaymentDate: payment.paymentMonth,
            };
        });

        if (this._isGroupConnected) {
            // 그룹 모드: Firebase에 가계부 항목 일괄 추가
            addSharedBudgetsBatch(newBudgets.map(b => this.localBudgetToShared(b))).catch(console.error);
        } else {
            this._budgets = [...this._budgets, ...newBudgets];
            await saveBudgets(this._budgets);
        }

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
        if (this._syncInProgress) return;
        this._syncInProgress = true;

        try {
            await ensureAuthenticated();
            const groupCode = await getCurrentGroupCode();
            const userName = await getCurrentUserName();

            if (!groupCode) return;

            this._isGroupConnected = true;
            this._groupCode = groupCode;
            this._userName = userName;

            // 그룹 연결 전 로컬 통장 백업 (나갈 때 복원용)
            await savePreGroupAccounts(this._accounts);

            // 기존 구독 해제
            this.stopGroupSync();

            // 6개 구독을 병렬로 초기화
            const [budgetResult, todoResult, accountResult, categoryResult, groupResult, fixedExpenseResult] = await Promise.allSettled([
                subscribeToSharedBudgetsAsync(
                    (sharedBudgets: SharedBudget[]) => {
                        this._budgets = sharedBudgets.map(sb => this.sharedBudgetToLocal(sb));
                        this.notify();
                    },
                    (error) => console.error('Budget sync error:', error)
                ),
                subscribeToSharedTodosAsync(
                    (sharedTodos: SharedTodo[]) => {
                        this._todos = sharedTodos.map(st => this.sharedTodoToLocal(st));
                        this.notify();
                    },
                    (error) => console.error('Todo sync error:', error)
                ),
                subscribeToSharedAccountsAsync(
                    (sharedAccounts: SharedAccounts) => {
                        // 최근 로컬에서 삭제된 통장은 Firebase 스냅샷에서 제외
                        const incomingAccounts = (sharedAccounts.accounts || [])
                            .filter(acc => !this._recentlyDeletedAccounts.has(acc));
                        this._accounts = incomingAccounts;
                        this._accountOwners = sharedAccounts.owners || {};

                        // 소유자 없는 통장 보정: 현재 사용자로 할당 (무한 루프 방지)
                        const uid = getCurrentUid();
                        if (uid && this._accounts.length > 0 && !this._fixingOrphans) {
                            const orphaned = this._accounts.filter(acc => !this._accountOwners[acc]);
                            if (orphaned.length > 0) {
                                for (const acc of orphaned) {
                                    this._accountOwners[acc] = uid;
                                }
                                this._fixingOrphans = true;
                                saveSharedAccounts(this._accounts, this._accountOwners)
                                    .catch(console.error)
                                    .finally(() => { this._fixingOrphans = false; });
                            }
                        }

                        this.notify();
                    },
                    (error) => console.error('Account sync error:', error)
                ),
                subscribeToSharedCategoriesAsync(
                    (shared: SharedCategories) => {
                        this._categories = shared.categories || [];
                        this._fixedCategories = shared.fixedCategories || [];
                        this.notify();
                    },
                    (error) => console.error('Category sync error:', error)
                ),
                subscribeToGroupAsync(
                    (group: Group) => {
                        this._memberNames = group.memberNames || {};
                        this._memberColors = group.memberColors || {};
                        this.notify();
                    },
                    (error) => console.error('Group member sync error:', error)
                ),
                subscribeToSharedFixedExpensesAsync(
                    (shared: SharedFixedExpenses) => {
                        this._fixedExpenseSchedules = shared.expenses || [];
                        this.notify();
                    },
                    (error) => console.error('FixedExpense sync error:', error)
                ),
            ]);

            // fulfilled인 것만 unsubscribe 할당
            this._budgetUnsubscribe = budgetResult.status === 'fulfilled' ? (budgetResult.value || null) : null;
            this._todoUnsubscribe = todoResult.status === 'fulfilled' ? (todoResult.value || null) : null;
            this._accountUnsubscribe = accountResult.status === 'fulfilled' ? (accountResult.value || null) : null;
            this._categoryUnsubscribe = categoryResult.status === 'fulfilled' ? (categoryResult.value || null) : null;
            this._groupUnsubscribe = groupResult.status === 'fulfilled' ? (groupResult.value || null) : null;
            this._fixedExpenseUnsubscribe = fixedExpenseResult.status === 'fulfilled' ? (fixedExpenseResult.value || null) : null;

            // rejected 경고 로그
            if (budgetResult.status === 'rejected') console.warn('Budget subscription failed:', budgetResult.reason);
            if (todoResult.status === 'rejected') console.warn('Todo subscription failed:', todoResult.reason);
            if (accountResult.status === 'rejected') console.warn('Account subscription failed:', accountResult.reason);
            if (categoryResult.status === 'rejected') console.warn('Category subscription failed:', categoryResult.reason);
            if (groupResult.status === 'rejected') console.warn('Group subscription failed:', groupResult.reason);
            if (fixedExpenseResult.status === 'rejected') console.warn('FixedExpense subscription failed:', fixedExpenseResult.reason);

            this.notify();
        } catch (error) {
            console.error('Start group sync error:', error);
        } finally {
            this._syncInProgress = false;
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
        if (this._categoryUnsubscribe) {
            this._categoryUnsubscribe();
            this._categoryUnsubscribe = null;
        }
        if (this._groupUnsubscribe) {
            this._groupUnsubscribe();
            this._groupUnsubscribe = null;
        }
        if (this._fixedExpenseUnsubscribe) {
            this._fixedExpenseUnsubscribe();
            this._fixedExpenseUnsubscribe = null;
        }
    }

    async disconnectGroup(): Promise<void> {
        // 나가기 전에 그룹 코드와 UID, 통장/가계부 데이터를 저장
        const groupCode = this._groupCode;
        const uid = getCurrentUid();
        const prevAccounts = [...this._accounts];
        const prevOwners = { ...this._accountOwners };
        const prevAllBudgets = [...this._budgets]; // 그룹 전체 가계부 (구독 해제 전 캡처)

        // 에러 복구용: 현재 데이터를 백업 (구독 해제 전 그룹 데이터)
        const fallbackBudgets = [...this._budgets];
        const fallbackTodos = [...this._todos];
        const fallbackCategories = [...this._categories];
        const fallbackFixedCategories = [...this._fixedCategories];

        // 구독 먼저 해제 (Firebase 변경 감지로 데이터 덮어쓰기 방지)
        this.stopGroupSync();
        this._isGroupConnected = false;
        this._groupCode = null;
        this._userName = null;
        this._memberNames = {};
        this._memberColors = {};

        // 내가 작성한 데이터만 Firebase에서 가져오기
        if (groupCode) {
            try {
                // 내 데이터를 먼저 로컬로 가져온 뒤, 그룹에서 내 통장/연결 가계부 정리
                const [mySharedBudgets, mySharedTodos] = await Promise.all([
                    fetchMyBudgets(groupCode),
                    fetchMyTodos(groupCode),
                ]);

                // 빈 배열 반환 시: Firebase 에러로 빈 배열이면 fallback 사용
                // (fetchMyBudgets/fetchMyTodos는 에러 시 []를 반환하므로 구별이 어려움)
                // uid가 있는데 둘 다 비어있으면 fallback에서 내 데이터 추출
                const myBudgets: Budget[] = mySharedBudgets.length > 0
                    ? mySharedBudgets.map(sb => this.sharedBudgetToLocal(sb))
                    : (uid ? fallbackBudgets.filter(b => b.authorUid === uid) : []);

                const myTodos: Todo[] = mySharedTodos.length > 0
                    ? mySharedTodos.map(st => this.sharedTodoToLocal(st))
                    : (uid ? fallbackTodos.filter(t => t.authorUid === uid) : []);

                this._budgets = myBudgets;
                this._todos = myTodos;

                // 그룹 공유 데이터에서 내 할 일 일괄 삭제 (결과 대기)
                try {
                    if (mySharedTodos.length > 0) {
                        await deleteSharedTodosBatch(mySharedTodos.map(t => t.id));
                    }
                } catch (e) {
                    console.error('그룹에서 할 일 삭제 실패:', e);
                }

                // 그룹 공유 데이터에서 내 통장 + 연결된 가계부 항목 제거
                if (uid) {
                    const myAccountNames = new Set(
                        prevAccounts.filter(acc => prevOwners[acc] === uid)
                    );

                    if (myAccountNames.size > 0) {
                        // 내 통장에 연결된 가계부 항목을 그룹에서 일괄 삭제
                        const linkedBudgetIds = prevAllBudgets
                            .filter(b => b.account && myAccountNames.has(b.account))
                            .map(b => b.id);
                        try {
                            if (linkedBudgetIds.length > 0) {
                                await deleteSharedBudgetsBatch(linkedBudgetIds);
                            }
                        } catch (e) {
                            console.error('그룹에서 가계부 삭제 실패:', e);
                        }

                        // 내 통장 제거
                        const remainingAccounts = prevAccounts.filter(acc => !myAccountNames.has(acc));
                        const remainingOwners: AccountOwnership = {};
                        for (const acc of remainingAccounts) {
                            if (prevOwners[acc]) {
                                remainingOwners[acc] = prevOwners[acc];
                            }
                        }
                        try {
                            await saveSharedAccounts(remainingAccounts, remainingOwners);
                        } catch (e) {
                            console.error('그룹 통장 정리 실패:', e);
                        }
                    }
                }

                // 내 소유 통장만 유지 (소유자가 명확히 나인 것만)
                if (uid) {
                    const myAccounts = prevAccounts.filter(acc =>
                        prevOwners[acc] === uid
                    );

                    if (myAccounts.length > 0) {
                        this._accounts = myAccounts;
                    } else {
                        // 소유권 정보가 없으면 그룹 연결 전 백업에서 복원
                        const backup = await loadPreGroupAccounts();
                        if (backup && backup.accounts.length > 0) {
                            this._accounts = backup.accounts;
                        } else {
                            this._accounts = ['기본'];
                        }
                    }
                } else {
                    // uid가 없으면 백업에서 복원 시도
                    const backup = await loadPreGroupAccounts();
                    if (backup && backup.accounts.length > 0) {
                        this._accounts = backup.accounts;
                    } else {
                        this._accounts = ['기본'];
                    }
                }
                this._accountOwners = {};
                await clearPreGroupAccounts();

                // 로컬에도 저장
                await Promise.all([
                    saveBudgets(this._budgets),
                    saveTodos(this._todos),
                    saveAccounts(this._accounts),
                    saveCategories(this._categories),
                    saveFixedExpenseCategories(this._fixedCategories),
                ]);
            } catch (error) {
                console.error('그룹 해제 중 오류 발생:', error);
                // 실패 시 기존 그룹 데이터에서 내 데이터를 최대한 보존
                if (uid) {
                    this._budgets = fallbackBudgets.filter(b => b.authorUid === uid);
                    this._todos = fallbackTodos.filter(t => t.authorUid === uid);
                } else {
                    this._budgets = fallbackBudgets;
                    this._todos = fallbackTodos;
                }
                this._categories = fallbackCategories;
                this._fixedCategories = fallbackFixedCategories;

                // 통장은 백업에서 복원 시도
                const backup = await loadPreGroupAccounts().catch(() => null);
                if (backup && backup.accounts.length > 0) {
                    this._accounts = backup.accounts;
                } else {
                    this._accounts = ['기본'];
                }
                this._accountOwners = {};

                // fallback 데이터라도 로컬에 저장
                await Promise.all([
                    saveBudgets(this._budgets),
                    saveTodos(this._todos),
                    saveAccounts(this._accounts),
                    saveCategories(this._categories),
                    saveFixedExpenseCategories(this._fixedCategories),
                ]).catch(console.error);
            }
        } else {
            // 그룹 코드 없으면 백업에서 복원 시도
            const backup = await loadPreGroupAccounts().catch(() => null);
            if (backup && backup.accounts.length > 0) {
                this._accounts = backup.accounts;
            } else {
                this._accounts = ['기본'];
            }
            this._budgets = [];
            this._todos = [];
            this._accountOwners = {};
        }

        this.notify();
    }

    // ── Conversion Helpers ─────────────────────────────────────
    private sharedBudgetToLocal(sb: SharedBudget): Budget {
        return {
            id: sb.id,
            title: sb.memo || '',
            money: Math.abs(sb.money),
            date: sb.date,
            type: sb.money >= 0 ? 'INCOME' : 'EXPENSE',
            category: sb.category,
            account: sb.account,
            authorUid: sb.author,
            authorName: sb.authorName,
            savingsId: sb.savingsId,
            savingsPaymentDate: sb.savingsPaymentDate,
            fixedExpenseId: sb.fixedExpenseId,
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
            authorUid: st.author,
            authorName: st.authorName,
        };
    }

    private localBudgetToShared(budget: Budget): Omit<SharedBudget, 'id' | 'author' | 'authorName' | 'createdAt' | 'updatedAt'> {
        const result: Record<string, any> = {
            money: budget.type === 'EXPENSE' ? -Math.abs(budget.money) : Math.abs(budget.money),
            date: budget.date,
            account: budget.account || '',
            category: budget.category,
            memo: budget.title,
        };
        // Firestore는 undefined 값을 거부하므로 값이 있는 필드만 포함
        if (budget.savingsId) result.savingsId = budget.savingsId;
        if (budget.savingsPaymentDate) result.savingsPaymentDate = budget.savingsPaymentDate;
        if (budget.fixedExpenseId) result.fixedExpenseId = budget.fixedExpenseId;
        return result as Omit<SharedBudget, 'id' | 'author' | 'authorName' | 'createdAt' | 'updatedAt'>;
    }

    private localTodoToShared(todo: Todo): Omit<SharedTodo, 'id' | 'author' | 'authorName' | 'createdAt' | 'updatedAt'> {
        const result: Record<string, any> = {
            title: todo.title,
            type: todo.type,
            completed: todo.completed,
        };
        // Firestore는 undefined 값을 거부하므로 값이 있는 필드만 포함
        if (todo.recurringDay !== undefined) result.recurringDay = todo.recurringDay;
        if (todo.monthlyRecurringDay !== undefined) result.monthlyRecurringDay = todo.monthlyRecurringDay;
        if (todo.deadline !== undefined) result.deadline = todo.deadline;
        if (todo.specificDate !== undefined) result.specificDate = todo.specificDate;
        if (todo.dateRangeStart !== undefined) result.dateRangeStart = todo.dateRangeStart;
        if (todo.dateRangeEnd !== undefined) result.dateRangeEnd = todo.dateRangeEnd;
        return result as Omit<SharedTodo, 'id' | 'author' | 'authorName' | 'createdAt' | 'updatedAt'>;
    }

    // ── Todo CRUD ──────────────────────────────────────────────
    addTodo(todo: Todo): void {
        // 로컬 즉시 반영 (낙관적 업데이트)
        this._todos = [...this._todos, todo];
        this.notify();

        if (this._isGroupConnected) {
            addSharedTodo(this.localTodoToShared(todo)).catch(console.error);
        } else {
            this.debouncedSave('todos', () => saveTodos(this._todos));
        }
    }

    updateTodo(id: string, updater: (todo: Todo) => Todo): void {
        const existingTodo = this._todos.find(t => t.id === id);
        if (!existingTodo) return;

        const updatedTodo = updater(existingTodo);

        // 로컬 즉시 반영
        this._todos = this._todos.map(t => t.id === id ? updatedTodo : t);
        this.notify();

        if (this._isGroupConnected) {
            updateSharedTodo(id, this.localTodoToShared(updatedTodo)).catch(console.error);
        } else {
            this.debouncedSave('todos', () => saveTodos(this._todos));
        }
    }

    deleteTodo(id: string): void {
        // 로컬 즉시 반영
        this._todos = this._todos.filter(t => t.id !== id);
        this.notify();

        if (this._isGroupConnected) {
            deleteSharedTodo(id).catch(console.error);
        } else {
            this.debouncedSave('todos', () => saveTodos(this._todos));
        }
    }

    toggleTodo(id: string): void {
        const todo = this._todos.find(t => t.id === id);
        if (!todo) return;

        // 로컬 즉시 반영
        this._todos = this._todos.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
        );
        this.notify();

        if (this._isGroupConnected) {
            toggleSharedTodoComplete(id, !todo.completed).catch(console.error);
        } else {
            this.debouncedSave('todos', () => saveTodos(this._todos));
        }
    }

    // ── Budget CRUD ────────────────────────────────────────────
    addBudget(budget: Budget): void {
        // 로컬 즉시 반영
        this._budgets = [...this._budgets, budget];
        this.notify();

        if (this._isGroupConnected) {
            addSharedBudget(this.localBudgetToShared(budget)).catch(console.error);
        } else {
            this.debouncedSave('budgets', () => saveBudgets(this._budgets));
        }
    }

    updateBudget(id: string, updates: Partial<Budget>): void {
        // 로컬 즉시 반영
        this._budgets = this._budgets.map(b =>
            b.id === id ? { ...b, ...updates } : b
        );
        this.notify();

        if (this._isGroupConnected) {
            const existingBudget = this._budgets.find(b => b.id === id);
            if (existingBudget) {
                updateSharedBudget(id, this.localBudgetToShared(existingBudget)).catch(console.error);
            }
        } else {
            this.debouncedSave('budgets', () => saveBudgets(this._budgets));
        }
    }

    deleteBudget(id: string): void {
        // 로컬 즉시 반영
        this._budgets = this._budgets.filter(b => b.id !== id);
        this.notify();

        if (this._isGroupConnected) {
            deleteSharedBudget(id).catch(console.error);
        } else {
            this.debouncedSave('budgets', () => saveBudgets(this._budgets));
        }
    }

    // ── Category Management ────────────────────────────────────
    addCategory(category: string): void {
        this._categories = [...this._categories, category];
        this.notify();
        this.debouncedSave('categories', () => saveCategories(this._categories));

        if (this._isGroupConnected) {
            // 호출 시점의 카테고리를 캡처 (리스너가 this._categories를 덮어쓸 수 있으므로)
            const currentCats = [...this._categories];
            const currentFixed = [...this._fixedCategories];
            getSharedCategories().then(shared => {
                const mergedCats = [...new Set([...(shared?.categories || []), ...currentCats])];
                const mergedFixed = [...new Set([...(shared?.fixedCategories || []), ...currentFixed])];
                saveSharedCategories(mergedCats, mergedFixed).catch(console.error);
            }).catch(console.error);
        }
    }

    saveCategoriesAndFixed(cats: string[], fixed: string[]): void {
        this._categories = cats;
        this._fixedCategories = fixed;
        this.notify();
        this.debouncedSave('categories', () => saveCategories(this._categories));
        this.debouncedSave('fixedCategories', () => saveFixedExpenseCategories(this._fixedCategories));

        if (this._isGroupConnected) {
            // 카테고리 관리 모달에서 전체 교체이므로 merge 없이 직접 저장
            // (merge 시 삭제한 카테고리가 Firebase 이전 데이터로 다시 살아남)
            saveSharedCategories(cats, fixed).catch(console.error);
        }
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
            saveSharedAccounts(this._accounts, this._accountOwners).catch(console.error);
        }

        this.notify();
        this.debouncedSave('accounts', () => saveAccounts(this._accounts));
    }

    saveAccountsAndBalances(accs: string[], owners?: AccountOwnership): void {
        // 삭제된 통장에 연결된 적금도 함께 삭제
        const removedAccounts = this._accounts.filter(acc => !accs.includes(acc));
        if (removedAccounts.length > 0) {
            const linkedSavings = this._savings.filter(s =>
                s.linkedAccountName && removedAccounts.includes(s.linkedAccountName)
            );
            if (linkedSavings.length > 0) {
                const idsToDelete = new Set(linkedSavings.map(s => s.id));
                this._savings = this._savings.filter(s => !idsToDelete.has(s.id));
                this.debouncedSave('savings', () => saveSavings(this._savings));

                // 관련 가계부 항목 삭제
                if (this._isGroupConnected) {
                    const budgetIdsToDelete = this._budgets
                        .filter(b => b.savingsId && idsToDelete.has(b.savingsId))
                        .map(b => b.id);
                    // 그룹 모드에서도 로컬 _budgets 즉시 업데이트
                    this._budgets = this._budgets.filter(b => !b.savingsId || !idsToDelete.has(b.savingsId));
                    deleteSharedBudgetsBatch(budgetIdsToDelete).catch(console.error);
                } else {
                    this._budgets = this._budgets.filter(b => !b.savingsId || !idsToDelete.has(b.savingsId));
                    this.debouncedSave('budgets', () => saveBudgets(this._budgets));
                }
            }
        }

        const prevAccounts = new Set(this._accounts);
        this._accounts = accs;

        // 소유자 정보: 명시적으로 전달된 경우 사용, 아니면 자동 할당
        const newOwners: AccountOwnership = {};
        const uid = this._isGroupConnected ? getCurrentUid() : null;
        for (const acc of accs) {
            if (owners && owners[acc]) {
                newOwners[acc] = owners[acc];
            } else if (this._accountOwners[acc]) {
                newOwners[acc] = this._accountOwners[acc];
            } else if (uid && !prevAccounts.has(acc)) {
                // 새로 추가된 통장: 현재 사용자를 소유자로 설정
                newOwners[acc] = uid;
            }
        }
        this._accountOwners = newOwners;

        this.notify();

        if (this._isGroupConnected) {
            // 그룹 연결 시 Firebase에 저장
            saveSharedAccounts(accs, this._accountOwners).catch(console.error);
        }

        this.debouncedSave('accounts', () => saveAccounts(this._accounts));
    }

    // ── Monthly Goals ──────────────────────────────────────────
    setMonthlyGoal(monthKey: string, amount: number): void {
        this._monthlyGoals = { ...this._monthlyGoals, [monthKey]: amount };
        this.notify();
        this.debouncedSave('monthlyGoals', () => saveMonthlyGoals(this._monthlyGoals));
    }

    deleteMonthlyGoal(monthKey: string): void {
        const next = { ...this._monthlyGoals };
        delete next[monthKey];
        this._monthlyGoals = next;
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

            // 그룹 연결 시 현재 사용자를 소유자로 설정
            if (this._isGroupConnected) {
                const uid = getCurrentUid();
                if (uid) {
                    this._accountOwners = { ...this._accountOwners, [savings.linkedAccountName]: uid };
                }
                saveSharedAccounts(this._accounts, this._accountOwners).catch(console.error);
            }

            this.debouncedSave('accounts', () => saveAccounts(this._accounts));
        }

        this.notify();
        this.debouncedSave('savings', () => saveSavings(this._savings));

        // 새 적금 추가 시 자동 납입 생성 (정기적금만)
        if (savings.type === 'INSTALLMENT_SAVINGS') {
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
            type: 'INCOME' as const,
            category: '저축',
            account: savings.linkedAccountName || '',
            savingsId: payment.savingsId,
            savingsPaymentDate: payment.paymentMonth,
        }));

        if (this._isGroupConnected) {
            // 그룹 모드: Firebase에 가계부 항목 일괄 추가
            addSharedBudgetsBatch(newBudgets.map(b => this.localBudgetToShared(b))).catch(console.error);
        } else {
            this._budgets = [...this._budgets, ...newBudgets];
            this.debouncedSave('budgets', () => saveBudgets(this._budgets));
        }

        this.notify();
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
        if (deleteRelatedBudgets) {
            if (this._isGroupConnected) {
                const relatedIds = this._budgets.filter(b => b.savingsId === id).map(b => b.id);
                // 그룹 모드에서도 로컬 _budgets 즉시 업데이트 (Firebase 리스너 대기 없이)
                this._budgets = this._budgets.filter(b => b.savingsId !== id);
                deleteSharedBudgetsBatch(relatedIds).catch(console.error);
            } else {
                this._budgets = this._budgets.filter(b => b.savingsId !== id);
                this.debouncedSave('budgets', () => saveBudgets(this._budgets));
            }
        }

        // 연결된 통장도 삭제
        if (deleteLinkedAccount && savingsToDelete?.linkedAccountName) {
            const accountName = savingsToDelete.linkedAccountName;
            this._accounts = this._accounts.filter(a => a !== accountName);

            // 소유자 정보도 정리
            const newOwners = { ...this._accountOwners };
            delete newOwners[accountName];
            this._accountOwners = newOwners;

            this.debouncedSave('accounts', () => saveAccounts(this._accounts));

            // 그룹 연결 시 Firebase에도 저장
            if (this._isGroupConnected) {
                // Firebase 리스너가 이전 데이터로 덮어쓰지 않도록 보호
                this._recentlyDeletedAccounts.add(accountName);
                saveSharedAccounts(this._accounts, this._accountOwners)
                    .catch(console.error)
                    .finally(() => this._recentlyDeletedAccounts.delete(accountName));
            }
        }

        this.notify();
        this.debouncedSave('savings', () => saveSavings(this._savings));
    }

    // ── Fixed Expense Schedule CRUD ─────────────────────────────
    saveFixedExpenseSchedules(expenses: FixedExpense[]): void {
        this._fixedExpenseSchedules = expenses;
        this.notify();
        this.debouncedSave('fixedExpenseSchedules', () => saveFixedExpensesToStorage(this._fixedExpenseSchedules));

        if (this._isGroupConnected) {
            saveSharedFixedExpenses(this._fixedExpenseSchedules).catch(console.error);
        }

        // 새로 저장 후 자동 생성 체크
        this.checkAndCreateFixedExpensePayments();
    }

    // ── Fixed Expense Auto-Payment ──────────────────────────────
    private async checkAndCreateFixedExpensePayments(): Promise<void> {
        if (this._fixedExpenseSchedules.length === 0) return;

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const yearMonth = `${year}-${String(month).padStart(2, '0')}`;

        // 이미 생성된 고정지출 budget의 ID Set
        const existingSet = new Set(
            this._budgets
                .filter(b => b.fixedExpenseId)
                .map(b => `${b.fixedExpenseId}_${b.date}`)
        );

        const newBudgets: Budget[] = [];

        for (const fe of this._fixedExpenseSchedules) {
            // 해당 월의 마지막 날 계산 (31일 지정인데 월이 30일까지인 경우)
            const lastDay = new Date(year, month, 0).getDate();
            const day = Math.min(fe.dayOfMonth, lastDay);
            const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`;

            // 미래 날짜면 스킵
            const expenseDate = new Date(year, month - 1, day);
            if (expenseDate > today) continue;

            // 이미 생성됐으면 스킵
            const key = `${fe.id}_${dateStr}`;
            if (existingSet.has(key)) continue;

            newBudgets.push({
                id: `fe_${fe.id}_${yearMonth}_${Date.now()}`,
                title: fe.title,
                money: fe.money,
                date: dateStr,
                type: 'EXPENSE',
                category: fe.category,
                account: fe.account,
                fixedExpenseId: fe.id,
            });
        }

        if (newBudgets.length === 0) return;

        if (this._isGroupConnected) {
            addSharedBudgetsBatch(newBudgets.map(b => this.localBudgetToShared(b))).catch(console.error);
        } else {
            this._budgets = [...this._budgets, ...newBudgets];
            this.debouncedSave('budgets', () => saveBudgets(this._budgets));
        }

        this.notify();
        console.log(`고정지출 자동 생성 ${newBudgets.length}건`);
    }
}
