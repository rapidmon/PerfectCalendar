import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Todo } from '../types/todo';

interface TodoItemProps {
    todo: Todo;
    onToggle: (id: string) => void;
    selectedDate: Date;
}

export default function TodoItem({ todo, onToggle, selectedDate }: TodoItemProps) {
    const getDateText = () => {
        switch (todo.type) {
        case 'RECURRING':
            return `매주 ${todo.recurringDay}요일`;
        case 'MONTHLY_RECURRING':
            return `매달 ${todo.monthlyRecurringDay}일`;
        case 'DEADLINE':
            if (todo.deadline) {
                const deadlineDate = new Date(todo.deadline);
                const diffTime = deadlineDate.getTime() - selectedDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 0) {
                    return '오늘까지!';
                } else {
                    return `D-${diffDays}`;
                }
            }
            return '';
        
        case 'SPECIFIC':
            return `오늘이다!`;
        
        default:
            return '';
        }
    };

    const getDateColor = () => {
        if (todo.type === 'DEADLINE' && todo.deadline) {
            const deadlineDate = new Date(todo.deadline);
            const diffTime = deadlineDate.getTime() - selectedDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 3) return '#FF9800';
            return '#4A90E2';
        }
        return '#4A90E2';
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={[styles.checkbox]} onPress={() => onToggle(todo.id)}>
                {todo.completed && <Text style={styles.checkmark}></Text>}
            </TouchableOpacity>

            <View style={styles.content}>
                <Text style={[
                styles.title,
                todo.completed && styles.titleCompleted
                ]}>
                    {todo.title}
                </Text>
                <Text style={[styles.dateText, { color: getDateColor() }]}>
                    {getDateText()}
                </Text>
            </View>
        </View>
    );
    }

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 6,
    },
    checkbox: {
        width: 16,
        height: 16,
        borderRadius: 12,
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
        borderRadius: 12,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    title: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    titleCompleted: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    dateText: {
        fontSize: 12,
        fontWeight: '600',
    },
});