import Big from 'big.js';

/** 외부 환율 API 실패 시 고정 기본 환율: 1 VND = 0.055 KRW */
export const FALLBACK_VND_KRW = 0.055;

const CACHE_KEY = 'mammoose-fx-vndkrw';
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface FxCache {
  rate: number;
  at: number;
}

function readCache(): FxCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as FxCache;
    return typeof c.rate === 'number' && c.rate > 0 ? c : null;
  } catch {
    return null;
  }
}

/** 캐시된 환율 (만료 무관). 없으면 fallback */
export function cachedRate(): number {
  return readCache()?.rate ?? FALLBACK_VND_KRW;
}

/**
 * 실시간 VND→KRW 환율. 캐시가 신선하면 그대로,
 * 아니면 무키 공개 API 호출 후 캐시. 실패하면 이전 캐시 또는 fallback.
 */
export async function fetchVndKrwRate(): Promise<number> {
  const cache = readCache();
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rate;
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/VND');
    const json = await res.json();
    const rate = json?.rates?.KRW;
    if (typeof rate !== 'number' || !(rate > 0)) throw new Error('bad rate');
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, at: Date.now() } satisfies FxCache));
    return rate;
  } catch {
    return cache?.rate ?? FALLBACK_VND_KRW;
  }
}

/** VND 금액 → KRW (부동소수점 오차 없이 big.js, 원 단위 반올림 정수 문자열) */
export function toKrw(vnd: string | number, rate: string | number): string {
  if (vnd === '' || vnd == null) return '0';
  try {
    return Big(vnd).times(rate).round(0).toString();
  } catch {
    return '0';
  }
}

/** 표시용 천단위 구분 (정수 문자열/숫자) */
export function commas(n: string | number): string {
  const s = String(n).replace(/[^\d.-]/g, '');
  if (!s) return '0';
  const [i, f] = s.split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f ? '.' + f : '');
}
