/** 여행지 선택용 도시 목록 (라벨 → IANA 타임존 → 현지 통화) */
export const CITY_TZ: { label: string; tz: string; currency: string; lang: string }[] = [
  { label: '베트남 · 하노이/호치민', tz: 'Asia/Ho_Chi_Minh', currency: 'VND', lang: 'vi' },
  { label: '태국 · 방콕', tz: 'Asia/Bangkok', currency: 'THB', lang: 'th' },
  { label: '한국 · 서울', tz: 'Asia/Seoul', currency: 'KRW', lang: 'ko' },
  { label: '일본 · 도쿄/오사카', tz: 'Asia/Tokyo', currency: 'JPY', lang: 'ja' },
  { label: '대만 · 타이베이', tz: 'Asia/Taipei', currency: 'TWD', lang: 'zh-TW' },
  { label: '싱가포르 · 말레이시아', tz: 'Asia/Singapore', currency: 'SGD', lang: 'en' },
  { label: '인도네시아 · 발리', tz: 'Asia/Makassar', currency: 'IDR', lang: 'id' },
  { label: '필리핀 · 세부/마닐라', tz: 'Asia/Manila', currency: 'PHP', lang: 'fil' },
  { label: '홍콩 · 마카오', tz: 'Asia/Hong_Kong', currency: 'HKD', lang: 'zh-TW' },
  { label: '중국 · 상하이/베이징', tz: 'Asia/Shanghai', currency: 'CNY', lang: 'zh-CN' },
  { label: '괌 · 사이판', tz: 'Pacific/Guam', currency: 'USD', lang: 'en' },
  { label: '아랍에미리트 · 두바이', tz: 'Asia/Dubai', currency: 'AED', lang: 'ar' },
  { label: '튀르키예 · 이스탄불', tz: 'Europe/Istanbul', currency: 'TRY', lang: 'tr' },
  { label: '유럽 · 파리/로마/베를린', tz: 'Europe/Paris', currency: 'EUR', lang: 'fr' },
  { label: '영국 · 런던', tz: 'Europe/London', currency: 'GBP', lang: 'en' },
  { label: '미국 동부 · 뉴욕', tz: 'America/New_York', currency: 'USD', lang: 'en' },
  { label: '미국 서부 · LA/라스베이거스', tz: 'America/Los_Angeles', currency: 'USD', lang: 'en' },
  { label: '하와이 · 호놀룰루', tz: 'Pacific/Honolulu', currency: 'USD', lang: 'en' },
  { label: '호주 · 시드니', tz: 'Australia/Sydney', currency: 'AUD', lang: 'en' },
];

export const tzLabel = (tz: string) => CITY_TZ.find((c) => c.tz === tz)?.label ?? tz;

/** 통화 메타 — 기호, 한글명, 소수점 자리수 (VND/JPY 등은 0) */
export const CURRENCY: Record<string, { symbol: string; name: string; decimals: number }> = {
  VND: { symbol: '₫', name: '동', decimals: 0 },
  THB: { symbol: '฿', name: '바트', decimals: 2 },
  KRW: { symbol: '₩', name: '원', decimals: 0 },
  JPY: { symbol: '¥', name: '엔', decimals: 0 },
  TWD: { symbol: 'NT$', name: '대만달러', decimals: 0 },
  SGD: { symbol: 'S$', name: '싱가포르달러', decimals: 2 },
  IDR: { symbol: 'Rp', name: '루피아', decimals: 0 },
  PHP: { symbol: '₱', name: '페소', decimals: 2 },
  HKD: { symbol: 'HK$', name: '홍콩달러', decimals: 2 },
  CNY: { symbol: '¥', name: '위안', decimals: 2 },
  USD: { symbol: '$', name: '달러', decimals: 2 },
  AED: { symbol: 'AED', name: '디르함', decimals: 2 },
  TRY: { symbol: '₺', name: '리라', decimals: 2 },
  EUR: { symbol: '€', name: '유로', decimals: 2 },
  GBP: { symbol: '£', name: '파운드', decimals: 2 },
  AUD: { symbol: 'A$', name: '호주달러', decimals: 2 },
};

/** 타임존/목적지 텍스트로 현지 통화 코드 추정 (기본 USD) */
export function currencyOf(tz?: string, destination?: string): string {
  const byTz = CITY_TZ.find((c) => c.tz === tz)?.currency;
  if (byTz) return byTz;
  const d = (destination ?? '').toLowerCase();
  const hit = CITY_TZ.find((c) => c.label.toLowerCase().split(/[·,\s]+/).some((w) => w.length > 1 && d.includes(w)));
  return hit?.currency ?? 'USD';
}

export function langOf(tz?: string): string {
  return CITY_TZ.find((c) => c.tz === tz)?.lang ?? 'en';
}

export const currencyMeta = (code: string) =>
  CURRENCY[code] ?? { symbol: code, name: code, decimals: 2 };
