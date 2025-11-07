import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

interface DropdownItem {
  value: number;
  label: string;
}

interface DropdownProps {
  items: DropdownItem[];
  selectedValue: number;
  onSelect: (value: number) => void;
  isVisible: boolean;
  style?: any;
}

export default function Dropdown({ items, selectedValue, onSelect, isVisible, style }: DropdownProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isVisible && scrollViewRef.current) {
        const selectedIndex = items.findIndex(item => item.value === selectedValue);
        
        if (selectedIndex !== -1) {
        const itemHeight = 48;
        const visibleHeight = 250;
        const offset = (selectedIndex * itemHeight) - (visibleHeight / 2) + (itemHeight / 2);
        
        scrollViewRef.current?.scrollTo({
            y: Math.max(0, offset),
            animated: false
        });
        }
    }
    }, [isVisible, selectedValue, items]);

  if (!isVisible) return null;

  return (
    <View style={[styles.dropdownList, style]}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.dropdownScroll} 
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={true}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.dropdownItem,
              item.value === selectedValue && styles.dropdownItemSelected
            ]}
            onPress={() => onSelect(item.value)}
          >
            <Text style={[
              styles.dropdownItemText,
              item.value === selectedValue && styles.dropdownItemTextSelected
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownList: {
    position: 'absolute',
    top: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    width: 120,
    maxHeight: 250,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignSelf: 'center'
  },
  dropdownScroll: {
    maxHeight: 250,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  dropdownItemText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  dropdownItemTextSelected: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
});