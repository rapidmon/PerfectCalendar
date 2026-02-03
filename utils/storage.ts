import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Todo } from '../types/todo';
import { Budget, MonthlyGoal, AccountBalances } from '../types/budget';

const IOS_APP_GROUP = 'group.com.perfectcalendar.app';

// iOS 위젯 데이터 동기화 (App Group UserDefaults)
const syncToWidgetStorage = async (key: string, jsonValue: string): Promise<void> => {
    if (Platform.OS !== 'ios') return;
    try {
        const SharedGroupPreferences = require('react-native-shared-group-preferences').default;
        await SharedGroupPreferences.setItem(key, jsonValue, IOS_APP_GROUP);
    } catch {
        // 위젯 동기화 실패는 무시 (위젯 미설치 등)
    }
};

const TODOS_KEY = '@todos';
const BUDGETS_KEY = '@budgets';
const BUDGET_CATEGORIES_KEY = '@budget_categories';
const FIXED_EXPENSE_CATEGORIES_KEY = '@fixed_expense_categories';
const MONTHLY_GOALS_KEY = '@monthly_goals';
const ACCOUNTS_KEY = '@accounts';
const ACCOUNT_BALANCES_KEY = '@account_balances';
const ONBOARDING_COMPLETE_KEY = '@onboarding_complete';

const DEFAULT_ACCOUNTS = ['기본'];

const DEFAULT_CATEGORIES = ['식비', '저축'];

// 할 일 저장
export const saveTodos = async (todos: Todo[]): Promise<void> => {
    try {
        const jsonValue = JSON.stringify(todos);
        await AsyncStorage.setItem(TODOS_KEY, jsonValue);
        syncToWidgetStorage('widget_todos', jsonValue);
    } catch (e) {
        console.error('할 일 저장 실패:', e);
    }
};

// 할 일 불러오기
export const loadTodos = async (): Promise<Todo[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(TODOS_KEY);
        if (jsonValue != null) {
        const todos = JSON.parse(jsonValue);
        return todos;
        }
        return [];
    } catch (e) {
        console.error('할 일 불러오기 실패:', e);
        return [];
    }
};

// 가계부 저장
export const saveBudgets = async (budgets: Budget[]): Promise<void> => {
    try {
        const jsonValue = JSON.stringify(budgets);
        await AsyncStorage.setItem(BUDGETS_KEY, jsonValue);
        syncToWidgetStorage('widget_budgets', jsonValue);
        console.log('가계부 저장 완료:', budgets.length, '개');
    } catch (e) {
        console.error('가계부 저장 실패:', e);
    }
};

// 가계부 불러오기
export const loadBudgets = async (): Promise<Budget[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(BUDGETS_KEY);
        if (jsonValue != null) {
        const budgets = JSON.parse(jsonValue);
        console.log('가계부 불러오기 완료:', budgets.length, '개');
        return budgets;
        }
        console.log('저장된 가계부 없음');
        return [];
    } catch (e) {
        console.error('가계부 불러오기 실패:', e);
        return [];
    }
};

// 카테고리 저장
export const saveCategories = async (categories: string[]): Promise<void> => {
    try {
        const jsonValue = JSON.stringify(categories);
        await AsyncStorage.setItem(BUDGET_CATEGORIES_KEY, jsonValue);
    } catch (e) {
        console.error('카테고리 저장 실패:', e);
    }
};

// 카테고리 불러오기
export const loadCategories = async (): Promise<string[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(BUDGET_CATEGORIES_KEY);
        if (jsonValue != null) {
            return JSON.parse(jsonValue);
        }
        return DEFAULT_CATEGORIES;
    } catch (e) {
        console.error('카테고리 불러오기 실패:', e);
        return DEFAULT_CATEGORIES;
    }
};

// 고정지출 카테고리 저장
export const saveFixedExpenseCategories = async (categories: string[]): Promise<void> => {
    try {
        const jsonValue = JSON.stringify(categories);
        await AsyncStorage.setItem(FIXED_EXPENSE_CATEGORIES_KEY, jsonValue);
    } catch (e) {
        console.error('고정지출 카테고리 저장 실패:', e);
    }
};

// 고정지출 카테고리 불러오기
export const loadFixedExpenseCategories = async (): Promise<string[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(FIXED_EXPENSE_CATEGORIES_KEY);
        if (jsonValue != null) {
            return JSON.parse(jsonValue);
        }
        return [];
    } catch (e) {
        console.error('고정지출 카테고리 불러오기 실패:', e);
        return [];
    }
};

// 월별 목표 금액 저장
export const saveMonthlyGoals = async (goals: MonthlyGoal): Promise<void> => {
    try {
        const jsonValue = JSON.stringify(goals);
        await AsyncStorage.setItem(MONTHLY_GOALS_KEY, jsonValue);
        syncToWidgetStorage('widget_monthly_goals', jsonValue);
    } catch (e) {
        console.error('월별 목표 저장 실패:', e);
    }
};

// 월별 목표 금액 불러오기
export const loadMonthlyGoals = async (): Promise<MonthlyGoal> => {
    try {
        const jsonValue = await AsyncStorage.getItem(MONTHLY_GOALS_KEY);
        if (jsonValue != null) {
            return JSON.parse(jsonValue);
        }
        return {};
    } catch (e) {
        console.error('월별 목표 불러오기 실패:', e);
        return {};
    }
};

// 통장 저장
export const saveAccounts = async (accounts: string[]): Promise<void> => {
    try {
        const jsonValue = JSON.stringify(accounts);
        await AsyncStorage.setItem(ACCOUNTS_KEY, jsonValue);
        syncToWidgetStorage('widget_accounts', jsonValue);
    } catch (e) {
        console.error('통장 저장 실패:', e);
    }
};

// 통장 불러오기
export const loadAccounts = async (): Promise<string[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(ACCOUNTS_KEY);
        if (jsonValue != null) {
            return JSON.parse(jsonValue);
        }
        return DEFAULT_ACCOUNTS;
    } catch (e) {
        console.error('통장 불러오기 실패:', e);
        return DEFAULT_ACCOUNTS;
    }
};

// 통장 초기 잔액 저장
export const saveAccountBalances = async (balances: AccountBalances): Promise<void> => {
    try {
        const jsonValue = JSON.stringify(balances);
        await AsyncStorage.setItem(ACCOUNT_BALANCES_KEY, jsonValue);
        syncToWidgetStorage('widget_account_balances', jsonValue);
    } catch (e) {
        console.error('통장 초기 잔액 저장 실패:', e);
    }
};

// 통장 초기 잔액 불러오기
export const loadAccountBalances = async (): Promise<AccountBalances> => {
    try {
        const jsonValue = await AsyncStorage.getItem(ACCOUNT_BALANCES_KEY);
        if (jsonValue != null) {
            return JSON.parse(jsonValue);
        }
        return {};
    } catch (e) {
        console.error('통장 초기 잔액 불러오기 실패:', e);
        return {};
    }
};

// 온보딩 완료 저장
export const saveOnboardingComplete = async (): Promise<void> => {
    try {
        await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    } catch (e) {
        console.error('온보딩 완료 저장 실패:', e);
    }
};

// 온보딩 완료 여부 불러오기
export const loadOnboardingComplete = async (): Promise<boolean> => {
    try {
        const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        return value === 'true';
    } catch (e) {
        console.error('온보딩 완료 불러오기 실패:', e);
        return false;
    }
};

// 모든 데이터 초기화 (개발/테스트용)
export const clearAllData = async (): Promise<void> => {
    try {
        await AsyncStorage.multiRemove([TODOS_KEY, BUDGETS_KEY]);
        console.log('모든 데이터 삭제 완료');
    } catch (e) {
        console.error('데이터 삭제 실패:', e);
    }
};