import { Todo } from '../types/todo';

export type BlockColor = 'green' | 'orange' | 'red' | 'gray';

export interface ProgressBlock {
    color: BlockColor;
}

export interface TodoProgress {
    hasProgress: boolean;
    blocks: ProgressBlock[];
    daysLeft: number;
    totalDays: number;
    label: string;
}

const TOTAL_BLOCKS = 20;

export function calculateTodoProgress(todo: Todo): TodoProgress {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let targetDate: Date | null = null;
    let label = '';

    switch (todo.type) {
        case 'DEADLINE':
            if (todo.deadline) {
                targetDate = new Date(todo.deadline);
                label = '마감';
            }
            break;
        case 'SPECIFIC':
            if (todo.specificDate) {
                targetDate = new Date(todo.specificDate);
                label = '당일';
            }
            break;
        case 'DATE_RANGE':
            if (todo.dateRangeStart && todo.dateRangeEnd) {
                const start = new Date(todo.dateRangeStart);
                start.setHours(0, 0, 0, 0);
                if (today.getTime() < start.getTime()) {
                    targetDate = start;
                    label = '시작';
                } else {
                    targetDate = new Date(todo.dateRangeEnd);
                    label = '종료';
                }
            }
            break;
        default:
            return { hasProgress: false, blocks: [], daysLeft: 0, totalDays: 0, label: '' };
    }

    if (!targetDate) {
        return { hasProgress: false, blocks: [], daysLeft: 0, totalDays: 0, label: '' };
    }

    targetDate.setHours(0, 0, 0, 0);
    const daysLeft = Math.max(0, Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    let color: BlockColor;
    if (daysLeft <= 1) {
        color = 'red';
    } else if (daysLeft <= 5) {
        color = 'orange';
    } else {
        color = 'green';
    }

    const filledBlocks = Math.min(daysLeft, TOTAL_BLOCKS);
    const blocks: ProgressBlock[] = [];
    for (let i = 0; i < TOTAL_BLOCKS; i++) {
        blocks.push({ color: i < filledBlocks ? color : 'gray' });
    }

    return { hasProgress: true, blocks, daysLeft, totalDays: daysLeft, label };
}
