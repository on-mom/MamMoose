import type { Flight, Project } from '../types';

/** IATA 항공사 코드 → 한국어 이름 */
const AIRLINES: Record<string, string> = {
  KE: '대한항공', OZ: '아시아나항공', '7C': '제주항공', TW: '티웨이항공', LJ: '진에어',
  BX: '에어부산', RS: '에어서울', ZE: '이스타항공', VJ: '비엣젯항공', VN: '베트남항공',
  QH: '뱀부항공', VU: '비엣트래블항공', OD: '말린도항공', TR: '스쿠트', SL: '타이라이온에어',
  D7: '에어아시아 X', AK: '에어아시아', FD: '타이에어아시아', PG: '방콕항공', TG: '타이항공',
  SQ: '싱가포르항공', CX: '캐세이퍼시픽', JL: '일본항공', NH: '전일본공수', CI: '중화항공', BR: '에바항공',
};

/** 편명(예: VJ961, 7C1402) → 항공사명 */
export function carrierOf(flightNo?: string): string {
  if (!flightNo) return '';
  const m = flightNo.trim().toUpperCase().match(/^([A-Z]\d|\d[A-Z]|[A-Z]{2})/);
  return (m && AIRLINES[m[1]]) || '';
}

/** 항공편 한 줄 표기: "9/11 · 비엣젯항공 VJ961 · ICN 11:05 → HAN 13:35" */
export function fmtFlight(f?: Flight): string | null {
  if (!f) return null;
  const md = f.date ? f.date.slice(5).replace('-', '/').replace(/^0/, '') : '';
  const carrier = f.carrier || carrierOf(f.flightNo);
  return [
    md,
    [carrier, f.flightNo].filter(Boolean).join(' '),
    `${f.depAirport} ${f.depTime} → ${f.arrAirport} ${f.arrTime}`,
  ].filter(Boolean).join(' · ');
}

/** 구조화 우선, 없으면 구버전 문자열 */
export function outboundText(p: Project): string | null {
  return fmtFlight(p.outbound) ?? p.outboundFlight ?? null;
}
export function inboundText(p: Project): string | null {
  return fmtFlight(p.inbound) ?? p.inboundFlight ?? null;
}
