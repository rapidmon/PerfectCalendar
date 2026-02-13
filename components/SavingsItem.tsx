import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Savings } from '../types/savings';
import { formatMoneyNoSign } from '../utils/format';
import {
    getSavingsProgress,
    getDaysRemaining,
    getCurrentPaidAmount,
    getExpectedMaturityAmount,
} from '../utils/savingsCalculator';

interface SavingsItemProps {
    savings: Savings;
    onPress: () => void;
}

function SavingsItem({ savings, onPress }: SavingsItemProps) {
    const progress = getSavingsProgress(savings);
    const daysRemaining = getDaysRemaining(savings);
    const currentAmount = getCurrentPaidAmount(savings);
    const expectedAmount = getExpectedMaturityAmount(savings);

    const getTypeInfo = () => {
        switch (savings.type) {
            case 'FIXED_DEPOSIT':
                return { label: '예금', emoji: '🏦' };
            case 'FREE_SAVINGS':
                return { label: '자유적금', emoji: '💫' };
            default:
                return { label: '적금', emoji: '📊' };
        }
    };
    const { label: typeLabel, emoji: typeEmoji } = getTypeInfo();

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.emoji}>{typeEmoji}</Text>
                    <View style={styles.titleContainer}>
                        <Text style={styles.name} numberOfLines={1}>{savings.name}</Text>
                        <Text style={styles.bankName}>{savings.bankName}</Text>
                    </View>
                </View>
                <View style={styles.badgeContainer}>
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{typeLabel}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.infoRow}>
                {savings.type === 'FIXED_DEPOSIT' ? (
                    <Text style={styles.infoText}>
                        원금 {formatMoneyNoSign(savings.principal || 0)}
                    </Text>
                ) : savings.type === 'FREE_SAVINGS' ? (
                    <Text style={styles.infoText}>
                        {savings.minMonthlyAmount && savings.maxMonthlyAmount
                            ? `월 ${formatMoneyNoSign(savings.minMonthlyAmount)}~${formatMoneyNoSign(savings.maxMonthlyAmount)}`
                            : '자유납입'}
                    </Text>
                ) : (
                    <Text style={styles.infoText}>
                        월 {formatMoneyNoSign(savings.monthlyAmount || 0)}
                    </Text>
                )}
                <Text style={styles.rateText}>{savings.interestRate}%</Text>
                <Text style={styles.daysText}>D-{daysRemaining}</Text>
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{progress}%</Text>
            </View>

            <View style={styles.amountRow}>
                <Text style={styles.currentLabel}>
                    현재: <Text style={styles.currentAmount}>{formatMoneyNoSign(currentAmount)}</Text>
                </Text>
                <Text style={styles.expectedLabel}>
                    예상: <Text style={styles.expectedAmount}>{formatMoneyNoSign(expectedAmount)}</Text>
                </Text>
            </View>
        </TouchableOpacity>
    );
}

export default React.memo(SavingsItem);

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    emoji: {
        fontSize: 24,
        marginRight: 10,
    },
    titleContainer: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    bankName: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    badgeContainer: {
        marginLeft: 8,
    },
    typeBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    typeBadgeText: {
        fontSize: 11,
        color: '#4CAF50',
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    infoText: {
        fontSize: 13,
        color: '#555',
    },
    rateText: {
        fontSize: 13,
        color: '#4A90E2',
        fontWeight: '600',
    },
    daysText: {
        fontSize: 13,
        color: '#FF9800',
        fontWeight: '600',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    progressBackground: {
        flex: 1,
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
        width: 36,
        textAlign: 'right',
    },
    amountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    currentLabel: {
        fontSize: 12,
        color: '#888',
    },
    currentAmount: {
        color: '#333',
        fontWeight: '600',
    },
    expectedLabel: {
        fontSize: 12,
        color: '#888',
    },
    expectedAmount: {
        color: '#4CAF50',
        fontWeight: '600',
    },
});
