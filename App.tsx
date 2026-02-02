import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import CalendarView from './components/CalendarView';
import TodoList from './components/TodoList';
import BudgetList from './components/BudgetList';
import TodoFullList from './components/TodoFullList';
import BudgetFullList from './components/BudgetFullList';
import OnboardingScreen from './components/OnboardingScreen';
import { AppDataProvider, useAppData } from './contexts/AppDataContext';
import { useState, useEffect } from 'react';
import { loadOnboardingComplete } from './utils/storage';

type TabType = 'home' | 'todo' | 'budget';

export default function App() {
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    loadOnboardingComplete().then(setOnboardingComplete);
  }, []);

  if (onboardingComplete === null) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      </SafeAreaProvider>
    );
  }

  if (!onboardingComplete) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <OnboardingScreen onComplete={() => setOnboardingComplete(true)} />
        </SafeAreaView>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppDataProvider>
        <AppContent />
      </AppDataProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { isLoaded } = useAppData();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabType>('home');

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      </SafeAreaView>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            <View style={styles.calendarSection}>
              <CalendarView
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </View>
            <View style={styles.listsContainer}>
              <View style={styles.listSection}>
                <TodoList selectedDate={selectedDate} />
              </View>
              <View style={styles.listSection}>
                <BudgetList selectedDate={selectedDate} />
              </View>
            </View>
          </>
        );
      case 'todo':
        return <TodoFullList selectedDate={selectedDate} />;
      case 'budget':
        return <BudgetFullList selectedDate={selectedDate} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {renderContent()}
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('todo')}
        >
          <Text style={[styles.tabIcon, activeTab === 'todo' && styles.tabIconActive]}>✅</Text>
          <Text style={[styles.tabLabel, activeTab === 'todo' && styles.tabLabelActive]}>할 일</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('home')}
        >
          <Text style={[styles.tabIcon, activeTab === 'home' && styles.tabIconActive]}>🏠</Text>
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>홈</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('budget')}
        >
          <Text style={[styles.tabIcon, activeTab === 'budget' && styles.tabIconActive]}>💰</Text>
          <Text style={[styles.tabLabel, activeTab === 'budget' && styles.tabLabelActive]}>가계부</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  calendarSection: {
    zIndex: 10,
  },
  listsContainer: {
    flex: 1,
    gap: 8,
    marginTop: 4,
  },
  listSection: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#4A90E2',
    fontWeight: '700',
  },
});
