import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Budget } from '../types/budget';
import { formatMoney } from '../utils/format';

const ACCOUNT_COLORS = [
    '#5B9BD5', '#E67E22', '#27AE60', '#8E44AD', '#E74C3C',
    '#1ABC9C', '#F39C12', '#3498DB', '#D35400', '#2ECC71',
];

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

interface BudgetItemProps {
    budget: Budget;
    accounts: string[];
    isGroupConnected?: boolean;
    onPress: () => void;
}

export default function BudgetItem({ budget, accounts, isGroupConnected = false, onPress }: BudgetItemProps) {
    const accountIndex = budget.account ? accounts.indexOf(budget.account) : -1;
    const accountNumber = accountIndex >= 0 ? accountIndex + 1 : null;
    const accountColor = accountNumber ? ACCOUNT_COLORS[(accountNumber - 1) % ACCOUNT_COLORS.length] : '#999';

    return (
        <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        >
            <View style={styles.leftSection}>
                <View style={styles.titleRow}>
                    {isGroupConnected && budget.authorUid ? (
                        <View style={[styles.ownerDot, { backgroundColor: OWNER_COLORS[getOwnerColorIndex(budget.authorUid)] }]} />
                    ) : null}
                    <Text style={styles.title}>{budget.title}</Text>
                </View>
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
                    {formatMoney(budget.type === 'EXPENSE' ? -budget.money : budget.money)}
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
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ownerDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        marginRight: 5,
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
