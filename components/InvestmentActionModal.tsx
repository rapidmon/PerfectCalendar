import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Investment, StockPrice } from '../types/investment';
import {
    calculateInvestmentDetail,
    formatProfitRate,
    formatAmount,
    formatProfit,
} from '../utils/investmentAnalytics';

interface InvestmentActionModalProps {
    visible: boolean;
    investment: Investment | null;
    price: StockPrice | null;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export default function InvestmentActionModal({
    visible,
    investment,
    price,
    onClose,
    onEdit,
    onDelete,
}: InvestmentActionModalProps) {
    if (!investment) return null;

    const currentPrice = price?.price || investment.averagePrice;
    const detail = calculateInvestmentDetail(investment, currentPrice);

    const isKorea = investment.type === 'KOREA_STOCK';
    const flag = isKorea ? '🇰🇷' : '🇺🇸';
    const profitColor = detail.profitRate >= 0 ? '#F44336' : '#2196F3';
    const priceChangeColor = (price?.changePercent || 0) >= 0 ? '#F44336' : '#2196F3';

    const formatDateStr = (dateStr: string): string => {
        const date = new Date(dateStr);
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.container} onStartShouldSetResponder={() => true}>
                    {/* 헤더 */}
                    <View style={styles.header}>
                        <Text style={styles.flag}>{flag}</Text>
                        <View style={styles.headerInfo}>
                            <Text style={styles.title}>{investment.name}</Text>
                            <Text style={styles.subtitle}>
                                {investment.ticker} • {investment.market}
                            </Text>
                        </View>
                    </View>

                    {/* 현재가 정보 */}
                    <View style={styles.priceSection}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>현재가</Text>
                            <View style={styles.priceValueRow}>
                                <Text style={styles.priceValue}>
                                    {formatAmount(currentPrice, investment.currency)}
                                </Text>
                                {price && (
                                    <Text style={[styles.priceChange, { color: priceChangeColor }]}>
                                        {price.changePercent >= 0 ? '+' : ''}
                                        {price.changePercent.toFixed(2)}%
                                    </Text>
                                )}
                            </View>
                        </View>
                        {price && (
                            <Text style={styles.lastUpdated}>
                                최근 업데이트: {formatDateStr(price.lastUpdated)}
                            </Text>
                        )}
                    </View>

                    {/* 보유 정보 */}
                    <View style={styles.infoSection}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>보유 수량</Text>
                            <Text style={styles.infoValue}>{investment.quantity}주</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>평균 매입가</Text>
                            <Text style={styles.infoValue}>
                                {formatAmount(investment.averagePrice, investment.currency)}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>총 매입금액</Text>
                            <Text style={styles.infoValue}>
                                {formatAmount(detail.purchaseValue, investment.currency)}
                            </Text>
                        </View>
                    </View>

                    {/* 평가 정보 */}
                    <View style={styles.evalSection}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>평가금액</Text>
                            <Text style={styles.evalValue}>
                                {formatAmount(detail.currentValue, investment.currency)}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>평가손익</Text>
                            <Text style={[styles.profitValue, { color: profitColor }]}>
                                {formatProfit(detail.profit, investment.currency)}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>수익률</Text>
                            <Text style={[styles.profitRateValue, { color: profitColor }]}>
                                {formatProfitRate(detail.profitRate)}
                            </Text>
                        </View>
                    </View>

                    {/* 등록일 */}
                    <Text style={styles.createdAt}>
                        등록일: {formatDateStr(investment.createdAt)}
                    </Text>

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
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    flag: {
        fontSize: 36,
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        marginTop: 2,
    },
    priceSection: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 14,
        color: '#666',
    },
    priceValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    priceValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    priceChange: {
        fontSize: 14,
        fontWeight: '600',
    },
    lastUpdated: {
        fontSize: 11,
        color: '#999',
        marginTop: 4,
        textAlign: 'right',
    },
    infoSection: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    evalSection: {
        marginBottom: 12,
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
    evalValue: {
        fontSize: 15,
        color: '#333',
        fontWeight: 'bold',
    },
    profitValue: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    profitRateValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    createdAt: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginBottom: 16,
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
