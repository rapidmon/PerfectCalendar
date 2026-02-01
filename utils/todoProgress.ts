import { Todo } from '../types/todo';

export type BlockColor = 'green' | 'orange' | 'gray';

export interface ProgressBlock {
    color: BlockColor;
}

export interface TodoProgress {
    hasProgress: boolean;
    blocks: ProgressBlock[];
    daysLeft: number;
    totalDays: number;
}

const TOTAL_BLOCKS = 20;

export function calculateTodoProgress(todo: Todo): TodoProgress {
    if (todo.type === 'RECURRING' || todo.type === 'MONTHLY_RECURRING') {
        return { hasProgress: false, blocks: [], daysLeft: 0, totalDays: 0 };
    }

    const deadlineStr = todo.type === 'DEADLINE' ? todo.deadline : todo.specificDate;
    if (!deadlineStr) {
        return { hasProgress: false, blocks: [], daysLeft: 0, totalDays: 0 };
    }

    const createdAtStr = todo.createdAt || new Date(parseInt(todo.id)).toISOString().split('T')[0];

    const created = new Date(createdAtStr);
    created.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineStr);
    deadline.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDays = Math.max(1, Math.round((deadline.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
    const elapsed = Math.round((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, Math.round((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    const ratio = Math.min(1, Math.max(0, elapsed / totalDays));
    const filledBlocks = Math.round(ratio * TOTAL_BLOCKS);
    const isUrgent = ratio >= 0.8;

    const blocks: ProgressBlock[] = [];
    for (let i = 0; i < TOTAL_BLOCKS; i++) {
        if (i < filledBlocks) {
            blocks.push({ color: isUrgent ? 'orange' : 'green' });
        } else {
            blocks.push({ color: 'gray' });
        }
    }

    return { hasProgress: true, blocks, daysLeft, totalDays };
}
