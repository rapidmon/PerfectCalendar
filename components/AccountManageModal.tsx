import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { AccountBalances } from '../types/budget';

const ACCOUNT_COLORS = [
    '#5B9BD5', '#E67E22', '#27AE60', '#8E44AD', '#E74C3C',
    '#1ABC9C', '#F39C12', '#3498DB', '#D35400', '#2ECC71',
];

interface AccountItem {
    key: string;
    name: string;
}

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
    const [list, setList] = useState<AccountItem[]>([]);
    const [balanceTexts, setBalanceTexts] = useState<Record<string, string>>({});
    const [newAccount, setNewAccount] = useState('');
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => {
        if (visible) {
            const items = accounts.map((name, index) => ({
                key: `account-${index}-${name}`,
                name,
            }));
            setList(items);
            const texts: Record<string, string> = {};
            for (const account of accounts) {
                const val = initialBalances[account];
                texts[account] = val ? String(val) : '';
            }
            setBalanceTexts(texts);
            setNewAccount('');
            setEditingKey(null);
            setEditingName('');
        }
    }, [visible, accounts, initialBalances]);

    const handleAdd = () => {
        const trimmed = newAccount.trim();
        if (!trimmed) return;
        if (list.some(item => item.name === trimmed)) {
            Alert.alert('알림', '이미 존재하는 통장입니다.');
            return;
        }
        const newItem: AccountItem = {
            key: `account-${Date.now()}-${trimmed}`,
            name: trimmed,
        };
        setList(prev => [...prev, newItem]);
        setBalanceTexts(prev => ({ ...prev, [trimmed]: '' }));
        setNewAccount('');
    };

    const handleDelete = (key: string, name: string) => {
        setList(prev => prev.filter(item => item.key !== key));
        setBalanceTexts(prev => {
            const next = { ...prev };
            delete next[name];
            return next;
        });
    };

    const startEdit = (key: string, name: string) => {
        setEditingKey(key);
        setEditingName(name);
    };

    const confirmEdit = () => {
        if (editingKey === null) return;
        const trimmed = editingName.trim();
        const item = list.find(i => i.key === editingKey);
        if (!item) return;
        const oldName = item.name;

        if (!trimmed) {
            Alert.alert('알림', '통장 이름을 입력해 주세요.');
            return;
        }
        if (trimmed !== oldName && list.some(i => i.name === trimmed)) {
            Alert.alert('알림', '이미 존재하는 통장입니다.');
            return;
        }

        if (trimmed !== oldName) {
            setList(prev => prev.map(i =>
                i.key === editingKey ? { ...i, name: trimmed } : i
            ));
            setBalanceTexts(prev => {
                const next = { ...prev };
                next[trimmed] = next[oldName] || '';
                delete next[oldName];
                return next;
            });
        }
        setEditingKey(null);
        setEditingName('');
    };

    const cancelEdit = () => {
        setEditingKey(null);
        setEditingName('');
    };

    const handleBalanceChange = (account: string, text: string) => {
        setBalanceTexts(prev => ({
            ...prev,
            [account]: text.replace(/[^0-9-]/g, ''),
        }));
    };

    const handleSave = () => {
        const accountNames = list.map(item => item.name);
        const balances: AccountBalances = {};
        for (const name of accountNames) {
            const val = parseInt(balanceTexts[name] || '0', 10);
            if (!isNaN(val)) {
                balances[name] = val;
            }
        }
        onSave(accountNames, balances);
        onClose();
    };

    const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<AccountItem>) => {
        const index = getIndex() ?? 0;
        const color = ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];
        const isEditing = editingKey === item.key;

        return (
            <ScaleDecorator>
                <View style={[styles.itemRow, isActive && styles.itemRowActive]}>
                    <TouchableOpacity
                        onLongPress={drag}
                        delayLongPress={100}
                        style={styles.dragHandle}
                    >
                        <Text style={styles.dragIcon}>☰</Text>
                    </TouchableOpacity>
                    <View style={[styles.numberBadge, { backgroundColor: color }]}>
                        <Text style={styles.numberBadgeText}>{index + 1}</Text>
                    </View>
                    <View style={styles.itemInfo}>
                        {isEditing ? (
                            <View style={styles.editRow}>
                                <TextInput
                                    style={[styles.editInput, { borderColor: color }]}
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
                            <TouchableOpacity onPress={() => startEdit(item.key, item.name)}>
                                <Text style={styles.itemText}>{item.name} ✎</Text>
                            </TouchableOpacity>
                        )}
                        <View style={styles.balanceRow}>
                            <Text style={styles.balanceLabel}>초기 잔액</Text>
                            <TextInput
                                style={styles.balanceInput}
                                placeholder="0"
                                value={balanceTexts[item.name] || ''}
                                onChangeText={(text) => handleBalanceChange(item.name, text)}
                                keyboardType="numeric"
                            />
                            <Text style={styles.unit}>원</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(item.key, item.name)} style={styles.deleteBtn}>
                        <Text style={styles.deleteText}>삭제</Text>
                    </TouchableOpacity>
                </View>
            </ScaleDecorator>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>통장 관리</Text>
                    <Text style={styles.hintText}>☰ 아이콘을 길게 눌러 순서를 변경하세요</Text>

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

                    <View style={styles.listContainer}>
                        {list.length === 0 ? (
                            <Text style={styles.emptyText}>통장이 없습니다</Text>
                        ) : (
                            <DraggableFlatList
                                data={list}
                                onDragEnd={({ data }) => setList(data)}
                                keyExtractor={(item) => item.key}
                                renderItem={renderItem}
                                containerStyle={styles.flatListContainer}
                            />
                        )}
                    </View>

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
        marginBottom: 4,
        textAlign: 'center',
    },
    hintText: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
        marginBottom: 16,
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
    listContainer: {
        maxHeight: 300,
        marginBottom: 16,
    },
    flatListContainer: {
        maxHeight: 300,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    itemRowActive: {
        backgroundColor: '#f5f5f5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    dragHandle: {
        padding: 8,
        marginRight: 4,
    },
    dragIcon: {
        fontSize: 16,
        color: '#999',
    },
    numberBadge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    numberBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
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
