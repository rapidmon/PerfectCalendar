import React from 'react';
import { FlexWidget, TextWidget, ListWidget } from 'react-native-android-widget';
import { Todo } from '../types/todo';
import { Budget } from '../types/budget';
import { calculateTodoProgress, BlockColor } from '../utils/todoProgress';

export type WidgetTab = 'todo' | 'budget';

interface CombinedWidgetScreenProps {
    todos: Todo[];
    budgets: Budget[];
    activeTab: WidgetTab;
}

// ── 할 일 콘텐츠 ──

function getBlockHexColor(color: BlockColor): `#${string}` {
    switch (color) {
        case 'green': return '#4CAF50';
        case 'orange': return '#FF9800';
        case 'gray': return '#E0E0E0';
    }
}

function TodoCard({ todo }: { todo: Todo }) {
    const progress = calculateTodoProgress(todo);

    return (
        <FlexWidget
            style={{
                flexDirection: 'column',
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
                width: 'match_parent',
            }}
        >
            <FlexWidget
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8,
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
                    <TextWidget text="✓" style={{ fontSize: 12, color: '#FFFFFF' }} />
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
                    <TextWidget text="✕" style={{ fontSize: 12, color: '#FFFFFF' }} />
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
                                height: 6,
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
                    text={progress.daysLeft === 0 ? '오늘 마감' : `${progress.daysLeft}일 뒤 마감`}
                    style={{
                        fontSize: 11,
                        color: progress.daysLeft <= 3 ? '#F44336' : '#999999',
                    }}
                />
            )}
        </FlexWidget>
    );
}

function TodoContent({ todos }: { todos: Todo[] }) {
    const filtered = todos
        .filter(t => !t.completed && (t.type === 'DEADLINE' || t.type === 'SPECIFIC'))
        .sort((a, b) => {
            const dateA = a.deadline || a.specificDate || '';
            const dateB = b.deadline || b.specificDate || '';
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
                        text="마감 할 일이 없습니다"
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

function BudgetContent({ budgets }: { budgets: Budget[] }) {
    const accountMap: Record<string, number> = {};
    for (const b of budgets) {
        const acc = b.account || '기본';
        accountMap[acc] = (accountMap[acc] || 0) + b.money;
    }

    const accountEntries = Object.entries(accountMap);

    return (
        <FlexWidget
            style={{
                flexDirection: 'column',
                flex: 1,
                width: 'match_parent',
            }}
        >
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
                <TextWidget
                    text="등록된 내역이 없습니다"
                    style={{ fontSize: 13, color: '#999999' }}
                />
            ) : (
                <ListWidget style={{ width: 'match_parent', height: 'match_parent' }}>
                    {accountEntries.map(([name, balance]) => (
                        <AccountCard key={name} name={name} balance={balance} />
                    ))}
                </ListWidget>
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

export default function CombinedWidgetScreen({ todos, budgets, activeTab }: CombinedWidgetScreenProps) {
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
                : <BudgetContent budgets={budgets} />
            }
        </FlexWidget>
    );
}
