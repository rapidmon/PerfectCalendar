import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { Budget } from '../types/budget';

interface BudgetWidgetScreenProps {
    budgets: Budget[];
}

function formatKoreanCurrency(amount: number): string {
    return amount.toLocaleString('ko-KR') + '원';
}

export default function BudgetWidgetScreen({ budgets }: BudgetWidgetScreenProps) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const yearMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    const monthlyBudgets = budgets.filter(b => b.date.startsWith(yearMonth));

    const totalIncome = monthlyBudgets
        .filter(b => b.type === 'INCOME')
        .reduce((sum, b) => sum + b.money, 0);

    const totalExpense = monthlyBudgets
        .filter(b => b.type === 'EXPENSE')
        .reduce((sum, b) => sum + b.money, 0);

    return (
        <FlexWidget
            style={{
                flexDirection: 'column',
                backgroundColor: '#F5F5F5',
                borderRadius: 16,
                padding: 16,
                width: 'match_parent',
                height: 'match_parent',
            }}
        >
            <TextWidget
                text={`💰 ${currentMonth}월 가계부`}
                style={{
                    fontSize: 16,
                    color: '#333333',
                    marginBottom: 12,
                }}
            />

            <FlexWidget
                style={{
                    flex: 1,
                    width: 'match_parent',
                    justifyContent: 'center',
                }}
            >
                <TextWidget
                    text={`수입: +${formatKoreanCurrency(totalIncome)}`}
                    style={{
                        fontSize: 14,
                        color: '#4CAF50',
                        marginBottom: 4,
                    }}
                />

                <TextWidget
                    text={`지출: -${formatKoreanCurrency(totalExpense)}`}
                    style={{
                        fontSize: 14,
                        color: '#F44336',
                    }}
                />
            </FlexWidget>

            <FlexWidget
                clickAction="ADD_BUDGET"
                style={{
                    backgroundColor: '#4A90E2',
                    borderRadius: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                    width: 'match_parent',
                    marginTop: 8,
                }}
            >
                <TextWidget
                    text="내역 추가"
                    style={{
                        fontSize: 13,
                        color: '#FFFFFF',
                    }}
                />
            </FlexWidget>
        </FlexWidget>
    );
}
