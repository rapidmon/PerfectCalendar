export type BudgetType = 'INCOME' | 'EXPENSE';

export interface Budget {
    id: string;
    title: string;
    money: number;
    date: string;
    type: BudgetType;
    category: string;
    account?: string;
}

export interface MonthlyGoal {
    [yearMonth: string]: number;
}

export interface AccountBalances {
    [accountName: string]: number;
}