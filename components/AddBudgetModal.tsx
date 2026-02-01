import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Budget, BudgetType } from '../types/budget';

interface AddBudgetModalProps {
    visible: boolean;
    selectedDate: Date;
    editingBudget?: Budget | null;
    categories: string[];
    accounts: string[];
    onClose: () => void;
    onAdd: (title: string, money: number, type: BudgetType, category: string, account: string) => void;
    onUpdate?: (id: string, title: string, money: number, type: BudgetType, category: string, account: string) => void;
    onAddCategory: (category: string) => void;
    onAddAccount: (account: string) => void;
}

export default function AddBudgetModal({ visible, selectedDate, editingBudget, categories, accounts, onClose, onAdd, onUpdate, onAddCategory, onAddAccount }: AddBudgetModalProps) {
    const [title, setTitle] = useState('');
    const [moneyText, setMoneyText] = useState('');
    const [budgetType, setBudgetType] = useState<BudgetType>('EXPENSE');
    const [selectedCategory, setSelectedCategory] = useState('식비');
    const [selectedAccount, setSelectedAccount] = useState('기본');
    const [newCategory, setNewCategory] = useState('');
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newAccount, setNewAccount] = useState('');
    const [showNewAccountInput, setShowNewAccountInput] = useState(false);

    useEffect(() => {
        if (editingBudget) {
            setTitle(editingBudget.title);
            setMoneyText(String(Math.abs(editingBudget.money)));
            setBudgetType(editingBudget.type);
            setSelectedCategory(editingBudget.category || '식비');
            setSelectedAccount(editingBudget.account || '기본');
        } else {
            setTitle('');
            setMoneyText('');
            setBudgetType('EXPENSE');
            setSelectedCategory('식비');
            setSelectedAccount(accounts[0] || '기본');
        }
        setNewCategory('');
        setShowNewCategoryInput(false);
        setNewAccount('');
        setShowNewAccountInput(false);
    }, [editingBudget, visible]);

    const handleSave = () => {
        if (!title.trim() || !moneyText.trim()) return;

        const amount = parseInt(moneyText, 10);
        if (isNaN(amount) || amount <= 0) return;

        const money = budgetType === 'EXPENSE' ? -amount : amount;

        if (editingBudget && onUpdate) {
            onUpdate(editingBudget.id, title.trim(), money, budgetType, selectedCategory, selectedAccount);
        } else {
            onAdd(title.trim(), money, budgetType, selectedCategory, selectedAccount);
        }
        handleCancel();
    };

    const handleCancel = () => {
        setTitle('');
        setMoneyText('');
        setBudgetType('EXPENSE');
        setSelectedCategory('식비');
        setSelectedAccount(accounts[0] || '기본');
        setNewCategory('');
        setShowNewCategoryInput(false);
        setNewAccount('');
        setShowNewAccountInput(false);
        onClose();
    };

    const handleAddAccount = () => {
        const trimmed = newAccount.trim();
        if (!trimmed) return;
        if (accounts.includes(trimmed)) {
            Alert.alert('알림', '이미 존재하는 통장입니다.');
            return;
        }
        onAddAccount(trimmed);
        setSelectedAccount(trimmed);
        setNewAccount('');
        setShowNewAccountInput(false);
    };

    const handleAddCategory = () => {
        const trimmed = newCategory.trim();
        if (!trimmed) return;
        if (categories.includes(trimmed)) {
            Alert.alert('알림', '이미 존재하는 카테고리입니다.');
            return;
        }
        onAddCategory(trimmed);
        setSelectedCategory(trimmed);
        setNewCategory('');
        setShowNewCategoryInput(false);
    };

    const handleMoneyChange = (text: string) => {
        const numbersOnly = text.replace(/[^0-9]/g, '');
        setMoneyText(numbersOnly);
    };

    const isValid = title.trim() && moneyText.trim() && parseInt(moneyText, 10) > 0;

    return (
        <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        >
        <View style={styles.overlay}>
            <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
                {editingBudget ? '가계부 수정' : '가계부 추가'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* 메모 입력 */}
                <TextInput
                style={styles.input}
                placeholder="메모"
                value={title}
                onChangeText={setTitle}
                autoFocus={!editingBudget}
                />

                {/* 금액 입력 */}
                <TextInput
                style={styles.input}
                placeholder="금액"
                value={moneyText}
                onChangeText={handleMoneyChange}
                keyboardType="numeric"
                />

                {/* 수입/지출 토글 */}
                <Text style={styles.label}>유형</Text>
                <View style={styles.typeContainer}>
                <TouchableOpacity
                    style={[
                    styles.typeButton,
                    budgetType === 'EXPENSE' && styles.expenseSelected,
                    ]}
                    onPress={() => setBudgetType('EXPENSE')}
                >
                    <Text style={[
                    styles.typeLabel,
                    budgetType === 'EXPENSE' && styles.expenseLabelSelected,
                    ]}>지출</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                    styles.typeButton,
                    budgetType === 'INCOME' && styles.incomeSelected,
                    ]}
                    onPress={() => setBudgetType('INCOME')}
                >
                    <Text style={[
                    styles.typeLabel,
                    budgetType === 'INCOME' && styles.incomeLabelSelected,
                    ]}>수입</Text>
                </TouchableOpacity>
                </View>

                {/* 카테고리 선택 (지출일 때만) */}
                {budgetType === 'EXPENSE' && (
                <>
                    <Text style={styles.label}>카테고리</Text>
                    <View style={styles.categoryContainer}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                        key={cat}
                        style={[
                            styles.categoryButton,
                            selectedCategory === cat && styles.categoryButtonSelected,
                        ]}
                        onPress={() => setSelectedCategory(cat)}
                        >
                        <Text style={[
                            styles.categoryText,
                            selectedCategory === cat && styles.categoryTextSelected,
                        ]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={styles.categoryAddButton}
                        onPress={() => setShowNewCategoryInput(!showNewCategoryInput)}
                    >
                        <Text style={styles.categoryAddText}>+</Text>
                    </TouchableOpacity>
                    </View>

                    {showNewCategoryInput && (
                    <View style={styles.newCategoryRow}>
                        <TextInput
                        style={styles.newCategoryInput}
                        placeholder="새 카테고리"
                        value={newCategory}
                        onChangeText={setNewCategory}
                        />
                        <TouchableOpacity style={styles.newCategoryConfirm} onPress={handleAddCategory}>
                        <Text style={styles.newCategoryConfirmText}>추가</Text>
                        </TouchableOpacity>
                    </View>
                    )}
                </>
                )}
                {/* 통장 선택 */}
                <Text style={styles.label}>통장</Text>
                <View style={styles.categoryContainer}>
                {accounts.map((acc) => (
                    <TouchableOpacity
                    key={acc}
                    style={[
                        styles.categoryButton,
                        selectedAccount === acc && styles.accountButtonSelected,
                    ]}
                    onPress={() => setSelectedAccount(acc)}
                    >
                    <Text style={[
                        styles.categoryText,
                        selectedAccount === acc && styles.accountTextSelected,
                    ]}>{acc}</Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity
                    style={styles.categoryAddButton}
                    onPress={() => setShowNewAccountInput(!showNewAccountInput)}
                >
                    <Text style={styles.categoryAddText}>+</Text>
                </TouchableOpacity>
                </View>

                {showNewAccountInput && (
                <View style={styles.newCategoryRow}>
                    <TextInput
                    style={styles.newCategoryInput}
                    placeholder="새 통장"
                    value={newAccount}
                    onChangeText={setNewAccount}
                    />
                    <TouchableOpacity style={styles.newCategoryConfirm} onPress={handleAddAccount}>
                    <Text style={styles.newCategoryConfirmText}>추가</Text>
                    </TouchableOpacity>
                </View>
                )}
            </ScrollView>

            {/* 버튼 */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                style={[styles.addButton, !isValid && styles.addButtonDisabled]}
                onPress={handleSave}
                disabled={!isValid}
                >
                <Text style={styles.addButtonText}>
                    {editingBudget ? '수정' : '추가'}
                </Text>
                </TouchableOpacity>
            </View>
            </View>
        </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '85%',
        maxWidth: 400,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 10,
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    typeButton: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    expenseSelected: {
        backgroundColor: '#FFEBEE',
        borderColor: '#F44336',
    },
    incomeSelected: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
    },
    typeLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    expenseLabelSelected: {
        color: '#F44336',
        fontWeight: 'bold',
    },
    incomeLabelSelected: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    categoryButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: '#f5f5f5',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    categoryButtonSelected: {
        backgroundColor: '#E3F2FD',
        borderColor: '#4A90E2',
    },
    categoryText: {
        fontSize: 13,
        color: '#666',
    },
    categoryTextSelected: {
        color: '#4A90E2',
        fontWeight: 'bold',
    },
    accountButtonSelected: {
        backgroundColor: '#FFF3E0',
        borderColor: '#FF9800',
    },
    accountTextSelected: {
        color: '#FF9800',
        fontWeight: 'bold',
    },
    categoryAddButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: '#f5f5f5',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        borderStyle: 'dashed',
    },
    categoryAddText: {
        fontSize: 13,
        color: '#999',
    },
    newCategoryRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    newCategoryInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
    },
    newCategoryConfirm: {
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    newCategoryConfirmText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    addButton: {
        flex: 1,
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
    },
    addButtonDisabled: {
        backgroundColor: '#ccc',
    },
    addButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
});
