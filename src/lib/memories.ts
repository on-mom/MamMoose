import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useMemberNames } from './members';

/** 참여자 전원이 좋아요 한 타임라인 항목(교집합) */
export function useMemoryPicks() {
  const timeline = useAppStore((s) => s.present[s.activeProjectId]?.timeline ?? []);
  const members = useMemberNames();
  return useMemo(() => {
    if (members.length === 0) return [];
    return [...timeline]
      .filter((it) => {
        const likes = it.likes ?? [];
        return likes.length > 0 && members.every((m) => likes.includes(m));
      })
      .sort((a, b) => a.day - b.day || a.order - b.order);
  }, [timeline, members]);
}

/** 오늘이 여행 종료일을 지났는지 */
export function tripEnded(p: { endDate: string }) {
  return new Date().toISOString().slice(0, 10) > p.endDate;
}
