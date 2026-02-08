export type SavingsType = 'FIXED_DEPOSIT' | 'INSTALLMENT_SAVINGS' | 'FREE_SAVINGS';

export interface Savings {
    id: string;
    type: SavingsType;        // 정기예금/정기적금/자유적금
    name: string;             // 상품명
    bankName: string;         // 은행명
    interestRate: number;     // 금리 (%)
    startDate: string;        // 시작일
    endDate: string;          // 만기일
    principal?: number;       // 원금 (예금)
    monthlyAmount?: number;   // 월 납입금 (정기적금)
    paymentDay?: number;      // 납입일 (정기적금)
    minMonthlyAmount?: number; // 월 최소 납입금 (자유적금)
    maxMonthlyAmount?: number; // 월 최대 납입금 (자유적금)
    initialBalance?: number;  // 초기 잔액 (기존에 납입한 금액)
    linkedAccountName?: string; // 연결된 통장 이름
    createdAt: string;
    updatedAt: string;
}
