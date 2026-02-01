import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AddTodoModal from './AddTodoModal';
import TodoActionModal from './TodoActionModal';
import { Todo, TodoType } from '../types/todo';
import { loadTodos, saveTodos } from '../utils/storage';

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
    }
    return { dateKey: 'unknown', dateLabel: '기타', sortKey: 'zzz' };
}

export default function TodoFullList({ selectedDate }: TodoFullListProps) {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

    useEffect(() => {
        const init = async () => {
            const loaded = await loadTodos();
            setTodos(loaded);
            setIsLoading(false);
        };
        init();
    }, []);

    useEffect(() => {
        if (!isLoading) {
            saveTodos(todos);
        }
    }, [todos, isLoading]);

    const handleAddTodo = () => {
        setEditingTodo(null);
        setAddModalVisible(true);
    };

    const handleTodoPress = (todo: Todo) => {
        setSelectedTodo(todo);
        setActionModalVisible(true);
    };

    const handleEditTodo = () => {
        setActionModalVisible(false);
        setEditingTodo(selectedTodo);
        setAddModalVisible(true);
    };

    const handleDeleteTodo = () => {
        if (selectedTodo) {
            Alert.alert('삭제 확인', '정말 삭제하시겠습니까?', [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => {
                        setTodos(prev => prev.filter(t => t.id !== selectedTodo.id));
                        setActionModalVisible(false);
                        setSelectedTodo(null);
                    },
                },
            ]);
        }
    };

    const handleAddTodoConfirm = (title: string, type: TodoType, customDate?: Date) => {
        const newTodo: Todo = { id: Date.now().toString(), title, type, completed: false, createdAt: new Date().toISOString().split('T')[0] };
        const dateToUse = customDate || selectedDate;
        const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateToUse.getDay()];
        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        switch (type) {
            case 'RECURRING':
                newTodo.recurringDay = dayOfWeek;
                break;
            case 'MONTHLY_RECURRING':
                newTodo.monthlyRecurringDay = dateToUse.getDate();
                break;
            case 'DEADLINE':
                newTodo.deadline = formatDate(dateToUse);
                break;
            case 'SPECIFIC':
                newTodo.specificDate = formatDate(dateToUse);
                break;
        }
        setTodos(prev => [...prev, newTodo]);
    };

    const handleUpdateTodo = (id: string, title: string, type: TodoType, customDate?: Date) => {
        const dateToUse = customDate || selectedDate;
        const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateToUse.getDay()];
        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        setTodos(prev => prev.map(todo => {
            if (todo.id === id) {
                const updated: Todo = {
                    ...todo, title, type,
                    recurringDay: undefined,
                    monthlyRecurringDay: undefined,
                    deadline: undefined,
                    specificDate: undefined,
                };
                switch (type) {
                    case 'RECURRING': updated.recurringDay = dayOfWeek; break;
                    case 'MONTHLY_RECURRING': updated.monthlyRecurringDay = dateToUse.getDate(); break;
                    case 'DEADLINE': updated.deadline = formatDate(dateToUse); break;
                    case 'SPECIFIC': updated.specificDate = formatDate(dateToUse); break;
                }
                return updated;
            }
            return todo;
        }));
    };

    const handleToggleTodo = (id: string) => {
        setTodos(prev => prev.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
    };

    // 날짜 정보 붙여서 정렬
    const todosWithDate: TodoWithDateKey[] = todos.map(todo => ({
        todo,
        ...getTodoDateInfo(todo),
    }));
    todosWithDate.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // 날짜별 그룹핑 (렌더링 시 날짜 헤더 표시용)
    const dateHeaders = new Set<string>();

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="small" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>할 일 전체</Text>
                <TouchableOpacity style={styles.headerAddButton} onPress={handleAddTodo}>
                    <Text style={styles.headerAddText}>+</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {todosWithDate.length > 0 ? (
                    todosWithDate.map((item) => {
                        const showHeader = !dateHeaders.has(item.dateKey);
                        if (showHeader) dateHeaders.add(item.dateKey);

                        return (
                            <View key={item.todo.id}>
                                {showHeader && (
                                    <Text style={styles.dateHeader}>{item.dateLabel}</Text>
                                )}
                                <TouchableOpacity
                                    style={styles.card}
                                    onPress={() => handleTodoPress(item.todo)}
                                    activeOpacity={0.7}
                                >
                                    <TouchableOpacity
                                        style={styles.checkbox}
                                        onPress={() => handleToggleTodo(item.todo.id)}
                                    >
                                        {item.todo.completed && <View style={styles.checkmark} />}
                                    </TouchableOpacity>
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
                    })
                ) : (
                    <Text style={styles.emptyText}>할 일이 없습니다</Text>
                )}
            </ScrollView>

            <AddTodoModal
                visible={addModalVisible}
                selectedDate={selectedDate}
                editingTodo={editingTodo}
                onClose={() => { setAddModalVisible(false); setEditingTodo(null); }}
                onAdd={handleAddTodoConfirm}
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
    headerAddButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerAddText: {
        color: '#fff',
        fontSize: 20,
        lineHeight: 22,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
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
