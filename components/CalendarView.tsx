import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Dropdown from './Dropdown';

export default function CalendarView() {
    const today = new Date();
    const [selectedDate, setSelectedDate] = useState(today);
    const [showYearDropdown, setShowYearDropdown] = useState(false);
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);

    const currentYear = selectedDate.getFullYear();
    const currentMonth = selectedDate.getMonth() + 1;

    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    // 연도 목록
    const years = Array.from({ length: 100 }, (_, i) => today.getFullYear() - 50 + i).map(year => ({
        value: year,
        label: `${year}년`
    }));
    
    // 월 목록
    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: `${i + 1}월`
    }));

    const selectYear = (year: number) => {
        const newDate = new Date(year, currentMonth - 1, 1);
        setSelectedDate(newDate);
        setShowYearDropdown(false);
    };

    const selectMonth = (month: number) => {
        const newDate = new Date(currentYear, month - 1, 1);
        setSelectedDate(newDate);
        setShowMonthDropdown(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => {
                    setShowYearDropdown(!showYearDropdown);
                    setShowMonthDropdown(false);
                }}
                >
                <Text style={styles.dropdownButtonText}>{currentYear}년</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => {
                    setShowMonthDropdown(!showMonthDropdown);
                    setShowYearDropdown(false);
                }}
                >
                <Text style={styles.dropdownButtonText}>{currentMonth}월</Text>
                </TouchableOpacity>
            </View>

            <Dropdown
                items={years}
                selectedValue={currentYear}
                onSelect={selectYear}
                isVisible={showYearDropdown}
                style={{ left: 20 }}
            />

            <Dropdown
                items={months}
                selectedValue={currentMonth}
                onSelect={selectMonth}
                isVisible={showMonthDropdown}
                style={{ right: 20 }}
            />

            <Calendar
                key={formatDate(selectedDate)}
                current={formatDate(selectedDate)}
                markedDates={{
                [formatDate(today)]: { selected: true, selectedColor: '#4A90E2' }
                }}
                theme={{
                todayTextColor: '#4A90E2',
                arrowColor: '#4A90E2',
                }}
                hideArrows={false}
                onMonthChange={(date) => {
                setSelectedDate(new Date(date.year, date.month - 1, 1));
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        gap: 10,
        marginBottom: 10,
        zIndex: 1000,
    },
    dropdownButton: {
        paddingHorizontal: 5,
        paddingVertical: 5,
    },
    dropdownButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
});