import { useMemo } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { KIND_LABEL, splitAreas, type Place, type PlaceKind } from '../lib/places';

const KINDS: PlaceKind[] = ['landmark', 'food', 'stay'];
export type PlaceSort = 'default' | 'name' | 'price';
const SORTS: [PlaceSort, string][] = [['default', '기본순'], ['name', '이름순'], ['price', '가격순']];

export interface PlaceFilterState {
  /** 상단에 오는 축 */
  primary: 'area' | 'kind';
  areaSel: string[];
  kind: PlaceKind;
  cat: string;
  sort: PlaceSort;
}
export const emptyFilterState: PlaceFilterState = {
  primary: 'area', areaSel: [], kind: 'food', cat: '전체', sort: 'default',
};

export function applyPlaceFilter(places: Place[], f: PlaceFilterState): Place[] {
  let r = places.filter((p) => p.kind === f.kind);
  if (f.areaSel.length) r = r.filter((p) => splitAreas(p.area).some((a) => f.areaSel.includes(a)));
  if (f.cat !== '전체') r = r.filter((p) => p.category === f.cat);
  if (f.sort === 'name') r = [...r].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  if (f.sort === 'price') r = [...r].sort((a, b) => (a.priceValue ?? Infinity) - (b.priceValue ?? Infinity));
  return r;
}

/** 선택된 필터를 사람이 읽는 짧은 요약 (검색 버튼 옆 칩) */
export function filterSummary(f: PlaceFilterState): string {
  const parts = [KIND_LABEL[f.kind].split('·')[0]];
  if (f.areaSel.length) parts.push(f.areaSel.slice(0, 2).join('·') + (f.areaSel.length > 2 ? '…' : ''));
  if (f.cat !== '전체') parts.push(f.cat);
  return parts.join(' / ');
}

/**
 * 1차 지역(다중) · 2차 종류(3버튼) · 3차 세부+정렬. 상태는 부모가 소유(controlled).
 * 일정 › 장소 검색 시트 · '추천 스팟 담기' 모달 공용.
 */
export function PlaceFilterControls({
  places, state, onChange,
}: {
  places: Place[];
  state: PlaceFilterState;
  onChange: (next: PlaceFilterState) => void;
}) {
  const set = (patch: Partial<PlaceFilterState>) => onChange({ ...state, ...patch });
  const byKind = (list: Place[]) => list.filter((p) => p.kind === state.kind);
  const byArea = (list: Place[]) =>
    state.areaSel.length ? list.filter((p) => splitAreas(p.area).some((a) => state.areaSel.includes(a))) : list;

  const areaOptions = useMemo(() => {
    const src = state.primary === 'kind' ? byKind(places) : places;
    const s = new Set<string>();
    for (const p of src) splitAreas(p.area).forEach((a) => s.add(a));
    return [...s].sort((a, b) => a.localeCompare(b, 'ko'));
  }, [places, state.primary, state.kind]);

  const kindCounts = useMemo(() => {
    const src = state.primary === 'area' ? byArea(places) : places;
    const c: Record<string, number> = {};
    for (const p of src) c[p.kind] = (c[p.kind] ?? 0) + 1;
    return c;
  }, [places, state.primary, state.areaSel]);

  const catOptions = useMemo(() => {
    const base = byKind(state.primary === 'area' ? byArea(places) : places);
    return ['전체', ...[...new Set(base.map((p) => p.category))].sort((a, b) => a.localeCompare(b, 'ko'))];
  }, [places, state.primary, state.areaSel, state.kind]);

  const toggleArea = (a: string) =>
    set({ areaSel: state.areaSel.includes(a) ? state.areaSel.filter((x) => x !== a) : [...state.areaSel, a] });

  const AreaRow = (
    <div key="area">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-slate-400">1차 · 지역 (복수)</span>
        {state.areaSel.length > 0 && (
          <button onClick={() => set({ areaSel: [] })} className="rounded-full bg-white/5 px-1.5 text-[10px] text-slate-400">지역 전체</button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {areaOptions.map((a) => {
          const on = state.areaSel.includes(a);
          return (
            <button
              key={a}
              onClick={() => toggleArea(a)}
              className={`rounded-full px-3 py-1.5 text-xs transition ${
                on ? 'bg-moose-heart/25 text-moose-heart ring-1 ring-moose-heart/40' : 'bg-white/5 text-slate-400'
              }`}
            >
              {a}
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
            {KIND_LABEL[k].split('·')[0]}
            <span className="ml-1 opacity-60">{kindCounts[k] ?? 0}</span>
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

      {state.primary === 'area' ? [AreaRow, KindRow] : [KindRow, AreaRow]}

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
