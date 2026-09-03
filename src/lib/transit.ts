import { useEffect, useMemo, useState } from 'react';
import type { TimelineItem } from '../types';
import { computeDriveMin } from './hanoiAccess';

const toMin = (t: string) => {
  const [h, m] = (t || '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
const pairKey = (a: TimelineItem, b: TimelineItem) => `${a.lat},${a.lng}|${b.lat},${b.lng}`;

export interface TransitWarn {
  needMin: number;
  gapMin: number;
  source: 'drive' | 'est';
}

/**
 * 하루 일정(순서대로)에서 "다음 일정까지 이동 시간이 남은 여유보다 큰" 지점을 찾는다.
 * 두 항목 모두 좌표가 있으면 구글 Distance Matrix 실시간 값, 없으면 사용자의 '이동(분)' 추정.
 * 반환: { 앞 항목 id → 경고 }
 */
export function useDayTransit(items: TimelineItem[]): Record<string, TransitWarn> {
  const [drive, setDrive] = useState<Record<string, number | null>>({});
  const sig = items.map((i) => `${i.id}:${i.lat},${i.lng}:${i.startTime}`).join('|');

  useEffect(() => {
    let live = true;
    (async () => {
      for (let i = 0; i < items.length - 1; i++) {
        const a = items[i];
        const b = items[i + 1];
        if (a.lat == null || b.lat == null) continue;
        const k = pairKey(a, b);
        if (k in drive) continue;
        const m = await computeDriveMin({ lat: a.lat!, lng: a.lng! }, { lat: b.lat!, lng: b.lng! });
        if (!live) return;
        setDrive((d) => ({ ...d, [k]: m }));
        await new Promise((r) => setTimeout(r, 130));
      }
    })();
    return () => { live = false; };
  }, [sig]); // eslint-disable-line

  return useMemo(() => {
    const out: Record<string, TransitWarn> = {};
    for (let i = 0; i < items.length - 1; i++) {
      const a = items[i];
      const b = items[i + 1];
      const gap = toMin(b.startTime) - toMin(a.startTime);
      if (gap <= 0) continue; // 같거나 역전된 시각은 별도(겹침 경고는 안 함)
      const dm = a.lat != null && b.lat != null ? drive[pairKey(a, b)] : null;
      const need = dm ?? a.durationMin;
      if (need > 0 && gap < need) {
        out[a.id] = { needMin: need, gapMin: gap, source: dm != null ? 'drive' : 'est' };
      }
    }
    return out;
  }, [items, drive]);
}
