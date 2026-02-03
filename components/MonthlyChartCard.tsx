import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
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

    const htmlContent = useMemo(() => {
        const labels = chartData.map(d => d.label);
        const incomeData = chartData.map(d => d.income);
        const savingsData = chartData.map(d => d.savings);
        const fixedExpenseData = chartData.map(d => d.fixedExpense);
        const totalExpenseData = chartData.map(d => d.totalExpense);
        const ratioData = chartData.map(d => d.incomeExpenseRatio);

        return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: transparent; overflow-x: auto; overflow-y: hidden; }
        .chart-wrapper {
            width: ${Math.max(chartData.length * 80, 300)}px;
            height: 220px;
            padding: 4px 0;
        }
        canvas { width: 100% !important; height: 100% !important; }
    </style>
</head>
<body>
    <div class="chart-wrapper">
        <canvas id="chart"></canvas>
    </div>
    <script>
        const hoverTooltipPlugin = {
            id: 'hoverTooltip',
            _activeItems: null,
            _touching: false,
            afterEvent(chart, args) {
                const evt = args.event;
                if (evt.type === 'pointerdown' || evt.type === 'pointermove' || evt.type === 'mousemove') {
                    this._touching = true;
                    const elements = chart.getElementsAtEventForMode(evt, 'index', { intersect: false }, false);
                    if (elements.length > 0) {
                        this._activeItems = elements;
                        chart.draw();
                    }
                } else if (evt.type === 'pointerup' || evt.type === 'pointerout' || evt.type === 'mouseout') {
                    this._touching = false;
                    this._activeItems = null;
                    chart.draw();
                }
            },
            afterDraw(chart) {
                if (!this._touching || !this._activeItems || this._activeItems.length === 0) return;
                const ctx = chart.ctx;
                const items = this._activeItems;
                const dataIndex = items[0].index;

                const lines = [];
                chart.data.datasets.forEach((ds, i) => {
                    const value = ds.data[dataIndex];
                    if (value == null) return;
                    const label = ds.label || '';
                    const color = ds.borderColor || ds.backgroundColor;
                    let text;
                    if (ds.yAxisID === 'y1') {
                        text = label + ': ' + Number(value).toFixed(1) + '%';
                    } else {
                        text = label + ': ' + Number(value).toLocaleString('ko-KR') + '원';
                    }
                    lines.push({ text, color });
                });
                if (lines.length === 0) return;

                ctx.save();
                ctx.font = '11px sans-serif';
                const padding = 8;
                const lineHeight = 16;
                const maxWidth = Math.max(...lines.map(l => ctx.measureText(l.text).width));
                const boxW = maxWidth + padding * 2 + 12;
                const boxH = lines.length * lineHeight + padding * 2;

                let x = items[0].element.x;
                let y = 8;
                if (x + boxW / 2 > chart.width) x = chart.width - boxW - 4;
                else if (x - boxW / 2 < 0) x = 4;
                else x = x - boxW / 2;

                ctx.fillStyle = 'rgba(0,0,0,0.82)';
                ctx.beginPath();
                ctx.roundRect(x, y, boxW, boxH, 6);
                ctx.fill();

                lines.forEach((line, i) => {
                    const ly = y + padding + i * lineHeight + 12;
                    ctx.fillStyle = line.color;
                    ctx.beginPath();
                    ctx.arc(x + padding + 4, ly - 4, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.fillText(line.text, x + padding + 12, ly);
                });
                ctx.restore();
            }
        };

        const ctx = document.getElementById('chart').getContext('2d');
        new Chart(ctx, {
            plugins: [hoverTooltipPlugin],
            type: 'bar',
            data: {
                labels: ${JSON.stringify(labels)},
                datasets: [
                    {
                        label: '수입',
                        data: ${JSON.stringify(incomeData)},
                        backgroundColor: '#4CAF50',
                        borderRadius: 3,
                        order: 2,
                        yAxisID: 'y',
                    },
                    {
                        label: '저축',
                        data: ${JSON.stringify(savingsData)},
                        backgroundColor: '#2196F3',
                        borderRadius: 3,
                        order: 2,
                        yAxisID: 'y',
                    },
                    {
                        label: '고정',
                        data: ${JSON.stringify(fixedExpenseData)},
                        backgroundColor: '#FF9800',
                        borderRadius: 3,
                        order: 2,
                        yAxisID: 'y',
                    },
                    {
                        label: '총지출',
                        data: ${JSON.stringify(totalExpenseData)},
                        backgroundColor: '#F44336',
                        borderRadius: 3,
                        order: 2,
                        yAxisID: 'y',
                    },
                    {
                        label: '지출비율',
                        data: ${JSON.stringify(ratioData)},
                        type: 'line',
                        borderColor: '#9C27B0',
                        backgroundColor: 'rgba(156, 39, 176, 0.1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#9C27B0',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        tension: 0.3,
                        fill: false,
                        order: 1,
                        yAxisID: 'y1',
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                events: ['pointerdown', 'pointermove', 'pointerup', 'pointerout'],
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: false,
                    },
                    hoverTooltip: {},
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 }, color: '#666' },
                    },
                    y: {
                        position: 'left',
                        min: 0,
                        max: 12000000,
                        ticks: {
                            stepSize: 2000000,
                            font: { size: 9 },
                            color: '#999',
                            callback: function(value) {
                                return (value / 10000).toLocaleString();
                            }
                        },
                        grid: { color: 'rgba(0,0,0,0.06)' },
                    },
                    y1: {
                        position: 'right',
                        min: 0,
                        max: 120,
                        ticks: {
                            stepSize: 20,
                            font: { size: 9 },
                            color: '#9C27B0',
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: { display: false },
                    },
                },
            },
        });

        // 초기 스크롤을 오른쪽 끝으로
        setTimeout(() => { window.scrollTo(document.body.scrollWidth, 0); }, 100);
    </script>
</body>
</html>`;
    }, [chartData]);

    return (
        <View style={styles.card}>
            <Text style={styles.title}>월별 추이</Text>

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

            <View style={styles.chartContainer}>
                <WebView
                    source={{ html: htmlContent }}
                    style={styles.webview}
                    scrollEnabled={true}
                    nestedScrollEnabled={true}
                    showsHorizontalScrollIndicator={false}
                    javaScriptEnabled={true}
                    originWhitelist={['*']}
                    injectedJavaScript="setTimeout(() => { window.scrollTo(document.body.scrollWidth, 0); }, 300);"
                />
            </View>
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
    chartContainer: {
        height: 230,
        borderRadius: 8,
        overflow: 'hidden',
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});
