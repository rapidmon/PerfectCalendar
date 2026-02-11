import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import MonthlySummaryCard from './MonthlySummaryCard';
import MonthlyChartCard from './MonthlyChartCard';
import SetGoalModal from './SetGoalModal';
import CategoryManageModal from './CategoryManageModal';
import AccountManageModal from './AccountManageModal';
import OverallStatsModal from './OverallStatsModal';
import BudgetTutorial, { TutorialStep } from './BudgetTutorial';
import { AccountBalances } from '../types/budget';
import { AccountOwnership } from '../firebase';
import { useAppData } from '../contexts/AppDataContext';
import { computeMonthlyStats, getMultiMonthChartData, computeAccountBalances } from '../utils/budgetAnalytics';
import { loadBudgetTutorialComplete, saveBudgetTutorialComplete } from '../utils/storage';

interface BudgetFullListProps {
    selectedDate: Date;
}

export default function BudgetFullList({ selectedDate }: BudgetFullListProps) {
    const { budgets, categories, fixedCategories, monthlyGoals, accounts, accountBalances, accountOwners, memberNames, isGroupConnected, store } = useAppData();

    const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
    const [viewMonth, setViewMonth] = useState(selectedDate.getMonth() + 1);

    const [settingsMenuVisible, setSettingsMenuVisible] = useState(false);
    const [goalModalVisible, setGoalModalVisible] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [accountManageModalVisible, setAccountManageModalVisible] = useState(false);
    const [overallStatsVisible, setOverallStatsVisible] = useState(false);

    // 튜토리얼 상태 (0: 설정버튼, 1: 목표, 2: 카테고리, 3: 통장, 4: 완료)
    const [tutorialStep, setTutorialStep] = useState<TutorialStep>(4); // 4 = 완료(비활성)

    // 처음 가계부 탭 방문 시 튜토리얼 시작
    useEffect(() => {
        const checkTutorial = async () => {
            const completed = await loadBudgetTutorialComplete();
            if (!completed) {
                setTimeout(() => setTutorialStep(0), 300);
            }
        };
        checkTutorial();
    }, []);

    const handleTutorialNext = useCallback(() => {
        if (tutorialStep === 0) {
            // 설정 버튼 설명 후 → 설정 메뉴 열고 목표 설명
            setSettingsMenuVisible(true);
            setTutorialStep(1);
        } else if (tutorialStep === 1) {
            setTutorialStep(2);
        } else if (tutorialStep === 2) {
            setTutorialStep(3);
        } else if (tutorialStep === 3) {
            // 완료
            completeTutorial();
        }
    }, [tutorialStep]);

    const completeTutorial = useCallback(async () => {
        setTutorialStep(4);
        setSettingsMenuVisible(false);
        await saveBudgetTutorialComplete();
    }, []);

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

    const handleDeleteGoal = useCallback(() => {
        store.deleteMonthlyGoal(monthKey);
    }, [store, monthKey]);

    const handleSaveCategories = useCallback((cats: string[], fixed: string[]) => {
        store.saveCategoriesAndFixed(cats, fixed);
    }, [store]);

    const handleSaveAccounts = useCallback((accs: string[], balances: AccountBalances, owners?: AccountOwnership) => {
        store.saveAccountsAndBalances(accs, balances, owners);
    }, [store]);

    const openSettingsItem = useCallback((target: 'goal' | 'category' | 'accountManage') => {
        setSettingsMenuVisible(false);
        setTimeout(() => {
            if (target === 'goal') setGoalModalVisible(true);
            else if (target === 'category') setCategoryModalVisible(true);
            else if (target === 'accountManage') setAccountManageModalVisible(true);
        }, 200);
    }, []);

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

    const isTutorialActive = tutorialStep < 4;

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
                    isGroupConnected={isGroupConnected}
                />

                <MonthlyChartCard chartData={chartData} />
            </ScrollView>

            <SetGoalModal
                visible={goalModalVisible}
                currentGoal={monthlyGoals[monthKey]}
                monthLabel={monthLabel}
                onClose={() => setGoalModalVisible(false)}
                onSave={handleSaveGoal}
                onDelete={handleDeleteGoal}
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
                accountOwners={accountOwners}
                memberNames={memberNames}
                isGroupConnected={isGroupConnected}
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
                onRequestClose={() => {
                    if (!isTutorialActive) {
                        setSettingsMenuVisible(false);
                    }
                }}
            >
                <TouchableOpacity
                    style={styles.menuOverlay}
                    activeOpacity={1}
                    onPress={() => {
                        if (!isTutorialActive) {
                            setSettingsMenuVisible(false);
                        }
                    }}
                >
                    <View style={styles.menuContainer}>
                        <TouchableOpacity
                            style={[
                                styles.menuItem,
                                isTutorialActive && tutorialStep === 1 && styles.menuItemHighlight
                            ]}
                            onPress={() => {
                                if (!isTutorialActive) openSettingsItem('goal');
                            }}
                        >
                            <Text style={styles.menuItemText}>지출 목표 설정</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity
                            style={[
                                styles.menuItem,
                                isTutorialActive && tutorialStep === 2 && styles.menuItemHighlight
                            ]}
                            onPress={() => {
                                if (!isTutorialActive) openSettingsItem('category');
                            }}
                        >
                            <Text style={styles.menuItemText}>카테고리 관리</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity
                            style={[
                                styles.menuItem,
                                isTutorialActive && tutorialStep === 3 && styles.menuItemHighlight
                            ]}
                            onPress={() => {
                                if (!isTutorialActive) openSettingsItem('accountManage');
                            }}
                        >
                            <Text style={styles.menuItemText}>통장 관리</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* 튜토리얼 */}
            <BudgetTutorial
                visible={isTutorialActive}
                step={tutorialStep}
                onNext={handleTutorialNext}
                onSkip={completeTutorial}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    menuItemHighlight: {
        backgroundColor: '#E8F4FD',
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
