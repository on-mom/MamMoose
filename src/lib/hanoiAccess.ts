// 하노이 구역별 그랩(차량) 접근성 추정치 — 러시아워 제외, 편도 기준.
// 시트의 "( ? )" 칸을 채우는 기본값. Google Maps 키가 있으면 실시간 값으로 대체 가능(computeDriveTime).
// ponytail: 실측 아님, 러시아워/우기에 크게 변동. 정확값 필요 시 구글맵 연동.

interface Access {
  airportMin: number; airportVnd: number; // 노이바이 국제공항
  centerMin: number; centerVnd: number;   // 도심 (호안끼엠 호수)
  oldMin: number; oldVnd: number;         // 구시가지 (올드쿼터)
}

const KRW = 0.055;

export const AREA_ACCESS: Record<string, Access> = {
  올드쿼터: { airportMin: 35, airportVnd: 300000, centerMin: 5, centerVnd: 30000, oldMin: 0, oldVnd: 0 },
  호안끼엠: { airportMin: 35, airportVnd: 300000, centerMin: 3, centerVnd: 25000, oldMin: 5, oldVnd: 30000 },
  바딘: { airportMin: 35, airportVnd: 300000, centerMin: 12, centerVnd: 65000, oldMin: 12, oldVnd: 65000 },
  서호: { airportMin: 30, airportVnd: 280000, centerMin: 15, centerVnd: 85000, oldMin: 15, oldVnd: 85000 },
  꺼우저이: { airportMin: 40, airportVnd: 330000, centerMin: 22, centerVnd: 110000, oldMin: 22, oldVnd: 110000 },
  하이바쯩: { airportMin: 40, airportVnd: 330000, centerMin: 12, centerVnd: 70000, oldMin: 12, oldVnd: 70000 },
  미딘: { airportMin: 45, airportVnd: 360000, centerMin: 25, centerVnd: 135000, oldMin: 25, oldVnd: 135000 },
  '프렌치 쿼터': { airportMin: 35, airportVnd: 300000, centerMin: 6, centerVnd: 35000, oldMin: 8, oldVnd: 40000 },
  동다: { airportMin: 40, airportVnd: 330000, centerMin: 15, centerVnd: 80000, oldMin: 15, oldVnd: 80000 },
};

/** 복합 구역("바딘/올드쿼터")도 첫 매칭 */
export function accessForArea(area: string): Access | null {
  if (!area) return null;
  for (const key of Object.keys(AREA_ACCESS)) if (area.includes(key)) return AREA_ACCESS[key];
  return null;
}

export const fmtVnd = (v: number) => (v === 0 ? '-' : `${Math.round(v / 1000)}k동 ≈ ${Math.round(v * KRW).toLocaleString()}원`);

/**
 * Google Maps 키가 있으면 두 좌표 사이 실제 차량 소요(분) 계산.
 * 키 없으면 null → 호출부에서 정적 추정치 사용.
 */
export async function computeDriveMin(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<number | null> {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const g = (globalThis as any).google;
  if (!key || !g?.maps?.DistanceMatrixService) return null;
  return new Promise((resolve) => {
    new g.maps.DistanceMatrixService().getDistanceMatrix(
      { origins: [from], destinations: [to], travelMode: g.maps.TravelMode.DRIVING },
      (res: any, status: string) => {
        const sec = res?.rows?.[0]?.elements?.[0]?.duration?.value;
        resolve(status === 'OK' && sec ? Math.round(sec / 60) : null);
      },
    );
  });
}
