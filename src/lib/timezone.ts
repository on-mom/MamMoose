import type { Project, TimelineItem } from '../types';

const DEFAULT_TZ = 'Asia/Ho_Chi_Minh';

/** 유효하지 않은 타임존이면 기본값으로 대체 (잘못된 값이 앱을 죽이지 않도록) */
export function safeTz(tz?: string): string {
  if (!tz) return DEFAULT_TZ;
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TZ;
  }
}

/** 특정 IANA 타임존 기준의 벽시계 시각 (분 단위, 자정=0) + YYYY-MM-DD */
export function wallClock(tz: string, now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTz(tz),
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(now);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  const hour = g('hour') === '24' ? 0 : Number(g('hour'));
  return {
    date: `${g('year')}-${g('month')}-${g('day')}`,
    minutes: hour * 60 + Number(g('minute')),
    hhmm: `${String(hour).padStart(2, '0')}:${g('minute')}`,
  };
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);

/**
 * 현지(프로젝트 타임존) 현재 시각 기준으로 스크롤/하이라이트할 타임라인 위치 계산.
 * - 여행 전: 1일차 첫 항목
 * - 여행 중: 오늘 일차에서 현재 시각을 막 지났거나 곧 시작할 항목
 * - 여행 후: 마지막 일차 마지막 항목
 */
export function computeFocus(project: Project, items: TimelineItem[], now: Date = new Date()) {
  const tz = safeTz(project.timezone);
  const local = wallClock(tz, now);
  const device = wallClock(Intl.DateTimeFormat().resolvedOptions().timeZone, now);
  const totalDays = Math.max(1, daysBetween(project.startDate, project.endDate) + 1);
  const dayOffset = daysBetween(project.startDate, local.date);
  const currentDay = Math.min(Math.max(dayOffset + 1, 1), totalDays);

  const inTrip = dayOffset >= 0 && dayOffset < totalDays;
  const dayItems = items
    .filter((i) => i.day === currentDay)
    .sort((a, b) => a.order - b.order || toMin(a.startTime) - toMin(b.startTime));

  let focusId: string | null = null;
  if (dayItems.length) {
    if (!inTrip) {
      focusId = dayOffset < 0 ? dayItems[0].id : dayItems[dayItems.length - 1].id;
    } else {
      // 현재 시각 이후 첫 항목, 없으면 마지막 항목
      const upcoming = dayItems.find((i) => toMin(i.startTime) + i.durationMin >= local.minutes);
      focusId = (upcoming ?? dayItems[dayItems.length - 1]).id;
    }
  }

  return {
    day: currentDay,
    focusId,
    inTrip,
    localHHMM: local.hhmm,
    deviceHHMM: device.hhmm,
    localTz: tz,
    deviceTz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
