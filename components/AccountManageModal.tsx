import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { AccountBalances } from '../types/budget';

interface AccountManageModalProps {
    visible: boolean;
    accounts: string[];
    initialBalances: AccountBalances;
    onClose: () => void;
    onSave: (accounts: string[], balances: AccountBalances) => void;
}

export default function AccountManageModal({
    visible,
    accounts,
    initialBalances,
    onClose,
    onSave,
}: AccountManageModalProps) {
    const [list, setList] = useState<string[]>([]);
    const [balanceTexts, setBalanceTexts] = useState<Record<string, string>>({});
    const [newAccount, setNewAccount] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => {
        if (visible) {
            setList([...accounts]);
            const texts: Record<string, string> = {};
            for (const account of accounts) {
                const val = initialBalances[account];
                texts[account] = val ? String(val) : '';
            }
            setBalanceTexts(texts);
            setNewAccount('');
            setEditingIndex(null);
            setEditingName('');
        }
    }, [visible, accounts, initialBalances]);

    const handleAdd = () => {
        const trimmed = newAccount.trim();
        if (!trimmed) return;
        if (list.includes(trimmed)) {
            Alert.alert('알림', '이미 존재하는 통장입니다.');
            return;
        }
        setList(prev => [...prev, trimmed]);
        setBalanceTexts(prev => ({ ...prev, [trimmed]: '' }));
        setNewAccount('');
    };

    const handleDelete = (acc: string) => {
        setList(prev => prev.filter(a => a !== acc));
        setBalanceTexts(prev => {
            const next = { ...prev };
            delete next[acc];
            return next;
        });
    };

    const startEdit = (index: number) => {
        setEditingIndex(index);
        setEditingName(list[index]);
    };

    const confirmEdit = () => {
        if (editingIndex === null) return;
        const trimmed = editingName.trim();
        const oldName = list[editingIndex];

        if (!trimmed) {
            Alert.alert('알림', '통장 이름을 입력해 주세요.');
            return;
        }
        if (trimmed !== oldName && list.includes(trimmed)) {
            Alert.alert('알림', '이미 존재하는 통장입니다.');
            return;
        }

        if (trimmed !== oldName) {
            setList(prev => prev.map((a, i) => i === editingIndex ? trimmed : a));
            setBalanceTexts(prev => {
                const next = { ...prev };
                next[trimmed] = next[oldName] || '';
                delete next[oldName];
                return next;
            });
        }
        setEditingIndex(null);
        setEditingName('');
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditingName('');
    };

    const handleBalanceChange = (account: string, text: string) => {
        setBalanceTexts(prev => ({
            ...prev,
            [account]: text.replace(/[^0-9-]/g, ''),
        }));
    };

    const handleSave = () => {
        const balances: AccountBalances = {};
        for (const account of list) {
            const val = parseInt(balanceTexts[account] || '0', 10);
            if (!isNaN(val)) {
                balances[account] = val;
            }
        }
        onSave(list, balances);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>통장 관리</Text>

                    <View style={styles.addRow}>
                        <TextInput
                            style={styles.addInput}
                            placeholder="새 통장 이름"
                            value={newAccount}
                            onChangeText={setNewAccount}
                            onSubmitEditing={handleAdd}
                        />
                        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                            <Text style={styles.addBtnText}>추가</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.list}>
                        {list.map((acc, index) => (
                            <View key={`${index}-${acc}`} style={styles.itemRow}>
                                <View style={styles.itemInfo}>
                                    {editingIndex === index ? (
                                        <View style={styles.editRow}>
                                            <TextInput
                                                style={styles.editInput}
                                                value={editingName}
                                                onChangeText={setEditingName}
                                                onSubmitEditing={confirmEdit}
                                                autoFocus
                                            />
                                            <TouchableOpacity onPress={confirmEdit} style={styles.editActionBtn}>
                                                <Text style={styles.confirmText}>확인</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={cancelEdit} style={styles.editActionBtn}>
                                                <Text style={styles.cancelEditText}>취소</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TouchableOpacity onPress={() => startEdit(index)}>
                                            <Text style={styles.itemText}>{acc} ✎</Text>
                                        </TouchableOpacity>
                                    )}
                                    <View style={styles.balanceRow}>
                                        <Text style={styles.balanceLabel}>초기 잔액</Text>
                                        <TextInput
                                            style={styles.balanceInput}
                                            placeholder="0"
                                            value={balanceTexts[acc] || ''}
                                            onChangeText={(text) => handleBalanceChange(acc, text)}
                                            keyboardType="numeric"
                                        />
                                        <Text style={styles.unit}>원</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => handleDelete(acc)} style={styles.deleteBtn}>
                                    <Text style={styles.deleteText}>삭제</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                        {list.length === 0 && (
                            <Text style={styles.emptyText}>통장이 없습니다</Text>
                        )}
                    </ScrollView>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>취소</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>저장</Text>
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
        maxHeight: '75%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
        textAlign: 'center',
    },
    addRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    addInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 15,
    },
    addBtn: {
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    addBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    list: {
        maxHeight: 300,
        marginBottom: 16,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    itemInfo: {
        flex: 1,
    },
    itemText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
    },
    editRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    editInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#4A90E2',
        borderRadius: 6,
        padding: 6,
        fontSize: 15,
    },
    editActionBtn: {
        padding: 4,
    },
    confirmText: {
        fontSize: 13,
        color: '#4A90E2',
        fontWeight: '600',
    },
    cancelEditText: {
        fontSize: 13,
        color: '#999',
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 12,
        color: '#888',
        marginRight: 8,
    },
    balanceInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        padding: 6,
        fontSize: 14,
        width: 110,
        textAlign: 'right',
    },
    unit: {
        fontSize: 13,
        color: '#666',
        marginLeft: 4,
    },
    deleteBtn: {
        marginLeft: 12,
        padding: 4,
    },
    deleteText: {
        fontSize: 13,
        color: '#F44336',
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 14,
        paddingVertical: 20,
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
