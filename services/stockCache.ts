import { StockPrice } from '../types/investment';

interface CacheEntry {
    data: StockPrice;
    timestamp: number;
}

class StockCache {
    private cache: Map<string, CacheEntry> = new Map();
    private readonly TTL_MS = 5 * 60 * 1000; // 5분 캐시
    private readonly MAX_SIZE = 200; // 최대 캐시 항목 수

    get(ticker: string): StockPrice | null {
        const entry = this.cache.get(ticker);
        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > this.TTL_MS) {
            this.cache.delete(ticker);
            return null;
        }

        return entry.data;
    }

    set(ticker: string, data: StockPrice): void {
        // 최대 크기 초과 시 만료된 항목 정리 후에도 넘으면 가장 오래된 항목 제거
        if (this.cache.size >= this.MAX_SIZE) {
            this.cleanup();
            if (this.cache.size >= this.MAX_SIZE) {
                const oldestKey = this.cache.keys().next().value;
                if (oldestKey) this.cache.delete(oldestKey);
            }
        }

        this.cache.set(ticker, {
            data,
            timestamp: Date.now(),
        });
    }

    getMultiple(tickers: string[]): Map<string, StockPrice> {
        const result = new Map<string, StockPrice>();
        for (const ticker of tickers) {
            const price = this.get(ticker);
            if (price) {
                result.set(ticker, price);
            }
        }
        return result;
    }

    setMultiple(prices: StockPrice[]): void {
        for (const price of prices) {
            this.set(price.ticker, price);
        }
    }

    clear(): void {
        this.cache.clear();
    }

    // 만료된 항목 정리
    cleanup(): void {
        const now = Date.now();
        for (const [ticker, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.TTL_MS) {
                this.cache.delete(ticker);
            }
        }
    }
}

export const stockCache = new StockCache();
