export type TodoType = 'RECURRING' | 'MONTHLY_RECURRING' | 'DEADLINE' | 'SPECIFIC' | 'DATE_RANGE';

export interface Todo {
    id: string;
    title: string;
    type: TodoType;
    completed: boolean;

    recurringDay?: string;
    monthlyRecurringDay?: number;

    deadline?: string;

    specificDate?: string;

    dateRangeStart?: string;
    dateRangeEnd?: string;

    createdAt?: string;
}