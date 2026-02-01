import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface BudgetActionModalProps {
    visible: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export default function BudgetActionModal({ visible, onClose, onEdit, onDelete }: BudgetActionModalProps) {
    return (
        <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        >
        <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={onClose}
        >
            <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
                <Text style={styles.actionButtonText}>수정</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
                <Text style={[styles.actionButtonText, styles.deleteText]}>삭제</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            </View>
        </TouchableOpacity>
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
        borderRadius: 12,
        width: '80%',
        maxWidth: 300,
        overflow: 'hidden',
    },
    actionButton: {
        padding: 16,
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    deleteText: {
        color: '#F44336',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
    },
    cancelButton: {
        padding: 16,
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
});
