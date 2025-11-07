import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Budget } from '../types/budget';
import { formatMoney } from '../utils/format';

interface BudgetItemProps {
    budget: Budget;
}

export default function BudgetItem({ budget }: BudgetItemProps) {

    return (
        <TouchableOpacity
        style={styles.container}
        >
            <Text style={styles.title}>
                {budget.title}
            </Text>
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
        justifyContent: 'space-between'
    },
    title: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    money: {
    },
    income: {
        color: '#4CAF50',
    },
    expense: {
        color: '#F44336',
    },
});