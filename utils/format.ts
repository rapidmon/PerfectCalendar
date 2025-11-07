export const formatMoney = (amount: number): string => {
    const sign = amount >= 0 ? '+' : '-';
    const absAmount = Math.abs(amount);
    const formatted = absAmount.toLocaleString('ko-KR');
    return `${sign}${formatted}원`;
};

export const formatDateKorean = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
};