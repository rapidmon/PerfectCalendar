import { Todo } from '../types/todo';
import { Budget, MonthlyGoal, AccountBalances } from '../types/budget';
import {
    loadTodos, saveTodos,
    loadBudgets, saveBudgets,
    loadCategories, saveCategories,
    loadFixedExpenseCategories, saveFixedExpenseCategories,
    loadMonthlyGoals, saveMonthlyGoals,
    loadAccounts, saveAccounts,
    loadAccountBalances, saveAccountBalances,
} from '../utils/storage';

type Listener = () => void;

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
    private _isLoaded = false;

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
    get isLoaded(): boolean { return this._isLoaded; }

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
        const [todos, budgets, categories, fixedCategories, monthlyGoals, accounts, accountBalances] =
            await Promise.all([
                loadTodos(),
                loadBudgets(),
                loadCategories(),
                loadFixedExpenseCategories(),
                loadMonthlyGoals(),
                loadAccounts(),
                loadAccountBalances(),
            ]);

        this._todos = todos;
        this._budgets = budgets;
        this._categories = categories;
        this._fixedCategories = fixedCategories;
        this._monthlyGoals = monthlyGoals;
        this._accounts = accounts;
        this._accountBalances = accountBalances;
        this._isLoaded = true;
        this.notify();
    }

    // ── Todo CRUD ──────────────────────────────────────────────
    addTodo(todo: Todo): void {
        this._todos = [...this._todos, todo];
        this.notify();
        this.debouncedSave('todos', () => saveTodos(this._todos));
    }

    updateTodo(id: string, updater: (todo: Todo) => Todo): void {
        this._todos = this._todos.map(t => t.id === id ? updater(t) : t);
        this.notify();
        this.debouncedSave('todos', () => saveTodos(this._todos));
    }

    deleteTodo(id: string): void {
        this._todos = this._todos.filter(t => t.id !== id);
        this.notify();
        this.debouncedSave('todos', () => saveTodos(this._todos));
    }

    toggleTodo(id: string): void {
        this._todos = this._todos.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
        );
        this.notify();
        this.debouncedSave('todos', () => saveTodos(this._todos));
    }

    // ── Budget CRUD ────────────────────────────────────────────
    addBudget(budget: Budget): void {
        this._budgets = [...this._budgets, budget];
        this.notify();
        this.debouncedSave('budgets', () => saveBudgets(this._budgets));
    }

    updateBudget(id: string, updates: Partial<Budget>): void {
        this._budgets = this._budgets.map(b =>
            b.id === id ? { ...b, ...updates } : b
        );
        this.notify();
        this.debouncedSave('budgets', () => saveBudgets(this._budgets));
    }

    deleteBudget(id: string): void {
        this._budgets = this._budgets.filter(b => b.id !== id);
        this.notify();
        this.debouncedSave('budgets', () => saveBudgets(this._budgets));
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
        this.notify();
        this.debouncedSave('accounts', () => saveAccounts(this._accounts));
    }

    saveAccountsAndBalances(accs: string[], balances: AccountBalances): void {
        this._accounts = accs;
        this._accountBalances = balances;
        this.notify();
        this.debouncedSave('accounts', () => saveAccounts(this._accounts));
        this.debouncedSave('accountBalances', () => saveAccountBalances(this._accountBalances));
    }

    // ── Monthly Goals ──────────────────────────────────────────
    setMonthlyGoal(monthKey: string, amount: number): void {
        this._monthlyGoals = { ...this._monthlyGoals, [monthKey]: amount };
        this.notify();
        this.debouncedSave('monthlyGoals', () => saveMonthlyGoals(this._monthlyGoals));
    }
}
