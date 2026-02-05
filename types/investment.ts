export type InvestmentType = 'KOREA_STOCK' | 'US_STOCK';
export type MarketType = 'KOSPI' | 'KOSDAQ' | 'NYSE' | 'NASDAQ';

export interface Investment {
    id: string;
    type: InvestmentType;
    ticker: string;           // 종목코드
    name: string;             // 종목명
    market: MarketType;
    quantity: number;         // 보유 수량
    averagePrice: number;     // 평균 매입가
    currency: 'KRW' | 'USD';
    createdAt: string;
    updatedAt: string;
}

export interface StockPrice {
    ticker: string;
    price: number;
    change: number;           // 전일 대비 변동액
    changePercent: number;    // 전일 대비 변동률 (%)
    lastUpdated: string;
}

export interface StockSearchResult {
    ticker: string;
    name: string;
    market: MarketType;
    type: InvestmentType;
}
