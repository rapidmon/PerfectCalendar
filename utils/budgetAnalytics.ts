import { Budget, AccountBalances } from '../types/budget';

export interface MonthlyStats {
    totalIncome: number;
    totalExpense: number;
    totalSavings: number;
    totalFixedExpense: number;
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
): MonthlyStats {
    const monthBudgets = getBudgetsForMonth(budgets, year, month);

    let totalIncome = 0;
    let totalExpense = 0;
    let totalSavings = 0;
    let totalFixedExpense = 0;
    const categoryMap: Record<string, number> = {};

    for (const b of monthBudgets) {
        if (b.type === 'INCOME') {
            totalIncome += Math.abs(b.money);
        } else {
            const abs = Math.abs(b.money);
            totalExpense += abs;

            if (b.category === '저축') {
                totalSavings += abs;
            }
            if (fixedCategories.includes(b.category)) {
                totalFixedExpense += abs;
            }

            categoryMap[b.category] = (categoryMap[b.category] || 0) + abs;
        }
    }

    const categoryBreakdown = Object.entries(categoryMap)
        .map(([category, amount]) => ({
            category,
            amount,
            ratio: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

    // 총 지출에서 저축 제외
    totalExpense -= totalSavings;

    const categoryBreakdownExcludingSavings = categoryBreakdown.map(item => ({
        ...item,
        ratio: totalExpense > 0 ? (item.amount / totalExpense) * 100 : 0,
    })).filter(item => item.category !== '저축');

    const incomeExpenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

    return {
        totalIncome,
        totalExpense,
        totalSavings,
        totalFixedExpense,
        incomeExpenseRatio,
        categoryBreakdown: categoryBreakdownExcludingSavings,
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
    initialBalances: AccountBalances,
    accounts: string[],
): { name: string; balance: number }[] {
    const defaultAccount = accounts[0] || '기본';

    return accounts.map(account => {
        const initial = initialBalances[account] || 0;
        let balance = initial;

        for (const b of budgets) {
            if ((b.account || defaultAccount) !== account) continue;
            if (b.type === 'INCOME') {
                balance += Math.abs(b.money);
            } else {
                balance -= Math.abs(b.money);
            }
        }

        return { name: account, balance };
    });
}
