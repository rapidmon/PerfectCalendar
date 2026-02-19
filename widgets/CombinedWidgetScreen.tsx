import React from 'react';
import { FlexWidget, TextWidget, ListWidget } from 'react-native-android-widget';
import { Todo } from '../types/todo';
import { Budget, MonthlyGoal } from '../types/budget';
import { calculateTodoProgress, BlockColor } from '../utils/todoProgress';

export type WidgetTab = 'todo' | 'budget';

interface CombinedWidgetScreenProps {
    todos: Todo[];
    budgets: Budget[];
    activeTab: WidgetTab;
    accounts: string[];
    monthlyGoals: MonthlyGoal;
    fixedExpenseCategories: string[];
}

// ── 할 일 콘텐츠 ──

function getBlockHexColor(color: BlockColor): `#${string}` {
    switch (color) {
        case 'green': return '#4CAF50';
        case 'orange': return '#FF9800';
        case 'red': return '#F44336';
        case 'gray': return '#E0E0E0';
    }
}

function getTodoDateLabel(todo: Todo): string {
    const dateStr = todo.specificDate || todo.deadline || todo.dateRangeStart || '';
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return '';
    return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
}

function TodoCard({ todo }: { todo: Todo }) {
    const progress = calculateTodoProgress(todo);
    const dateLabel = getTodoDateLabel(todo);

    return (
        <FlexWidget
            style={{
                flexDirection: 'row',
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
                width: 'match_parent',
                alignItems: 'center',
            }}
        >
            {/* 왼쪽: 날짜 */}
            {dateLabel !== '' && (
                <FlexWidget
                    style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                        width: 40,
                    }}
                >
                    <TextWidget
                        text={dateLabel}
                        style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            color: '#4A90E2',
                        }}
                    />
                </FlexWidget>
            )}

            {/* 오른쪽: 제목 + 버튼 + 진행바 */}
            <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
                <FlexWidget
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: progress.hasProgress ? 8 : 0,
                        width: 'match_parent',
                    }}
                >
                    <FlexWidget style={{ flex: 1 }}>
                        <TextWidget
                            text={todo.title}
                            maxLines={1}
                            truncate="END"
                            style={{ fontSize: 14, color: '#333333' }}
                        />
                    </FlexWidget>
                    <FlexWidget
                        clickAction="COMPLETE_TODO"
                        clickActionData={{ todoId: todo.id }}
                        style={{
                            backgroundColor: '#4CAF50',
                            borderRadius: 6,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            marginLeft: 6,
                        }}
                    >
                        <TextWidget text="완료" style={{ fontSize: 11, color: '#FFFFFF' }} />
                    </FlexWidget>
                    <FlexWidget
                        clickAction="DELETE_TODO"
                        clickActionData={{ todoId: todo.id }}
                        style={{
                            backgroundColor: '#F44336',
                            borderRadius: 6,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            marginLeft: 6,
                        }}
                    >
                        <TextWidget text="제거" style={{ fontSize: 11, color: '#FFFFFF' }} />
                    </FlexWidget>
                </FlexWidget>

                {progress.hasProgress && (
                    <FlexWidget
                        style={{
                            flexDirection: 'row',
                            width: 'match_parent',
                            marginBottom: 4,
                        }}
                    >
                        {progress.blocks.map((block, idx) => (
                            <FlexWidget
                                key={idx}
                                style={{
                                    flex: 1,
                                    height: 8,
                                    backgroundColor: getBlockHexColor(block.color),
                                    borderRadius: 2,
                                    marginRight: idx < 19 ? 1 : 0,
                                }}
                            />
                        ))}
                    </FlexWidget>
                )}

                {progress.hasProgress && (
                    <TextWidget
                        text={progress.daysLeft === 0 ? `오늘 ${progress.label}` : `${progress.daysLeft}일 뒤 ${progress.label}`}
                        style={{
                            fontSize: 11,
                            color: progress.daysLeft <= 3 ? '#F44336' : '#999999',
                        }}
                    />
                )}
            </FlexWidget>
        </FlexWidget>
    );
}

function TodoContent({ todos }: { todos: Todo[] }) {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const filtered = todos
        .filter(t => {
            if (t.completed) return false;
            if (t.type === 'SPECIFIC') return !!t.specificDate && t.specificDate >= todayStr;
            if (t.type === 'DEADLINE') return !!t.deadline && t.deadline >= todayStr;
            if (t.type === 'DATE_RANGE') return !!t.dateRangeEnd && t.dateRangeEnd >= todayStr;
            return false;
        })
        .sort((a, b) => {
            const dateA = a.deadline || a.specificDate || a.dateRangeStart || '';
            const dateB = b.deadline || b.specificDate || b.dateRangeStart || '';
            return dateA.localeCompare(dateB);
        });

    return (
        <FlexWidget
            style={{
                flexDirection: 'column',
                flex: 1,
                width: 'match_parent',
            }}
        >
            <FlexWidget style={{ flex: 1, width: 'match_parent' }}>
                {filtered.length === 0 ? (
                    <FlexWidget
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: 'match_parent',
                        }}
                    >
                        <TextWidget
                            text="할 일이 없습니다"
                            style={{ fontSize: 13, color: '#999999' }}
                        />
                    </FlexWidget>
                ) : (
                    <ListWidget style={{ width: 'match_parent', height: 'match_parent' }}>
                        {filtered.map(todo => (
                            <TodoCard key={todo.id} todo={todo} />
                        ))}
                    </ListWidget>
                )}
            </FlexWidget>

            <FlexWidget
                clickAction="OPEN_APP"
                style={{
                    backgroundColor: '#4A90E2',
                    borderRadius: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                    width: 'match_parent',
                    marginTop: 8,
                }}
            >
                <TextWidget text="할 일 추가" style={{ fontSize: 13, color: '#FFFFFF' }} />
            </FlexWidget>
        </FlexWidget>
    );
}

// ── 가계부 콘텐츠 ──

function formatKoreanCurrency(amount: number): string {
    return amount.toLocaleString('ko-KR') + '원';
}

function AccountCard({ name, balance }: { name: string; balance: number }) {
    return (
        <FlexWidget
            style={{
                flexDirection: 'row',
                backgroundColor: '#FFFFFF',
                borderRadius: 10,
                padding: 12,
                marginBottom: 6,
                width: 'match_parent',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}
        >
            <TextWidget
                text={name}
                style={{ fontSize: 14, color: '#333333', fontWeight: 'bold' }}
            />
            <TextWidget
                text={formatKoreanCurrency(balance)}
                style={{
                    fontSize: 14,
                    color: balance >= 0 ? '#4CAF50' : '#F44336',
                    fontWeight: 'bold',
                }}
            />
        </FlexWidget>
    );
}

function BudgetContent({ budgets, accounts, monthlyGoals, fixedExpenseCategories }: {
    budgets: Budget[];
    accounts: string[];
    monthlyGoals: MonthlyGoal;
    fixedExpenseCategories: string[];
}) {
    // 앱과 동일한 방식으로 통장별 잔액 계산
    const accountEntries = accounts.map(account => {
        let balance = 0;
        for (const b of budgets) {
            if ((b.account || '기본') !== account) continue;
            if (b.type === 'INCOME') {
                balance += Math.abs(b.money);
            } else {
                balance -= Math.abs(b.money);
            }
        }
        return { name: account, balance };
    });

    // 이번 달 목표 잔여 금액 계산 (저축, 고정지출 제외 — 가계부 탭과 동일)
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyGoal = monthlyGoals[yearMonth] || 0;
    const monthPrefix = `${yearMonth}-`;
    const monthBudgets = budgets.filter(b => b.type === 'EXPENSE' && b.date.startsWith(monthPrefix));
    // 저축 제외한 지출
    const monthlyExpenseExcludingSavings = monthBudgets
        .filter(b => b.category !== '저축')
        .reduce((sum, b) => sum + Math.abs(b.money), 0);
    const fixedExpense = monthBudgets
        .filter(b => fixedExpenseCategories.includes(b.category))
        .reduce((sum, b) => sum + Math.abs(b.money), 0);
    const remaining = monthlyGoal - (monthlyExpenseExcludingSavings - fixedExpense);

    return (
        <FlexWidget
            style={{
                flexDirection: 'column',
                flex: 1,
                width: 'match_parent',
            }}
        >
            {monthlyGoal > 0 && (
                <FlexWidget
                    style={{
                        flexDirection: 'row',
                        backgroundColor: remaining >= 0 ? '#E8F5E9' : '#FFEBEE',
                        borderRadius: 10,
                        padding: 10,
                        marginBottom: 8,
                        width: 'match_parent',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <TextWidget
                        text="목표 잔여"
                        style={{ fontSize: 12, color: '#666666', fontWeight: 'bold' }}
                    />
                    <TextWidget
                        text={formatKoreanCurrency(remaining)}
                        style={{
                            fontSize: 14,
                            color: remaining >= 0 ? '#388E3C' : '#D32F2F',
                            fontWeight: 'bold',
                        }}
                    />
                </FlexWidget>
            )}

            <TextWidget
                text="통장별 잔액"
                style={{
                    fontSize: 14,
                    color: '#333333',
                    fontWeight: 'bold',
                    marginBottom: 8,
                }}
            />

            {accountEntries.length === 0 ? (
                <FlexWidget style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: 'match_parent' }}>
                    <TextWidget
                        text="등록된 통장이 없습니다"
                        style={{ fontSize: 13, color: '#999999' }}
                    />
                </FlexWidget>
            ) : (
                <FlexWidget style={{ flex: 1, width: 'match_parent' }}>
                    {accountEntries.map(item => (
                        <AccountCard key={item.name} name={item.name} balance={item.balance} />
                    ))}
                </FlexWidget>
            )}

            <FlexWidget
                clickAction="ADD_BUDGET"
                style={{
                    backgroundColor: '#4A90E2',
                    borderRadius: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                    width: 'match_parent',
                    marginTop: 8,
                }}
            >
                <TextWidget text="항목 추가" style={{ fontSize: 13, color: '#FFFFFF' }} />
            </FlexWidget>
        </FlexWidget>
    );
}

// ── 통합 위젯 ──

export default function CombinedWidgetScreen({ todos, budgets, activeTab, accounts, monthlyGoals, fixedExpenseCategories }: CombinedWidgetScreenProps) {
    return (
        <FlexWidget
            style={{
                flexDirection: 'column',
                backgroundColor: '#F5F5F5',
                borderRadius: 16,
                padding: 12,
                width: 'match_parent',
                height: 'match_parent',
            }}
        >
            {/* 탭 바 */}
            <FlexWidget
                style={{
                    flexDirection: 'row',
                    width: 'match_parent',
                    marginBottom: 10,
                    backgroundColor: '#E8E8E8',
                    borderRadius: 10,
                    padding: 3,
                }}
            >
                <FlexWidget
                    clickAction="SWITCH_TAB"
                    clickActionData={{ tab: 'todo' }}
                    style={{
                        flex: 1,
                        alignItems: 'center',
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: activeTab === 'todo' ? '#FFFFFF' : '#E8E8E8',
                    }}
                >
                    <TextWidget
                        text="✅ 할 일"
                        style={{
                            fontSize: 13,
                            fontWeight: activeTab === 'todo' ? 'bold' : 'normal',
                            color: activeTab === 'todo' ? '#333333' : '#999999',
                        }}
                    />
                </FlexWidget>
                <FlexWidget
                    clickAction="SWITCH_TAB"
                    clickActionData={{ tab: 'budget' }}
                    style={{
                        flex: 1,
                        alignItems: 'center',
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: activeTab === 'budget' ? '#FFFFFF' : '#E8E8E8',
                    }}
                >
                    <TextWidget
                        text="💰 가계부"
                        style={{
                            fontSize: 13,
                            fontWeight: activeTab === 'budget' ? 'bold' : 'normal',
                            color: activeTab === 'budget' ? '#333333' : '#999999',
                        }}
                    />
                </FlexWidget>
            </FlexWidget>

            {/* 콘텐츠 */}
            {activeTab === 'todo'
                ? <TodoContent todos={todos} />
                : <BudgetContent budgets={budgets} accounts={accounts} monthlyGoals={monthlyGoals} fixedExpenseCategories={fixedExpenseCategories} />
            }
        </FlexWidget>
    );
}
