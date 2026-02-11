import React from 'react';
import { FlexWidget, TextWidget, ListWidget } from 'react-native-android-widget';
import { Todo } from '../types/todo';
import { calculateTodoProgress, BlockColor } from '../utils/todoProgress';

interface TodoWidgetScreenProps {
    todos: Todo[];
}

function getBlockHexColor(color: BlockColor): `#${string}` {
    switch (color) {
        case 'green': return '#4CAF50';
        case 'orange': return '#FF9800';
        case 'red': return '#F44336';
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
                marginBottom: 10,
                width: 'match_parent',
            }}
        >
            {/* 상단: 제목 + 버튼 */}
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
                        style={{
                            fontSize: 14,
                            color: '#333333',
                        }}
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
                    <TextWidget
                        text="완료"
                        style={{ fontSize: 11, color: '#FFFFFF' }}
                    />
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
                    <TextWidget
                        text="제거"
                        style={{ fontSize: 11, color: '#FFFFFF' }}
                    />
                </FlexWidget>
            </FlexWidget>

            {/* 진행바: 20개 블록 */}
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

            {/* 마감일 정보 */}
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
    );
}

export default function TodoWidgetScreen({ todos }: TodoWidgetScreenProps) {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const filteredTodos = todos
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
                backgroundColor: '#F5F5F5',
                borderRadius: 16,
                padding: 12,
                width: 'match_parent',
                height: 'match_parent',
            }}
        >
            <TextWidget
                text="📋 할 일 목록"
                style={{
                    fontSize: 16,
                    color: '#333333',
                    fontWeight: 'bold',
                    marginBottom: 8,
                }}
            />

            <FlexWidget style={{ flex: 1, width: 'match_parent' }}>
                {filteredTodos.length === 0 ? (
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
                            style={{
                                fontSize: 13,
                                color: '#999999',
                            }}
                        />
                    </FlexWidget>
                ) : (
                    <ListWidget
                        style={{
                            width: 'match_parent',
                            height: 'match_parent',
                        }}
                    >
                        {filteredTodos.map(todo => (
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
