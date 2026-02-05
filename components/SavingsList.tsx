import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Savings } from '../types/savings';
import SavingsItem from './SavingsItem';
import { formatMoneyNoSign } from '../utils/format';
import { getTotalSavingsValue, getTotalExpectedMaturity } from '../utils/savingsCalculator';

interface SavingsListProps {
    savings: Savings[];
    onAddPress: () => void;
    onItemPress: (savings: Savings) => void;
}

export default function SavingsList({ savings, onAddPress, onItemPress }: SavingsListProps) {
    const totalCurrent = getTotalSavingsValue(savings);
    const totalExpected = getTotalExpectedMaturity(savings);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.sectionTitle}>적금/예금</Text>
                    <Text style={styles.countBadge}>{savings.length}</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
                    <Text style={styles.addButtonText}>+ 추가</Text>
                </TouchableOpacity>
            </View>

            {savings.length > 0 && (
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                        현재 <Text style={styles.summaryValue}>{formatMoneyNoSign(totalCurrent)}</Text>
                    </Text>
                    <Text style={styles.summaryLabel}>
                        예상 <Text style={styles.summaryExpected}>{formatMoneyNoSign(totalExpected)}</Text>
                    </Text>
                </View>
            )}

            {savings.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>등록된 적금/예금이 없습니다</Text>
                    <Text style={styles.emptySubText}>+ 추가 버튼을 눌러 등록하세요</Text>
                </View>
            ) : (
                <View style={styles.listContent}>
                    {savings.map((item) => (
                        <SavingsItem
                            key={item.id}
                            savings={item}
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
        backgroundColor: '#E8F5E9',
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    addButton: {
        backgroundColor: '#4CAF50',
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
        justifyContent: 'space-between',
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 13,
        color: '#666',
    },
    summaryValue: {
        color: '#333',
        fontWeight: '700',
    },
    summaryExpected: {
        color: '#4CAF50',
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
