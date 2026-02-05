import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Investment, StockPrice } from '../types/investment';
import {
    calculateInvestmentDetail,
    formatProfitRate,
    formatAmount,
} from '../utils/investmentAnalytics';

interface InvestmentItemProps {
    investment: Investment;
    price: StockPrice | null;
    onPress: () => void;
}

export default function InvestmentItem({ investment, price, onPress }: InvestmentItemProps) {
    const currentPrice = price?.price || investment.averagePrice;
    const detail = calculateInvestmentDetail(investment, currentPrice);

    const isKorea = investment.type === 'KOREA_STOCK';
    const flag = isKorea ? '🇰🇷' : '🇺🇸';
    const priceChangePercent = price?.changePercent || 0;

    const profitColor = detail.profitRate >= 0 ? '#F44336' : '#2196F3';
    const priceChangeColor = priceChangePercent >= 0 ? '#F44336' : '#2196F3';

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.flag}>{flag}</Text>
                    <View style={styles.titleContainer}>
                        <Text style={styles.name} numberOfLines={1}>{investment.name}</Text>
                        <Text style={styles.ticker}>{investment.ticker} • {investment.market}</Text>
                    </View>
                </View>
                <View style={styles.profitContainer}>
                    <Text style={[styles.profitRate, { color: profitColor }]}>
                        {formatProfitRate(detail.profitRate)}
                    </Text>
                </View>
            </View>

            <View style={styles.infoRow}>
                <Text style={styles.quantity}>{investment.quantity}주</Text>
                <Text style={styles.separator}>×</Text>
                <Text style={styles.price}>
                    {formatAmount(currentPrice, investment.currency)}
                </Text>
                {price && (
                    <Text style={[styles.change, { color: priceChangeColor }]}>
                        ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                    </Text>
                )}
            </View>

            <View style={styles.valueRow}>
                <Text style={styles.valueLabel}>
                    평가: <Text style={styles.valueAmount}>{formatAmount(detail.currentValue, investment.currency)}</Text>
                </Text>
                <Text style={[styles.profitLabel, { color: profitColor }]}>
                    {detail.profit >= 0 ? '+' : ''}{formatAmount(detail.profit, investment.currency)}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

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
    flag: {
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
    ticker: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    profitContainer: {
        marginLeft: 8,
    },
    profitRate: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    quantity: {
        fontSize: 14,
        color: '#555',
        fontWeight: '600',
    },
    separator: {
        fontSize: 14,
        color: '#999',
        marginHorizontal: 6,
    },
    price: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    change: {
        fontSize: 12,
        marginLeft: 6,
    },
    valueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    valueLabel: {
        fontSize: 13,
        color: '#888',
    },
    valueAmount: {
        color: '#333',
        fontWeight: '600',
    },
    profitLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
});
