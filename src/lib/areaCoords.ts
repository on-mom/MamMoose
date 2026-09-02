// 하노이 주요 구역 대략 좌표 — 시드 장소를 지도에 얹기 위한 근사값.
// 정확한 핀은 사용자가 [동선] 탭에서 마커를 드래그해 보정한다.
export const AREA_COORDS: Record<string, { lat: number; lng: number }> = {
  올드쿼터: { lat: 21.0338, lng: 105.8510 },
  호안끼엠: { lat: 21.0287, lng: 105.8524 },
  바딘: { lat: 21.0355, lng: 105.8140 },
  서호: { lat: 21.0680, lng: 105.8200 },
  꺼우저이: { lat: 21.0300, lng: 105.7900 },
  하이바쯩: { lat: 21.0075, lng: 105.8560 },
  '프렌치 쿼터': { lat: 21.0245, lng: 105.8570 },
  미딘: { lat: 21.0170, lng: 105.7620 },
  동다: { lat: 21.0110, lng: 105.8260 },
  뻐남: { lat: 21.0200, lng: 105.8450 },
  항카이: { lat: 21.0270, lng: 105.8490 },
  '성요셉 근처': { lat: 21.0290, lng: 105.8490 },
  '전역 체인': { lat: 21.0300, lng: 105.8400 },
};

const HANOI_CENTER = { lat: 21.0285, lng: 105.8542 };

/** "바딘/올드쿼터" 같은 복합 구역도 첫 매칭으로 처리 */
export function coordsForArea(area: string): { lat: number; lng: number } {
  if (!area) return HANOI_CENTER;
  for (const key of Object.keys(AREA_COORDS)) {
    if (area.includes(key)) return AREA_COORDS[key];
  }
  return HANOI_CENTER;
}
