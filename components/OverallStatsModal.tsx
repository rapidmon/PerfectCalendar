import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Budget } from '../types/budget';

interface OverallStatsModalProps {
    visible: boolean;
    budgets: Budget[];
    onClose: () => void;
}

export default function OverallStatsModal({ visible, budgets, onClose }: OverallStatsModalProps) {
    const { totalIncome, totalExpense, categoryBreakdown } = useMemo(() => {
        let income = 0;
        let expense = 0;
        const categoryMap: Record<string, number> = {};

        for (const b of budgets) {
            if (b.type === 'INCOME') {
                income += Math.abs(b.money);
            } else {
                const abs = Math.abs(b.money);
                expense += abs;
                categoryMap[b.category] = (categoryMap[b.category] || 0) + abs;
            }
        }

        const breakdown = Object.entries(categoryMap)
            .map(([category, amount]) => ({
                category,
                amount,
                ratio: expense > 0 ? (amount / expense) * 100 : 0,
            }))
            .sort((a, b) => b.amount - a.amount);

        return { totalIncome: income, totalExpense: expense, categoryBreakdown: breakdown };
    }, [budgets]);

    const formatAmount = (n: number) => n.toLocaleString('ko-KR') + '원';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    style={styles.container}
                    activeOpacity={1}
                    onPress={() => {}}
                >
                    <Text style={styles.title}>전체 통계</Text>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>총 수입</Text>
                        <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                            {formatAmount(totalIncome)}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>총 지출</Text>
                        <Text style={[styles.summaryValue, { color: '#F44336' }]}>
                            {formatAmount(totalExpense)}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>카테고리별 지출</Text>
                    <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                        {categoryBreakdown.length > 0 ? (
                            categoryBreakdown.map(item => (
                                <View key={item.category} style={styles.categoryRow}>
                                    <Text style={styles.categoryName}>{item.category}</Text>
                                    <View style={styles.categoryRight}>
                                        <Text style={styles.categoryAmount}>{formatAmount(item.amount)}</Text>
                                        <Text style={styles.categoryRatio}>{item.ratio.toFixed(1)}%</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>지출 내역이 없습니다</Text>
                        )}
                    </ScrollView>

                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>닫기</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '85%',
        maxWidth: 400,
        maxHeight: '75%',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    summaryLabel: {
        fontSize: 15,
        color: '#555',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 16,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    scrollArea: {
        maxHeight: 250,
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
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
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 14,
        paddingVertical: 20,
    },
    closeButton: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
        marginTop: 16,
    },
    closeButtonText: {
        fontSize: 15,
        color: '#666',
        fontWeight: '600',
    },
});
