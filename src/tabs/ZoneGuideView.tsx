import { useState } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import { useActiveProject } from '../store/useAppStore';
import { regionFor } from '../data/regions';

/** 일정 › 구역 가이드 — 여행지별 구역 소개 + 필수 코스·맛집·카페·쇼핑·분위기. */
export default function ZoneGuideView() {
  const project = useActiveProject();
  const region = regionFor(project?.destination, project?.timezone, project?.name);
  const guides = region?.zoneGuide ?? [];
  const [open, setOpen] = useState<string>(guides[0]?.id ?? '');

  const Row = ({ label, items }: { label: string; items: { place: string; desc?: string }[] }) => (
    <div>
      <div className="text-[10px] font-semibold text-moose-heart">{label}</div>
      {items.map((it, i) => (
        <div key={i} className="mt-0.5 text-[12px]">
          <span className="font-medium text-slate-100">{it.place}</span>
          {it.desc && <span className="text-slate-400"> · {it.desc}</span>}
        </div>
      ))}
    </div>
  );

  if (!guides.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
        <MapPin size={28} className="text-slate-600" />
        <p className="text-sm text-slate-400">{project?.destination || '이 여행지'} 구역 가이드는 아직 준비 중이에요</p>
        <p className="text-[11px] text-slate-600">
          현재 하노이·오사카·도쿄·후쿠오카·방콕 지원 · 탐색 탭에서 장소를 직접 검색·추가할 수 있어요
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="edge min-h-0 flex-1 space-y-1.5 overflow-y-auto py-3">
        <p className="px-0.5 text-[10px] text-slate-500">{region?.label} · 구역별 소개와 필수 코스·맛집·카페·쇼핑·분위기</p>
        {guides.map((g) => {
          const isOpen = open === g.id;
          return (
            <div key={g.id} className="overflow-hidden rounded-xl border border-white/5 bg-moose-dusk/70">
              <button onClick={() => setOpen(isOpen ? '' : g.id)} className="block w-full text-left">
                {g.photo ? (
                  <div className="relative h-28 w-full">
                    <img src={g.photo} alt={g.name} loading="lazy" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                    {g.credit && <span className="absolute right-1.5 top-1.5 rounded bg-black/45 px-1 py-0.5 text-[8px] text-white/70">{g.credit}</span>}
                    <div className="absolute inset-x-3 bottom-1.5 flex items-end justify-between gap-2">
                      <div className="text-sm font-bold text-white drop-shadow">
                        {g.name} <span className="text-[10px] font-normal text-white/60">{g.en}</span>
                      </div>
                      <ChevronDown size={16} className={`mb-0.5 shrink-0 text-white/80 transition ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
                    <div className="text-sm font-bold text-white">
                      {g.name} <span className="text-[10px] font-normal text-slate-500">{g.en}</span>
                    </div>
                    <ChevronDown size={15} className={`shrink-0 text-slate-500 transition ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                )}
                <div className="px-3 py-2 text-[11px] text-slate-400">{g.intro}</div>
              </button>
              {isOpen && (
                <div className="space-y-2.5 border-t border-white/5 px-3 py-3">
                  <Row label="필수 코스" items={g.mustSee} />
                  <Row label="맛집" items={g.food} />
                  <Row label="카페" items={[g.cafe]} />
                  <Row label="쇼핑" items={[g.shopping]} />
                  <Row label="현지 분위기" items={[g.vibe]} />
                  <Row label="놀이시설" items={[g.play]} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
