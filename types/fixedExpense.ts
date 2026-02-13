export interface FixedExpense {
    id: string;
    dayOfMonth: number;    // 매월 몇일 (1~31)
    title: string;         // 메모 (예: 월세)
    money: number;         // 금액
    category: string;      // 카테고리
    account: string;       // 통장
}
