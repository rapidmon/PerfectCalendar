import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AddTodoModal from './AddTodoModal';
import TodoActionModal from './TodoActionModal';
import { Todo, TodoType } from '../types/todo';
import { useAppData } from '../contexts/AppDataContext';
import { getMemberColor } from '../utils/memberColors';

interface TodoFullListProps {
    selectedDate: Date;
}

interface TodoWithDateKey {
    todo: Todo;
    dateKey: string;
    dateLabel: string;
    sortKey: string;
}

function getTodoDateInfo(todo: Todo): { dateKey: string; dateLabel: string; sortKey: string } {
    switch (todo.type) {
        case 'SPECIFIC':
            if (todo.specificDate) {
                const d = new Date(todo.specificDate);
                return {
                    dateKey: todo.specificDate,
                    dateLabel: `${d.getMonth() + 1}월 ${d.getDate()}일`,
                    sortKey: todo.specificDate,
                };
            }
            break;
        case 'DEADLINE':
            if (todo.deadline) {
                const d = new Date(todo.deadline);
                return {
                    dateKey: `deadline-${todo.deadline}`,
                    dateLabel: `${d.getMonth() + 1}월 ${d.getDate()}일까지`,
                    sortKey: todo.deadline,
                };
            }
            break;
        case 'RECURRING':
            if (todo.recurringDay) {
                return {
                    dateKey: `recurring-${todo.recurringDay}`,
                    dateLabel: `매주 ${todo.recurringDay}요일`,
                    sortKey: `z-recurring-${todo.recurringDay}`,
                };
            }
            break;
        case 'MONTHLY_RECURRING':
            if (todo.monthlyRecurringDay) {
                const day = String(todo.monthlyRecurringDay).padStart(2, '0');
                return {
                    dateKey: `monthly-${day}`,
                    dateLabel: `매달 ${todo.monthlyRecurringDay}일`,
                    sortKey: `z-monthly-${day}`,
                };
            }
            break;
        case 'DATE_RANGE':
            if (todo.dateRangeStart && todo.dateRangeEnd) {
                const s = new Date(todo.dateRangeStart);
                const e = new Date(todo.dateRangeEnd);
                return {
                    dateKey: `range-${todo.dateRangeStart}-${todo.dateRangeEnd}`,
                    dateLabel: `${s.getMonth() + 1}월 ${s.getDate()}일 ~ ${e.getMonth() + 1}월 ${e.getDate()}일`,
                    sortKey: todo.dateRangeStart,
                };
            }
            break;
    }
    return { dateKey: 'unknown', dateLabel: '기타', sortKey: 'zzz' };
}

function isTodoOverdue(todo: Todo): boolean {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    switch (todo.type) {
        case 'SPECIFIC':
            return !!todo.specificDate && todo.specificDate < todayStr;
        case 'DEADLINE':
            return !!todo.deadline && todo.deadline < todayStr;
        case 'DATE_RANGE':
            return !!todo.dateRangeEnd && todo.dateRangeEnd < todayStr;
        case 'RECURRING':
        case 'MONTHLY_RECURRING':
            return false;
    }
}

const formatLocalDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export default function TodoFullList({ selectedDate }: TodoFullListProps) {
    const { todos, store, isGroupConnected, memberNames, memberColors } = useAppData();
    const memberUids = Object.keys(memberNames);

    const [addModalVisible, setAddModalVisible] = useState(false);
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

    const handleTodoPress = useCallback((todo: Todo) => {
        setSelectedTodo(todo);
        setActionModalVisible(true);
    }, []);

    const handleEditTodo = useCallback(() => {
        setActionModalVisible(false);
        setEditingTodo(selectedTodo);
        setAddModalVisible(true);
    }, [selectedTodo]);

    const handleDeleteTodo = useCallback(() => {
        if (selectedTodo) {
            Alert.alert('삭제 확인', '정말 삭제하시겠습니까?', [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => {
                        store.deleteTodo(selectedTodo.id);
                        setActionModalVisible(false);
                        setSelectedTodo(null);
                    },
                },
            ]);
        }
    }, [selectedTodo, store]);

    const handleUpdateTodo = useCallback((id: string, title: string, type: TodoType, customDate?: Date, endDate?: Date) => {
        const dateToUse = customDate || selectedDate;
        const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateToUse.getDay()];

        store.updateTodo(id, (todo) => {
            const updated: Todo = {
                ...todo, title, type,
                recurringDay: undefined,
                monthlyRecurringDay: undefined,
                deadline: undefined,
                specificDate: undefined,
                dateRangeStart: undefined,
                dateRangeEnd: undefined,
            };
            switch (type) {
                case 'RECURRING': updated.recurringDay = dayOfWeek; break;
                case 'MONTHLY_RECURRING': updated.monthlyRecurringDay = dateToUse.getDate(); break;
                case 'DEADLINE': updated.deadline = formatLocalDate(dateToUse); break;
                case 'SPECIFIC': updated.specificDate = formatLocalDate(dateToUse); break;
                case 'DATE_RANGE':
                    updated.dateRangeStart = formatLocalDate(dateToUse);
                    updated.dateRangeEnd = endDate ? formatLocalDate(endDate) : formatLocalDate(dateToUse);
                    break;
            }
            return updated;
        });
    }, [selectedDate, store]);

    const handleToggleTodo = useCallback((id: string) => {
        store.toggleTodo(id);
    }, [store]);

    const { activeTodos, overdueTodos, completedTodos } = useMemo(() => {
        const active: TodoWithDateKey[] = [];
        const overdue: TodoWithDateKey[] = [];
        const completed: TodoWithDateKey[] = [];

        for (const todo of todos) {
            const dateInfo = getTodoDateInfo(todo);
            const item: TodoWithDateKey = { todo, ...dateInfo };

            if (todo.completed) {
                completed.push(item);
            } else if (isTodoOverdue(todo)) {
                overdue.push(item);
            } else {
                active.push(item);
            }
        }

        active.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
        overdue.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
        completed.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

        return { activeTodos: active, overdueTodos: overdue, completedTodos: completed };
    }, [todos]);

    const renderTodoGroup = (items: TodoWithDateKey[], cardStyle?: object) => {
        const dateHeaders = new Set<string>();
        return items.map((item) => {
            const showHeader = !dateHeaders.has(item.dateKey);
            if (showHeader) dateHeaders.add(item.dateKey);

            return (
                <View key={item.todo.id}>
                    {showHeader && (
                        <Text style={styles.dateHeader}>{item.dateLabel}</Text>
                    )}
                    <TouchableOpacity
                        style={[styles.card, cardStyle]}
                        onPress={() => handleTodoPress(item.todo)}
                        activeOpacity={0.7}
                    >
                        <TouchableOpacity
                            style={styles.checkbox}
                            onPress={() => handleToggleTodo(item.todo.id)}
                        >
                            {item.todo.completed && <View style={styles.checkmark} />}
                        </TouchableOpacity>
                        {isGroupConnected && item.todo.authorUid ? (
                            <View style={[styles.authorDot, { backgroundColor: getMemberColor(item.todo.authorUid, memberUids, memberColors) }]} />
                        ) : null}
                        <Text style={[
                            styles.cardTitle,
                            item.todo.completed && styles.cardTitleCompleted,
                        ]}>
                            {item.todo.title}
                        </Text>
                        <Text style={styles.typeTag}>{getTypeLabel(item.todo.type)}</Text>
                    </TouchableOpacity>
                </View>
            );
        });
    };

    const hasBottomSection = overdueTodos.length > 0 || completedTodos.length > 0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>할 일 전체</Text>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {activeTodos.length > 0 ? (
                    renderTodoGroup(activeTodos)
                ) : (
                    !hasBottomSection && <Text style={styles.emptyText}>할 일이 없습니다</Text>
                )}

                {overdueTodos.length > 0 && (
                    <>
                        <Text style={styles.sectionHeader}>기한 지남</Text>
                        {renderTodoGroup(overdueTodos, styles.cardOverdue)}
                    </>
                )}

                {completedTodos.length > 0 && (
                    <>
                        <Text style={styles.sectionHeader}>완료</Text>
                        {renderTodoGroup(completedTodos, styles.cardCompleted)}
                    </>
                )}
            </ScrollView>

            <AddTodoModal
                visible={addModalVisible}
                selectedDate={selectedDate}
                editingTodo={editingTodo}
                onClose={() => { setAddModalVisible(false); setEditingTodo(null); }}
                onAdd={() => {}}
                onUpdate={handleUpdateTodo}
            />
            <TodoActionModal
                visible={actionModalVisible}
                onClose={() => { setActionModalVisible(false); setSelectedTodo(null); }}
                onEdit={handleEditTodo}
                onDelete={handleDeleteTodo}
            />
        </View>
    );
}

function getTypeLabel(type: TodoType): string {
    switch (type) {
        case 'RECURRING': return '주간';
        case 'MONTHLY_RECURRING': return '월간';
        case 'DEADLINE': return '기한';
        case 'SPECIFIC': return '특정일';
        case 'DATE_RANGE': return '범위';
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    scrollView: {
        flex: 1,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 20,
        marginBottom: 8,
        paddingHorizontal: 4,
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    dateHeader: {
        fontSize: 13,
        fontWeight: '600',
        color: '#999',
        marginTop: 12,
        marginBottom: 6,
        paddingHorizontal: 4,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 8,
    },
    cardOverdue: {
        backgroundColor: '#FFEBEE',
        borderColor: '#EF9A9A',
    },
    cardCompleted: {
        backgroundColor: '#E8F5E9',
        borderColor: '#C8E6C9',
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkmark: {
        width: 8,
        height: 8,
        backgroundColor: '#4A90E2',
        borderRadius: 4,
    },
    authorDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        marginRight: 5,
    },
    cardTitle: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    cardTitleCompleted: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    typeTag: {
        fontSize: 11,
        color: '#4A90E2',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        overflow: 'hidden',
        fontWeight: '600',
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 40,
        fontSize: 14,
    },
});
