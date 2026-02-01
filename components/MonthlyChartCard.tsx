import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { ChartMonthData } from '../utils/budgetAnalytics';

interface MonthlyChartCardProps {
    chartData: ChartMonthData[];
}

export default function MonthlyChartCard({ chartData }: MonthlyChartCardProps) {
    if (chartData.length === 0) {
        return (
            <View style={styles.card}>
                <Text style={styles.emptyText}>차트 데이터가 없습니다</Text>
            </View>
        );
    }

    const maxValue = Math.max(
        ...chartData.map(d => Math.max(d.income, d.totalExpense)),
        1,
    );

    const barData = chartData.flatMap((d, i) => [
        {
            value: d.income,
            frontColor: '#4CAF50',
            label: i === 0 || i === chartData.length - 1 ? d.label : '',
            spacing: 2,
            labelWidth: 40,
        },
        {
            value: d.savings,
            frontColor: '#2196F3',
            spacing: 2,
        },
        {
            value: d.fixedExpense,
            frontColor: '#FF9800',
            spacing: 2,
        },
        {
            value: d.totalExpense,
            frontColor: '#F44336',
            spacing: i < chartData.length - 1 ? 16 : 0,
        },
    ]);

    const lineData = chartData.map(d => ({
        value: d.incomeExpenseRatio,
    }));

    const maxLineValue = Math.max(...lineData.map(d => d.value), 100);

    return (
        <View style={styles.card}>
            <Text style={styles.title}>월별 추이</Text>

            {/* 범례 */}
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                    <Text style={styles.legendText}>수입</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
                    <Text style={styles.legendText}>저축</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
                    <Text style={styles.legendText}>고정</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
                    <Text style={styles.legendText}>총지출</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendLine, { backgroundColor: '#9C27B0' }]} />
                    <Text style={styles.legendText}>지출비율</Text>
                </View>
            </View>

            <BarChart
                data={barData}
                barWidth={10}
                spacing={2}
                noOfSections={4}
                maxValue={maxValue * 1.1}
                yAxisTextStyle={{ fontSize: 9, color: '#999' }}
                xAxisLabelTextStyle={{ fontSize: 10, color: '#666' }}
                hideRules
                barBorderRadius={2}
                lineData={lineData}
                lineConfig={{
                    color: '#9C27B0',
                    thickness: 2,
                    dataPointsColor: '#9C27B0',
                    dataPointsRadius: 3,
                    curved: true,
                    shiftY: 0,
                    startIndex: 0,
                    endIndex: lineData.length - 1,
                }}
                secondaryYAxis={{
                    maxValue: maxLineValue * 1.2,
                    noOfSections: 4,
                    yAxisTextStyle: { fontSize: 9, color: '#9C27B0' },
                }}
                height={180}
                isAnimated
            />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 16,
        marginBottom: 12,
    },
    title: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 14,
        paddingVertical: 20,
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendLine: {
        width: 14,
        height: 3,
        borderRadius: 1,
    },
    legendText: {
        fontSize: 11,
        color: '#666',
    },
});
