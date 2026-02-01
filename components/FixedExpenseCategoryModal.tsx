import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface FixedExpenseCategoryModalProps {
    visible: boolean;
    categories: string[];
    fixedCategories: string[];
    onClose: () => void;
    onSave: (fixedCategories: string[]) => void;
}

export default function FixedExpenseCategoryModal({
    visible,
    categories,
    fixedCategories,
    onClose,
    onSave,
}: FixedExpenseCategoryModalProps) {
    const [selected, setSelected] = useState<string[]>([]);

    useEffect(() => {
        if (visible) {
            setSelected([...fixedCategories]);
        }
    }, [visible, fixedCategories]);

    const toggleCategory = (cat: string) => {
        setSelected(prev =>
            prev.includes(cat)
                ? prev.filter(c => c !== cat)
                : [...prev, cat]
        );
    };

    const handleSave = () => {
        onSave(selected);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>고정지출 카테고리 설정</Text>
                    <Text style={styles.description}>고정지출로 분류할 카테고리를 선택하세요</Text>

                    <ScrollView style={styles.list}>
                        {categories.map(cat => (
                            <TouchableOpacity
                                key={cat}
                                style={styles.itemRow}
                                onPress={() => toggleCategory(cat)}
                            >
                                <View style={[
                                    styles.checkbox,
                                    selected.includes(cat) && styles.checkboxSelected,
                                ]}>
                                    {selected.includes(cat) && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </View>
                                <Text style={styles.itemText}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
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
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 13,
        color: '#999',
        textAlign: 'center',
        marginBottom: 16,
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
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#ddd',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#4A90E2',
        borderColor: '#4A90E2',
    },
    checkmark: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    itemText: {
        fontSize: 15,
        color: '#333',
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
