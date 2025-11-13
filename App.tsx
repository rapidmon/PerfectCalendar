import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import CalendarView from './components/CalendarView';
import TodoList from './components/TodoList';
import BudgetList from './components/BudgetList';
import { useState } from 'react';

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfect Calendar</Text>
      <View style={styles.calendarSection}>
        <CalendarView 
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </View>
      <View style={styles.listSection}>
        <TodoList selectedDate={selectedDate}/>
      </View>
      <View style={styles.listSection}>
        <BudgetList selectedDate={selectedDate}/>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 0,
    color: '#333',
  },
  calendarSection: {
    flex: 1.7,
  },
  listSection: {
    flex: 1,
  },
});