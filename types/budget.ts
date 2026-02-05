export type BudgetType = 'INCOME' | 'EXPENSE';

export interface Budget {
    id: string;
    title: string;
    money: number;
    date: string;
    type: BudgetType;
    category: string;
    account?: string;
    savingsId?: string;      // 적금 자동납입인 경우 적금 ID
    savingsPaymentDate?: string;  // 적금 납입 해당 월 (YYYY-MM)
}

export interface MonthlyGoal {
    [yearMonth: string]: number;
}

export interface AccountBalances {
    [accountName: string]: number;
}