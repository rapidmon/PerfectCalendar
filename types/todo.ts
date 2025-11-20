export type TodoType = 'RECURRING' | 'MONTHLY_RECURRING' | 'DEADLINE' | 'SPECIFIC';

export interface Todo {
    id: string;
    title: string;
    type: TodoType;
    completed: boolean;
    
    recurringDay?: string;
    monthlyRecurringDay?: number;

    deadline?: string;

    specificDate?: string;
}