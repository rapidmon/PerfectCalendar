import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import TodoItem from './TodoItem';
import AddTodoModal from './AddTodoModal';
import TodoActionModal from './TodoActionModal';
import { Todo, TodoType } from '../types/todo';
import { formatDateKorean } from '../utils/format';
import { loadTodos, saveTodos } from '../utils/storage';

interface TodoListProps {
    selectedDate: Date;
}

export default function TodoList({ selectedDate }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);  // 빈 배열로 시작!
  const [isLoading, setIsLoading] = useState(true);  // 로딩 상태 추가

    const [addModalVisible, setAddModalVisible] = useState(false);
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
    
    useEffect(() => {
        const initTodos = async () => {
        const loadedTodos = await loadTodos();
        setTodos(loadedTodos);
        setIsLoading(false);
        };
        initTodos();
    }, []);

    useEffect(() => {
        if (!isLoading) {  // 초기 로딩 중에는 저장 안 함
            saveTodos(todos);
        }
    }, [todos]);

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
        Alert.alert(
            '삭제 확인',
            '정말 삭제하시겠습니까?',
            [
            { text: '취소', style: 'cancel' },
            {
                text: '삭제',
                style: 'destructive',
                onPress: () => {
                setTodos(todos.filter(t => t.id !== selectedTodo.id));
                setActionModalVisible(false);
                setSelectedTodo(null);
                },
            },
            ]
        );
        }
    };

    const handleAddTodoConfirm = (title: string, type: TodoType, customDate?: Date) => {
        const newTodo: Todo = { id: Date.now().toString(), title, type, completed: false, createdAt: new Date().toISOString().split('T')[0] };

        const dateToUse = customDate || selectedDate;
        const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateToUse.getDay()];
        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        switch (type) {
        case 'RECURRING':
            // customWeekday가 있다면 사용 (모달에서 처리됨)
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

        setTodos([...todos, newTodo]);
    };

    const handleUpdateTodo = (id: string, title: string, type: TodoType, customDate?: Date) => {
        const dateToUse = customDate || selectedDate;
        const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateToUse.getDay()];
        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        setTodos(todos.map(todo => {
        if (todo.id === id) {
            const updatedTodo: Todo = {
                ...todo,
                title,
                type,
                recurringDay: undefined,
                monthlyRecurringDay: undefined,
                deadline: undefined,
                specificDate: undefined,
            };

            switch (type) {
            case 'RECURRING':
                updatedTodo.recurringDay = dayOfWeek;
                break;
            case 'MONTHLY_RECURRING':
                updatedTodo.monthlyRecurringDay = dateToUse.getDate();
                break;
            case 'DEADLINE':
                updatedTodo.deadline = formatDate(dateToUse);
                break;
            case 'SPECIFIC':
                updatedTodo.specificDate = formatDate(dateToUse);
                break;
            }

            return updatedTodo;
        }
        return todo;
        }));
    };

    const handleToggleTodo = (id: string) => {
        setTodos(todos.map(todo => 
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
    };

    const filteredTodos = todos.filter(todo => {
        if (todo.type === 'RECURRING' && todo.recurringDay) {
            const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][selectedDate.getDay()];
            return dayOfWeek === todo.recurringDay;
        }
        
        if (todo.type === 'MONTHLY_RECURRING' && todo.monthlyRecurringDay) {
            return selectedDate.getDate() === todo.monthlyRecurringDay;
        }

        if (todo.type === 'DEADLINE' && todo.deadline) {
            const deadlineDate = new Date(todo.deadline);
            deadlineDate.setHours(0, 0, 0, 0);
            const selected = new Date(selectedDate);
            selected.setHours(0, 0, 0, 0);
            
            return selected <= deadlineDate;
        }

        if (todo.type === 'SPECIFIC' && todo.specificDate) {
            const specificDate = new Date(todo.specificDate);
            specificDate.setHours(0, 0, 0, 0);
            const selected = new Date(selectedDate);
            selected.setHours(0, 0, 0, 0);
            
            return selected.getTime() === specificDate.getTime();
        }

        return false;
    });

    if (isLoading) {
        return (
        <View style={styles.container}>
            <View style={styles.header}>
            <Text style={styles.title}>{formatDateKorean(selectedDate)} 할 일</Text>
            </View>
            <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>불러오는 중...</Text>
            </View>
        </View>
        );
    }

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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#999',
        fontSize: 14,
    },
});