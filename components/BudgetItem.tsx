import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Budget } from '../types/budget';
import { formatMoney } from '../utils/format';

interface BudgetItemProps {
    budget: Budget;
    onPress: () => void;
}

export default function BudgetItem({ budget, onPress }: BudgetItemProps) {
    return (
        <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        >
            <View style={styles.leftSection}>
                <Text style={styles.title}>{budget.title}</Text>
                {budget.category && budget.type === 'EXPENSE' ? (
                    <Text style={styles.category}>{budget.category}</Text>
                ) : null}
            </View>
            <Text style={[
            styles.money,
            { color: budget.type === 'INCOME' ? '#4CAF50' : '#F44336' }
            ]}>
                {formatMoney(budget.money)}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 6,
        justifyContent: 'space-between',
    },
    leftSection: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        color: '#333',
    },
    category: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    money: {
    },
});
