import type { Flight, Project } from '../types';

/** IATA 항공사 코드 → 한국어 이름 (한국·베트남·동남아 취항사 위주 + 주요 국제선) */
const AIRLINES: Record<string, string> = {
  // --- 대한민국 ---
  KE: '대한항공', OZ: '아시아나항공', '7C': '제주항공', TW: '티웨이항공', LJ: '진에어',
  BX: '에어부산', RS: '에어서울', ZE: '이스타항공', YP: '에어프레미아', RF: '에어로케이', HL: '하이에어',
  // --- 베트남 ---
  VN: '베트남항공', VJ: '비엣젯항공', QH: '뱀부항공', VU: '비엣트래블항공', BL: '퍼시픽항공', '0V': '바스코항공',
  // --- 동남아 / LCC ---
  TR: '스쿠트', MI: '실크에어', '3K': '젯스타 아시아', SQ: '싱가포르항공',
  AK: '에어아시아', D7: '에어아시아 X', FD: '타이 에어아시아', XJ: '타이 에어아시아 X',
  QZ: '인도네시아 에어아시아', Z2: '필리핀 에어아시아', I5: '에어아시아 인디아',
  TG: '타이항공', WE: '타이 스마일', PG: '방콕항공', SL: '타이 라이온에어', DD: '녹에어', VZ: '타이 비엣젯',
  MH: '말레이시아항공', OD: '바틱에어 말레이시아', FY: '파이어플라이',
  GA: '가루다 인도네시아', QG: '시티링크', JT: '라이온에어', ID: '바틱에어', IU: '슈퍼에어젯',
  PR: '필리핀항공', '5J': '세부퍼시픽', DG: '세부고',
  BR: '에바항공', CI: '중화항공', B7: '유니항공', AE: '만다린항공', IT: '타이거에어 타이완', JX: '스타럭스항공',
  CX: '캐세이퍼시픽', HX: '홍콩항공', UO: '홍콩익스프레스',
  '3U': '쓰촨항공', CA: '중국국제항공', MU: '중국동방항공', CZ: '중국남방항공', HU: '하이난항공',
  MF: '샤먼항공', FM: '상하이항공', ZH: '심천항공', GS: '천진항공', '9C': '춘추항공', HO: '준야오항공',
  NH: '전일본공수(ANA)', JL: '일본항공(JAL)', MM: '피치항공', GK: '젯스타 재팬', BC: '스카이마크', '7G': '스타플라이어',
  // --- 인도 / 중동 / 기타 ---
  '6E': '인디고', UK: '비스타라', AI: '에어인디아', SG: '스파이스젯',
  EK: '에미레이트항공', EY: '에티하드항공', QR: '카타르항공', GF: '걸프에어', SV: '사우디아항공',
  TK: '터키항공', SU: '아에로플로트', S7: 'S7 항공',
  // --- 유럽 / 미주 / 오세아니아 ---
  LH: '루프트한자', LX: '스위스항공', OS: '오스트리아항공', AF: '에어프랑스', KL: 'KLM',
  BA: '영국항공', VS: '버진애틀랜틱', AZ: 'ITA 항공', IB: '이베리아', AY: '핀에어',
  UA: '유나이티드항공', AA: '아메리칸항공', DL: '델타항공', AC: '에어캐나다', HA: '하와이안항공',
  QF: '콴타스항공', JQ: '젯스타', VA: '버진 오스트레일리아', NZ: '에어뉴질랜드', FJ: '피지항공',
};

/** 편명(예: VJ961, 7C1402, "KE 123") → 항공사명 */
export function carrierOf(flightNo?: string): string {
  if (!flightNo) return '';
  const m = flightNo.replace(/\s+/g, '').toUpperCase().match(/^([A-Z]\d|\d[A-Z]|[A-Z]{2})/);
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
