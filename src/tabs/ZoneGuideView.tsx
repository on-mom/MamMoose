import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AREA_GUIDES } from '../data/zoneGuide';

/** 일정 › 구역 가이드 — 구역별 한 줄 소개 + 필수 코스·맛집·카페·쇼핑·분위기 (xlsx "지역별 특성"). */
export default function ZoneGuideView() {
  const [open, setOpen] = useState<string>(AREA_GUIDES[0].id);

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

  return (
    <div className="flex h-full flex-col">
      <div className="edge min-h-0 flex-1 space-y-1.5 overflow-y-auto py-3">
        <p className="px-0.5 text-[10px] text-slate-500">구역별 한 줄 소개와 필수 코스·맛집·카페·쇼핑·분위기</p>
        {AREA_GUIDES.map((g) => {
          const isOpen = open === g.id;
          return (
            <div key={g.id} className="overflow-hidden rounded-xl border border-white/5 bg-moose-dusk/70">
              <button
                onClick={() => setOpen(isOpen ? '' : g.id)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white">{g.name} <span className="text-[10px] font-normal text-slate-500">{g.en}</span></div>
                  <div className="truncate text-[11px] text-slate-400">{g.intro}</div>
                </div>
                <ChevronDown size={15} className={`shrink-0 text-slate-500 transition ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="space-y-2.5 border-t border-white/5 px-3 py-3">
                  <Row label="필수 코스" items={g.mustSee} />
                  <Row label="맛집" items={g.food} />
                  <Row label="카페 (연유커피)" items={[g.cafe]} />
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
