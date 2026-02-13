import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVICE_KEY = 't/gbeR9lf0CZXSorz5rzLkt9dWXAPLweTEHfFcHZKtkzj2ytxA9gRDeISfNLd7ITtyGoAznf+c/xS8UEy6yzLQ==';
const BASE_URL = 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo';

// 인메모리 캐시: "YYYY-MM" → { "2026-01-01": "신정", ... }
const memoryCache = new Map<string, Record<string, string>>();

function formatDateKey(locdate: number): string {
    const s = String(locdate);
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

async function loadYearCache(year: number): Promise<Record<string, string> | null> {
    try {
        const raw = await AsyncStorage.getItem(`@holidays_${year}`);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.error('공휴일 캐시 로드 실패:', e);
    }
    return null;
}

async function saveYearCache(year: number, data: Record<string, string>): Promise<void> {
    try {
        // 기존 캐시와 병합
        const existing = await loadYearCache(year);
        const merged = { ...existing, ...data };
        await AsyncStorage.setItem(`@holidays_${year}`, JSON.stringify(merged));
    } catch (e) {
        console.error('공휴일 캐시 저장 실패:', e);
    }
}

async function fetchFromApi(year: number, month: number): Promise<Record<string, string>> {
    const solMonth = String(month).padStart(2, '0');
    const url = `${BASE_URL}?solYear=${year}&solMonth=${solMonth}&ServiceKey=${encodeURIComponent(SERVICE_KEY)}&numOfRows=50&_type=json`;

    console.log('공휴일 API 요청:', url);
    const response = await fetch(url);
    if (!response.ok) {
        const text = await response.text();
        console.error('공휴일 API 응답 본문:', text);
        throw new Error(`공휴일 API 응답 실패: ${response.status}`);
    }

    const text = await response.text();
    console.log('공휴일 API 응답:', text.substring(0, 200));

    let json: any;
    try {
        json = JSON.parse(text);
    } catch {
        // XML 응답인 경우 (API 에러 시 XML로 올 수 있음)
        console.error('공휴일 API JSON 파싱 실패 (XML 응답 가능성):', text.substring(0, 300));
        throw new Error('공휴일 API가 JSON이 아닌 응답 반환');
    }
    const result: Record<string, string> = {};

    const body = json?.response?.body;
    if (!body || body.totalCount === 0) return result;

    const items = body.items?.item;
    if (!items) return result;

    // 단건이면 객체, 복수면 배열
    const list = Array.isArray(items) ? items : [items];

    for (const item of list) {
        if (item.isHoliday === 'Y') {
            const key = formatDateKey(item.locdate);
            result[key] = item.dateName;
        }
    }

    return result;
}

export async function getHolidays(year: number, month: number): Promise<Record<string, string>> {
    const cacheKey = `${year}-${String(month).padStart(2, '0')}`;

    // 1. 인메모리 캐시 확인
    const cached = memoryCache.get(cacheKey);
    if (cached) return cached;

    // 2. AsyncStorage 캐시에서 해당 월 데이터 추출 시도
    const yearCache = await loadYearCache(year);
    if (yearCache) {
        const prefix = cacheKey; // "YYYY-MM"
        const monthData: Record<string, string> = {};
        let found = false;
        for (const [dateStr, name] of Object.entries(yearCache)) {
            if (dateStr.startsWith(prefix)) {
                monthData[dateStr] = name;
                found = true;
            }
        }
        // AsyncStorage에 이 월의 데이터가 이미 저장된 적 있으면 사용
        // (공휴일이 없는 월도 있으므로 별도 마커로 판단)
        const markerKey = `__fetched_${cacheKey}`;
        if (yearCache[markerKey] || found) {
            memoryCache.set(cacheKey, monthData);
            return monthData;
        }
    }

    // 3. API 호출
    try {
        const data = await fetchFromApi(year, month);
        memoryCache.set(cacheKey, data);

        // AsyncStorage에 저장 (마커 포함)
        const markerKey = `__fetched_${cacheKey}`;
        await saveYearCache(year, { ...data, [markerKey]: '1' });

        return data;
    } catch (e) {
        console.error('공휴일 API 호출 실패:', e);
        // 오프라인 fallback: AsyncStorage에서 가능한 데이터 반환
        if (yearCache) {
            const prefix = cacheKey;
            const fallback: Record<string, string> = {};
            for (const [dateStr, name] of Object.entries(yearCache)) {
                if (dateStr.startsWith(prefix) && !dateStr.startsWith('__')) {
                    fallback[dateStr] = name;
                }
            }
            return fallback;
        }
        return {};
    }
}
