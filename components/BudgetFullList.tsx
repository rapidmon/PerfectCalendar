import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import MonthlySummaryCard from './MonthlySummaryCard';
import MonthlyChartCard from './MonthlyChartCard';
import SetGoalModal from './SetGoalModal';
import FixedExpenseCategoryModal from './FixedExpenseCategoryModal';
import CategoryManageModal from './CategoryManageModal';
import AccountBalanceModal from './AccountBalanceModal';
import AccountManageModal from './AccountManageModal';
import { Budget, MonthlyGoal, AccountBalances } from '../types/budget';
import {
    loadBudgets,
    loadCategories,
    saveCategories,
    loadFixedExpenseCategories,
    saveFixedExpenseCategories,
    loadMonthlyGoals,
    saveMonthlyGoals,
    loadAccounts,
    saveAccounts,
    loadAccountBalances,
    saveAccountBalances,
} from '../utils/storage';
import { computeMonthlyStats, getMultiMonthChartData, computeAccountBalances } from '../utils/budgetAnalytics';

interface BudgetFullListProps {
    selectedDate: Date;
}

export default function BudgetFullList({ selectedDate }: BudgetFullListProps) {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [fixedCategories, setFixedCategories] = useState<string[]>([]);
    const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal>({});
    const [accounts, setAccounts] = useState<string[]>([]);
    const [accountInitialBalances, setAccountInitialBalances] = useState<AccountBalances>({});
    const [loading, setLoading] = useState(true);

    const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
    const [viewMonth, setViewMonth] = useState(selectedDate.getMonth() + 1);

    const [settingsMenuVisible, setSettingsMenuVisible] = useState(false);
    const [goalModalVisible, setGoalModalVisible] = useState(false);
    const [fixedModalVisible, setFixedModalVisible] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [accountBalanceModalVisible, setAccountBalanceModalVisible] = useState(false);
    const [accountManageModalVisible, setAccountManageModalVisible] = useState(false);

    useEffect(() => {
        const load = async () => {
            const [b, c, fc, mg, acc, ab] = await Promise.all([
                loadBudgets(),
                loadCategories(),
                loadFixedExpenseCategories(),
                loadMonthlyGoals(),
                loadAccounts(),
                loadAccountBalances(),
            ]);
            setBudgets(b);
            setCategories(c);
            setFixedCategories(fc);
            setMonthlyGoals(mg);
            setAccounts(acc);
            setAccountInitialBalances(ab);
            setLoading(false);
        };
        load();
    }, []);

    // Reload budgets when coming back (selectedDate changes may mean new data)
    useEffect(() => {
        if (!loading) {
            loadBudgets().then(setBudgets);
        }
    }, [selectedDate, loading]);

    const monthKey = `${viewYear}-${String(viewMonth).padStart(2, '0')}`;
    const monthLabel = `${viewYear}년 ${viewMonth}월`;

    const goToPrevMonth = () => {
        if (viewMonth === 1) {
            setViewYear(y => y - 1);
            setViewMonth(12);
        } else {
            setViewMonth(m => m - 1);
        }
    };

    const goToNextMonth = () => {
        if (viewMonth === 12) {
            setViewYear(y => y + 1);
            setViewMonth(1);
        } else {
            setViewMonth(m => m + 1);
        }
    };

    const handleSaveGoal = useCallback((amount: number) => {
        const updated = { ...monthlyGoals, [monthKey]: amount };
        setMonthlyGoals(updated);
        saveMonthlyGoals(updated);
    }, [monthlyGoals, monthKey]);

    const handleSaveFixedCategories = useCallback((cats: string[]) => {
        setFixedCategories(cats);
        saveFixedExpenseCategories(cats);
    }, []);

    const handleSaveCategories = useCallback((cats: string[]) => {
        setCategories(cats);
        saveCategories(cats);
    }, []);

    const handleSaveAccountBalances = useCallback((balances: AccountBalances) => {
        setAccountInitialBalances(balances);
        saveAccountBalances(balances);
    }, []);

    const handleSaveAccounts = useCallback((accs: string[]) => {
        setAccounts(accs);
        saveAccounts(accs);
    }, []);

    const openSettingsItem = (target: 'goal' | 'category' | 'fixed' | 'accountBalance' | 'accountManage') => {
        setSettingsMenuVisible(false);
        setTimeout(() => {
            if (target === 'goal') setGoalModalVisible(true);
            else if (target === 'category') setCategoryModalVisible(true);
            else if (target === 'fixed') setFixedModalVisible(true);
            else if (target === 'accountBalance') setAccountBalanceModalVisible(true);
            else if (target === 'accountManage') setAccountManageModalVisible(true);
        }, 200);
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="small" color="#4A90E2" />
            </View>
        );
    }

    const stats = computeMonthlyStats(budgets, viewYear, viewMonth, fixedCategories);
    const chartData = getMultiMonthChartData(budgets, viewYear, viewMonth, 5, fixedCategories);
    const accountBalanceList = computeAccountBalances(budgets, accountInitialBalances, accounts);

    return (
        <View style={styles.container}>
            {/* 월 네비게이터 */}
            <View style={styles.monthNav}>
                <View style={styles.navSpacer} />
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

            <FixedExpenseCategoryModal
                visible={fixedModalVisible}
                categories={categories}
                fixedCategories={fixedCategories}
                onClose={() => setFixedModalVisible(false)}
                onSave={handleSaveFixedCategories}
            />

            <CategoryManageModal
                visible={categoryModalVisible}
                categories={categories}
                onClose={() => setCategoryModalVisible(false)}
                onSave={handleSaveCategories}
            />

            <AccountBalanceModal
                visible={accountBalanceModalVisible}
                accounts={accounts}
                initialBalances={accountInitialBalances}
                onClose={() => setAccountBalanceModalVisible(false)}
                onSave={handleSaveAccountBalances}
            />

            <AccountManageModal
                visible={accountManageModalVisible}
                accounts={accounts}
                onClose={() => setAccountManageModalVisible(false)}
                onSave={handleSaveAccounts}
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
                            onPress={() => openSettingsItem('fixed')}
                        >
                            <Text style={styles.menuItemText}>고정지출 카테고리 설정</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => openSettingsItem('accountManage')}
                        >
                            <Text style={styles.menuItemText}>통장 관리</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => openSettingsItem('accountBalance')}
                        >
                            <Text style={styles.menuItemText}>통장 초기 잔액 설정</Text>
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
    navSpacer: {
        width: 32,
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
