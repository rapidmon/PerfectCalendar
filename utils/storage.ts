import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo } from '../types/todo';
import { Budget } from '../types/budget';

const TODOS_KEY = '@todos';
const BUDGETS_KEY = '@budgets';

// 할 일 저장
export const saveTodos = async (todos: Todo[]): Promise<void> => {
    try {
        const jsonValue = JSON.stringify(todos);
        await AsyncStorage.setItem(TODOS_KEY, jsonValue);
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

// 모든 데이터 초기화 (개발/테스트용)
export const clearAllData = async (): Promise<void> => {
    try {
        await AsyncStorage.multiRemove([TODOS_KEY, BUDGETS_KEY]);
        console.log('모든 데이터 삭제 완료');
    } catch (e) {
        console.error('데이터 삭제 실패:', e);
    }
};