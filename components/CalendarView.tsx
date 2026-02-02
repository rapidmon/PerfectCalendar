import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';

interface CalendarViewProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// Module-level constants - avoids recreating on every render
const PICKER_YEARS = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 50 + i);
const PICKER_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
    return new Date(year, month - 1, 1).getDay();
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

function isToday(year: number, month: number, day: number): boolean {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() + 1 === month && now.getDate() === day;
}

export default function CalendarView({ selectedDate, onDateChange }: CalendarViewProps) {
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerType, setPickerType] = useState<'year' | 'month'>('year');

    const currentYear = selectedDate.getFullYear();
    const currentMonth = selectedDate.getMonth() + 1;

    const calendarRows = useMemo(() => {
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
        const rows: (number | null)[][] = [];
        let row: (number | null)[] = [];

        for (let i = 0; i < firstDay; i++) {
            row.push(null);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            row.push(day);
            if (row.length === 7) {
                rows.push(row);
                row = [];
            }
        }
        if (row.length > 0) {
            while (row.length < 7) row.push(null);
            rows.push(row);
        }
        return rows;
    }, [currentYear, currentMonth]);

    const goToPrevMonth = () => {
        if (currentMonth === 1) {
            onDateChange(new Date(currentYear - 1, 11, 1));
        } else {
            onDateChange(new Date(currentYear, currentMonth - 2, 1));
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 12) {
            onDateChange(new Date(currentYear + 1, 0, 1));
        } else {
            onDateChange(new Date(currentYear, currentMonth, 1));
        }
    };

    const openPicker = (type: 'year' | 'month') => {
        setPickerType(type);
        setPickerVisible(true);
    };

    const years = PICKER_YEARS;
    const months = PICKER_MONTHS;

    const handlePickerSelect = (value: number) => {
        if (pickerType === 'year') {
            onDateChange(new Date(value, currentMonth - 1, 1));
        } else {
            onDateChange(new Date(currentYear, value - 1, 1));
        }
        setPickerVisible(false);
    };

    return (
        <View style={styles.container}>
            {/* 헤더: 화살표 + 연/월 선택 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={goToPrevMonth} style={styles.arrowBtn}>
                    <Text style={styles.arrowText}>◀</Text>
                </TouchableOpacity>
                <View style={styles.titleRow}>
                    <TouchableOpacity onPress={() => openPicker('year')} style={styles.titleBtn}>
                        <Text style={styles.titleText}>{currentYear}년</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openPicker('month')} style={styles.titleBtn}>
                        <Text style={styles.titleText}>{currentMonth}월</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={goToNextMonth} style={styles.arrowBtn}>
                    <Text style={styles.arrowText}>▶</Text>
                </TouchableOpacity>
            </View>

            {/* 요일 헤더 */}
            <View style={styles.weekRow}>
                {DAY_LABELS.map((label, i) => (
                    <View key={i} style={styles.weekCell}>
                        <Text style={[
                            styles.weekText,
                            i === 0 && styles.sundayText,
                            i === 6 && styles.saturdayText,
                        ]}>{label}</Text>
                    </View>
                ))}
            </View>

            {/* 날짜 그리드 */}
            <View>
                {calendarRows.map((row, rowIdx) => (
                    <View key={rowIdx} style={styles.dayRow}>
                        {row.map((day, colIdx) => {
                            if (day === null) {
                                return <View key={colIdx} style={styles.dayCell} />;
                            }
                            const date = new Date(currentYear, currentMonth - 1, day);
                            const selected = isSameDay(date, selectedDate);
                            const today = isToday(currentYear, currentMonth, day);

                            return (
                                <TouchableOpacity
                                    key={colIdx}
                                    style={styles.dayCell}
                                    onPress={() => onDateChange(date)}
                                    activeOpacity={0.6}
                                >
                                    <View style={[
                                        styles.dayInner,
                                        selected && styles.daySelected,
                                    ]}>
                                        <Text style={[
                                            styles.dayText,
                                            colIdx === 0 && styles.sundayText,
                                            colIdx === 6 && styles.saturdayText,
                                            today && !selected && styles.todayText,
                                            selected && styles.daySelectedText,
                                        ]}>{day}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>

            {/* 연/월 선택 모달 */}
            <PickerModal
                visible={pickerVisible}
                type={pickerType}
                items={pickerType === 'year' ? years : months}
                selectedValue={pickerType === 'year' ? currentYear : currentMonth}
                onSelect={handlePickerSelect}
                onClose={() => setPickerVisible(false)}
            />
        </View>
    );
}

interface PickerModalProps {
    visible: boolean;
    type: 'year' | 'month';
    items: number[];
    selectedValue: number;
    onSelect: (value: number) => void;
    onClose: () => void;
}

function PickerModal({ visible, type, items, selectedValue, onSelect, onClose }: PickerModalProps) {
    const scrollViewRef = React.useRef<ScrollView>(null);

    const handleLayout = () => {
        const idx = items.indexOf(selectedValue);
        if (idx !== -1 && scrollViewRef.current) {
            const itemHeight = 48;
            const visibleHeight = 300;
            const offset = (idx * itemHeight) - (visibleHeight / 2) + (itemHeight / 2);
            scrollViewRef.current.scrollTo({ y: Math.max(0, offset), animated: false });
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>
                        {type === 'year' ? '연도 선택' : '월 선택'}
                    </Text>
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.modalScroll}
                        onLayout={handleLayout}
                        showsVerticalScrollIndicator={true}
                    >
                        {items.map(item => (
                            <TouchableOpacity
                                key={item}
                                style={[
                                    styles.modalItem,
                                    item === selectedValue && styles.modalItemSelected,
                                ]}
                                onPress={() => onSelect(item)}
                            >
                                <Text style={[
                                    styles.modalItemText,
                                    item === selectedValue && styles.modalItemTextSelected,
                                ]}>
                                    {type === 'year' ? `${item}년` : `${item}월`}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    arrowBtn: {
        padding: 8,
    },
    arrowText: {
        fontSize: 16,
        color: '#333',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    titleBtn: {
        paddingHorizontal: 4,
        paddingVertical: 4,
    },
    titleText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    weekRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 6,
        marginBottom: 2,
    },
    weekCell: {
        flex: 1,
        alignItems: 'center',
    },
    weekText: {
        fontSize: 13,
        color: '#999',
        fontWeight: '600',
    },
    dayRow: {
        flexDirection: 'row',
    },
    dayCell: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 2,
    },
    dayInner: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    daySelected: {
        backgroundColor: '#4A90E2',
    },
    dayText: {
        fontSize: 15,
        color: '#333',
    },
    daySelectedText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    todayText: {
        color: '#0f7dfa',
        fontWeight: 'bold',
    },
    sundayText: {
        color: '#F44336',
    },
    saturdayText: {
        color: '#2196F3',
    },
    // 모달
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '60%',
        maxWidth: 280,
        maxHeight: '60%',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 12,
    },
    modalScroll: {
        maxHeight: 300,
    },
    modalItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalItemSelected: {
        backgroundColor: '#E3F2FD',
    },
    modalItemText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#333',
    },
    modalItemTextSelected: {
        color: '#4A90E2',
        fontWeight: 'bold',
    },
});
