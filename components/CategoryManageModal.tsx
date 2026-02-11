import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';

interface CategoryManageModalProps {
    visible: boolean;
    categories: string[];
    fixedCategories: string[];
    onClose: () => void;
    onSave: (categories: string[], fixedCategories: string[]) => void;
}

export default function CategoryManageModal({
    visible,
    categories,
    fixedCategories,
    onClose,
    onSave,
}: CategoryManageModalProps) {
    const [list, setList] = useState<string[]>([]);
    const [fixedList, setFixedList] = useState<string[]>([]);
    const [newCategory, setNewCategory] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => {
        if (visible) {
            setList([...categories]);
            setFixedList([...fixedCategories]);
            setNewCategory('');
            setEditingIndex(null);
            setEditingName('');
        }
    }, [visible, categories, fixedCategories]);

    const handleAdd = () => {
        const trimmed = newCategory.trim();
        if (!trimmed) return;
        if (list.includes(trimmed)) {
            Alert.alert('알림', '이미 존재하는 카테고리입니다.');
            return;
        }
        setList(prev => [...prev, trimmed]);
        setNewCategory('');
    };

    const handleDelete = (cat: string) => {
        setList(prev => prev.filter(c => c !== cat));
        setFixedList(prev => prev.filter(c => c !== cat));
    };

    const toggleFixed = (cat: string) => {
        setFixedList(prev =>
            prev.includes(cat)
                ? prev.filter(c => c !== cat)
                : [...prev, cat]
        );
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
            Alert.alert('알림', '카테고리 이름을 입력해 주세요.');
            return;
        }
        if (trimmed !== oldName && list.includes(trimmed)) {
            Alert.alert('알림', '이미 존재하는 카테고리입니다.');
            return;
        }

        if (trimmed !== oldName) {
            setList(prev => prev.map((c, i) => i === editingIndex ? trimmed : c));
            // 고정지출 목록에서도 이름 변경
            if (fixedList.includes(oldName)) {
                setFixedList(prev => prev.map(c => c === oldName ? trimmed : c));
            }
        }
        setEditingIndex(null);
        setEditingName('');
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditingName('');
    };

    const handleSave = () => {
        onSave(list, fixedList);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>카테고리 관리</Text>

                    <View style={styles.addRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="새 카테고리"
                            value={newCategory}
                            onChangeText={setNewCategory}
                            onSubmitEditing={handleAdd}
                        />
                        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                            <Text style={styles.addBtnText}>추가</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.list}>
                        {list.map((cat, index) => {
                            const isFixed = fixedList.includes(cat);
                            return (
                                <View key={`${index}-${cat}`} style={styles.itemRow}>
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
                                        <TouchableOpacity onPress={() => startEdit(index)} style={styles.itemNameBtn}>
                                            <Text style={styles.itemText}>{cat} ✎</Text>
                                        </TouchableOpacity>
                                    )}
                                    <View style={styles.itemActions}>
                                        <TouchableOpacity
                                            style={[styles.fixedBtn, isFixed && styles.fixedBtnActive]}
                                            onPress={() => toggleFixed(cat)}
                                        >
                                            <Text style={[styles.fixedBtnText, isFixed && styles.fixedBtnTextActive]}>
                                                고정지출
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDelete(cat)}>
                                            <Text style={styles.deleteText}>삭제</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                        {list.length === 0 && (
                            <Text style={styles.emptyText}>카테고리가 없습니다</Text>
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
        maxHeight: 300,
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
    itemNameBtn: {
        flex: 1,
    },
    itemText: {
        fontSize: 15,
        color: '#333',
    },
    editRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginRight: 8,
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
    itemActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    fixedBtn: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    fixedBtnActive: {
        backgroundColor: '#FF9800',
        borderColor: '#FF9800',
    },
    fixedBtnText: {
        fontSize: 11,
        color: '#999',
        fontWeight: '600',
    },
    fixedBtnTextActive: {
        color: '#fff',
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
