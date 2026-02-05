import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useAppData } from '../contexts/AppDataContext';
import { Investment, StockPrice } from '../types/investment';
import { Savings } from '../types/savings';
import { getMultipleStockPrices } from '../services/stockService';
import InvestmentSummaryCard from './InvestmentSummaryCard';
import InvestmentList from './InvestmentList';
import SavingsList from './SavingsList';
import AddInvestmentModal from './AddInvestmentModal';
import AddSavingsModal from './AddSavingsModal';
import InvestmentActionModal from './InvestmentActionModal';
import SavingsActionModal from './SavingsActionModal';

export default function InvestmentScreen() {
    const { investments, savings, store } = useAppData();

    const [prices, setPrices] = useState<Map<string, StockPrice>>(new Map());
    const [refreshing, setRefreshing] = useState(false);

    // 모달 상태
    const [addInvestmentVisible, setAddInvestmentVisible] = useState(false);
    const [addSavingsVisible, setAddSavingsVisible] = useState(false);
    const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
    const [selectedSavings, setSelectedSavings] = useState<Savings | null>(null);
    const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
    const [editingSavings, setEditingSavings] = useState<Savings | null>(null);

    // 주식 시세 조회
    const fetchPrices = useCallback(async () => {
        if (investments.length === 0) return;

        try {
            const stocks = investments.map((inv) => ({
                ticker: inv.ticker,
                type: inv.type,
            }));
            const newPrices = await getMultipleStockPrices(stocks);
            setPrices(newPrices);
        } catch (error) {
            console.error('시세 조회 실패:', error);
        }
    }, [investments]);

    useEffect(() => {
        fetchPrices();
    }, [fetchPrices]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchPrices();
        setRefreshing(false);
    };

    // 투자 CRUD
    const handleAddInvestment = (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = new Date().toISOString();
        const investment: Investment = {
            ...data,
            id: `inv_${Date.now()}`,
            createdAt: now,
            updatedAt: now,
        };
        store.addInvestment(investment);
    };

    const handleUpdateInvestment = (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!editingInvestment) return;
        store.updateInvestment(editingInvestment.id, data);
        setEditingInvestment(null);
    };

    const handleDeleteInvestment = (id: string) => {
        Alert.alert(
            '투자 삭제',
            '이 투자를 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => {
                        store.deleteInvestment(id);
                        setSelectedInvestment(null);
                    },
                },
            ]
        );
    };

    // 적금 CRUD
    const handleAddSavings = (data: Omit<Savings, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = new Date().toISOString();
        const savingsItem: Savings = {
            ...data,
            id: `sav_${Date.now()}`,
            createdAt: now,
            updatedAt: now,
        };
        store.addSavings(savingsItem);
    };

    const handleUpdateSavings = (data: Omit<Savings, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!editingSavings) return;
        store.updateSavings(editingSavings.id, data);
        setEditingSavings(null);
    };

    const handleDeleteSavings = (id: string) => {
        Alert.alert(
            '적금/예금 삭제',
            '이 적금/예금을 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => {
                        store.deleteSavings(id);
                        setSelectedSavings(null);
                    },
                },
            ]
        );
    };

    // 모달 핸들러
    const handleInvestmentItemPress = (investment: Investment) => {
        setSelectedInvestment(investment);
    };

    const handleSavingsItemPress = (savingsItem: Savings) => {
        setSelectedSavings(savingsItem);
    };

    const handleEditInvestment = () => {
        if (selectedInvestment) {
            setEditingInvestment(selectedInvestment);
            setSelectedInvestment(null);
            setAddInvestmentVisible(true);
        }
    };

    const handleEditSavings = () => {
        if (selectedSavings) {
            setEditingSavings(selectedSavings);
            setSelectedSavings(null);
            setAddSavingsVisible(true);
        }
    };

    return (
        <View style={styles.container}>
            {/* 헤더 */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>저축/투자</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                    <Text style={styles.refreshButtonText}>새로고침</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {/* 자산 요약 */}
                <InvestmentSummaryCard
                    investments={investments}
                    savings={savings}
                    prices={prices}
                />

                {/* 투자 목록 */}
                <View style={styles.section}>
                    <InvestmentList
                        investments={investments}
                        prices={prices}
                        onAddPress={() => {
                            setEditingInvestment(null);
                            setAddInvestmentVisible(true);
                        }}
                        onItemPress={handleInvestmentItemPress}
                    />
                </View>

                {/* 적금 목록 */}
                <View style={styles.section}>
                    <SavingsList
                        savings={savings}
                        onAddPress={() => {
                            setEditingSavings(null);
                            setAddSavingsVisible(true);
                        }}
                        onItemPress={handleSavingsItemPress}
                    />
                </View>
            </ScrollView>

            {/* 모달들 */}
            <AddInvestmentModal
                visible={addInvestmentVisible}
                editingInvestment={editingInvestment}
                onClose={() => {
                    setAddInvestmentVisible(false);
                    setEditingInvestment(null);
                }}
                onSave={editingInvestment ? handleUpdateInvestment : handleAddInvestment}
            />

            <AddSavingsModal
                visible={addSavingsVisible}
                editingSavings={editingSavings}
                onClose={() => {
                    setAddSavingsVisible(false);
                    setEditingSavings(null);
                }}
                onSave={editingSavings ? handleUpdateSavings : handleAddSavings}
            />

            <InvestmentActionModal
                visible={!!selectedInvestment}
                investment={selectedInvestment}
                price={selectedInvestment ? prices.get(selectedInvestment.ticker) || null : null}
                onClose={() => setSelectedInvestment(null)}
                onEdit={handleEditInvestment}
                onDelete={() => selectedInvestment && handleDeleteInvestment(selectedInvestment.id)}
            />

            <SavingsActionModal
                visible={!!selectedSavings}
                savings={selectedSavings}
                onClose={() => setSelectedSavings(null)}
                onEdit={handleEditSavings}
                onDelete={() => selectedSavings && handleDeleteSavings(selectedSavings.id)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    refreshButton: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    refreshButtonText: {
        fontSize: 13,
        color: '#555',
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        marginTop: 20,
    },
});
