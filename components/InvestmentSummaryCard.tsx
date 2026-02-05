import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Investment, StockPrice } from '../types/investment';
import { Savings } from '../types/savings';
import { formatMoneyNoSign } from '../utils/format';
import { calculateInvestmentSummary, formatAmount, formatProfitRate } from '../utils/investmentAnalytics';
import { getTotalSavingsValue, getTotalExpectedMaturity } from '../utils/savingsCalculator';

interface InvestmentSummaryCardProps {
    investments: Investment[];
    savings: Savings[];
    prices: Map<string, StockPrice>;
}

export default function InvestmentSummaryCard({
    investments,
    savings,
    prices,
}: InvestmentSummaryCardProps) {
    const investmentSummary = calculateInvestmentSummary(investments, prices);
    const savingsTotal = getTotalSavingsValue(savings);
    const savingsExpected = getTotalExpectedMaturity(savings);

    // 총 자산 (한국 투자 + 적금 현재가치)
    const totalAssets = investmentSummary.koreaTotal + savingsTotal;

    const profitColor = investmentSummary.totalProfitRate >= 0 ? '#F44336' : '#2196F3';

    return (
        <View style={styles.container}>
            {/* 총 자산 */}
            <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>총 자산 (KRW)</Text>
                <Text style={styles.totalValue}>{formatMoneyNoSign(totalAssets)}</Text>
            </View>

            {/* 상세 내역 */}
            <View style={styles.detailsContainer}>
                {/* 투자 수익 */}
                <View style={styles.detailItem}>
                    <View style={styles.detailHeader}>
                        <Text style={styles.detailIcon}>📈</Text>
                        <Text style={styles.detailLabel}>투자 수익</Text>
                    </View>
                    <Text style={[styles.detailValue, { color: profitColor }]}>
                        {investmentSummary.totalProfit >= 0 ? '+' : '-'}
                        {formatMoneyNoSign(Math.abs(investmentSummary.totalProfit))}
                    </Text>
                    <Text style={[styles.detailRate, { color: profitColor }]}>
                        {formatProfitRate(investmentSummary.totalProfitRate)}
                    </Text>
                </View>

                {/* 적금 예상 */}
                <View style={[styles.detailItem, styles.detailItemBorder]}>
                    <View style={styles.detailHeader}>
                        <Text style={styles.detailIcon}>🏦</Text>
                        <Text style={styles.detailLabel}>적금 예상</Text>
                    </View>
                    <Text style={styles.detailValueGreen}>
                        {formatMoneyNoSign(savingsExpected)}
                    </Text>
                    <Text style={styles.detailSubtext}>
                        현재 {formatMoneyNoSign(savingsTotal)}
                    </Text>
                </View>
            </View>

            {/* 미국 주식 별도 표시 */}
            {investmentSummary.usTotal > 0 && (
                <View style={styles.usSection}>
                    <Text style={styles.usLabel}>🇺🇸 미국 주식</Text>
                    <Text style={styles.usValue}>
                        {formatAmount(investmentSummary.usTotal, 'USD')}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    totalSection: {
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    totalLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 4,
    },
    totalValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    detailsContainer: {
        flexDirection: 'row',
    },
    detailItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    detailItemBorder: {
        borderLeftWidth: 1,
        borderLeftColor: '#f0f0f0',
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    detailIcon: {
        fontSize: 16,
    },
    detailLabel: {
        fontSize: 13,
        color: '#666',
    },
    detailValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    detailValueGreen: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 2,
    },
    detailRate: {
        fontSize: 12,
        fontWeight: '600',
    },
    detailSubtext: {
        fontSize: 11,
        color: '#999',
    },
    usSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    usLabel: {
        fontSize: 13,
        color: '#666',
    },
    usValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
});
