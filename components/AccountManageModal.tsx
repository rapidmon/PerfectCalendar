import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';

interface AccountManageModalProps {
    visible: boolean;
    accounts: string[];
    onClose: () => void;
    onSave: (accounts: string[]) => void;
}

export default function AccountManageModal({
    visible,
    accounts,
    onClose,
    onSave,
}: AccountManageModalProps) {
    const [list, setList] = useState<string[]>([]);
    const [newAccount, setNewAccount] = useState('');

    useEffect(() => {
        if (visible) {
            setList([...accounts]);
            setNewAccount('');
        }
    }, [visible, accounts]);

    const handleAdd = () => {
        const trimmed = newAccount.trim();
        if (!trimmed) return;
        if (list.includes(trimmed)) {
            Alert.alert('알림', '이미 존재하는 통장입니다.');
            return;
        }
        setList(prev => [...prev, trimmed]);
        setNewAccount('');
    };

    const handleDelete = (acc: string) => {
        setList(prev => prev.filter(a => a !== acc));
    };

    const handleSave = () => {
        onSave(list);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>통장 관리</Text>

                    <View style={styles.addRow}>
                        <TextInput
                            style={styles.input}
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
                        {list.map(acc => (
                            <View key={acc} style={styles.itemRow}>
                                <Text style={styles.itemText}>{acc}</Text>
                                <TouchableOpacity onPress={() => handleDelete(acc)}>
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
        maxHeight: '70%',
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
    input: {
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
        maxHeight: 250,
        marginBottom: 16,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    itemText: {
        fontSize: 15,
        color: '#333',
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
