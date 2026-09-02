import type { Flight, Project } from '../types';

/** 항공편 한 줄 표기: "9/11 · VJ961 · ICN 11:05 → HAN 13:35" */
export function fmtFlight(f?: Flight): string | null {
  if (!f) return null;
  const md = f.date ? f.date.slice(5).replace('-', '/').replace(/^0/, '') : '';
  return [
    md,
    f.flightNo,
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
