import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import BudgetItem from './BudgetItem';
import AddBudgetModal from './AddBudgetModal';
import BudgetActionModal from './BudgetActionModal';
import { Budget, BudgetType } from '../types/budget';
import { formatDateKorean } from '../utils/format';
import { saveBudgets, loadBudgets, saveCategories, loadCategories, saveAccounts, loadAccounts } from '../utils/storage';

interface BudgetListProps {
    selectedDate: Date;
}

export default function BudgetList({ selectedDate }: BudgetListProps) {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [categories, setCategories] = useState<string[]>(['식비']);
    const [accounts, setAccounts] = useState<string[]>(['현금']);
    const [loading, setLoading] = useState(true);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

    // 초기 데이터 로드
    useEffect(() => {
        const load = async () => {
            const [loadedBudgets, loadedCategories, loadedAccounts] = await Promise.all([
                loadBudgets(),
                loadCategories(),
                loadAccounts(),
            ]);
            setBudgets(loadedBudgets);
            setCategories(loadedCategories);
            setAccounts(loadedAccounts);
            setLoading(false);
        };
        load();
    }, []);

    // 자동 저장
    useEffect(() => {
        if (!loading) {
            saveBudgets(budgets);
        }
    }, [budgets, loading]);

    useEffect(() => {
        if (!loading) {
            saveCategories(categories);
        }
    }, [categories, loading]);

    useEffect(() => {
        if (!loading) {
            saveAccounts(accounts);
        }
    }, [accounts, loading]);

    const handleAddBudget = (title: string, money: number, type: BudgetType, category: string, account: string) => {
        const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        const newBudget: Budget = {
            id: Date.now().toString(),
            title,
            money,
            date: dateStr,
            type,
            category,
            account,
        };
        setBudgets(prev => [...prev, newBudget]);
    };

    const handleUpdateBudget = (id: string, title: string, money: number, type: BudgetType, category: string, account: string) => {
        setBudgets(prev => prev.map(b =>
            b.id === id ? { ...b, title, money, type, category, account } : b
        ));
    };

    const handleDeleteBudget = (id: string) => {
        setBudgets(prev => prev.filter(b => b.id !== id));
    };

    const handleBudgetPress = (budget: Budget) => {
        setSelectedBudget(budget);
        setActionModalVisible(true);
    };

    const handleEdit = () => {
        setActionModalVisible(false);
        setEditingBudget(selectedBudget);
        setAddModalVisible(true);
    };

    const handleDelete = () => {
        if (selectedBudget) {
            handleDeleteBudget(selectedBudget.id);
        }
        setActionModalVisible(false);
        setSelectedBudget(null);
    };

    const handleAddCategory = (category: string) => {
        setCategories(prev => [...prev, category]);
    };

    const handleAddAccount = (account: string) => {
        setAccounts(prev => [...prev, account]);
    };

    const handleCloseAddModal = () => {
        setAddModalVisible(false);
        setEditingBudget(null);
    };

    const handleCloseActionModal = () => {
        setActionModalVisible(false);
        setSelectedBudget(null);
    };

    const filteredBudgets = budgets.filter(budget => {
        const budgetDate = new Date(budget.date);
        budgetDate.setHours(0, 0, 0, 0);

        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);

        return budgetDate.getTime() === selected.getTime();
    });

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="small" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.title}>{formatDateKorean(selectedDate)} 가계부</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
            <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
            {filteredBudgets.length > 0 ? (
                filteredBudgets.map(budget => (
                    <BudgetItem
                    key={budget.id}
                    budget={budget}
                    onPress={() => handleBudgetPress(budget)}
                    />
                ))
                ) : (
                <Text style={styles.emptyText}>-</Text>
            )}
        </ScrollView>

        <AddBudgetModal
            visible={addModalVisible}
            selectedDate={selectedDate}
            editingBudget={editingBudget}
            categories={categories}
            accounts={accounts}
            onClose={handleCloseAddModal}
            onAdd={handleAddBudget}
            onUpdate={handleUpdateBudget}
            onAddCategory={handleAddCategory}
            onAddAccount={handleAddAccount}
        />

        <BudgetActionModal
            visible={actionModalVisible}
            onClose={handleCloseActionModal}
            onEdit={handleEdit}
            onDelete={handleDelete}
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
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
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
