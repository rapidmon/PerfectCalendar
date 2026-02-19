import { Budget } from '../types/budget';

export interface MonthlyStats {
    totalIncome: number;
    totalExpense: number;
    totalSavings: number;
    totalFixedExpense: number;
    totalSavingsExpense: number;
    incomeExpenseRatio: number;
    categoryBreakdown: { category: string; amount: number; ratio: number }[];
}

export interface ChartMonthData {
    label: string;
    income: number;
    savings: number;
    fixedExpense: number;
    totalExpense: number;
    incomeExpenseRatio: number;
}

export function getBudgetsForMonth(budgets: Budget[], year: number, month: number): Budget[] {
    const yearStr = String(year);
    const monthStr = String(month).padStart(2, '0');
    const prefix = `${yearStr}-${monthStr}`;
    return budgets.filter(b => b.date.startsWith(prefix));
}

export function computeMonthlyStats(
    budgets: Budget[],
    year: number,
    month: number,
    fixedCategories: string[],
    savingsCategories: string[] = [],
): MonthlyStats {
    const monthBudgets = getBudgetsForMonth(budgets, year, month);

    let totalIncome = 0;
    let totalExpense = 0;
    let totalSavings = 0;
    let totalFixedExpense = 0;
    let totalSavingsExpense = 0;
    const categoryMap: Record<string, number> = {};

    for (const b of monthBudgets) {
        if (b.type === 'INCOME') {
            const abs = Math.abs(b.money);
            if (b.category === '저축') {
                totalSavings += abs;
            } else {
                totalIncome += abs;
            }
        } else {
            const abs = Math.abs(b.money);
            totalExpense += abs;

            if (fixedCategories.includes(b.category)) {
                totalFixedExpense += abs;
            } else if (savingsCategories.includes(b.category)) {
                totalSavingsExpense += abs;
            }

            categoryMap[b.category] = (categoryMap[b.category] || 0) + abs;
        }
    }

    const categoryBreakdown = Object.entries(categoryMap)
        .filter(([category]) => category !== '저축')
        .map(([category, amount]) => ({
            category,
            amount,
            ratio: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

    const incomeExpenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

    return {
        totalIncome,
        totalExpense,
        totalSavings,
        totalFixedExpense,
        totalSavingsExpense,
        incomeExpenseRatio,
        categoryBreakdown,
    };
}

export function computeYoYGrowthRate(
    currentValue: number,
    budgets: Budget[],
    previousYear: number,
    month: number,
    fixedCategories: string[],
    field: 'totalExpense' | 'totalFixedExpense',
): number | null {
    const prevBudgets = getBudgetsForMonth(budgets, previousYear, month);
    if (prevBudgets.length === 0) return null;

    const prevStats = computeMonthlyStats(budgets, previousYear, month, fixedCategories);
    const prevValue = prevStats[field];

    if (prevValue === 0) return null;
    return ((currentValue - prevValue) / prevValue) * 100;
}

export function getMultiMonthChartData(
    budgets: Budget[],
    year: number,
    month: number,
    count: number,
    fixedCategories: string[],
): ChartMonthData[] {
    const result: ChartMonthData[] = [];

    for (let i = count - 1; i >= 0; i--) {
        let m = month - i;
        let y = year;
        while (m <= 0) {
            m += 12;
            y -= 1;
        }

        const stats = computeMonthlyStats(budgets, y, m, fixedCategories);
        result.push({
            label: `${m}월`,
            income: stats.totalIncome,
            savings: stats.totalSavings,
            fixedExpense: stats.totalFixedExpense,
            totalExpense: stats.totalExpense,
            incomeExpenseRatio: stats.incomeExpenseRatio,
        });
    }

    return result;
}

export function computeAccountBalances(
    budgets: Budget[],
    accounts: string[],
    owners?: { [accountName: string]: string },
): { name: string; balance: number; ownerUid?: string }[] {
    const defaultAccount = accounts[0] || '기본';

    // Single pass: accumulate deltas per account
    const deltaMap: Record<string, number> = {};
    for (const b of budgets) {
        const acct = b.account || defaultAccount;
        if (b.type === 'INCOME') {
            deltaMap[acct] = (deltaMap[acct] || 0) + Math.abs(b.money);
        } else {
            deltaMap[acct] = (deltaMap[acct] || 0) - Math.abs(b.money);
        }
    }

    return accounts.map(account => ({
        name: account,
        balance: deltaMap[account] || 0,
        ownerUid: owners?.[account],
    }));
}
