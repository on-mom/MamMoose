import Big from 'big.js';

/** 외부 환율 API 실패 시 통화별 고정 기본값 (1 현지통화 = ? KRW, 대략치) */
const FALLBACK: Record<string, number> = {
  VND: 0.055, THB: 39, JPY: 9.3, TWD: 43, SGD: 1020, IDR: 0.086, PHP: 24,
  HKD: 176, CNY: 190, USD: 1380, AED: 375, TRY: 41, EUR: 1500, GBP: 1750, AUD: 900, KRW: 1,
};
export const fallbackRate = (from: string) => FALLBACK[from] ?? 1;

/** @deprecated 하위호환 — VND 기준 */
export const FALLBACK_VND_KRW = FALLBACK.VND;

const TTL_MS = 24 * 60 * 60 * 1000; // 24h
const cacheKey = (from: string) => `mammoose-fx-${from}`;

interface FxCache { rate: number; at: number }

function readCache(from: string): FxCache | null {
  try {
    const raw = localStorage.getItem(cacheKey(from));
    if (!raw) return null;
    const c = JSON.parse(raw) as FxCache;
    return typeof c.rate === 'number' && c.rate > 0 ? c : null;
  } catch {
    return null;
  }
}

/** 캐시된 환율 (만료 무관). 없으면 통화별 fallback */
export function cachedRate(from = 'VND'): number {
  return readCache(from)?.rate ?? fallbackRate(from);
}

/**
 * 실시간 현지통화 → KRW 환율. 캐시가 신선하면 그대로,
 * 아니면 무키 공개 API 호출 후 캐시. 실패하면 이전 캐시 또는 fallback.
 */
export async function fetchRate(from = 'VND'): Promise<number> {
  if (from === 'KRW') return 1;
  const cache = readCache(from);
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rate;
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    const json = await res.json();
    const rate = json?.rates?.KRW;
    if (typeof rate !== 'number' || !(rate > 0)) throw new Error('bad rate');
    localStorage.setItem(cacheKey(from), JSON.stringify({ rate, at: Date.now() } satisfies FxCache));
    return rate;
  } catch {
    return cache?.rate ?? fallbackRate(from);
  }
}

/** @deprecated 하위호환 */
export const fetchVndKrwRate = () => fetchRate('VND');

/** 현지통화 금액 → KRW (부동소수점 오차 없이 big.js, 원 단위 반올림 정수 문자열) */
export function toKrw(amount: string | number, rate: string | number): string {
  if (amount === '' || amount == null) return '0';
  try {
    return Big(amount).times(rate).round(0).toString();
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
