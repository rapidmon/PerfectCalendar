import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MonthlyStats, computeYoYGrowthRate } from '../utils/budgetAnalytics';
import { Budget } from '../types/budget';

// 소유자별 색상 (멤버 구분용)
const OWNER_COLORS = [
    '#4A90E2', // 파랑
    '#E91E63', // 핑크
    '#9C27B0', // 보라
    '#FF9800', // 주황
    '#009688', // 청록
    '#795548', // 갈색
];

// uid를 기반으로 일관된 색상 인덱스 생성
const getOwnerColorIndex = (uid: string): number => {
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
        hash = ((hash << 5) - hash) + uid.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash) % OWNER_COLORS.length;
};

interface MonthlySummaryCardProps {
    year: number;
    month: number;
    stats: MonthlyStats;
    budgets: Budget[];
    fixedCategories: string[];
    goalAmount: number | undefined;
    accountBalances: { name: string; balance: number; ownerUid?: string }[];
}

export default function MonthlySummaryCard({
    year,
    month,
    stats,
    budgets,
    fixedCategories,
    goalAmount,
    accountBalances,
}: MonthlySummaryCardProps) {
    const [expenseExpanded, setExpenseExpanded] = useState(false);

    // Memoized YoY calculations - avoids recomputing on every render
    const expenseGrowth = useMemo(
        () => computeYoYGrowthRate(stats.totalExpense, budgets, year - 1, month, fixedCategories, 'totalExpense'),
        [stats.totalExpense, budgets, year, month, fixedCategories]
    );

    const fixedGrowth = useMemo(
        () => computeYoYGrowthRate(stats.totalFixedExpense, budgets, year - 1, month, fixedCategories, 'totalFixedExpense'),
        [stats.totalFixedExpense, budgets, year, month, fixedCategories]
    );

    const formatAmount = (n: number) => n.toLocaleString('ko-KR') + '원';
    const formatRatio = (n: number) => n.toFixed(1) + '%';

    const goalDiff = goalAmount ? goalAmount - (stats.totalExpense - stats.totalFixedExpense) : undefined;
    const isOverBudget = goalDiff !== undefined && goalDiff < 0;

    const formatGrowth = (value: number | null) => {
        if (value === null) return '데이터 없음';
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(1)}%`;
    };

    const growthColor = (value: number | null) => {
        if (value === null) return '#999';
        return value > 0 ? '#F44336' : value < 0 ? '#4CAF50' : '#666';
    };

    return (
        <View style={styles.card}>
            {/* 통장별 잔액 */}
            {accountBalances.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>통장별 잔액</Text>
                    {accountBalances.map(item => {
                        const ownerColor = item.ownerUid
                            ? OWNER_COLORS[getOwnerColorIndex(item.ownerUid)]
                            : undefined;
                        return (
                            <View key={item.name} style={styles.accountRow}>
                                {ownerColor && (
                                    <View style={[styles.ownerIndicator, { backgroundColor: ownerColor }]} />
                                )}
                                <Text style={[styles.categoryName, { flex: 1 }]}>{item.name}</Text>
                                <Text style={[
                                    styles.categoryAmount,
                                    { color: item.balance >= 0 ? '#2196F3' : '#F44336' },
                                ]}>
                                    {formatAmount(item.balance)}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* 이번 달 지출 목표 */}
            {goalAmount != null && (
                <View style={styles.goalRow}>
                    <Text style={styles.goalLabel}>이번 달 지출 목표</Text>
                    <Text style={styles.goalValue}>{formatAmount(goalAmount)}</Text>
                </View>
            )}

            {/* 통계 그리드 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>월간 통계</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>수입</Text>
                        <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                            {formatAmount(stats.totalIncome)}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>수입 대비 지출</Text>
                        <Text style={styles.statValue}>{formatRatio(stats.incomeExpenseRatio)}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>저축</Text>
                        <Text style={[styles.statValue, { color: '#2196F3' }]}>
                            {formatAmount(stats.totalSavings)}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>고정지출</Text>
                        <Text style={[styles.statValue, { color: '#FF9800' }]}>
                            {formatAmount(stats.totalFixedExpense)}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.statItem}
                        activeOpacity={0.7}
                        onPress={() => setExpenseExpanded(prev => !prev)}
                    >
                        <Text style={styles.statLabel}>
                            총 지출 {expenseExpanded ? '▲' : '▼'}
                        </Text>
                        <Text style={[styles.statValue, { color: '#F44336' }]}>
                            {formatAmount(stats.totalExpense)}
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>전년 대비 고정지출</Text>
                        <Text style={[styles.statValue, { color: growthColor(fixedGrowth) }]}>
                            {formatGrowth(fixedGrowth)}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>전년 대비 지출</Text>
                        <Text style={[styles.statValue, { color: growthColor(expenseGrowth) }]}>
                            {formatGrowth(expenseGrowth)}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>목표 잔여</Text>
                        {goalAmount ? (
                            <Text style={[styles.statValue, { color: isOverBudget ? '#F44336' : '#4CAF50' }]}>
                                {isOverBudget
                                    ? `-${formatAmount(Math.abs(goalDiff!))}`
                                    : formatAmount(goalDiff!)}
                            </Text>
                        ) : (
                            <Text style={[styles.statValue, { color: '#999' }]}>미설정</Text>
                        )}
                    </View>
                </View>
            </View>

            {/* 카테고리별 지출 (토글) */}
            {expenseExpanded && stats.categoryBreakdown.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>카테고리별 지출</Text>
                    {stats.categoryBreakdown.map(item => (
                        <View key={item.category} style={styles.categoryRow}>
                            <Text style={styles.categoryName}>{item.category}</Text>
                            <View style={styles.categoryRight}>
                                <Text style={styles.categoryAmount}>{formatAmount(item.amount)}</Text>
                                <Text style={styles.categoryRatio}>{formatRatio(item.ratio)}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 16,
        marginBottom: 12,
    },
    section: {
        marginBottom: 16,
    },
    goalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginBottom: 16,
    },
    goalLabel: {
        fontSize: 13,
        color: '#555',
        fontWeight: '600',
    },
    goalValue: {
        fontSize: 14,
        color: '#4A90E2',
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    accountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },
    ownerIndicator: {
        width: 4,
        height: 20,
        borderRadius: 2,
        marginRight: 10,
    },
    categoryName: {
        fontSize: 14,
        color: '#555',
    },
    categoryRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    categoryAmount: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    categoryRatio: {
        fontSize: 12,
        color: '#999',
        width: 45,
        textAlign: 'right',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    statItem: {
        width: '47%',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 10,
    },
    statLabel: {
        fontSize: 11,
        color: '#999',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
});
