import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { AccountOwnership } from '../firebase';
import { getMemberColor } from '../utils/memberColors';

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
    accountOwners?: AccountOwnership;
    memberNames?: { [uid: string]: string };
    memberColors?: { [uid: string]: string };
    isGroupConnected?: boolean;
    onClose: () => void;
    onSave: (accounts: string[], owners?: AccountOwnership) => void;
}

export default function AccountManageModal({
    visible,
    accounts,
    accountOwners = {},
    memberNames = {},
    memberColors: customColors,
    isGroupConnected = false,
    onClose,
    onSave,
}: AccountManageModalProps) {
    const [list, setList] = useState<AccountItem[]>([]);
    const [localOwners, setLocalOwners] = useState<AccountOwnership>({});
    const [newAccount, setNewAccount] = useState('');
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [ownerPickerAccount, setOwnerPickerAccount] = useState<string | null>(null);

    const memberUids = Object.keys(memberNames);

    useEffect(() => {
        if (visible) {
            const items = accounts.map((name, index) => ({
                key: `account-${index}-${name}`,
                name,
            }));
            setList(items);
            setLocalOwners({ ...accountOwners });
            setNewAccount('');
            setEditingKey(null);
            setEditingName('');
            setOwnerPickerAccount(null);
        }
    }, [visible, accounts, accountOwners]);

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
        setNewAccount('');
    };

    const handleDelete = (key: string, name: string) => {
        setList(prev => prev.filter(item => item.key !== key));
        setLocalOwners(prev => {
            const next = { ...prev };
            delete next[name];
            return next;
        });
    };

    const handleMoveUp = (index: number) => {
        if (index <= 0) return;
        setList(prev => {
            const next = [...prev];
            [next[index - 1], next[index]] = [next[index], next[index - 1]];
            return next;
        });
    };

    const handleMoveDown = (index: number) => {
        setList(prev => {
            if (index >= prev.length - 1) return prev;
            const next = [...prev];
            [next[index], next[index + 1]] = [next[index + 1], next[index]];
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
            // 소유자 정보도 새 이름으로 이전
            setLocalOwners(prev => {
                const next = { ...prev };
                if (next[oldName]) {
                    next[trimmed] = next[oldName];
                    delete next[oldName];
                }
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

    const handleSave = () => {
        const accountNames = list.map(item => item.name);
        onSave(accountNames, isGroupConnected ? localOwners : undefined);
        onClose();
    };

    const handleOwnerChange = (accountName: string, newOwnerUid: string) => {
        setLocalOwners(prev => ({ ...prev, [accountName]: newOwnerUid }));
        setOwnerPickerAccount(null);
    };

    const renderItem = (item: AccountItem, index: number) => {
        const isEditing = editingKey === item.key;
        const isFirst = index === 0;
        const isLast = index === list.length - 1;

        // 그룹 모드에서는 소유자 색상 사용, 아니면 인덱스 기반 색상
        const ownerUid = localOwners[item.name];
        const color = isGroupConnected && ownerUid
            ? getMemberColor(ownerUid, memberUids, customColors)
            : ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];
        const ownerName = ownerUid ? (memberNames[ownerUid] || '알 수 없음') : '';
        const isPickerOpen = ownerPickerAccount === item.name;

        return (
            <View key={item.key}>
                <View style={styles.itemRow}>
                    <View style={styles.reorderButtons}>
                        <TouchableOpacity
                            onPress={() => handleMoveUp(index)}
                            style={[styles.arrowBtn, isFirst && styles.arrowBtnDisabled]}
                            disabled={isFirst}
                        >
                            <Text style={[styles.arrowText, isFirst && styles.arrowTextDisabled]}>▲</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleMoveDown(index)}
                            style={[styles.arrowBtn, isLast && styles.arrowBtnDisabled]}
                            disabled={isLast}
                        >
                            <Text style={[styles.arrowText, isLast && styles.arrowTextDisabled]}>▼</Text>
                        </TouchableOpacity>
                    </View>
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
                        {/* 그룹 모드: 소유자 표시 및 변경 */}
                        {isGroupConnected && (
                            <TouchableOpacity
                                style={styles.ownerRow}
                                onPress={() => setOwnerPickerAccount(isPickerOpen ? null : item.name)}
                            >
                                <View style={[styles.ownerDot, { backgroundColor: color }]} />
                                <Text style={styles.ownerText}>{ownerName || '소유자 미지정'}</Text>
                                <Text style={styles.ownerChangeText}>변경</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(item.key, item.name)} style={styles.deleteBtn}>
                        <Text style={styles.deleteText}>삭제</Text>
                    </TouchableOpacity>
                </View>
                {/* 소유자 선택 피커 */}
                {isGroupConnected && isPickerOpen && (
                    <View style={styles.ownerPicker}>
                        {memberUids.map(uid => {
                            const memberColor = getMemberColor(uid, memberUids, customColors);
                            const isSelected = localOwners[item.name] === uid;
                            return (
                                <TouchableOpacity
                                    key={uid}
                                    style={[styles.ownerPickerItem, isSelected && styles.ownerPickerItemSelected]}
                                    onPress={() => handleOwnerChange(item.name, uid)}
                                >
                                    <View style={[styles.ownerDot, { backgroundColor: memberColor }]} />
                                    <Text style={[styles.ownerPickerText, isSelected && styles.ownerPickerTextSelected]}>
                                        {memberNames[uid] || uid}
                                    </Text>
                                    {isSelected && <Text style={styles.checkMark}>✓</Text>}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </View>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>통장 관리</Text>
                    <Text style={styles.hintText}>▲ ▼ 버튼으로 순서를 변경하세요</Text>

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

                    <ScrollView style={styles.listContainer}>
                        {list.length === 0 ? (
                            <Text style={styles.emptyText}>통장이 없습니다</Text>
                        ) : (
                            list.map((item, index) => renderItem(item, index))
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
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    reorderButtons: {
        marginRight: 6,
        alignItems: 'center',
        gap: 2,
    },
    arrowBtn: {
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    arrowBtnDisabled: {
        opacity: 0.25,
    },
    arrowText: {
        fontSize: 12,
        color: '#666',
    },
    arrowTextDisabled: {
        color: '#ccc',
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
    deleteBtn: {
        marginLeft: 12,
        padding: 4,
    },
    deleteText: {
        fontSize: 13,
        color: '#F44336',
    },
    ownerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    ownerDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    ownerText: {
        fontSize: 12,
        color: '#666',
    },
    ownerChangeText: {
        fontSize: 11,
        color: '#4A90E2',
        marginLeft: 8,
    },
    ownerPicker: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginHorizontal: 8,
        marginBottom: 8,
        padding: 6,
    },
    ownerPickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 6,
    },
    ownerPickerItemSelected: {
        backgroundColor: '#E3F2FD',
    },
    ownerPickerText: {
        fontSize: 13,
        color: '#333',
        flex: 1,
    },
    ownerPickerTextSelected: {
        fontWeight: 'bold',
        color: '#4A90E2',
    },
    checkMark: {
        fontSize: 14,
        color: '#4A90E2',
        fontWeight: 'bold',
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
