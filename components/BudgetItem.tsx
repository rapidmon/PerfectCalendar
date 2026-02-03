import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Budget } from '../types/budget';
import { formatMoney } from '../utils/format';

const ACCOUNT_COLORS = [
    '#5B9BD5', '#E67E22', '#27AE60', '#8E44AD', '#E74C3C',
    '#1ABC9C', '#F39C12', '#3498DB', '#D35400', '#2ECC71',
];

interface BudgetItemProps {
    budget: Budget;
    accounts: string[];
    onPress: () => void;
}

export default function BudgetItem({ budget, accounts, onPress }: BudgetItemProps) {
    const accountIndex = budget.account ? accounts.indexOf(budget.account) : -1;
    const accountNumber = accountIndex >= 0 ? accountIndex + 1 : null;
    const accountColor = accountNumber ? ACCOUNT_COLORS[(accountNumber - 1) % ACCOUNT_COLORS.length] : '#999';

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
            <View style={styles.rightSection}>
                {accountNumber ? (
                    <View style={[styles.accountChip, { backgroundColor: accountColor + '18', borderColor: accountColor + '40' }]}>
                        <Text style={[styles.accountLabel, { color: accountColor }]}>
                            {accountNumber}번
                        </Text>
                    </View>
                ) : null}
                <Text style={[
                styles.money,
                { color: budget.type === 'INCOME' ? '#4CAF50' : '#F44336' }
                ]}>
                    {formatMoney(budget.money)}
                </Text>
            </View>
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
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    accountChip: {
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 5,
        paddingVertical: 1,
    },
    accountLabel: {
        fontSize: 9,
        fontWeight: '700',
    },
    money: {
    },
});
