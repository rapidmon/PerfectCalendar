import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Investment, StockPrice } from '../types/investment';
import InvestmentItem from './InvestmentItem';
import { calculateInvestmentSummary, formatAmount } from '../utils/investmentAnalytics';

interface InvestmentListProps {
    investments: Investment[];
    prices: Map<string, StockPrice>;
    onAddPress: () => void;
    onItemPress: (investment: Investment) => void;
}

export default function InvestmentList({
    investments,
    prices,
    onAddPress,
    onItemPress,
}: InvestmentListProps) {
    const summary = calculateInvestmentSummary(investments, prices);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.sectionTitle}>투자</Text>
                    <Text style={styles.countBadge}>{investments.length}</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
                    <Text style={styles.addButtonText}>+ 추가</Text>
                </TouchableOpacity>
            </View>

            {investments.length > 0 && (
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>한국</Text>
                        <Text style={styles.summaryValue}>{formatAmount(summary.koreaTotal, 'KRW')}</Text>
                    </View>
                    {summary.usTotal > 0 && (
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>미국</Text>
                            <Text style={styles.summaryValue}>{formatAmount(summary.usTotal, 'USD')}</Text>
                        </View>
                    )}
                </View>
            )}

            {investments.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>등록된 투자가 없습니다</Text>
                    <Text style={styles.emptySubText}>+ 추가 버튼을 눌러 등록하세요</Text>
                </View>
            ) : (
                <View style={styles.listContent}>
                    {investments.map((item) => (
                        <InvestmentItem
                            key={item.id}
                            investment={item}
                            price={prices.get(item.ticker) || null}
                            onPress={() => onItemPress(item)}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    countBadge: {
        backgroundColor: '#E3F2FD',
        color: '#4A90E2',
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    addButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    summaryRow: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        gap: 20,
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    summaryLabel: {
        fontSize: 13,
        color: '#666',
    },
    summaryValue: {
        fontSize: 13,
        color: '#333',
        fontWeight: '700',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        marginBottom: 4,
    },
    emptySubText: {
        fontSize: 12,
        color: '#bbb',
    },
    listContent: {
        paddingBottom: 16,
    },
});
