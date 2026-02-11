import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import TodoItem from './TodoItem';
import AddTodoModal from './AddTodoModal';
import TodoActionModal from './TodoActionModal';
import { Todo, TodoType } from '../types/todo';
import { formatDateKorean } from '../utils/format';
import { useStore, useTodos, useGroup } from '../contexts/AppDataContext';

interface TodoListProps {
    selectedDate: Date;
}

const formatLocalDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export default function TodoList({ selectedDate }: TodoListProps) {
    const { store } = useStore();
    const { todos } = useTodos();
    const { isGroupConnected, memberNames, memberColors } = useGroup();
    const memberUids = useMemo(() => Object.keys(memberNames), [memberNames]);

    const [addModalVisible, setAddModalVisible] = useState(false);
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

    const handleAddTodo = useCallback(() => {
        setEditingTodo(null);
        setAddModalVisible(true);
    }, []);

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
            Alert.alert(
                '삭제 확인',
                '정말 삭제하시겠습니까?',
                [
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
                ]
            );
        }
    }, [selectedTodo, store]);

    const handleAddTodoConfirm = useCallback((title: string, type: TodoType, customDate?: Date, endDate?: Date) => {
        const newTodo: Todo = { id: Date.now().toString(), title, type, completed: false, createdAt: formatLocalDate(new Date()) };

        const dateToUse = customDate || selectedDate;
        const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateToUse.getDay()];

        switch (type) {
            case 'RECURRING':
                newTodo.recurringDay = dayOfWeek;
                break;
            case 'MONTHLY_RECURRING':
                newTodo.monthlyRecurringDay = dateToUse.getDate();
                break;
            case 'DEADLINE':
                newTodo.deadline = formatLocalDate(dateToUse);
                break;
            case 'SPECIFIC':
                newTodo.specificDate = formatLocalDate(dateToUse);
                break;
            case 'DATE_RANGE':
                newTodo.dateRangeStart = formatLocalDate(dateToUse);
                newTodo.dateRangeEnd = endDate ? formatLocalDate(endDate) : formatLocalDate(dateToUse);
                break;
        }

        store.addTodo(newTodo);
    }, [selectedDate, store]);

    const handleUpdateTodo = useCallback((id: string, title: string, type: TodoType, customDate?: Date, endDate?: Date) => {
        const dateToUse = customDate || selectedDate;
        const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateToUse.getDay()];

        store.updateTodo(id, (todo) => {
            const updatedTodo: Todo = {
                ...todo,
                title,
                type,
                recurringDay: undefined,
                monthlyRecurringDay: undefined,
                deadline: undefined,
                specificDate: undefined,
                dateRangeStart: undefined,
                dateRangeEnd: undefined,
            };

            switch (type) {
                case 'RECURRING':
                    updatedTodo.recurringDay = dayOfWeek;
                    break;
                case 'MONTHLY_RECURRING':
                    updatedTodo.monthlyRecurringDay = dateToUse.getDate();
                    break;
                case 'DEADLINE':
                    updatedTodo.deadline = formatLocalDate(dateToUse);
                    break;
                case 'SPECIFIC':
                    updatedTodo.specificDate = formatLocalDate(dateToUse);
                    break;
                case 'DATE_RANGE':
                    updatedTodo.dateRangeStart = formatLocalDate(dateToUse);
                    updatedTodo.dateRangeEnd = endDate ? formatLocalDate(endDate) : formatLocalDate(dateToUse);
                    break;
            }

            return updatedTodo;
        });
    }, [selectedDate, store]);

    const handleToggleTodo = useCallback((id: string) => {
        store.toggleTodo(id);
    }, [store]);

    // Memoized filtering - avoids recomputation on unrelated re-renders
    const filteredTodos = useMemo(() => {
        return todos.filter(todo => {
            if (todo.type === 'RECURRING' && todo.recurringDay) {
                const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][selectedDate.getDay()];
                return dayOfWeek === todo.recurringDay;
            }

            if (todo.type === 'MONTHLY_RECURRING' && todo.monthlyRecurringDay) {
                return selectedDate.getDate() === todo.monthlyRecurringDay;
            }

            if (todo.type === 'DEADLINE' && todo.deadline) {
                const selectedStr = formatLocalDate(selectedDate);
                return selectedStr <= todo.deadline;
            }

            if (todo.type === 'SPECIFIC' && todo.specificDate) {
                const selectedStr = formatLocalDate(selectedDate);
                return selectedStr === todo.specificDate;
            }

            if (todo.type === 'DATE_RANGE' && todo.dateRangeStart && todo.dateRangeEnd) {
                const selectedStr = formatLocalDate(selectedDate);
                return selectedStr >= todo.dateRangeStart && selectedStr <= todo.dateRangeEnd;
            }

            return false;
        });
    }, [todos, selectedDate]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{formatDateKorean(selectedDate)} 할 일</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddTodo}>
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {filteredTodos.length > 0 ? (
                    filteredTodos.map(todo => (
                        <TouchableOpacity key={todo.id} onPress={() => handleTodoPress(todo)} activeOpacity={0.7}>
                            <TodoItem
                                todo={todo}
                                onToggle={handleToggleTodo}
                                selectedDate={selectedDate}
                                isGroupConnected={isGroupConnected}
                                memberUids={memberUids}
                                memberColors={memberColors}
                            />
                        </TouchableOpacity>
                    ))
                    ) : (
                    <Text style={styles.emptyText}>할 일이 없습니다</Text>
                )}
            </ScrollView>
            <AddTodoModal
                visible={addModalVisible}
                selectedDate={selectedDate}
                editingTodo={editingTodo}
                onClose={() => {
                    setAddModalVisible(false);
                    setEditingTodo(null);
                }}
                onAdd={handleAddTodoConfirm}
                onUpdate={handleUpdateTodo}
            />
            <TodoActionModal
                visible={actionModalVisible}
                onClose={() => {
                    setActionModalVisible(false);
                    setSelectedTodo(null);
                }}
                onEdit={handleEditTodo}
                onDelete={handleDeleteTodo}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    addButton: {
        width: 20,
        height: 20,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: '#999999',
        fontSize: 24,
        lineHeight: 28,
    },
    scrollView: {
        flex: 1,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 20,
        fontSize: 14,
    },
});
