import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import BudgetItem from './BudgetItem';
import { Budget } from '../types/budget';
import { formatDateKorean } from '../utils/format';

interface BudgetListProps {
    selectedDate: Date;
}

export default function BudgetList({ selectedDate }: BudgetListProps) {
    const [budgets, setBudgets] = useState<Budget[]>([
            {
                id: '1',
                title: '운동하기',
                money: -12000,
                date: '2025-11-10',
                type: 'EXPENSE'
            },
            {
                id: '2',
                title: '월급',
                money: 3000000,
                date: '2025-11-10',
                type: 'INCOME'
            },
            {
                id: '3',
                title: '콘서트 티켓 예매',
                money: -4500,
                date: '2025-11-10',
                type: 'EXPENSE'
            },
            {
                id: '4',
                title: '사과, 감',
                money: -6000,
                date: '2025-11-10',
                type: 'EXPENSE'
            },
        ]);

    const handleAddBudget = () => {
        console.log('가계부 추가');
    };

    const handleToggleBudgets = (id: string) => {
        setBudgets(budgets.map(budget => 
            budget.id === id ? { ...budget } : budget
        ));
    };

    const filteredBudgets = budgets.filter(budget => {
        const budgetDate = new Date(budget.date);
        budgetDate.setHours(0, 0, 0, 0);
        
        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);
        
        return budgetDate.getTime() === selected.getTime();
    });

    return (
        <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.title}>{formatDateKorean(selectedDate)} 가계부</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddBudget}>
            <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
            {filteredBudgets.length > 0 ? (
                filteredBudgets.map(budget => (
                    <BudgetItem 
                    key={budget.id}
                    budget={budget}
                    />
                ))
                ) : (
                <Text style={styles.emptyText}>-</Text>
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 12
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