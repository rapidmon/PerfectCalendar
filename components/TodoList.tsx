import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import TodoItem from './TodoItem';
import { Todo } from '../types/todo';
import { formatDateKorean } from '../utils/format';

interface TodoListProps {
    selectedDate: Date;
}

export default function TodoList({ selectedDate }: TodoListProps) {
    // 샘플 데이터
    const [todos, setTodos] = useState<Todo[]>([
        {
            id: '1',
            title: '운동하기',
            type: 'RECURRING',
            recurringDay: '화',
            completed: false,
        },
        {
            id: '2',
            title: '프로젝트 마감',
            type: 'DEADLINE',
            deadline: '2025-11-10',
            completed: false,
        },
        {
            id: '3',
            title: '콘서트 티켓 예매',
            type: 'SPECIFIC',
            specificDate: '2025-11-15',
            completed: false,
        },
        {
            id: '4',
            title: '영어 공부',
            type: 'RECURRING',
            recurringDay: '월',
            completed: false,
        },
    ]);

    const handleAddTodo = () => {
        console.log('할 일 추가');
        // 나중에 모달로 구현
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
                <TodoItem 
                key={todo.id}
                todo={todo}
                onToggle={handleToggleTodo}
                selectedDate={selectedDate}
                />
            ))
            ) : (
            <Text style={styles.emptyText}>할 일이 없습니다</Text>
            )}
        </ScrollView>
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