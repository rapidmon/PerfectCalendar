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
    saveCategories,
    saveOnboardingComplete,
} from '../utils/storage';

interface OnboardingScreenProps {
    onComplete: () => void;
}

const TOTAL_PAGES = 2;

const FEATURES = [
    { icon: '📅', title: '캘린더', desc: '날짜별로 일정과 지출을 한눈에', color: '#4A90E2' },
    { icon: '✅', title: '할 일', desc: '반복, 마감일, 특정일 할 일 관리', color: '#4CAF50' },
    { icon: '💰', title: '가계부', desc: '통장별 수입/지출 추적', color: '#FF9800' },
    { icon: '📈', title: '투자', desc: '한국/미국 주식 포트폴리오 관리', color: '#9C27B0' },
    { icon: '👨‍👩‍👧', title: '함께해요', desc: '가족/커플과 가계부 & 할 일 공유', color: '#E91E63' },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
    const [page, setPage] = useState(0);

    // 페이지 2 상태
    const [accounts, setAccounts] = useState<string[]>(['기본']);
    const [newAccount, setNewAccount] = useState('');
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
        setNewAccount('');
    };

    const handleDeleteAccount = (acc: string) => {
        setAccounts(prev => prev.filter(a => a !== acc));
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
        await saveCategories(categories);
        await saveOnboardingComplete();
        onComplete();
    };

    const renderPageDots = () => (
        <View style={styles.dotsContainer}>
            {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
                <View
                    key={i}
                    style={[styles.dot, i === page && styles.dotActive]}
                />
            ))}
        </View>
    );

    if (page === 0) {
        return (
            <View style={styles.container}>
                <ScrollView
                    style={styles.introScroll}
                    contentContainerStyle={styles.introScrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Image
                        source={require('../logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.appName}>PerfectCalendar</Text>
                    <Text style={styles.tagline}>당신의 완벽한 일상 관리</Text>
                    <Text style={styles.welcomeText}>환영합니다!</Text>

                    <View style={styles.featureList}>
                        {FEATURES.map((feature, index) => (
                            <View key={index} style={styles.featureItem}>
                                <View style={[styles.featureColorBar, { backgroundColor: feature.color }]} />
                                <Text style={styles.featureIcon}>{feature.icon}</Text>
                                <View style={styles.featureTextWrap}>
                                    <Text style={styles.featureTitle}>{feature.title}</Text>
                                    <Text style={styles.featureDesc}>{feature.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>

                {renderPageDots()}
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

            {renderPageDots()}
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
    introScroll: {
        flex: 1,
    },
    introScrollContent: {
        alignItems: 'center',
        paddingTop: 48,
        paddingBottom: 16,
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 12,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    tagline: {
        fontSize: 15,
        color: '#888',
        marginBottom: 20,
    },
    welcomeText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#4A90E2',
        marginBottom: 20,
    },
    featureList: {
        width: '100%',
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 14,
        overflow: 'hidden',
    },
    featureColorBar: {
        width: 4,
        height: '100%',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
    },
    featureIcon: {
        fontSize: 28,
        marginLeft: 8,
        marginRight: 14,
    },
    featureTextWrap: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: 13,
        color: '#666',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#DDD',
    },
    dotActive: {
        backgroundColor: '#4A90E2',
        width: 20,
        borderRadius: 4,
    },
    nextButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
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
