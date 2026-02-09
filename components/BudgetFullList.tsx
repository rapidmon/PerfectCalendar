import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import MonthlySummaryCard from './MonthlySummaryCard';
import MonthlyChartCard from './MonthlyChartCard';
import SetGoalModal from './SetGoalModal';
import CategoryManageModal from './CategoryManageModal';
import AccountManageModal from './AccountManageModal';
import OverallStatsModal from './OverallStatsModal';
import BudgetTutorial, { TutorialStep, HighlightPosition } from './BudgetTutorial';
import { AccountBalances } from '../types/budget';
import { useAppData } from '../contexts/AppDataContext';
import { computeMonthlyStats, getMultiMonthChartData, computeAccountBalances } from '../utils/budgetAnalytics';
import { loadBudgetTutorialComplete, saveBudgetTutorialComplete } from '../utils/storage';

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

    // 튜토리얼 상태
    const [tutorialActive, setTutorialActive] = useState(false);
    const [tutorialStep, setTutorialStep] = useState<TutorialStep>('settings_button');
    const [highlightPosition, setHighlightPosition] = useState<HighlightPosition | null>(null);

    // Refs for measuring element positions
    const settingsButtonRef = useRef<View>(null);
    const goalItemRef = useRef<View>(null);
    const categoryItemRef = useRef<View>(null);
    const accountItemRef = useRef<View>(null);

    // 처음 가계부 탭 방문 시 튜토리얼 시작
    useEffect(() => {
        const checkTutorial = async () => {
            const completed = await loadBudgetTutorialComplete();
            if (!completed) {
                // 약간의 딜레이 후 튜토리얼 시작 (화면 렌더링 대기)
                setTimeout(() => {
                    setTutorialActive(true);
                    measureSettingsButton();
                }, 500);
            }
        };
        checkTutorial();
    }, []);

    // 설정 버튼 위치 측정
    const measureSettingsButton = useCallback(() => {
        if (settingsButtonRef.current) {
            settingsButtonRef.current.measureInWindow((x, y, width, height) => {
                setHighlightPosition({ x, y, width, height });
            });
        }
    }, []);

    // 메뉴 아이템 위치 측정
    const measureMenuItem = useCallback((ref: React.RefObject<View | null>) => {
        if (ref.current) {
            ref.current.measureInWindow((x, y, width, height) => {
                setHighlightPosition({ x, y, width, height });
            });
        }
    }, []);

    // 튜토리얼 단계별 액션 처리
    const handleTutorialAction = useCallback(() => {
        if (tutorialStep === 'settings_button') {
            // 설정 메뉴 열기
            setSettingsMenuVisible(true);
            setTutorialStep('goal_item');
            // 메뉴가 열린 후 지출 목표 설정 위치 측정
            setTimeout(() => measureMenuItem(goalItemRef), 300);
        } else if (tutorialStep === 'goal_item') {
            setTutorialStep('category_item');
            setTimeout(() => measureMenuItem(categoryItemRef), 100);
        } else if (tutorialStep === 'category_item') {
            setTutorialStep('account_item');
            setTimeout(() => measureMenuItem(accountItemRef), 100);
        } else if (tutorialStep === 'account_item') {
            // 튜토리얼 완료
            completeTutorial();
        }
    }, [tutorialStep, measureMenuItem]);

    // 튜토리얼 완료 또는 건너뛰기
    const completeTutorial = useCallback(async () => {
        setTutorialActive(false);
        setTutorialStep('complete');
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
                <View ref={settingsButtonRef} collapsable={false}>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => {
                            if (tutorialActive && tutorialStep === 'settings_button') {
                                handleTutorialAction();
                            } else {
                                setSettingsMenuVisible(true);
                            }
                        }}
                    >
                        <Text style={styles.settingsButtonText}>⚙</Text>
                    </TouchableOpacity>
                </View>
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
                onRequestClose={() => {
                    if (!tutorialActive) {
                        setSettingsMenuVisible(false);
                    }
                }}
            >
                <TouchableOpacity
                    style={[
                        styles.menuOverlay,
                        tutorialActive && styles.menuOverlayTutorial
                    ]}
                    activeOpacity={1}
                    onPress={() => {
                        if (!tutorialActive) {
                            setSettingsMenuVisible(false);
                        }
                    }}
                >
                    <View style={styles.menuContainer}>
                        <View ref={goalItemRef} collapsable={false}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    if (tutorialActive && tutorialStep === 'goal_item') {
                                        handleTutorialAction();
                                    } else {
                                        openSettingsItem('goal');
                                    }
                                }}
                            >
                                <Text style={styles.menuItemText}>지출 목표 설정</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.menuDivider} />
                        <View ref={categoryItemRef} collapsable={false}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    if (tutorialActive && tutorialStep === 'category_item') {
                                        handleTutorialAction();
                                    } else {
                                        openSettingsItem('category');
                                    }
                                }}
                            >
                                <Text style={styles.menuItemText}>카테고리 관리</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.menuDivider} />
                        <View ref={accountItemRef} collapsable={false}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    if (tutorialActive && tutorialStep === 'account_item') {
                                        handleTutorialAction();
                                    } else {
                                        openSettingsItem('accountManage');
                                    }
                                }}
                            >
                                <Text style={styles.menuItemText}>통장 관리</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* 튜토리얼 오버레이 */}
            <BudgetTutorial
                visible={tutorialActive}
                currentStep={tutorialStep}
                highlightPosition={highlightPosition}
                onStepAction={handleTutorialAction}
                onSkip={completeTutorial}
            />
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
    menuOverlayTutorial: {
        backgroundColor: 'transparent',
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
