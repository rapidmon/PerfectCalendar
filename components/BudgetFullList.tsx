import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import MonthlySummaryCard from './MonthlySummaryCard';
import MonthlyChartCard from './MonthlyChartCard';
import SetGoalModal from './SetGoalModal';
import CategoryManageModal from './CategoryManageModal';
import AccountManageModal from './AccountManageModal';
import OverallStatsModal from './OverallStatsModal';
import { AccountBalances } from '../types/budget';
import { useAppData } from '../contexts/AppDataContext';
import { computeMonthlyStats, getMultiMonthChartData, computeAccountBalances } from '../utils/budgetAnalytics';

interface BudgetFullListProps {
    selectedDate: Date;
}

export default function BudgetFullList({ selectedDate }: BudgetFullListProps) {
    const { budgets, categories, fixedCategories, monthlyGoals, accounts, accountBalances, accountOwners, isGroupConnected, store } = useAppData();

    const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
    const [viewMonth, setViewMonth] = useState(selectedDate.getMonth() + 1);

    const [settingsMenuVisible, setSettingsMenuVisible] = useState(false);
    const [goalModalVisible, setGoalModalVisible] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [accountManageModalVisible, setAccountManageModalVisible] = useState(false);
    const [overallStatsVisible, setOverallStatsVisible] = useState(false);

    const monthKey = `${viewYear}-${String(viewMonth).padStart(2, '0')}`;
    const monthLabel = `${viewYear}년 ${viewMonth}월`;

    const goToPrevMonth = useCallback(() => {
        if (viewMonth === 1) {
            setViewYear(y => y - 1);
            setViewMonth(12);
        } else {
            setViewMonth(m => m - 1);
        }
    }, [viewMonth]);

    const goToNextMonth = useCallback(() => {
        if (viewMonth === 12) {
            setViewYear(y => y + 1);
            setViewMonth(1);
        } else {
            setViewMonth(m => m + 1);
        }
    }, [viewMonth]);

    const handleSaveGoal = useCallback((amount: number) => {
        store.setMonthlyGoal(monthKey, amount);
    }, [store, monthKey]);

    const handleSaveCategories = useCallback((cats: string[], fixed: string[]) => {
        store.saveCategoriesAndFixed(cats, fixed);
    }, [store]);

    const handleSaveAccounts = useCallback((accs: string[], balances: AccountBalances) => {
        store.saveAccountsAndBalances(accs, balances);
    }, [store]);

    const openSettingsItem = useCallback((target: 'goal' | 'category' | 'accountManage') => {
        setSettingsMenuVisible(false);
        setTimeout(() => {
            if (target === 'goal') setGoalModalVisible(true);
            else if (target === 'category') setCategoryModalVisible(true);
            else if (target === 'accountManage') setAccountManageModalVisible(true);
        }, 200);
    }, []);

    // Memoized analytics - recomputed only when dependencies change
    const stats = useMemo(
        () => computeMonthlyStats(budgets, viewYear, viewMonth, fixedCategories),
        [budgets, viewYear, viewMonth, fixedCategories]
    );

    const chartData = useMemo(
        () => getMultiMonthChartData(budgets, viewYear, viewMonth, 6, fixedCategories),
        [budgets, viewYear, viewMonth, fixedCategories]
    );

    const accountBalanceList = useMemo(
        () => computeAccountBalances(budgets, accountBalances, accounts, isGroupConnected ? accountOwners : undefined),
        [budgets, accountBalances, accounts, accountOwners, isGroupConnected]
    );

    return (
        <View style={styles.container}>
            {/* 월 네비게이터 */}
            <View style={styles.monthNav}>
                <TouchableOpacity
                    style={styles.overallButton}
                    onPress={() => setOverallStatsVisible(true)}
                >
                    <Text style={styles.overallButtonText}>전체</Text>
                </TouchableOpacity>
                <View style={styles.navCenter}>
                    <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
                        <Text style={styles.navButtonText}>◀</Text>
                    </TouchableOpacity>
                    <Text style={styles.monthLabel}>{monthLabel}</Text>
                    <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                        <Text style={styles.navButtonText}>▶</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => setSettingsMenuVisible(true)}
                >
                    <Text style={styles.settingsButtonText}>⚙</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <MonthlySummaryCard
                    year={viewYear}
                    month={viewMonth}
                    stats={stats}
                    budgets={budgets}
                    fixedCategories={fixedCategories}
                    goalAmount={monthlyGoals[monthKey]}
                    accountBalances={accountBalanceList}
                />

                <MonthlyChartCard chartData={chartData} />
            </ScrollView>

            <SetGoalModal
                visible={goalModalVisible}
                currentGoal={monthlyGoals[monthKey]}
                monthLabel={monthLabel}
                onClose={() => setGoalModalVisible(false)}
                onSave={handleSaveGoal}
            />

            <CategoryManageModal
                visible={categoryModalVisible}
                categories={categories}
                fixedCategories={fixedCategories}
                onClose={() => setCategoryModalVisible(false)}
                onSave={handleSaveCategories}
            />

            <AccountManageModal
                visible={accountManageModalVisible}
                accounts={accounts}
                initialBalances={accountBalances}
                onClose={() => setAccountManageModalVisible(false)}
                onSave={handleSaveAccounts}
            />

            <OverallStatsModal
                visible={overallStatsVisible}
                budgets={budgets}
                onClose={() => setOverallStatsVisible(false)}
            />

            {/* 설정 메뉴 */}
            <Modal
                visible={settingsMenuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setSettingsMenuVisible(false)}
            >
                <TouchableOpacity
                    style={styles.menuOverlay}
                    activeOpacity={1}
                    onPress={() => setSettingsMenuVisible(false)}
                >
                    <View style={styles.menuContainer}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => openSettingsItem('goal')}
                        >
                            <Text style={styles.menuItemText}>지출 목표 설정</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => openSettingsItem('category')}
                        >
                            <Text style={styles.menuItemText}>카테고리 관리</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => openSettingsItem('accountManage')}
                        >
                            <Text style={styles.menuItemText}>통장 관리</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    overallButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    overallButtonText: {
        fontSize: 12,
        color: '#555',
        fontWeight: '600',
    },
    navCenter: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    navButton: {
        padding: 8,
    },
    navButtonText: {
        fontSize: 18,
        color: '#4A90E2',
    },
    monthLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    settingsButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsButtonText: {
        fontSize: 18,
        color: '#888',
    },
    scrollView: {
        flex: 1,
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: '70%',
        maxWidth: 280,
        overflow: 'hidden',
    },
    menuItem: {
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    menuItemText: {
        fontSize: 15,
        color: '#333',
        textAlign: 'center',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#f0f0f0',
    },
});
