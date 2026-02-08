import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppDataStore } from '../stores/AppDataStore';
import { Todo } from '../types/todo';
import { Budget, MonthlyGoal, AccountBalances } from '../types/budget';
import { Investment } from '../types/investment';
import { Savings } from '../types/savings';
import { AccountOwnership } from '../firebase';

/**
 * AppData - Context value interface exposing store state and the store instance.
 *
 * Components read state properties for rendering (triggers re-render on change)
 * and call store methods for mutations (e.g., store.addTodo(...)).
 */
export interface AppData {
    todos: Todo[];
    budgets: Budget[];
    categories: string[];
    accounts: string[];
    fixedCategories: string[];
    monthlyGoals: MonthlyGoal;
    accountBalances: AccountBalances;
    accountOwners: AccountOwnership;
    investments: Investment[];
    savings: Savings[];
    isLoaded: boolean;
    isGroupConnected: boolean;
    groupCode: string | null;
    userName: string | null;
    store: AppDataStore;
}

const AppDataContext = createContext<AppData | null>(null);

/**
 * AppDataProvider - Bridges the OOP AppDataStore singleton with React's rendering.
 *
 * Subscribes to store notifications and triggers re-renders via a revision counter
 * so that consuming components always see the latest state snapshot.
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

    const value: AppData = {
        todos: store.todos,
        budgets: store.budgets,
        categories: store.categories,
        accounts: store.accounts,
        fixedCategories: store.fixedCategories,
        monthlyGoals: store.monthlyGoals,
        accountBalances: store.accountBalances,
        accountOwners: store.accountOwners,
        investments: store.investments,
        savings: store.savings,
        isLoaded: store.isLoaded,
        isGroupConnected: store.isGroupConnected,
        groupCode: store.groupCode,
        userName: store.userName,
        store,
    };

    return (
        <AppDataContext.Provider value={value}>
            {children}
        </AppDataContext.Provider>
    );
}

/**
 * useAppData - Hook to access centralized app data and the store instance.
 * Must be used within an AppDataProvider.
 */
export function useAppData(): AppData {
    const ctx = useContext(AppDataContext);
    if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
    return ctx;
}
