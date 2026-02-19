import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Todo } from '../types/todo';
import { Budget, MonthlyGoal } from '../types/budget';
import { Investment } from '../types/investment';
import { Savings } from '../types/savings';
import { FixedExpense } from '../types/fixedExpense';

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
const SAVINGS_CATEGORIES_KEY = '@savings_categories';
const MONTHLY_GOALS_KEY = '@monthly_goals';
const ACCOUNTS_KEY = '@accounts';
const ONBOARDING_COMPLETE_KEY = '@onboarding_complete';
const BUDGET_TUTORIAL_COMPLETE_KEY = '@budget_tutorial_complete';
const INVESTMENTS_KEY = '@investments';
const SAVINGS_KEY = '@savings';
const FIXED_EXPENSES_KEY = '@fixed_expense_schedules';
const PREGROUP_ACCOUNTS_KEY = '@pregroup_accounts_backup';

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
        syncToWidgetStorage('widget_fixed_expense_categories', jsonValue);
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

// 목표제외 카테고리 저장
export const saveSavingsCategories = async (categories: string[]): Promise<void> => {
    try {
        const jsonValue = JSON.stringify(categories);
        await AsyncStorage.setItem(SAVINGS_CATEGORIES_KEY, jsonValue);
    } catch (e) {
        console.error('목표제외 카테고리 저장 실패:', e);
    }
};

// 목표제외 카테고리 불러오기
export const loadSavingsCategories = async (): Promise<string[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(SAVINGS_CATEGORIES_KEY);
        if (jsonValue != null) {
            return JSON.parse(jsonValue);
        }
        return [];
    } catch (e) {
        console.error('목표제외 카테고리 불러오기 실패:', e);
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

// 가계부 튜토리얼 완료 저장
export const saveBudgetTutorialComplete = async (): Promise<void> => {
    try {
        await AsyncStorage.setItem(BUDGET_TUTORIAL_COMPLETE_KEY, 'true');
    } catch (e) {
        console.error('가계부 튜토리얼 완료 저장 실패:', e);
    }
};

// 가계부 튜토리얼 완료 여부 불러오기
export const loadBudgetTutorialComplete = async (): Promise<boolean> => {
    try {
        const value = await AsyncStorage.getItem(BUDGET_TUTORIAL_COMPLETE_KEY);
        return value === 'true';
    } catch (e) {
        console.error('가계부 튜토리얼 완료 불러오기 실패:', e);
        return false;
    }
};

// 투자 저장
export const saveInvestments = async (investments: Investment[]): Promise<void> => {
    try {
        const jsonValue = JSON.stringify(investments);
        await AsyncStorage.setItem(INVESTMENTS_KEY, jsonValue);
    } catch (e) {
        console.error('투자 저장 실패:', e);
    }
};

// 투자 불러오기
export const loadInvestments = async (): Promise<Investment[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(INVESTMENTS_KEY);
        if (jsonValue != null) {
            return JSON.parse(jsonValue);
        }
        return [];
    } catch (e) {
        console.error('투자 불러오기 실패:', e);
        return [];
    }
};

// 적금 저장
export const saveSavings = async (savings: Savings[]): Promise<void> => {
    try {
        const jsonValue = JSON.stringify(savings);
        await AsyncStorage.setItem(SAVINGS_KEY, jsonValue);
    } catch (e) {
        console.error('적금 저장 실패:', e);
    }
};

// 적금 불러오기
export const loadSavings = async (): Promise<Savings[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(SAVINGS_KEY);
        if (jsonValue != null) {
            return JSON.parse(jsonValue);
        }
        return [];
    } catch (e) {
        console.error('적금 불러오기 실패:', e);
        return [];
    }
};

// 고정지출 스케줄 저장
export const saveFixedExpenses = async (expenses: FixedExpense[]): Promise<void> => {
    try {
        const jsonValue = JSON.stringify(expenses);
        await AsyncStorage.setItem(FIXED_EXPENSES_KEY, jsonValue);
    } catch (e) {
        console.error('고정지출 저장 실패:', e);
    }
};

// 고정지출 스케줄 불러오기
export const loadFixedExpenses = async (): Promise<FixedExpense[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(FIXED_EXPENSES_KEY);
        if (jsonValue != null) {
            return JSON.parse(jsonValue);
        }
        return [];
    } catch (e) {
        console.error('고정지출 불러오기 실패:', e);
        return [];
    }
};

// 그룹 연결 전 통장 백업 저장
export const savePreGroupAccounts = async (accounts: string[]): Promise<void> => {
    try {
        const jsonValue = JSON.stringify({ accounts });
        await AsyncStorage.setItem(PREGROUP_ACCOUNTS_KEY, jsonValue);
    } catch (e) {
        console.error('통장 백업 저장 실패:', e);
    }
};

// 그룹 연결 전 통장 백업 불러오기
export const loadPreGroupAccounts = async (): Promise<{ accounts: string[] } | null> => {
    try {
        const jsonValue = await AsyncStorage.getItem(PREGROUP_ACCOUNTS_KEY);
        if (jsonValue != null) {
            return JSON.parse(jsonValue);
        }
        return null;
    } catch (e) {
        console.error('통장 백업 불러오기 실패:', e);
        return null;
    }
};

// 그룹 연결 전 통장 백업 삭제
export const clearPreGroupAccounts = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(PREGROUP_ACCOUNTS_KEY);
    } catch (e) {
        console.error('통장 백업 삭제 실패:', e);
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