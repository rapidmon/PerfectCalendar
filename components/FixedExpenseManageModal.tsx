import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { FixedExpense } from '../types/fixedExpense';

interface FixedExpenseManageModalProps {
    visible: boolean;
    fixedExpenses: FixedExpense[];
    categories: string[];
    accounts: string[];
    onClose: () => void;
    onSave: (expenses: FixedExpense[]) => void;
}

export default function FixedExpenseManageModal({
    visible,
    fixedExpenses,
    categories,
    accounts,
    onClose,
    onSave,
}: FixedExpenseManageModalProps) {
    const [list, setList] = useState<FixedExpense[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);

    // 추가 폼 상태
    const [newDay, setNewDay] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newMoney, setNewMoney] = useState('');
    const [newCategory, setNewCategory] = useState(categories[0] || '');
    const [newAccount, setNewAccount] = useState(accounts[0] || '');

    useEffect(() => {
        if (visible) {
            setList([...fixedExpenses]);
            setShowAddForm(false);
            resetAddForm();
        }
    }, [visible, fixedExpenses]);

    const resetAddForm = () => {
        setNewDay('');
        setNewTitle('');
        setNewMoney('');
        setNewCategory(categories[0] || '');
        setNewAccount(accounts[0] || '');
    };

    const handleAdd = () => {
        const day = parseInt(newDay, 10);
        const money = parseInt(newMoney.replace(/,/g, ''), 10);

        if (!newTitle.trim()) {
            Alert.alert('알림', '메모를 입력해 주세요.');
            return;
        }
        if (isNaN(day) || day < 1 || day > 31) {
            Alert.alert('알림', '날짜는 1~31 사이로 입력해 주세요.');
            return;
        }
        if (isNaN(money) || money <= 0) {
            Alert.alert('알림', '금액을 입력해 주세요.');
            return;
        }

        const newExpense: FixedExpense = {
            id: `fe_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            dayOfMonth: day,
            title: newTitle.trim(),
            money,
            category: newCategory,
            account: newAccount,
        };

        setList(prev => [...prev, newExpense]);
        setShowAddForm(false);
        resetAddForm();
    };

    const handleDelete = (id: string) => {
        setList(prev => prev.filter(item => item.id !== id));
    };

    const handleSave = () => {
        onSave(list);
        onClose();
    };

    const formatMoney = (value: number) => {
        return value.toLocaleString() + '원';
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>고정지출 관리</Text>
                    <Text style={styles.hintText}>매월 지정일에 자동으로 가계부에 추가됩니다</Text>

                    <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                        {list.length === 0 && !showAddForm && (
                            <Text style={styles.emptyText}>등록된 고정지출이 없습니다</Text>
                        )}

                        {list.map((item) => (
                            <View key={item.id} style={styles.itemRow}>
                                <View style={styles.dayBadge}>
                                    <Text style={styles.dayBadgeText}>{item.dayOfMonth}일</Text>
                                </View>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemTitle}>{item.title}</Text>
                                    <Text style={styles.itemDetail}>
                                        {formatMoney(item.money)} · {item.category} · {item.account || '기본'}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                                    <Text style={styles.deleteText}>삭제</Text>
                                </TouchableOpacity>
                            </View>
                        ))}

                        {/* 추가 폼 */}
                        {showAddForm && (
                            <View style={styles.addForm}>
                                <Text style={styles.addFormTitle}>새 고정지출</Text>

                                <View style={styles.formRow}>
                                    <Text style={styles.formLabel}>날짜</Text>
                                    <TextInput
                                        style={[styles.formInput, { width: 60 }]}
                                        placeholder="1~31"
                                        value={newDay}
                                        onChangeText={(t) => setNewDay(t.replace(/[^0-9]/g, ''))}
                                        keyboardType="numeric"
                                        maxLength={2}
                                    />
                                    <Text style={styles.formUnit}>일</Text>
                                </View>

                                <View style={styles.formRow}>
                                    <Text style={styles.formLabel}>메모</Text>
                                    <TextInput
                                        style={[styles.formInput, { flex: 1 }]}
                                        placeholder="예: 월세, 보험료"
                                        value={newTitle}
                                        onChangeText={setNewTitle}
                                    />
                                </View>

                                <View style={styles.formRow}>
                                    <Text style={styles.formLabel}>금액</Text>
                                    <TextInput
                                        style={[styles.formInput, { flex: 1 }]}
                                        placeholder="금액 입력"
                                        value={newMoney}
                                        onChangeText={(t) => setNewMoney(t.replace(/[^0-9]/g, ''))}
                                        keyboardType="numeric"
                                    />
                                    <Text style={styles.formUnit}>원</Text>
                                </View>

                                {/* 카테고리 선택 */}
                                <Text style={styles.formLabel}>카테고리</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                                    <View style={styles.chipContainer}>
                                        {categories.map(cat => (
                                            <TouchableOpacity
                                                key={cat}
                                                style={[styles.chip, newCategory === cat && styles.chipSelected]}
                                                onPress={() => setNewCategory(cat)}
                                            >
                                                <Text style={[styles.chipText, newCategory === cat && styles.chipTextSelected]}>
                                                    {cat}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>

                                {/* 통장 선택 */}
                                <Text style={styles.formLabel}>통장</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                                    <View style={styles.chipContainer}>
                                        {accounts.map(acc => (
                                            <TouchableOpacity
                                                key={acc}
                                                style={[styles.chip, newAccount === acc && styles.chipSelected]}
                                                onPress={() => setNewAccount(acc)}
                                            >
                                                <Text style={[styles.chipText, newAccount === acc && styles.chipTextSelected]}>
                                                    {acc}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>

                                <View style={styles.addFormButtons}>
                                    <TouchableOpacity style={styles.addFormCancel} onPress={() => { setShowAddForm(false); resetAddForm(); }}>
                                        <Text style={styles.addFormCancelText}>취소</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.addFormConfirm} onPress={handleAdd}>
                                        <Text style={styles.addFormConfirmText}>추가</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* 추가 버튼 */}
                    {!showAddForm && (
                        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddForm(true)}>
                            <Text style={styles.addButtonText}>+ 고정지출 추가</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>취소</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
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
        width: '90%',
        maxWidth: 400,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
        textAlign: 'center',
    },
    hintText: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
        marginBottom: 16,
    },
    listContainer: {
        maxHeight: 300,
        marginBottom: 12,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 14,
        paddingVertical: 24,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dayBadge: {
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginRight: 10,
    },
    dayBadgeText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    itemInfo: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    itemDetail: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    deleteBtn: {
        marginLeft: 8,
        padding: 4,
    },
    deleteText: {
        fontSize: 13,
        color: '#F44336',
    },
    addForm: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
    },
    addFormTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    formRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    formLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        width: 40,
        marginBottom: 6,
    },
    formInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 15,
        backgroundColor: '#fff',
    },
    formUnit: {
        fontSize: 14,
        color: '#666',
    },
    chipScroll: {
        marginBottom: 10,
    },
    chipContainer: {
        flexDirection: 'row',
        gap: 6,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    chipSelected: {
        backgroundColor: '#E3F2FD',
        borderColor: '#4A90E2',
    },
    chipText: {
        fontSize: 13,
        color: '#666',
    },
    chipTextSelected: {
        color: '#4A90E2',
        fontWeight: 'bold',
    },
    addFormButtons: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    addFormCancel: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
    },
    addFormCancelText: {
        fontSize: 14,
        color: '#666',
    },
    addFormConfirm: {
        flex: 1,
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
    },
    addFormConfirmText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
    },
    addButton: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
    },
    addButtonText: {
        fontSize: 14,
        color: '#4A90E2',
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
    saveButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
});
