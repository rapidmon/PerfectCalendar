import { Investment, StockPrice } from '../types/investment';

// 투자 수익률 계산
export const calculateProfitRate = (
    investment: Investment,
    currentPrice: number
): number => {
    if (investment.averagePrice === 0) return 0;
    return ((currentPrice - investment.averagePrice) / investment.averagePrice) * 100;
};

// 투자 수익금 계산
export const calculateProfit = (
    investment: Investment,
    currentPrice: number
): number => {
    return (currentPrice - investment.averagePrice) * investment.quantity;
};

// 투자 현재가치 계산
export const calculateCurrentValue = (
    investment: Investment,
    currentPrice: number
): number => {
    return currentPrice * investment.quantity;
};

// 투자 매입금액 계산
export const calculatePurchaseValue = (investment: Investment): number => {
    return investment.averagePrice * investment.quantity;
};

// 전체 투자 요약 계산
export interface InvestmentSummary {
    totalPurchaseValue: number;     // 총 매입금액
    totalCurrentValue: number;      // 총 현재가치
    totalProfit: number;            // 총 수익금
    totalProfitRate: number;        // 총 수익률
    koreaTotal: number;             // 한국 주식 총액
    usTotal: number;                // 미국 주식 총액 (USD)
}

export const calculateInvestmentSummary = (
    investments: Investment[],
    prices: Map<string, StockPrice>
): InvestmentSummary => {
    let totalPurchaseValue = 0;
    let totalCurrentValue = 0;
    let koreaTotal = 0;
    let usTotal = 0;

    for (const investment of investments) {
        const purchaseValue = calculatePurchaseValue(investment);
        const price = prices.get(investment.ticker);
        const currentPrice = price?.price || investment.averagePrice; // 가격 없으면 매입가 사용
        const currentValue = calculateCurrentValue(investment, currentPrice);

        if (investment.currency === 'KRW') {
            totalPurchaseValue += purchaseValue;
            totalCurrentValue += currentValue;
            koreaTotal += currentValue;
        } else {
            // USD는 별도 집계 (환율 변환 없이)
            usTotal += currentValue;
        }
    }

    const totalProfit = totalCurrentValue - totalPurchaseValue;
    const totalProfitRate = totalPurchaseValue > 0
        ? (totalProfit / totalPurchaseValue) * 100
        : 0;

    return {
        totalPurchaseValue,
        totalCurrentValue,
        totalProfit,
        totalProfitRate,
        koreaTotal,
        usTotal,
    };
};

// 개별 투자 상세 정보 계산
export interface InvestmentDetail {
    purchaseValue: number;
    currentValue: number;
    profit: number;
    profitRate: number;
}

export const calculateInvestmentDetail = (
    investment: Investment,
    currentPrice: number
): InvestmentDetail => {
    const purchaseValue = calculatePurchaseValue(investment);
    const currentValue = calculateCurrentValue(investment, currentPrice);
    const profit = calculateProfit(investment, currentPrice);
    const profitRate = calculateProfitRate(investment, currentPrice);

    return {
        purchaseValue,
        currentValue,
        profit,
        profitRate,
    };
};

// 수익률 포맷팅
export const formatProfitRate = (rate: number): string => {
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(2)}%`;
};

// 수익금 포맷팅 (통화 포함)
export const formatProfit = (profit: number, currency: 'KRW' | 'USD'): string => {
    const sign = profit >= 0 ? '+' : '';
    if (currency === 'KRW') {
        return `${sign}${profit.toLocaleString()}원`;
    } else {
        return `${sign}$${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
};

// 금액 포맷팅 (통화 포함)
export const formatAmount = (amount: number, currency: 'KRW' | 'USD'): string => {
    if (currency === 'KRW') {
        return `${amount.toLocaleString()}원`;
    } else {
        return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
};
