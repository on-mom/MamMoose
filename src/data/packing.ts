// 여행지별 짐 체크리스트 프리셋 — 공통 + 키워드 매칭 블록.
// destination/여행이름/타임존 텍스트로 매칭 (짐은 나라·기후 단위라 느슨해도 무해).

export interface PackItem { label: string; cat: string }

const BASE: PackItem[] = [
  { label: '여권 (유효기간 6개월 이상)', cat: '필수' },
  { label: '항공권 · e-티켓 · 숙소 바우처', cat: '필수' },
  { label: '해외 결제 카드 + 비상금(현금)', cat: '필수' },
  { label: '여행자보험 가입', cat: '필수' },
  { label: '휴대폰 유심 / eSIM / 로밍', cat: '필수' },
  { label: '멀티 충전기 · 보조배터리(기내 반입)', cat: '전자' },
  { label: '충전 케이블 (C·라이트닝)', cat: '전자' },
  { label: '상비약 (진통제·소화제·밴드·개인약)', cat: '건강' },
  { label: '세면도구 · 화장품 (100ml 이하)', cat: '생활' },
  { label: '속옷 · 양말 (일수 + 1)', cat: '의류' },
  { label: '잠옷 · 편한 실내복', cat: '의류' },
  { label: '접이식 에코백 / 보조가방', cat: '생활' },
  { label: '커플 사진용 셀카봉 · 미니 삼각대', cat: '커플' },
];

const BLOCKS: { match: RegExp; items: PackItem[] }[] = [
  {
    match: /일본|japan|도쿄|오사카|후쿠오카|교토|삿포로|오키나와|나고야|tokyo|osaka|fukuoka|kyoto|hokkaido|okinawa/i,
    items: [
      { label: 'IC카드 (스이카·파스모·이코카)', cat: '현지' },
      { label: '엔화 현금 + 동전 지갑 (현금 사회)', cat: '현지' },
      { label: '휴대용 우산 (소나기 잦음)', cat: '현지' },
      { label: '지도앱: 노리카에안내 / 구글맵 오프라인', cat: '현지' },
    ],
  },
  {
    match: /베트남|vietnam|하노이|호치민|다낭|나트랑|태국|thailand|방콕|푸켓|치앙마이|필리핀|philippines|세부|보라카이|발리|bali|인도네시아|캄보디아|라오스|말레이|싱가포르/i,
    items: [
      { label: '모기 기피제 · 물린 데 바르는 약', cat: '현지' },
      { label: '자외선 차단제 (SPF50+) · 애프터선', cat: '현지' },
      { label: '지사제 · 정로환 (물갈이 대비)', cat: '현지' },
      { label: '얇은 긴팔 (냉방·사원 입장용)', cat: '현지' },
      { label: '우비 / 3단 우산 (우기)', cat: '현지' },
      { label: '미국 달러 현금 (현지 환전용)', cat: '현지' },
      { label: '슬리퍼 · 방수 샌들', cat: '현지' },
    ],
  },
  {
    match: /유럽|europe|파리|런던|로마|바르셀로나|프라하|스위스|미국|usa|뉴욕|la|하와이|괌|사이판|캐나다|호주|australia|시드니|영국|프랑스|이탈리아|스페인|독일/i,
    items: [
      { label: '여행용 멀티 어댑터 (국가별 플러그)', cat: '현지' },
      { label: '소매치기 대비 크로스백 · 자물쇠', cat: '현지' },
      { label: '상비약 넉넉히 (약국 접근성 낮음)', cat: '현지' },
      { label: '리유저블 물병 (생수 비쌈)', cat: '현지' },
    ],
  },
  {
    match: /겨울|1월|2월|12월|삿포로|hokkaido|스키|스위스|알프스|아이슬란드|핀란드/i,
    items: [
      { label: '패딩 · 방한 내의 · 장갑 · 목도리', cat: '방한' },
      { label: '핫팩 · 립밤 · 수분크림', cat: '방한' },
      { label: '미끄럼 방지 신발 / 아이젠', cat: '방한' },
    ],
  },
  {
    match: /바다|해변|beach|리조트|resort|몰디브|칸쿤|풀빌라|스노클|다이빙|하와이|괌|사이판|세부|보라카이|나트랑|푸켓|발리|오키나와/i,
    items: [
      { label: '수영복 · 래시가드 · 비치타월', cat: '물놀이' },
      { label: '방수팩 · 방수폰케이스', cat: '물놀이' },
      { label: '스노클링 장비 (선택)', cat: '물놀이' },
    ],
  },
];

export function packingPreset(destination?: string, timezone?: string, tripName?: string): PackItem[] {
  const text = `${destination ?? ''} ${tripName ?? ''} ${timezone ?? ''}`;
  const extra = BLOCKS.filter((b) => b.match.test(text)).flatMap((b) => b.items);
  // 중복 라벨 제거
  const seen = new Set<string>();
  return [...BASE, ...extra].filter((it) => (seen.has(it.label) ? false : (seen.add(it.label), true)));
}
