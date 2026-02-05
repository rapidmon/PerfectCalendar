export type SavingsType = 'FIXED_DEPOSIT' | 'INSTALLMENT_SAVINGS';

export interface Savings {
    id: string;
    type: SavingsType;        // 정기예금/정기적금
    name: string;             // 상품명
    bankName: string;         // 은행명
    interestRate: number;     // 금리 (%)
    startDate: string;        // 시작일
    endDate: string;          // 만기일
    principal?: number;       // 원금 (예금)
    monthlyAmount?: number;   // 월 납입금 (적금)
    paymentDay?: number;      // 납입일 (적금)
    createdAt: string;
    updatedAt: string;
}
