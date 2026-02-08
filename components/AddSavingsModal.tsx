import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Savings, SavingsType } from '../types/savings';

interface AddSavingsModalProps {
    visible: boolean;
    editingSavings?: Savings | null;
    onClose: () => void;
    onSave: (savings: Omit<Savings, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const BANK_OPTIONS = [
    '국민은행', '신한은행', '우리은행', '하나은행', 'NH농협',
    '카카오뱅크', '토스뱅크', 'SC제일', '기업은행', '새마을금고', '기타'
];

export default function AddSavingsModal({
    visible,
    editingSavings,
    onClose,
    onSave,
}: AddSavingsModalProps) {
    const [type, setType] = useState<SavingsType>('INSTALLMENT_SAVINGS');
    const [name, setName] = useState('');
    const [bankName, setBankName] = useState(BANK_OPTIONS[0]);
    const [interestRate, setInterestRate] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
    const [principal, setPrincipal] = useState('');
    const [monthlyAmount, setMonthlyAmount] = useState('');
    const [paymentDay, setPaymentDay] = useState('1');
    const [minMonthlyAmount, setMinMonthlyAmount] = useState('');
    const [maxMonthlyAmount, setMaxMonthlyAmount] = useState('');
    const [initialBalance, setInitialBalance] = useState('');
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    useEffect(() => {
        if (editingSavings) {
            setType(editingSavings.type);
            setName(editingSavings.name);
            setBankName(editingSavings.bankName);
            setInterestRate(String(editingSavings.interestRate));
            setStartDate(new Date(editingSavings.startDate));
            setEndDate(new Date(editingSavings.endDate));
            setPrincipal(editingSavings.principal ? String(editingSavings.principal) : '');
            setMonthlyAmount(editingSavings.monthlyAmount ? String(editingSavings.monthlyAmount) : '');
            setPaymentDay(editingSavings.paymentDay ? String(editingSavings.paymentDay) : '1');
            setMinMonthlyAmount(editingSavings.minMonthlyAmount ? String(editingSavings.minMonthlyAmount) : '');
            setMaxMonthlyAmount(editingSavings.maxMonthlyAmount ? String(editingSavings.maxMonthlyAmount) : '');
            setInitialBalance(editingSavings.initialBalance ? String(editingSavings.initialBalance) : '');
        } else {
            resetForm();
        }
    }, [editingSavings, visible]);

    const resetForm = () => {
        setType('INSTALLMENT_SAVINGS');
        setName('');
        setBankName(BANK_OPTIONS[0]);
        setInterestRate('');
        setStartDate(new Date());
        setEndDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
        setPrincipal('');
        setMonthlyAmount('');
        setPaymentDay('1');
        setMinMonthlyAmount('');
        setMaxMonthlyAmount('');
        setInitialBalance('');
    };

    const handleSave = () => {
        const rate = parseFloat(interestRate);
        if (!name.trim() || isNaN(rate) || rate <= 0) return;

        const initialBalanceNum = parseInt(initialBalance, 10) || 0;
        const linkedAccountName = `[${bankName}] ${name.trim()}`;

        if (type === 'FIXED_DEPOSIT') {
            const principalNum = parseInt(principal, 10);
            if (isNaN(principalNum) || principalNum <= 0) return;

            onSave({
                type,
                name: name.trim(),
                bankName,
                interestRate: rate,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                principal: principalNum,
                initialBalance: initialBalanceNum > 0 ? initialBalanceNum : undefined,
                linkedAccountName,
            });
        } else if (type === 'INSTALLMENT_SAVINGS') {
            const monthlyNum = parseInt(monthlyAmount, 10);
            const dayNum = parseInt(paymentDay, 10);
            if (isNaN(monthlyNum) || monthlyNum <= 0) return;
            if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) return;

            onSave({
                type,
                name: name.trim(),
                bankName,
                interestRate: rate,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                monthlyAmount: monthlyNum,
                paymentDay: dayNum,
                initialBalance: initialBalanceNum > 0 ? initialBalanceNum : undefined,
                linkedAccountName,
            });
        } else {
            // FREE_SAVINGS (자유적금)
            const minNum = parseInt(minMonthlyAmount, 10) || 0;
            const maxNum = parseInt(maxMonthlyAmount, 10) || 0;

            onSave({
                type,
                name: name.trim(),
                bankName,
                interestRate: rate,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                minMonthlyAmount: minNum > 0 ? minNum : undefined,
                maxMonthlyAmount: maxNum > 0 ? maxNum : undefined,
                initialBalance: initialBalanceNum > 0 ? initialBalanceNum : undefined,
                linkedAccountName,
            });
        }

        handleClose();
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const formatDate = (date: Date): string => {
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };

    const handleNumberInput = (text: string, setter: (value: string) => void) => {
        setter(text.replace(/[^0-9]/g, ''));
    };

    const handleRateInput = (text: string) => {
        // 소수점 한 개만 허용
        const cleaned = text.replace(/[^0-9.]/g, '');
        const parts = cleaned.split('.');
        if (parts.length > 2) return;
        if (parts.length === 2 && parts[1].length > 2) return;
        setInterestRate(cleaned);
    };

    const isValid = () => {
        const rate = parseFloat(interestRate);
        if (!name.trim() || isNaN(rate) || rate <= 0) return false;

        if (type === 'FIXED_DEPOSIT') {
            const principalNum = parseInt(principal, 10);
            return !isNaN(principalNum) && principalNum > 0;
        } else if (type === 'INSTALLMENT_SAVINGS') {
            const monthlyNum = parseInt(monthlyAmount, 10);
            const dayNum = parseInt(paymentDay, 10);
            return !isNaN(monthlyNum) && monthlyNum > 0 && dayNum >= 1 && dayNum <= 31;
        } else {
            // FREE_SAVINGS - 최소/최대 한도는 선택사항
            return true;
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>
                        {editingSavings ? '적금/예금 수정' : '적금/예금 추가'}
                    </Text>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* 유형 선택 */}
                        <Text style={styles.label}>유형</Text>
                        <View style={styles.typeContainer}>
                            <TouchableOpacity
                                style={[styles.typeButton, type === 'INSTALLMENT_SAVINGS' && styles.typeSelected]}
                                onPress={() => setType('INSTALLMENT_SAVINGS')}
                            >
                                <Text style={[styles.typeLabel, type === 'INSTALLMENT_SAVINGS' && styles.typeLabelSelected]}>
                                    정기적금
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeButton, type === 'FREE_SAVINGS' && styles.typeSelected]}
                                onPress={() => setType('FREE_SAVINGS')}
                            >
                                <Text style={[styles.typeLabel, type === 'FREE_SAVINGS' && styles.typeLabelSelected]}>
                                    자유적금
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeButton, type === 'FIXED_DEPOSIT' && styles.typeSelected]}
                                onPress={() => setType('FIXED_DEPOSIT')}
                            >
                                <Text style={[styles.typeLabel, type === 'FIXED_DEPOSIT' && styles.typeLabelSelected]}>
                                    정기예금
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* 상품명 */}
                        <TextInput
                            style={styles.input}
                            placeholder="상품명"
                            value={name}
                            onChangeText={setName}
                            autoFocus={!editingSavings}
                        />

                        {/* 은행 선택 */}
                        <Text style={styles.label}>은행</Text>
                        <View style={styles.bankContainer}>
                            {BANK_OPTIONS.map((bank) => (
                                <TouchableOpacity
                                    key={bank}
                                    style={[styles.bankButton, bankName === bank && styles.bankButtonSelected]}
                                    onPress={() => setBankName(bank)}
                                >
                                    <Text style={[styles.bankText, bankName === bank && styles.bankTextSelected]}>
                                        {bank}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* 금리 */}
                        <Text style={styles.label}>연 금리 (%)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="예: 3.5"
                            value={interestRate}
                            onChangeText={handleRateInput}
                            keyboardType="decimal-pad"
                        />

                        {/* 금액 입력 */}
                        {type === 'FIXED_DEPOSIT' ? (
                            <>
                                <Text style={styles.label}>원금</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="원금 입력"
                                    value={principal}
                                    onChangeText={(text) => handleNumberInput(text, setPrincipal)}
                                    keyboardType="numeric"
                                />
                            </>
                        ) : type === 'INSTALLMENT_SAVINGS' ? (
                            <>
                                <Text style={styles.label}>월 납입금</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="월 납입금 입력"
                                    value={monthlyAmount}
                                    onChangeText={(text) => handleNumberInput(text, setMonthlyAmount)}
                                    keyboardType="numeric"
                                />
                                <Text style={styles.label}>납입일 (매월)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="1~31"
                                    value={paymentDay}
                                    onChangeText={(text) => handleNumberInput(text, setPaymentDay)}
                                    keyboardType="numeric"
                                    maxLength={2}
                                />
                            </>
                        ) : (
                            <>
                                <Text style={styles.label}>월 최소 납입금 (선택)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="최소 금액 (없으면 비워두세요)"
                                    value={minMonthlyAmount}
                                    onChangeText={(text) => handleNumberInput(text, setMinMonthlyAmount)}
                                    keyboardType="numeric"
                                />
                                <Text style={styles.label}>월 최대 납입금 (선택)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="최대 금액 (없으면 비워두세요)"
                                    value={maxMonthlyAmount}
                                    onChangeText={(text) => handleNumberInput(text, setMaxMonthlyAmount)}
                                    keyboardType="numeric"
                                />
                            </>
                        )}

                        {/* 초기 잔액 - 기존에 납입한 금액 */}
                        <Text style={styles.label}>기존 납입 금액 (선택)</Text>
                        <Text style={styles.hintText}>이미 납입한 금액이 있으면 입력하세요</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            value={initialBalance}
                            onChangeText={(text) => handleNumberInput(text, setInitialBalance)}
                            keyboardType="numeric"
                        />

                        {/* 시작일 */}
                        <Text style={styles.label}>시작일</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowStartPicker(true)}
                        >
                            <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                        </TouchableOpacity>

                        {/* 만기일 */}
                        <Text style={styles.label}>만기일</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowEndPicker(true)}
                        >
                            <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                        </TouchableOpacity>

                        {showStartPicker && (
                            <DateTimePicker
                                value={startDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, date) => {
                                    setShowStartPicker(Platform.OS === 'ios');
                                    if (date) setStartDate(date);
                                }}
                            />
                        )}

                        {showEndPicker && (
                            <DateTimePicker
                                value={endDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, date) => {
                                    setShowEndPicker(Platform.OS === 'ios');
                                    if (date) setEndDate(date);
                                }}
                            />
                        )}
                    </ScrollView>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                            <Text style={styles.cancelButtonText}>취소</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveButton, !isValid() && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={!isValid()}
                        >
                            <Text style={styles.saveButtonText}>
                                {editingSavings ? '수정' : '추가'}
                            </Text>
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
        width: '90%',
        maxWidth: 400,
        maxHeight: '85%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
        marginTop: 8,
    },
    hintText: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
        marginTop: -4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 8,
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    typeButton: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeSelected: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
    },
    typeLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    typeLabelSelected: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    bankContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    bankButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#f5f5f5',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    bankButtonSelected: {
        backgroundColor: '#E3F2FD',
        borderColor: '#4A90E2',
    },
    bankText: {
        fontSize: 12,
        color: '#666',
    },
    bankTextSelected: {
        color: '#4A90E2',
        fontWeight: 'bold',
    },
    dateButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    dateText: {
        fontSize: 16,
        color: '#333',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
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
        backgroundColor: '#4CAF50',
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
});
