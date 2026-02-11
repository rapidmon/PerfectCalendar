import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface SetGoalModalProps {
    visible: boolean;
    currentGoal: number | undefined;
    monthLabel: string;
    onClose: () => void;
    onSave: (amount: number) => void;
    onDelete?: () => void;
}

export default function SetGoalModal({ visible, currentGoal, monthLabel, onClose, onSave, onDelete }: SetGoalModalProps) {
    const [amountText, setAmountText] = useState('');

    useEffect(() => {
        if (visible) {
            setAmountText(currentGoal ? String(currentGoal) : '');
        }
    }, [visible, currentGoal]);

    const handleMoneyChange = (text: string) => {
        setAmountText(text.replace(/[^0-9]/g, ''));
    };

    const handleSave = () => {
        const amount = parseInt(amountText, 10);
        if (isNaN(amount) || amount <= 0) return;
        onSave(amount);
        onClose();
    };

    const isValid = amountText.trim() !== '' && parseInt(amountText, 10) > 0;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
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
        marginBottom: 20,
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
