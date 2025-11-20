import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Todo, TodoType } from '../types/todo';

interface AddTodoModalProps {
    visible: boolean;
    selectedDate: Date;
    editingTodo?: Todo | null;
    onClose: () => void;
    onAdd: (title: string, type: TodoType, customDate?: Date) => void;
    onUpdate?: (id: string, title: string, type: TodoType, customDate?: Date) => void;
}

export default function AddTodoModal({ visible, selectedDate, editingTodo, onClose, onAdd, onUpdate }: AddTodoModalProps) {
    const [title, setTitle] = useState('');
    const [selectedType, setSelectedType] = useState<TodoType>('SPECIFIC');
    const [customDate, setCustomDate] = useState<Date>(selectedDate);
    const [customDay, setCustomDay] = useState<number>(1);
    const [customWeekday, setCustomWeekday] = useState<string>('월');

    // 편집 모드일 때 기존 데이터 채우기
    useEffect(() => {
        if (editingTodo) {
        setTitle(editingTodo.title);
        setSelectedType(editingTodo.type);
        
        // 타입별로 날짜 복원
        if (editingTodo.type === 'RECURRING' && editingTodo.recurringDay) {
            setCustomWeekday(editingTodo.recurringDay);
        } else if (editingTodo.type === 'MONTHLY_RECURRING' && editingTodo.monthlyRecurringDay) {
            setCustomDay(editingTodo.monthlyRecurringDay);
        } else if (editingTodo.type === 'DEADLINE' && editingTodo.deadline) {
            setCustomDate(new Date(editingTodo.deadline));
        } else if (editingTodo.type === 'SPECIFIC' && editingTodo.specificDate) {
            setCustomDate(new Date(editingTodo.specificDate));
        }
        } else {
            setCustomDate(selectedDate);
            const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][selectedDate.getDay()];
            setCustomWeekday(dayOfWeek);
            setCustomDay(selectedDate.getDate());
        }
    }, [editingTodo, selectedDate, visible]);

    const todoTypes: { type: TodoType; label: string; }[] = [
        { type: 'RECURRING', label: '주간 반복' },
        { type: 'MONTHLY_RECURRING', label: '월간 반복' },
        { type: 'DEADLINE', label: '기한' },
        { type: 'SPECIFIC', label: '특정일' },
    ];

    const weekdays = ['월', '화', '수', '목', '금', '토', '일'];
    const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);

    const getTypeDescription = () => {
        switch (selectedType) {
        case 'RECURRING':
            return `매주 ${customWeekday}요일마다 반복`;
        case 'MONTHLY_RECURRING':
            return `매달 ${customDay}일마다 반복`;
        case 'DEADLINE':
            return `${customDate.getMonth() + 1}월 ${customDate.getDate()}일까지 완료`;
        case 'SPECIFIC':
            return `${customDate.getMonth() + 1}월 ${customDate.getDate()}일에만 표시`;
        default:
            return '';
        }
    };

    const handleSave = () => {
        if (title.trim()) {
        if (editingTodo && onUpdate) {
            // 수정 모드
            let dateToUse: Date | undefined;
            
            if (selectedType === 'DEADLINE' || selectedType === 'SPECIFIC') {
            dateToUse = customDate;
            } else if (selectedType === 'MONTHLY_RECURRING') {
            dateToUse = new Date(customDate.getFullYear(), customDate.getMonth(), customDay);
            } else if (selectedType === 'RECURRING') {
            // 요일은 날짜로 변환 불필요
            dateToUse = undefined;
            }
            
            onUpdate(editingTodo.id, title.trim(), selectedType, dateToUse);
        } else {
            // 추가 모드
            let dateToUse: Date | undefined;
            
            if (selectedType === 'DEADLINE' || selectedType === 'SPECIFIC') {
            dateToUse = customDate;
            } else if (selectedType === 'MONTHLY_RECURRING') {
            dateToUse = new Date(customDate.getFullYear(), customDate.getMonth(), customDay);
            }
            
            onAdd(title.trim(), selectedType, dateToUse);
        }
        handleCancel();
        }
    };

    const handleCancel = () => {
        setTitle('');
        setSelectedType('SPECIFIC');
        setCustomDate(selectedDate);
        onClose();
    };

    // 날짜 변경 핸들러
    const handleDateChange = (days: number) => {
        const newDate = new Date(customDate);
        newDate.setDate(customDate.getDate() + days);
        setCustomDate(newDate);
    };

    return (
        <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        >
        <View style={styles.overlay}>
            <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
                {editingTodo ? '할 일 수정' : '할 일 추가'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* 제목 입력 */}
                <TextInput
                style={styles.input}
                placeholder="할 일 제목"
                value={title}
                onChangeText={setTitle}
                autoFocus={!editingTodo}
                />

                {/* 타입 선택 */}
                <Text style={styles.label}>반복 유형</Text>
                <View style={styles.typeContainer}>
                {todoTypes.map((item) => (
                    <TouchableOpacity
                    key={item.type}
                    style={[
                        styles.typeButton,
                        selectedType === item.type && styles.typeButtonSelected,
                    ]}
                    onPress={() => setSelectedType(item.type)}
                    >
                    <Text
                        style={[
                        styles.typeLabel,
                        selectedType === item.type && styles.typeLabelSelected,
                        ]}
                    >
                        {item.label}
                    </Text>
                    </TouchableOpacity>
                ))}
                </View>

                {/* 날짜/요일 선택 */}
                {selectedType === 'RECURRING' && (
                <View style={styles.datePickerContainer}>
                    <Text style={styles.label}>요일 선택</Text>
                    <View style={styles.weekdayContainer}>
                    {weekdays.map((day) => (
                        <TouchableOpacity
                        key={day}
                        style={[
                            styles.weekdayButton,
                            customWeekday === day && styles.weekdayButtonSelected,
                        ]}
                        onPress={() => setCustomWeekday(day)}
                        >
                        <Text
                            style={[
                            styles.weekdayText,
                            customWeekday === day && styles.weekdayTextSelected,
                            ]}
                        >
                            {day}
                        </Text>
                        </TouchableOpacity>
                    ))}
                    </View>
                </View>
                )}

                {selectedType === 'MONTHLY_RECURRING' && (
                <View style={styles.datePickerContainer}>
                    <Text style={styles.label}>날짜 선택 (일)</Text>
                    <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.monthDayScroll}
                    >
                    {monthDays.map((day) => (
                        <TouchableOpacity
                        key={day}
                        style={[
                            styles.monthDayButton,
                            customDay === day && styles.monthDayButtonSelected,
                        ]}
                        onPress={() => setCustomDay(day)}
                        >
                        <Text
                            style={[
                            styles.monthDayText,
                            customDay === day && styles.monthDayTextSelected,
                            ]}
                        >
                            {day}
                        </Text>
                        </TouchableOpacity>
                    ))}
                    </ScrollView>
                </View>
                )}

                {( editingTodo && (selectedType === 'DEADLINE' || selectedType === 'SPECIFIC')) && (
                    <View style={styles.datePickerContainer}>
                        <Text style={styles.label}>날짜 선택</Text>
                        <View style={styles.dateNavigator}>
                        <TouchableOpacity
                            style={styles.dateNavButton}
                            onPress={() => handleDateChange(-1)}
                        >
                            <Text style={styles.dateNavText}>◀</Text>
                        </TouchableOpacity>
                        
                        <Text style={styles.dateDisplay}>
                            {customDate.getFullYear()}년 {customDate.getMonth() + 1}월 {customDate.getDate()}일
                        </Text>
                        
                        <TouchableOpacity
                            style={styles.dateNavButton}
                            onPress={() => handleDateChange(1)}
                        >
                            <Text style={styles.dateNavText}>▶</Text>
                        </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* 설명 */}
                <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionText}>{getTypeDescription()}</Text>
                </View>
            </ScrollView>

            {/* 버튼 */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                style={[styles.addButton, !title.trim() && styles.addButtonDisabled]}
                onPress={handleSave}
                disabled={!title.trim()}
                >
                <Text style={styles.addButtonText}>
                    {editingTodo ? '수정' : '추가'}
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
        width: '85%',
        maxWidth: 400,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
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
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 10,
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
    },
    typeButton: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeButtonSelected: {
        backgroundColor: '#E3F2FD',
        borderColor: '#4A90E2',
    },
    typeIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    typeLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    typeLabelSelected: {
        color: '#4A90E2',
        fontWeight: 'bold',
    },
    datePickerContainer: {
        marginBottom: 16,
    },
    weekdayContainer: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    weekdayButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    weekdayButtonSelected: {
        backgroundColor: '#E3F2FD',
        borderColor: '#4A90E2',
    },
    weekdayText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    weekdayTextSelected: {
        color: '#4A90E2',
        fontWeight: 'bold',
    },
    monthDayScroll: {
        flexDirection: 'row',
    },
    monthDayButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    monthDayButtonSelected: {
        backgroundColor: '#E3F2FD',
        borderColor: '#4A90E2',
    },
    monthDayText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    monthDayTextSelected: {
        color: '#4A90E2',
        fontWeight: 'bold',
    },
    dateNavigator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
    },
    dateNavButton: {
        padding: 8,
    },
    dateNavText: {
        fontSize: 18,
        color: '#4A90E2',
        fontWeight: 'bold',
    },
    dateDisplay: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    descriptionContainer: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
    },
    descriptionText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
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
    addButton: {
        flex: 1,
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
    },
    addButtonDisabled: {
        backgroundColor: '#ccc',
    },
    addButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
});