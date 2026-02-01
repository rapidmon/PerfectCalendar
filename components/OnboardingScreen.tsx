import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import {
    saveAccounts,
    saveAccountBalances,
    saveCategories,
    saveOnboardingComplete,
} from '../utils/storage';
import { AccountBalances } from '../types/budget';

interface OnboardingScreenProps {
    onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
    const [page, setPage] = useState(0);

    // 페이지 2 상태
    const [accounts, setAccounts] = useState<string[]>(['기본']);
    const [newAccount, setNewAccount] = useState('');
    const [balances, setBalances] = useState<AccountBalances>({ '기본': 0 });
    const [categories, setCategories] = useState<string[]>(['식비', '저축']);
    const [newCategory, setNewCategory] = useState('');

    const handleAddAccount = () => {
        const trimmed = newAccount.trim();
        if (!trimmed) return;
        if (accounts.includes(trimmed)) {
            Alert.alert('알림', '이미 존재하는 통장입니다.');
            return;
        }
        setAccounts(prev => [...prev, trimmed]);
        setBalances(prev => ({ ...prev, [trimmed]: 0 }));
        setNewAccount('');
    };

    const handleDeleteAccount = (acc: string) => {
        setAccounts(prev => prev.filter(a => a !== acc));
        setBalances(prev => {
            const next = { ...prev };
            delete next[acc];
            return next;
        });
    };

    const handleBalanceChange = (acc: string, value: string) => {
        const num = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
        setBalances(prev => ({ ...prev, [acc]: num }));
    };

    const handleAddCategory = () => {
        const trimmed = newCategory.trim();
        if (!trimmed) return;
        if (categories.includes(trimmed)) {
            Alert.alert('알림', '이미 존재하는 카테고리입니다.');
            return;
        }
        setCategories(prev => [...prev, trimmed]);
        setNewCategory('');
    };

    const handleDeleteCategory = (cat: string) => {
        setCategories(prev => prev.filter(c => c !== cat));
    };

    const handleFinish = async () => {
        if (accounts.length === 0) {
            Alert.alert('알림', '통장을 최소 1개 이상 추가해주세요.');
            return;
        }
        if (categories.length === 0) {
            Alert.alert('알림', '카테고리를 최소 1개 이상 추가해주세요.');
            return;
        }
        await saveAccounts(accounts);
        await saveAccountBalances(balances);
        await saveCategories(categories);
        await saveOnboardingComplete();
        onComplete();
    };

    if (page === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.introContent}>
                    <Image
                        source={require('../logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.appName}>PerfectCalendar</Text>

                    <View style={styles.featureList}>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>📅</Text>
                            <View style={styles.featureTextWrap}>
                                <Text style={styles.featureTitle}>캘린더</Text>
                                <Text style={styles.featureDesc}>날짜별로 일정과 지출을 한눈에</Text>
                            </View>
                        </View>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>✅</Text>
                            <View style={styles.featureTextWrap}>
                                <Text style={styles.featureTitle}>할 일</Text>
                                <Text style={styles.featureDesc}>반복, 마감일, 특정일 할 일 관리</Text>
                            </View>
                        </View>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>💰</Text>
                            <View style={styles.featureTextWrap}>
                                <Text style={styles.featureTitle}>가계부</Text>
                                <Text style={styles.featureDesc}>통장별 수입/지출 추적</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.nextButton} onPress={() => setPage(1)}>
                    <Text style={styles.nextButtonText}>다음</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView style={styles.setupScroll} contentContainerStyle={styles.setupScrollContent}>
                <Text style={styles.setupTitle}>초기 설정</Text>

                {/* 통장 관리 */}
                <Text style={styles.sectionTitle}>통장 관리</Text>
                <View style={styles.addRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="새 통장 이름"
                        value={newAccount}
                        onChangeText={setNewAccount}
                        onSubmitEditing={handleAddAccount}
                    />
                    <TouchableOpacity style={styles.addBtn} onPress={handleAddAccount}>
                        <Text style={styles.addBtnText}>추가</Text>
                    </TouchableOpacity>
                </View>
                {accounts.map(acc => (
                    <View key={acc} style={styles.accountRow}>
                        <View style={styles.accountInfo}>
                            <Text style={styles.itemText}>{acc}</Text>
                            <TouchableOpacity onPress={() => handleDeleteAccount(acc)}>
                                <Text style={styles.deleteText}>삭제</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.balanceRow}>
                            <TextInput
                                style={styles.balanceInput}
                                placeholder="초기 잔액"
                                keyboardType="numeric"
                                value={balances[acc] ? String(balances[acc]) : ''}
                                onChangeText={(v) => handleBalanceChange(acc, v)}
                            />
                            <Text style={styles.wonText}>원</Text>
                        </View>
                    </View>
                ))}
                {accounts.length === 0 && (
                    <Text style={styles.emptyText}>통장이 없습니다</Text>
                )}

                {/* 카테고리 관리 */}
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>지출 카테고리 관리</Text>
                <View style={styles.addRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="새 카테고리"
                        value={newCategory}
                        onChangeText={setNewCategory}
                        onSubmitEditing={handleAddCategory}
                    />
                    <TouchableOpacity style={styles.addBtn} onPress={handleAddCategory}>
                        <Text style={styles.addBtnText}>추가</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.chipContainer}>
                    {categories.map(cat => (
                        <View key={cat} style={styles.chip}>
                            <Text style={styles.chipText}>{cat}</Text>
                            <TouchableOpacity onPress={() => handleDeleteCategory(cat)}>
                                <Text style={styles.chipDelete}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
                {categories.length === 0 && (
                    <Text style={styles.emptyText}>카테고리가 없습니다</Text>
                )}
            </ScrollView>

            <TouchableOpacity style={styles.nextButton} onPress={handleFinish}>
                <Text style={styles.nextButtonText}>시작하기</Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    introContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 16,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 40,
    },
    featureList: {
        width: '100%',
        gap: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
    },
    featureIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    featureTextWrap: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    featureDesc: {
        fontSize: 14,
        color: '#666',
    },
    nextButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    setupScroll: {
        flex: 1,
    },
    setupScrollContent: {
        paddingBottom: 20,
    },
    setupTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 24,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
    },
    addRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 15,
    },
    addBtn: {
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    addBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    accountRow: {
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    accountInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '600',
    },
    deleteText: {
        fontSize: 13,
        color: '#F44336',
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    balanceInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 8,
        fontSize: 15,
        backgroundColor: '#fff',
        textAlign: 'right',
    },
    wonText: {
        fontSize: 15,
        color: '#666',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F0FE',
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 12,
        gap: 6,
    },
    chipText: {
        fontSize: 14,
        color: '#4A90E2',
        fontWeight: '500',
    },
    chipDelete: {
        fontSize: 14,
        color: '#999',
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 14,
        paddingVertical: 12,
    },
});
