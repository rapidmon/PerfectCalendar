export type TodoType = 'RECURRING' | 'DEADLINE' | 'SPECIFIC';

export interface Todo {
    id: string;
    title: string;
    type: TodoType;
    completed: boolean;
    
    recurringDay?: string;

    deadline?: string;

    specificDate?: string;
}