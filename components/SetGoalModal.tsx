import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

interface SetGoalModalProps {
    visible: boolean;
    currentGoal: number | undefined;
    monthLabel: string;
    categories: string[];
    fixedCategories: string[];
    savingsCategories: string[];
    onClose: () => void;
    onSave: (amount: number) => void;
    onSaveSavingsCategories: (savingsCategories: string[]) => void;
    onDelete?: () => void;
}

export default function SetGoalModal({
    visible, currentGoal, monthLabel,
    categories, fixedCategories, savingsCategories,
    onClose, onSave, onSaveSavingsCategories, onDelete,
}: SetGoalModalProps) {
    const [amountText, setAmountText] = useState('');
    const [excludedList, setExcludedList] = useState<string[]>([]);

    useEffect(() => {
        if (visible) {
            setAmountText(currentGoal ? String(currentGoal) : '');
            setExcludedList([...savingsCategories]);
        }
    }, [visible, currentGoal, savingsCategories]);

    const handleMoneyChange = (text: string) => {
        setAmountText(text.replace(/[^0-9]/g, ''));
    };

    const toggleExcluded = (cat: string) => {
        setExcludedList(prev =>
            prev.includes(cat)
                ? prev.filter(c => c !== cat)
                : [...prev, cat]
        );
    };

    const handleSave = () => {
        const amount = parseInt(amountText, 10);
        if (isNaN(amount) || amount <= 0) return;
        onSave(amount);
        onSaveSavingsCategories(excludedList);
        onClose();
    };

    const isValid = amountText.trim() !== '' && parseInt(amountText, 10) > 0;

    // 고정지출이 아닌 카테고리만 토글 가능 (고정지출은 이미 제외됨)
    const nonFixedCategories = categories.filter(c => !fixedCategories.includes(c));

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>{monthLabel} 지출 목표</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="목표 금액 (원)"
                        value={amountText}
                        onChangeText={handleMoneyChange}
                        keyboardType="numeric"
                        autoFocus
                    />

                    {categories.length > 0 && (
                        <View style={styles.excludeSection}>
                            <Text style={styles.excludeSectionTitle}>목표 제외 카테고리</Text>
                            <Text style={styles.excludeDescription}>선택한 카테고리는 목표 잔여 계산에서 제외됩니다</Text>
                            <ScrollView style={styles.categoryList} nestedScrollEnabled>
                                {fixedCategories.length > 0 && fixedCategories.filter(c => categories.includes(c)).map(cat => (
                                    <View key={cat} style={styles.categoryItem}>
                                        <Text style={[styles.categoryName, styles.categoryNameDisabled]}>{cat}</Text>
                                        <View style={[styles.toggleBtn, styles.toggleBtnDisabled]}>
                                            <Text style={styles.toggleBtnTextDisabled}>고정지출</Text>
                                        </View>
                                    </View>
                                ))}
                                {nonFixedCategories.map(cat => {
                                    const isExcluded = excludedList.includes(cat);
                                    return (
                                        <TouchableOpacity
                                            key={cat}
                                            style={styles.categoryItem}
                                            onPress={() => toggleExcluded(cat)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.categoryName}>{cat}</Text>
                                            <View style={[styles.toggleBtn, isExcluded && styles.toggleBtnActive]}>
                                                <Text style={[styles.toggleBtnText, isExcluded && styles.toggleBtnTextActive]}>
                                                    {isExcluded ? '제외' : '포함'}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}

                    {currentGoal && onDelete && (
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => { onDelete(); onClose(); }}
                        >
                            <Text style={styles.deleteButtonText}>목표 삭제</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>취소</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={!isValid}
                        >
                            <Text style={styles.saveButtonText}>저장</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
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
        fontSize: 18,
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
    excludeSection: {
        marginBottom: 16,
    },
    excludeSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    excludeDescription: {
        fontSize: 11,
        color: '#999',
        marginBottom: 10,
    },
    categoryList: {
        maxHeight: 180,
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    categoryName: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    categoryNameDisabled: {
        color: '#aaa',
    },
    toggleBtn: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    toggleBtnActive: {
        backgroundColor: '#2196F3',
        borderColor: '#2196F3',
    },
    toggleBtnDisabled: {
        backgroundColor: '#f0f0f0',
        borderColor: '#e0e0e0',
    },
    toggleBtnText: {
        fontSize: 11,
        color: '#999',
        fontWeight: '600',
    },
    toggleBtnTextActive: {
        color: '#fff',
    },
    toggleBtnTextDisabled: {
        fontSize: 11,
        color: '#bbb',
        fontWeight: '600',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
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
    saveButton: {
        flex: 1,
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#ccc',
    },
    saveButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    deleteButton: {
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 12,
    },
    deleteButtonText: {
        fontSize: 14,
        color: '#F44336',
    },
});
