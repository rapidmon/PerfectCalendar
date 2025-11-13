export type BudgetType = 'INCOME' | 'EXPENSE';

export interface Budget {
    id: string;
    title: string;
    money: number;
    date: string;
    type: BudgetType;
}