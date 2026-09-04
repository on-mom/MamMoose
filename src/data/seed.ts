// 앱 기본값만. 예시(샘플) 여행 데이터는 없음 — 새 계정/새 설치는 빈 여행으로 시작.
import type { Project, TimelineItem } from '../types';

const localIso = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** 새 계정/새 앱은 빈 여행으로 시작 (오늘~+2일, 기기 시간대) */
export function blankProject(): Project {
  const d = new Date();
  const end = new Date(d); end.setDate(end.getDate() + 2);
  let timezone = 'Asia/Seoul';
  try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || timezone; } catch { /* noop */ }
  return {
    id: 'trip-start',
    name: '새 여행',
    destination: '',
    startDate: localIso(d),
    endDate: localIso(end),
    timezone,
  };
}

/** 항공편 → 타임라인 행 (addProject·patchProject 공용). 항공편 수정 시 자동 갱신됨. */
export function flightTimelineItem(
  leg: 'outbound' | 'inbound',
  f: { flightNo?: string; carrier?: string; depAirport?: string; depTime?: string; arrAirport?: string; arrTime?: string },
): Omit<TimelineItem, 'id' | 'projectId' | 'day' | 'order'> {
  const dir = leg === 'outbound' ? '출국' : '귀국';
  const dep = f.depAirport || '출발';
  const arr = f.arrAirport || '도착';
  const name = f.carrier || f.flightNo || '';
  return {
    startTime: f.depTime || '00:00',
    durationMin: 120,
    place: `${dep} → ${arr} ${dir}${name ? ` (${name})` : ''}`,
    lat: null,
    lng: null,
    memo: f.depTime || f.arrTime ? `${dep} (${f.depTime || '-'}) → ${arr} (${f.arrTime || '-'})` : '',
    flightLeg: leg,
  };
}
