import { StockPrice, StockSearchResult, InvestmentType, MarketType } from '../types/investment';
import { stockCache } from './stockCache';

const FINNHUB_API_KEY = 'd624i6hr01qgcobrigtgd624i6hr01qgcobrigu0'; // 사용자가 설정해야 함

// 한국 주식 시세 조회 (네이버 금융)
const fetchKoreaStockPrice = async (ticker: string): Promise<StockPrice | null> => {
    try {
        const url = `https://m.stock.naver.com/api/stock/${ticker}/basic`;
        const response = await fetch(url);

        if (!response.ok) return null;

        const data = await response.json();

        return {
            ticker,
            price: parseFloat(data.closePrice?.replace(/,/g, '') || '0'),
            change: parseFloat(data.compareToPreviousClosePrice?.replace(/,/g, '') || '0'),
            changePercent: parseFloat(data.fluctuationsRatio || '0'),
            lastUpdated: new Date().toISOString(),
        };
    } catch (error) {
        console.error('한국 주식 시세 조회 실패:', error);
        return null;
    }
};

// 미국 주식 시세 조회 (Finnhub)
const fetchUSStockPrice = async (ticker: string): Promise<StockPrice | null> => {
    if (!FINNHUB_API_KEY) {
        console.warn('Finnhub API 키가 설정되지 않았습니다.');
        return null;
    }

    try {
        const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.log(`미국 주식 ${ticker} 응답 실패:`, response.status);
            return null;
        }

        const data = await response.json();
        console.log(`미국 주식 ${ticker} 응답:`, data);

        // c가 0이면 데이터 없음 (Finnhub은 지원 안하는 종목은 0 반환)
        if (!data.c || data.c === 0) {
            console.log(`미국 주식 ${ticker} 가격 데이터 없음`);
            return null;
        }

        return {
            ticker,
            price: data.c, // current price
            change: data.d || 0, // change
            changePercent: data.dp || 0, // percent change
            lastUpdated: new Date().toISOString(),
        };
    } catch (error) {
        console.error('미국 주식 시세 조회 실패:', error);
        return null;
    }
};

// 주식 시세 조회 (캐시 우선)
export const getStockPrice = async (
    ticker: string,
    type: InvestmentType
): Promise<StockPrice | null> => {
    // 캐시 확인
    const cached = stockCache.get(ticker);
    if (cached) return cached;

    // API 호출
    let price: StockPrice | null = null;

    if (type === 'KOREA_STOCK') {
        price = await fetchKoreaStockPrice(ticker);
    } else {
        price = await fetchUSStockPrice(ticker);
    }

    // 캐시 저장
    if (price) {
        stockCache.set(ticker, price);
    }

    return price;
};

// 여러 종목 시세 일괄 조회
export const getMultipleStockPrices = async (
    stocks: Array<{ ticker: string; type: InvestmentType }>
): Promise<Map<string, StockPrice>> => {
    const result = new Map<string, StockPrice>();

    // 캐시 확인
    const cached = stockCache.getMultiple(stocks.map((s) => s.ticker));
    const uncached = stocks.filter((s) => !cached.has(s.ticker));

    // 캐시된 데이터 추가
    for (const [ticker, price] of cached) {
        result.set(ticker, price);
    }

    // 캐시되지 않은 데이터 조회 (병렬)
    const promises = uncached.map(async ({ ticker, type }) => {
        const price = await getStockPrice(ticker, type);
        if (price) {
            result.set(ticker, price);
        }
    });

    await Promise.all(promises);

    return result;
};

// 한국 주식 검색 (네이버 자동완성 API)
export const searchKoreaStocks = async (query: string): Promise<StockSearchResult[]> => {
    try {
        // 네이버 자동완성 API 사용
        const url = `https://ac.stock.naver.com/ac?q=${encodeURIComponent(query)}&target=stock`;
        const response = await fetch(url);

        if (!response.ok) {
            console.log('한국 주식 검색 응답 실패:', response.status);
            return [];
        }

        const data = await response.json();

        if (!data.items || !Array.isArray(data.items)) return [];

        const results: StockSearchResult[] = [];

        for (const item of data.items) {
            // 응답 형식: { code, name, typeCode, typeName, category, ... }
            if (item.code && item.name && item.category === 'stock') {
                const marketStr = item.typeCode; // KOSPI, KOSDAQ

                if (marketStr === 'KOSPI' || marketStr === 'KOSDAQ') {
                    results.push({
                        ticker: item.code,
                        name: item.name,
                        market: marketStr as MarketType,
                        type: 'KOREA_STOCK',
                    });
                }
            }
        }

        return results.slice(0, 10);
    } catch (error) {
        console.error('한국 주식 검색 실패:', error);
        return [];
    }
};

// 미국 주식 검색 (Finnhub)
export const searchUSStocks = async (query: string): Promise<StockSearchResult[]> => {
    if (!FINNHUB_API_KEY) {
        console.warn('Finnhub API 키가 설정되지 않았습니다.');
        return [];
    }

    try {
        const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) return [];

        const data = await response.json();

        if (!data.result) return [];

        // 미국 거래소만 필터링 (티커에 . 이 없는 것 = 미국)
        // .WA = 폴란드, .DE = 독일, .L = 런던 등
        const results: StockSearchResult[] = data.result
            .filter((item: any) =>
                item.type === 'Common Stock' &&
                !item.symbol.includes('.')  // 미국 주식만 (다른 거래소 제외)
            )
            .slice(0, 10)
            .map((item: any) => ({
                ticker: item.symbol,
                name: item.description,
                market: 'NYSE' as MarketType, // Finnhub은 거래소 정보 안 줘서 일단 NYSE로
                type: 'US_STOCK' as InvestmentType,
            }));

        return results;
    } catch (error) {
        console.error('미국 주식 검색 실패:', error);
        return [];
    }
};

// 통합 검색
export const searchStocks = async (
    query: string,
    market: 'KOREA' | 'US' | 'ALL' = 'ALL'
): Promise<StockSearchResult[]> => {
    if (!query.trim()) return [];

    const results: StockSearchResult[] = [];

    if (market === 'KOREA' || market === 'ALL') {
        const koreaResults = await searchKoreaStocks(query);
        results.push(...koreaResults);
    }

    if (market === 'US' || market === 'ALL') {
        const usResults = await searchUSStocks(query);
        results.push(...usResults);
    }

    return results;
};
