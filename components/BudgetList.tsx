import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import BudgetItem from './BudgetItem';
import AddBudgetModal from './AddBudgetModal';
import BudgetActionModal from './BudgetActionModal';
import { Budget, BudgetType } from '../types/budget';
import { formatDateKorean } from '../utils/format';
import { useStore, useBudgets, useAccounts, useGroup } from '../contexts/AppDataContext';

interface BudgetListProps {
    selectedDate: Date;
}

export default function BudgetList({ selectedDate }: BudgetListProps) {
    const { store } = useStore();
    const { budgets, categories } = useBudgets();
    const { accounts } = useAccounts();
    const { isGroupConnected, memberNames, memberColors } = useGroup();
    const memberUids = useMemo(() => Object.keys(memberNames), [memberNames]);

    const [addModalVisible, setAddModalVisible] = useState(false);
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

    const handleAddBudget = useCallback((title: string, money: number, type: BudgetType, category: string, account: string) => {
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
        store.addBudget(newBudget);
    }, [selectedDate, store]);

    const handleUpdateBudget = useCallback((id: string, title: string, money: number, type: BudgetType, category: string, account: string) => {
        store.updateBudget(id, { title, money, type, category, account });
    }, [store]);

    const handleDeleteBudget = useCallback((id: string) => {
        store.deleteBudget(id);
    }, [store]);

    const handleBudgetPress = useCallback((budget: Budget) => {
        setSelectedBudget(budget);
        setActionModalVisible(true);
    }, []);

    const handleEdit = useCallback(() => {
        setActionModalVisible(false);
        setEditingBudget(selectedBudget);
        setAddModalVisible(true);
    }, [selectedBudget]);

    const handleDelete = useCallback(() => {
        if (selectedBudget) {
            handleDeleteBudget(selectedBudget.id);
        }
        setActionModalVisible(false);
        setSelectedBudget(null);
    }, [selectedBudget, handleDeleteBudget]);

    const handleAddCategory = useCallback((category: string) => {
        store.addCategory(category);
    }, [store]);

    const handleAddAccount = useCallback((account: string) => {
        store.addAccount(account);
    }, [store]);

    const handleCloseAddModal = useCallback(() => {
        setAddModalVisible(false);
        setEditingBudget(null);
    }, []);

    const handleCloseActionModal = useCallback(() => {
        setActionModalVisible(false);
        setSelectedBudget(null);
    }, []);

    // Memoized filtering using string comparison (avoids Date object creation)
    const filteredBudgets = useMemo(() => {
        const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        return budgets.filter(b => b.date === dateStr);
    }, [budgets, selectedDate]);

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
                            accounts={accounts}
                            isGroupConnected={isGroupConnected}
                            memberUids={memberUids}
                            memberColors={memberColors}
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
