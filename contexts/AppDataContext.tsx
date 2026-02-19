import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { AppDataStore } from '../stores/AppDataStore';
import { Todo } from '../types/todo';
import { Budget, MonthlyGoal } from '../types/budget';
import { Investment } from '../types/investment';
import { Savings } from '../types/savings';
import { AccountOwnership } from '../firebase';

// ── Domain-specific context interfaces ──────────────────────

interface StoreData {
    store: AppDataStore;
    isLoaded: boolean;
}

interface TodoData {
    todos: Todo[];
}

interface BudgetData {
    budgets: Budget[];
    categories: string[];
    fixedCategories: string[];
    monthlyGoals: MonthlyGoal;
}

interface AccountData {
    accounts: string[];
    accountOwners: AccountOwnership;
}

interface GroupData {
    isGroupConnected: boolean;
    groupCode: string | null;
    userName: string | null;
    memberNames: { [uid: string]: string };
    memberColors: { [uid: string]: string };
}

interface InvestmentData {
    investments: Investment[];
    savings: Savings[];
}

// ── Backward-compatible combined interface ──────────────────

export interface AppData extends StoreData, TodoData, BudgetData, AccountData, GroupData, InvestmentData {}

// ── Contexts ────────────────────────────────────────────────

const StoreContext = createContext<StoreData | null>(null);
const TodoContext = createContext<TodoData | null>(null);
const BudgetContext = createContext<BudgetData | null>(null);
const AccountContext = createContext<AccountData | null>(null);
const GroupContext = createContext<GroupData | null>(null);
const InvestmentContext = createContext<InvestmentData | null>(null);

// ── Provider ────────────────────────────────────────────────

/**
 * AppDataProvider - Bridges the OOP AppDataStore singleton with React's rendering.
 *
 * Each domain context is memoized independently so that a change in one domain
 * (e.g. budgets) does NOT trigger re-renders in unrelated consumers (e.g. TodoList).
 */
export function AppDataProvider({ children }: { children: React.ReactNode }) {
    const storeRef = useRef(AppDataStore.getInstance());
    const store = storeRef.current;
    const [, setRevision] = useState(0);

    useEffect(() => {
        const unsubscribe = store.subscribe(() => setRevision(r => r + 1));
        store.loadAll();
        return unsubscribe;
    }, [store]);

    const storeValue = useMemo<StoreData>(
        () => ({ store, isLoaded: store.isLoaded }),
        [store, store.isLoaded]
    );

    const todoValue = useMemo<TodoData>(
        () => ({ todos: store.todos }),
        [store.todos]
    );

    const budgetValue = useMemo<BudgetData>(
        () => ({
            budgets: store.budgets,
            categories: store.categories,
            fixedCategories: store.fixedCategories,
            monthlyGoals: store.monthlyGoals,
        }),
        [store.budgets, store.categories, store.fixedCategories, store.monthlyGoals]
    );

    const accountValue = useMemo<AccountData>(
        () => ({
            accounts: store.accounts,
            accountOwners: store.accountOwners,
        }),
        [store.accounts, store.accountOwners]
    );

    const groupValue = useMemo<GroupData>(
        () => ({
            isGroupConnected: store.isGroupConnected,
            groupCode: store.groupCode,
            userName: store.userName,
            memberNames: store.memberNames,
            memberColors: store.memberColors,
        }),
        [store.isGroupConnected, store.groupCode, store.userName, store.memberNames, store.memberColors]
    );

    const investmentValue = useMemo<InvestmentData>(
        () => ({
            investments: store.investments,
            savings: store.savings,
        }),
        [store.investments, store.savings]
    );

    return (
        <StoreContext.Provider value={storeValue}>
        <TodoContext.Provider value={todoValue}>
        <BudgetContext.Provider value={budgetValue}>
        <AccountContext.Provider value={accountValue}>
        <GroupContext.Provider value={groupValue}>
        <InvestmentContext.Provider value={investmentValue}>
            {children}
        </InvestmentContext.Provider>
        </GroupContext.Provider>
        </AccountContext.Provider>
        </BudgetContext.Provider>
        </TodoContext.Provider>
        </StoreContext.Provider>
    );
}

// ── Domain-specific hooks ───────────────────────────────────

export function useStore(): StoreData {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error('useStore must be used within AppDataProvider');
    return ctx;
}

export function useTodos(): TodoData {
    const ctx = useContext(TodoContext);
    if (!ctx) throw new Error('useTodos must be used within AppDataProvider');
    return ctx;
}

export function useBudgets(): BudgetData {
    const ctx = useContext(BudgetContext);
    if (!ctx) throw new Error('useBudgets must be used within AppDataProvider');
    return ctx;
}

export function useAccounts(): AccountData {
    const ctx = useContext(AccountContext);
    if (!ctx) throw new Error('useAccounts must be used within AppDataProvider');
    return ctx;
}

export function useGroup(): GroupData {
    const ctx = useContext(GroupContext);
    if (!ctx) throw new Error('useGroup must be used within AppDataProvider');
    return ctx;
}

export function useInvestments(): InvestmentData {
    const ctx = useContext(InvestmentContext);
    if (!ctx) throw new Error('useInvestments must be used within AppDataProvider');
    return ctx;
}

// ── Backward-compatible hook ────────────────────────────────

/**
 * useAppData - Combines all domain contexts into a single object.
 * Prefer domain-specific hooks (useTodos, useBudgets, etc.) to avoid
 * unnecessary re-renders.
 */
export function useAppData(): AppData {
    return {
        ...useStore(),
        ...useTodos(),
        ...useBudgets(),
        ...useAccounts(),
        ...useGroup(),
        ...useInvestments(),
    };
}
