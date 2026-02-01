import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AccountBalances } from '../types/budget';

interface AccountBalanceModalProps {
    visible: boolean;
    accounts: string[];
    initialBalances: AccountBalances;
    onClose: () => void;
    onSave: (balances: AccountBalances) => void;
}

export default function AccountBalanceModal({
    visible,
    accounts,
    initialBalances,
    onClose,
    onSave,
}: AccountBalanceModalProps) {
    const [balanceTexts, setBalanceTexts] = useState<Record<string, string>>({});

    useEffect(() => {
        if (visible) {
            const texts: Record<string, string> = {};
            for (const account of accounts) {
                const val = initialBalances[account];
                texts[account] = val ? String(val) : '';
            }
            setBalanceTexts(texts);
        }
    }, [visible, accounts, initialBalances]);

    const handleChange = (account: string, text: string) => {
        setBalanceTexts(prev => ({
            ...prev,
            [account]: text.replace(/[^0-9-]/g, ''),
        }));
    };

    const handleSave = () => {
        const balances: AccountBalances = {};
        for (const account of accounts) {
            const val = parseInt(balanceTexts[account] || '0', 10);
            if (!isNaN(val)) {
                balances[account] = val;
            }
        }
        onSave(balances);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>통장 초기 잔액 설정</Text>

                    <ScrollView style={styles.listContainer}>
                        {accounts.map(account => (
                            <View key={account} style={styles.row}>
                                <Text style={styles.accountName}>{account}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0"
                                    value={balanceTexts[account] || ''}
                                    onChangeText={(text) => handleChange(account, text)}
                                    keyboardType="numeric"
                                />
                                <Text style={styles.unit}>원</Text>
                            </View>
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
        marginBottom: 20,
        textAlign: 'center',
    },
    listContainer: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    accountName: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 15,
        width: 140,
        textAlign: 'right',
    },
    unit: {
        fontSize: 14,
        color: '#666',
        marginLeft: 6,
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
