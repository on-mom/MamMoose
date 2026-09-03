import { useMemo } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { KIND_LABEL, type Place, type PlaceKind } from '../lib/places';
import { ZONES, zonesOf, type ZoneId } from '../lib/zones';

export type KindFilter = PlaceKind | 'all';
const KINDS: KindFilter[] = ['all', 'landmark', 'food', 'stay'];
const kindLabel = (k: KindFilter) => (k === 'all' ? '전체' : KIND_LABEL[k].split('·')[0]);
export type PlaceSort = 'default' | 'name' | 'price';
const SORTS: [PlaceSort, string][] = [['default', '기본순'], ['name', '이름순'], ['price', '가격순']];

export interface PlaceFilterState {
  /** 상단에 오는 축 */
  primary: 'area' | 'kind';
  /** 선택된 존 id들 (빈 배열 = 전체) */
  zoneSel: string[];
  kind: KindFilter;
  cat: string;
  sort: PlaceSort;
}
export const emptyFilterState: PlaceFilterState = {
  primary: 'area', zoneSel: [], kind: 'all', cat: '전체', sort: 'default',
};

const inZones = (area: string, sel: string[]) =>
  !sel.length || zonesOf(area).some((z) => sel.includes(z));

export function applyPlaceFilter(places: Place[], f: PlaceFilterState): Place[] {
  let r = f.kind === 'all' ? places : places.filter((p) => p.kind === f.kind);
  r = r.filter((p) => inZones(p.area, f.zoneSel));
  if (f.cat !== '전체') r = r.filter((p) => p.category === f.cat);
  if (f.sort === 'name') r = [...r].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  if (f.sort === 'price') r = [...r].sort((a, b) => (a.priceValue ?? Infinity) - (b.priceValue ?? Infinity));
  return r;
}

/** 선택된 필터를 사람이 읽는 짧은 요약 (검색 버튼 옆) */
export function filterSummary(f: PlaceFilterState): string {
  const parts = [f.kind === 'all' && !f.zoneSel.length && f.cat === '전체' ? '관광지·맛집·숙소' : kindLabel(f.kind)];
  if (f.zoneSel.length) {
    const names = f.zoneSel.map((id) => ZONES.find((z) => z.id === id)?.label.split('·')[0] ?? id);
    parts.push(names.slice(0, 2).join('·') + (names.length > 2 ? '…' : ''));
  }
  if (f.cat !== '전체') parts.push(f.cat);
  return parts.join(' / ');
}

/**
 * 1차 지역(넓은 존 6개, 복수) · 2차 종류(3버튼) · 3차 세부+정렬. 상태는 부모 소유(controlled).
 */
export function PlaceFilterControls({
  places, state, onChange,
}: {
  places: Place[];
  state: PlaceFilterState;
  onChange: (next: PlaceFilterState) => void;
}) {
  const set = (patch: Partial<PlaceFilterState>) => onChange({ ...state, ...patch });
  const byKind = (list: Place[]) => (state.kind === 'all' ? list : list.filter((p) => p.kind === state.kind));
  const byZone = (list: Place[]) => list.filter((p) => inZones(p.area, state.zoneSel));

  const zoneCounts = useMemo(() => {
    const src = state.primary === 'kind' ? byKind(places) : places;
    const c: Record<string, number> = {};
    for (const p of src) for (const z of zonesOf(p.area)) c[z] = (c[z] ?? 0) + 1;
    return c;
  }, [places, state.primary, state.kind]);

  const kindCounts = useMemo(() => {
    const src = state.primary === 'area' ? byZone(places) : places;
    const c: Record<string, number> = {};
    for (const p of src) c[p.kind] = (c[p.kind] ?? 0) + 1;
    return c;
  }, [places, state.primary, state.zoneSel]);

  const catOptions = useMemo(() => {
    const base = byKind(state.primary === 'area' ? byZone(places) : places);
    return ['전체', ...[...new Set(base.map((p) => p.category))].sort((a, b) => a.localeCompare(b, 'ko'))];
  }, [places, state.primary, state.zoneSel, state.kind]);

  const toggleZone = (id: ZoneId) =>
    set({ zoneSel: state.zoneSel.includes(id) ? state.zoneSel.filter((x) => x !== id) : [...state.zoneSel, id] });

  const ZoneRow = (
    <div key="zone">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-slate-400">1차 · 지역 (복수)</span>
        {state.zoneSel.length > 0 && (
          <button onClick={() => set({ zoneSel: [] })} className="rounded-full bg-white/5 px-1.5 text-[10px] text-slate-400">전체</button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {ZONES.map((z) => {
          const on = state.zoneSel.includes(z.id);
          const cnt = zoneCounts[z.id] ?? 0;
          return (
            <button
              key={z.id}
              onClick={() => toggleZone(z.id)}
              className={`flex flex-col items-center gap-0.5 rounded-xl border px-1 py-2 text-center transition ${
                on ? 'border-moose-heart bg-moose-heart/15' : 'border-white/5 bg-white/[0.03]'
              }`}
            >
              <span className="text-lg leading-none">{z.emoji}</span>
              <span className={`text-[10px] font-medium leading-tight ${on ? 'text-moose-heart' : 'text-slate-300'}`}>{z.label}</span>
              <span className="text-[9px] text-slate-500">{cnt}곳</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const KindRow = (
    <div key="kind">
      <div className="mb-1.5 text-[11px] font-semibold text-slate-400">2차 · 종류</div>
      <div className="flex gap-1.5">
        {KINDS.map((k) => (
          <button
            key={k}
            onClick={() => set({ kind: k, cat: '전체' })}
            className={`flex-1 rounded-lg px-1 py-2 text-xs font-medium transition ${
              state.kind === k ? 'btn-heart' : 'bg-white/5 text-slate-400'
            }`}
          >
            {kindLabel(k)}
            <span className="ml-1 opacity-60">{k === 'all' ? places.length : (kindCounts[k] ?? 0)}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => set({ primary: state.primary === 'area' ? 'kind' : 'area' })}
          className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[11px] text-slate-300"
        >
          <ArrowUpDown size={12} /> {state.primary === 'area' ? '지역 먼저' : '종류 먼저'}
        </button>
        <select
          value={state.sort}
          onChange={(e) => set({ sort: e.target.value as PlaceSort })}
          className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-slate-300 outline-none"
        >
          {SORTS.map(([v, l]) => <option key={v} value={v} className="bg-moose-edge">{l}</option>)}
        </select>
      </div>

      {state.primary === 'area' ? [ZoneRow, KindRow] : [KindRow, ZoneRow]}

      {catOptions.length > 1 && (
        <div>
          <div className="mb-1.5 text-[11px] font-semibold text-slate-400">3차 · 세부</div>
          <div className="flex flex-wrap gap-1.5">
            {catOptions.map((c) => (
              <button
                key={c}
                onClick={() => set({ cat: c })}
                className={`rounded-full px-3 py-1.5 text-xs transition ${
                  c === state.cat ? 'bg-white/15 text-white' : 'bg-white/5 text-slate-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
