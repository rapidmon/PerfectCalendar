import { Savings } from '../types/savings';

// 날짜 문자열을 Date 객체로 변환
const parseDate = (dateStr: string): Date => new Date(dateStr);

// 두 날짜 사이의 개월 수 계산
const getMonthsBetween = (start: Date, end: Date): number => {
    return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
};

// 오늘까지의 진행률 계산 (0~100)
export const getSavingsProgress = (savings: Savings): number => {
    const today = new Date();
    const start = parseDate(savings.startDate);
    const end = parseDate(savings.endDate);

    if (today <= start) return 0;
    if (today >= end) return 100;

    const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    return Math.round((elapsedDays / totalDays) * 100);
};

// 만기까지 남은 일수
export const getDaysRemaining = (savings: Savings): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = parseDate(savings.endDate);
    end.setHours(0, 0, 0, 0);

    const days = Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
};

// 현재까지 납입된 금액 계산 (적금)
export const getCurrentPaidAmount = (savings: Savings): number => {
    if (savings.type === 'FIXED_DEPOSIT') {
        return savings.principal || 0;
    }

    if (savings.type === 'FREE_SAVINGS') {
        // 자유적금은 초기 잔액만 반환 (실제 납입 내역은 가계부에서 별도 추적)
        return savings.initialBalance || 0;
    }

    // 정기적금의 경우 납입 횟수 계산
    const today = new Date();
    const start = parseDate(savings.startDate);
    const end = parseDate(savings.endDate);
    const monthlyAmount = savings.monthlyAmount || 0;

    if (today <= start) return savings.initialBalance || 0;

    // 총 납입 횟수 계산
    const totalMonths = getMonthsBetween(start, end);
    let paidMonths = getMonthsBetween(start, today);

    // 이번 달 납입일이 지났는지 확인
    const paymentDay = savings.paymentDay || 1;
    if (today.getDate() >= paymentDay) {
        paidMonths += 1;
    }

    paidMonths = Math.min(paidMonths, totalMonths);

    return paidMonths * monthlyAmount + (savings.initialBalance || 0);
};

// 예상 만기금액 계산 (단리)
export const getExpectedMaturityAmount = (savings: Savings): number => {
    const start = parseDate(savings.startDate);
    const end = parseDate(savings.endDate);
    const rate = savings.interestRate / 100;
    const totalMonths = getMonthsBetween(start, end);
    const years = totalMonths / 12;

    if (savings.type === 'FIXED_DEPOSIT') {
        // 정기예금: 원금 × (1 + 이율 × 기간)
        const principal = savings.principal || 0;
        return Math.round(principal * (1 + rate * years));
    } else if (savings.type === 'FREE_SAVINGS') {
        // 자유적금: 현재 잔액 기준으로 계산 (정확한 예측 불가)
        const currentBalance = savings.initialBalance || 0;
        return Math.round(currentBalance * (1 + rate * years));
    } else {
        // 정기적금: 월 납입금 × 납입횟수 + 이자
        // 단리 적금 이자 계산: 월 납입금 × (N × (N+1) / 2) × (월이율)
        const monthlyAmount = savings.monthlyAmount || 0;
        const principal = monthlyAmount * totalMonths + (savings.initialBalance || 0);
        const monthlyRate = rate / 12;
        const interest = monthlyAmount * (totalMonths * (totalMonths + 1) / 2) * monthlyRate;
        return Math.round(principal + interest);
    }
};

// 총 원금 계산
export const getTotalPrincipal = (savings: Savings): number => {
    if (savings.type === 'FIXED_DEPOSIT') {
        return savings.principal || 0;
    } else if (savings.type === 'FREE_SAVINGS') {
        return savings.initialBalance || 0;
    } else {
        const start = parseDate(savings.startDate);
        const end = parseDate(savings.endDate);
        const totalMonths = getMonthsBetween(start, end);
        return (savings.monthlyAmount || 0) * totalMonths + (savings.initialBalance || 0);
    }
};

// 예상 이자 금액 계산
export const getExpectedInterest = (savings: Savings): number => {
    return getExpectedMaturityAmount(savings) - getTotalPrincipal(savings);
};

// 적금 목록의 총 자산 계산
export const getTotalSavingsValue = (savingsList: Savings[]): number => {
    return savingsList.reduce((sum, s) => sum + getCurrentPaidAmount(s), 0);
};

// 적금 목록의 총 예상 만기금액 계산
export const getTotalExpectedMaturity = (savingsList: Savings[]): number => {
    return savingsList.reduce((sum, s) => sum + getExpectedMaturityAmount(s), 0);
};

// 다음 납입일 계산 (적금)
export const getNextPaymentDate = (savings: Savings): string | null => {
    // 정기적금만 다음 납입일이 있음
    if (savings.type !== 'INSTALLMENT_SAVINGS') return null;

    const today = new Date();
    const end = parseDate(savings.endDate);
    const paymentDay = savings.paymentDay || 1;

    if (today >= end) return null;

    // 이번 달 또는 다음 달의 납입일 계산 (날짜 오버플로우 방지)
    let nextYear = today.getFullYear();
    let nextMonth = today.getMonth(); // 0-indexed

    if (today.getDate() >= paymentDay) {
        nextMonth++;
        if (nextMonth > 11) {
            nextMonth = 0;
            nextYear++;
        }
    }

    const lastDay = new Date(nextYear, nextMonth + 1, 0).getDate();
    const actualDay = Math.min(paymentDay, lastDay);
    const nextPayment = new Date(nextYear, nextMonth, actualDay);

    if (nextPayment > end) return null;

    return nextPayment.toISOString().split('T')[0];
};

// 적금 자동 납입을 위한 누락된 납입 정보 생성
export interface MissingSavingsPayment {
    savingsId: string;
    savingsName: string;
    bankName: string;
    monthlyAmount: number;
    paymentDate: string;      // YYYY-MM-DD (실제 납입일)
    paymentMonth: string;     // YYYY-MM (납입 해당 월)
}

// 누락된 적금 납입 목록 생성
export const getMissingSavingsPayments = (
    savings: Savings[],
    existingPayments: Array<{ savingsId?: string; savingsPaymentDate?: string }>
): MissingSavingsPayment[] => {
    const missingPayments: MissingSavingsPayment[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 기존 납입 기록을 Set으로 만들어 빠르게 조회
    const existingPaymentSet = new Set(
        existingPayments
            .filter(p => p.savingsId && p.savingsPaymentDate)
            .map(p => `${p.savingsId}_${p.savingsPaymentDate}`)
    );

    for (const s of savings) {
        // 정기적금만 처리
        if (s.type !== 'INSTALLMENT_SAVINGS') continue;
        if (!s.monthlyAmount) continue;

        const paymentDay = s.paymentDay || 1;
        const startDate = parseDate(s.startDate);
        const endDate = parseDate(s.endDate);

        // 시작월부터 현재월까지 순회 (월 단위로 안전하게 이동)
        let checkYear = startDate.getFullYear();
        let checkMonth = startDate.getMonth(); // 0-indexed

        while (true) {
            // 해당 월의 마지막 날을 고려하여 실제 납입일 계산
            const lastDayOfMonth = new Date(checkYear, checkMonth + 1, 0).getDate();
            const actualDay = Math.min(paymentDay, lastDayOfMonth);
            const checkDate = new Date(checkYear, checkMonth, actualDay);

            if (checkDate > today || checkDate > endDate) break;

            const paymentMonth = `${checkYear}-${String(checkMonth + 1).padStart(2, '0')}`;
            const paymentKey = `${s.id}_${paymentMonth}`;

            // 이미 납입 기록이 있는지 확인
            if (!existingPaymentSet.has(paymentKey)) {
                missingPayments.push({
                    savingsId: s.id,
                    savingsName: s.name,
                    bankName: s.bankName,
                    monthlyAmount: s.monthlyAmount,
                    paymentDate: checkDate.toISOString().split('T')[0],
                    paymentMonth: paymentMonth,
                });
            }

            // 다음 달로 이동 (날짜 오버플로우 없이 년/월만 증가)
            checkMonth++;
            if (checkMonth > 11) {
                checkMonth = 0;
                checkYear++;
            }
        }
    }

    return missingPayments;
};
