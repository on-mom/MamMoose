import { useMemo, useState, type ReactNode } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { KIND_LABEL, splitAreas, type Place, type PlaceKind } from '../lib/places';

const KINDS: PlaceKind[] = ['landmark', 'food', 'stay'];
type Sort = 'default' | 'name' | 'price';
const SORTS: [Sort, string][] = [['default', '기본순'], ['name', '이름순'], ['price', '가격순']];

/**
 * 1차 지역(다중) · 2차 종류(3버튼) · 3차 세부+정렬 필터.
 * 1↔2차 표시 순서 토글. 결과를 render(filtered) 로 넘긴다.
 * 일정 › 장소 탭과 '추천 스팟 담기' 모달에서 공용.
 */
export default function PlaceFilter({
  places, render, compact,
}: {
  places: Place[];
  render: (filtered: Place[], count: number) => ReactNode;
  compact?: boolean;
}) {
  const [primary, setPrimary] = useState<'area' | 'kind'>('area');
  const [areaSel, setAreaSel] = useState<Set<string>>(new Set());
  const [kind, setKind] = useState<PlaceKind>('food');
  const [cat, setCat] = useState('전체');
  const [sort, setSort] = useState<Sort>('default');

  const byArea = (list: Place[]) =>
    areaSel.size ? list.filter((p) => splitAreas(p.area).some((a) => areaSel.has(a))) : list;
  const byKind = (list: Place[]) => list.filter((p) => p.kind === kind);

  // 보조 행 옵션은 주 행 결과 기준
  const areaOptions = useMemo(() => {
    const src = primary === 'kind' ? byKind(places) : places;
    const set = new Set<string>();
    for (const p of src) splitAreas(p.area).forEach((a) => set.add(a));
    return [...set].sort((a, b) => a.localeCompare(b, 'ko'));
  }, [places, primary, kind]);

  const kindCounts = useMemo(() => {
    const src = primary === 'area' ? byArea(places) : places;
    const c: Record<string, number> = {};
    for (const p of src) c[p.kind] = (c[p.kind] ?? 0) + 1;
    return c;
  }, [places, primary, areaSel]);

  const catOptions = useMemo(() => {
    const base = byKind(primary === 'area' ? byArea(places) : places);
    return ['전체', ...[...new Set(base.map((p) => p.category))].sort((a, b) => a.localeCompare(b, 'ko'))];
  }, [places, primary, areaSel, kind]);

  const filtered = useMemo(() => {
    let r = byKind(byArea(places));
    if (cat !== '전체') r = r.filter((p) => p.category === cat);
    if (sort === 'name') r = [...r].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    if (sort === 'price') r = [...r].sort((a, b) => (a.priceValue ?? Infinity) - (b.priceValue ?? Infinity));
    return r;
  }, [places, areaSel, kind, cat, sort]);

  const toggleArea = (a: string) =>
    setAreaSel((s) => { const n = new Set(s); n.has(a) ? n.delete(a) : n.add(a); return n; });

  const AreaRow = (
    <div key="area">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="text-[10px] font-semibold text-slate-500">1차 · 지역</span>
        {areaSel.size > 0 && (
          <button onClick={() => setAreaSel(new Set())} className="rounded-full bg-white/5 px-1.5 text-[10px] text-slate-400">전체</button>
        )}
      </div>
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
        {areaOptions.map((a) => {
          const on = areaSel.has(a);
          return (
            <button
              key={a}
              onClick={() => toggleArea(a)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] transition ${
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
      <div className="mb-1 text-[10px] font-semibold text-slate-500">2차 · 종류</div>
      <div className="flex gap-1.5">
        {KINDS.map((k) => (
          <button
            key={k}
            onClick={() => { setKind(k); setCat('전체'); }}
            className={`flex-1 rounded-lg px-1 py-1.5 text-[10.5px] font-medium transition ${
              kind === k ? 'btn-heart' : 'bg-white/5 text-slate-400'
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
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setPrimary((p) => (p === 'area' ? 'kind' : 'area'))}
          className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[10px] text-slate-300"
        >
          <ArrowUpDown size={11} /> {primary === 'area' ? '지역 먼저' : '종류 먼저'}
        </button>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-slate-300 outline-none"
        >
          {SORTS.map(([v, l]) => <option key={v} value={v} className="bg-moose-edge">{l}</option>)}
        </select>
      </div>

      {primary === 'area' ? [AreaRow, KindRow] : [KindRow, AreaRow]}

      {!compact && catOptions.length > 1 && (
        <div>
          <div className="mb-1 text-[10px] font-semibold text-slate-500">3차 · 세부</div>
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
            {catOptions.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10.5px] transition ${
                  c === cat ? 'bg-white/15 text-white' : 'bg-white/5 text-slate-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {render(filtered, filtered.length)}
    </div>
  );
}
