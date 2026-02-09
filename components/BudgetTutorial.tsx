import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
    Modal,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type TutorialStep =
    | 'settings_button'      // 설정 버튼 하이라이트
    | 'goal_item'            // 지출 목표 설정 하이라이트
    | 'category_item'        // 카테고리 관리 하이라이트
    | 'account_item'         // 통장 관리 하이라이트
    | 'complete';            // 완료

export interface HighlightPosition {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface BudgetTutorialProps {
    visible: boolean;
    currentStep: TutorialStep;
    highlightPosition: HighlightPosition | null;
    onStepAction: () => void;
    onSkip: () => void;
}

const STEP_MESSAGES: Record<TutorialStep, { title: string; description: string }> = {
    settings_button: {
        title: '가계부 설정',
        description: '여기서 가계부의 다양한 설정을\n관리할 수 있어요.\n\n⚙ 버튼을 눌러보세요!',
    },
    goal_item: {
        title: '지출 목표 설정',
        description: '매월 지출 목표 금액을 설정하면\n예산 관리가 더 쉬워져요.\n\n눌러서 확인해보세요!',
    },
    category_item: {
        title: '카테고리 관리',
        description: '식비, 교통비 등 지출 카테고리를\n자유롭게 추가하고 관리할 수 있어요.\n\n눌러서 확인해보세요!',
    },
    account_item: {
        title: '통장 관리',
        description: '사용하는 통장들을 등록하면\n통장별 잔액 관리가 가능해요.\n\n눌러서 확인해보세요!',
    },
    complete: {
        title: '',
        description: '',
    },
};

const PADDING = 8;

export default function BudgetTutorial({
    visible,
    currentStep,
    highlightPosition,
    onStepAction,
    onSkip,
}: BudgetTutorialProps) {
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [visible, fadeAnim]);

    if (!visible || currentStep === 'complete' || !highlightPosition) {
        return null;
    }

    const message = STEP_MESSAGES[currentStep];

    // 하이라이트 영역 계산 (패딩 포함)
    const holeX = highlightPosition.x - PADDING;
    const holeY = highlightPosition.y - PADDING;
    const holeWidth = highlightPosition.width + PADDING * 2;
    const holeHeight = highlightPosition.height + PADDING * 2;

    // 설명 박스 위치 계산
    const isUpperHalf = holeY < SCREEN_HEIGHT / 2;
    const tooltipTop = isUpperHalf
        ? holeY + holeHeight + 20
        : undefined;
    const tooltipBottom = isUpperHalf
        ? undefined
        : SCREEN_HEIGHT - holeY + 20;

    // 스텝 번호 계산
    const stepNumber = currentStep === 'settings_button' ? 1
        : currentStep === 'goal_item' ? 2
        : currentStep === 'category_item' ? 3
        : 4;

    return (
        <Modal visible={visible} transparent animationType="none">
        <Animated.View
            style={[styles.container, { opacity: fadeAnim }]}
            pointerEvents="box-none"
        >
            {/* 상단 오버레이 */}
            <View
                style={[
                    styles.overlay,
                    { top: 0, left: 0, right: 0, height: holeY }
                ]}
            />

            {/* 좌측 오버레이 */}
            <View
                style={[
                    styles.overlay,
                    { top: holeY, left: 0, width: holeX, height: holeHeight }
                ]}
            />

            {/* 우측 오버레이 */}
            <View
                style={[
                    styles.overlay,
                    {
                        top: holeY,
                        left: holeX + holeWidth,
                        right: 0,
                        height: holeHeight
                    }
                ]}
            />

            {/* 하단 오버레이 */}
            <View
                style={[
                    styles.overlay,
                    {
                        top: holeY + holeHeight,
                        left: 0,
                        right: 0,
                        bottom: 0
                    }
                ]}
            />

            {/* 하이라이트 테두리 */}
            <View
                style={[
                    styles.highlightBorder,
                    {
                        top: holeY,
                        left: holeX,
                        width: holeWidth,
                        height: holeHeight,
                    }
                ]}
            />

            {/* 하이라이트 영역 터치 감지 */}
            <TouchableOpacity
                style={[
                    styles.highlightTouchArea,
                    {
                        top: holeY,
                        left: holeX,
                        width: holeWidth,
                        height: holeHeight,
                    }
                ]}
                activeOpacity={0.8}
                onPress={onStepAction}
            />

            {/* 설명 박스 */}
            <View
                style={[
                    styles.tooltip,
                    {
                        top: tooltipTop,
                        bottom: tooltipBottom,
                    }
                ]}
            >
                <View style={styles.stepIndicator}>
                    <Text style={styles.stepText}>{stepNumber} / 4</Text>
                </View>
                <Text style={styles.tooltipTitle}>{message.title}</Text>
                <Text style={styles.tooltipDescription}>{message.description}</Text>

                <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                    <Text style={styles.skipButtonText}>튜토리얼 건너뛰기</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    overlay: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
    },
    highlightBorder: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: '#4A90E2',
        borderRadius: 12,
        backgroundColor: 'transparent',
    },
    highlightTouchArea: {
        position: 'absolute',
        backgroundColor: 'transparent',
    },
    tooltip: {
        position: 'absolute',
        left: 24,
        right: 24,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    stepIndicator: {
        position: 'absolute',
        top: -12,
        right: 20,
        backgroundColor: '#4A90E2',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    stepText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    tooltipTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    tooltipDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },
    skipButton: {
        marginTop: 16,
        alignSelf: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    skipButtonText: {
        fontSize: 13,
        color: '#999',
        textDecorationLine: 'underline',
    },
});
