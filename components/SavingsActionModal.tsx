import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Savings } from '../types/savings';
import { formatMoneyNoSign } from '../utils/format';
import {
    getSavingsProgress,
    getDaysRemaining,
    getCurrentPaidAmount,
    getExpectedMaturityAmount,
    getExpectedInterest,
    getTotalPrincipal,
    getNextPaymentDate,
} from '../utils/savingsCalculator';

interface SavingsActionModalProps {
    visible: boolean;
    savings: Savings | null;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export default function SavingsActionModal({
    visible,
    savings,
    onClose,
    onEdit,
    onDelete,
}: SavingsActionModalProps) {
    if (!savings) return null;

    const progress = getSavingsProgress(savings);
    const daysRemaining = getDaysRemaining(savings);
    const currentAmount = getCurrentPaidAmount(savings);
    const expectedAmount = getExpectedMaturityAmount(savings);
    const expectedInterest = getExpectedInterest(savings);
    const totalPrincipal = getTotalPrincipal(savings);
    const nextPayment = getNextPaymentDate(savings);

    const getTypeLabel = () => {
        switch (savings.type) {
            case 'FIXED_DEPOSIT': return '정기예금';
            case 'FREE_SAVINGS': return '자유적금';
            default: return '정기적금';
        }
    };
    const typeLabel = getTypeLabel();

    const formatDateStr = (dateStr: string): string => {
        const [year, month, day] = dateStr.split('-');
        return `${year}.${month}.${day}`;
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.container} onStartShouldSetResponder={() => true}>
                    {/* 헤더 */}
                    <View style={styles.header}>
                        <Text style={styles.title}>{savings.name}</Text>
                        <Text style={styles.subtitle}>{savings.bankName} | {typeLabel}</Text>
                    </View>

                    {/* 상세 정보 */}
                    <View style={styles.infoSection}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>연 금리</Text>
                            <Text style={styles.infoValue}>{savings.interestRate}%</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>가입일</Text>
                            <Text style={styles.infoValue}>{formatDateStr(savings.startDate)}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>만기일</Text>
                            <Text style={styles.infoValue}>{formatDateStr(savings.endDate)}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>남은 일수</Text>
                            <Text style={[styles.infoValue, styles.daysValue]}>D-{daysRemaining}</Text>
                        </View>
                        {savings.type === 'INSTALLMENT_SAVINGS' && nextPayment && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>다음 납입일</Text>
                                <Text style={styles.infoValue}>{formatDateStr(nextPayment)}</Text>
                            </View>
                        )}
                    </View>

                    {/* 금액 정보 */}
                    <View style={styles.amountSection}>
                        {savings.type === 'INSTALLMENT_SAVINGS' ? (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>월 납입금</Text>
                                <Text style={styles.infoValue}>{formatMoneyNoSign(savings.monthlyAmount || 0)}</Text>
                            </View>
                        ) : savings.type === 'FREE_SAVINGS' ? (
                            <>
                                {(savings.minMonthlyAmount || savings.maxMonthlyAmount) && (
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>월 납입 한도</Text>
                                        <Text style={styles.infoValue}>
                                            {savings.minMonthlyAmount ? formatMoneyNoSign(savings.minMonthlyAmount) : '0'}
                                            ~
                                            {savings.maxMonthlyAmount ? formatMoneyNoSign(savings.maxMonthlyAmount) : '무제한'}
                                        </Text>
                                    </View>
                                )}
                            </>
                        ) : (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>예치 원금</Text>
                                <Text style={styles.infoValue}>{formatMoneyNoSign(savings.principal || 0)}</Text>
                            </View>
                        )}
                        {savings.type !== 'FREE_SAVINGS' && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>총 원금</Text>
                                <Text style={styles.infoValue}>{formatMoneyNoSign(totalPrincipal)}</Text>
                            </View>
                        )}
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>{savings.type === 'FREE_SAVINGS' ? '현재 잔액' : '현재까지 납입'}</Text>
                            <Text style={styles.infoValue}>{formatMoneyNoSign(currentAmount)}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>예상 이자</Text>
                            <Text style={[styles.infoValue, styles.interestValue]}>+{formatMoneyNoSign(expectedInterest)}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>예상 만기금액</Text>
                            <Text style={[styles.infoValue, styles.expectedValue]}>{formatMoneyNoSign(expectedAmount)}</Text>
                        </View>
                    </View>

                    {/* 진행률 */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>진행률</Text>
                            <Text style={styles.progressPercent}>{progress}%</Text>
                        </View>
                        <View style={styles.progressBackground}>
                            <View style={[styles.progressFill, { width: `${progress}%` }]} />
                        </View>
                    </View>

                    {/* 버튼 */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
                            <Text style={styles.editButtonText}>수정</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                            <Text style={styles.deleteButtonText}>삭제</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '90%',
        maxWidth: 380,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
    },
    infoSection: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    amountSection: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    daysValue: {
        color: '#FF9800',
    },
    interestValue: {
        color: '#4CAF50',
    },
    expectedValue: {
        color: '#4A90E2',
        fontWeight: 'bold',
    },
    progressSection: {
        marginBottom: 20,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 14,
        color: '#666',
    },
    progressPercent: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    progressBackground: {
        height: 10,
        backgroundColor: '#E0E0E0',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 5,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    editButton: {
        flex: 1,
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
    },
    editButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    deleteButton: {
        flex: 1,
        backgroundColor: '#F44336',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
});
