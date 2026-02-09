import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
} from 'react-native';

export type TutorialStep = 0 | 1 | 2 | 3 | 4; // 0: 설정버튼, 1: 목표, 2: 카테고리, 3: 통장, 4: 완료

interface BudgetTutorialProps {
    visible: boolean;
    step: TutorialStep;
    onNext: () => void;
    onSkip: () => void;
}

const STEP_INFO = [
    {
        title: '가계부 설정',
        description: '여기서 가계부의 다양한 설정을 관리할 수 있어요.',
        action: '⚙ 버튼을 눌러보세요!',
    },
    {
        title: '지출 목표 설정',
        description: '매월 지출 목표 금액을 설정하면 예산 관리가 더 쉬워져요.',
        action: '다음',
    },
    {
        title: '카테고리 관리',
        description: '식비, 교통비 등 지출 카테고리를 자유롭게 추가하고 관리할 수 있어요.',
        action: '다음',
    },
    {
        title: '통장 관리',
        description: '사용하는 통장들을 등록하면 통장별 잔액 관리가 가능해요.',
        action: '완료',
    },
];

export default function BudgetTutorial({
    visible,
    step,
    onNext,
    onSkip,
}: BudgetTutorialProps) {
    if (!visible || step >= 4) return null;

    const info = STEP_INFO[step];

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.stepBadge}>
                        <Text style={styles.stepText}>{step + 1} / 4</Text>
                    </View>

                    <Text style={styles.title}>{info.title}</Text>
                    <Text style={styles.description}>{info.description}</Text>

                    <TouchableOpacity style={styles.nextButton} onPress={onNext}>
                        <Text style={styles.nextButtonText}>{info.action}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                        <Text style={styles.skipButtonText}>건너뛰기</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
    },
    stepBadge: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 16,
    },
    stepText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        color: '#666',
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 24,
    },
    nextButton: {
        backgroundColor: '#4A90E2',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    skipButton: {
        marginTop: 12,
        paddingVertical: 8,
    },
    skipButtonText: {
        color: '#999',
        fontSize: 14,
    },
});
