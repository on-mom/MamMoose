import { useMemo } from 'react';
import { Heart, MapPin } from 'lucide-react';
import { useAppStore, useActiveProject } from '../store/useAppStore';
import { useMemberNames } from '../lib/members';
import { MooseEmpty } from '../components/Moose';
import CoupleMoose from '../components/CoupleMoose';

const dayLabel = (start: string, day: number) => {
  const d = new Date(start + 'T00:00:00');
  d.setDate(d.getDate() + day - 1);
  return `${day}일차 · ${d.getMonth() + 1}/${d.getDate()}`;
};

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

/** MY › 추억함 — 참여자 전원이 좋아요 한 타임라인 항목(교집합) 모아보기. 여행 후 회고용. */
export default function MemoriesView() {
  const project = useActiveProject()!;
  const picks = useMemoryPicks();

  return (
    <div className="space-y-3 overflow-y-auto pb-2">
      {/* 커플 맘무 일러스트 */}
      <div className="flex flex-col items-center gap-1 rounded-2xl bg-gradient-to-b from-moose-heart/15 to-transparent py-4">
        <CoupleMoose className="mb-1" />
        <div className="font-title text-sm font-bold text-white">우리 추억함</div>
        <div className="text-[11px] text-slate-400">둘 다 ♥ 누른 곳 {picks.length}곳</div>
      </div>

      {picks.length === 0 && (
        <MooseEmpty
          line="둘 다 좋아한 곳이 아직 없어요"
          sub="일정 › 타임라인 [읽기] 모드에서 좋아요를 남겨보세요"
        />
      )}

      {picks.map((it) => {
        const comments = it.comments ?? [];
        return (
          <div key={it.id} className="rounded-xl border border-white/5 bg-moose-dusk/70 p-3">
            <div className="flex items-center gap-2">
              <Heart size={13} className="shrink-0 text-moose-heart" fill="currentColor" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{it.place}</span>
              {it.lat != null && <MapPin size={11} className="shrink-0 text-emerald-500" />}
            </div>
            <div className="mt-0.5 text-[10px] text-slate-500">{dayLabel(project.startDate, it.day)} · {it.startTime}</div>
            {it.memo && <div className="mt-1 text-[12px] text-slate-400">{it.memo}</div>}
            {comments.length > 0 && (
              <div className="mt-2 space-y-1 border-t border-white/5 pt-2">
                {comments.map((c) => (
                  <div key={c.id} className="text-[12px]">
                    <span className="font-semibold text-slate-300">{c.author}</span>
                    <span className="text-slate-400"> · {c.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
