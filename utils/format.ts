export const formatMoney = (amount: number): string => {
    const sign = amount >= 0 ? '+' : '-';
    const absAmount = Math.abs(amount);
    const formatted = absAmount.toLocaleString('ko-KR');
    return `${sign}${formatted}원`;
};

export const formatMoneyNoSign = (amount: number): string => {
    const absAmount = Math.abs(amount);
    const formatted = absAmount.toLocaleString('ko-KR');
    return `${formatted}원`;
};

export const formatDateKorean = (date: Date): string => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일`;
};