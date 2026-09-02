import { useMemo, useRef, useState } from 'react';
import {
  DndContext, KeyboardSensor, PointerSensor, TouchSensor,
  closestCenter, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, ExternalLink, ChevronsUpDown, SlidersHorizontal, Copy, MapPin, GripVertical, Utensils, X,
} from 'lucide-react';
import type { Restaurant, Hotel } from '../types';
import { useAppStore, useActiveProject } from '../store/useAppStore';
import { uid } from '../lib/uid';
import { commas } from '../lib/currency';
import { coordsForArea, AREA_COORDS } from '../lib/areaCoords';
import Modal from '../components/Modal';
import DataTable, { type Column } from '../components/DataTable';
import { accessForArea, fmtVnd } from '../lib/hanoiAccess';

type ColKey = 'nameKo' | 'area' | 'priceVndAvg' | 'link';
const COLS: Record<ColKey, { label: string; w: number; sortable: boolean }> = {
  nameKo: { label: '장소명', w: 148, sortable: true },
  area: { label: '구역', w: 96, sortable: true },
  priceVndAvg: { label: '2인 VND', w: 92, sortable: true },
  link: { label: '바로가기', w: 62, sortable: false },
};
const DEFAULT_ORDER: ColKey[] = ['nameKo', 'area', 'priceVndAvg', 'link'];

const BBOX = { latMax: 21.10, latMin: 20.98, lngMin: 105.74, lngMax: 105.9 };
const disp = (r: Restaurant) => r.nameKo || r.name;
const won = (t: string) => Number((t.match(/[\d,]+/)?.[0] ?? '0').replace(/,/g, '')) * (/만/.test(t) ? 10000 : 1);
const mapQ = (name: string) => `https://maps.google.com/?q=${encodeURIComponent(name + ' Hanoi')}`;

export default function RestaurantsTab() {
  const [view, setView] = useState<'food' | 'stay'>('food');
  return (
    <div className="edge space-y-3 py-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-title text-xl font-bold text-white">{view === 'food' ? '맛집 · 카페 · 쇼핑' : '숙소 후보'}</h2>
      </div>
      <div className="flex gap-1 rounded-lg bg-moose-dusk p-1 text-xs">
        {([['food', '맛집·카페·쇼핑'], ['stay', '숙소']] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setView(k)}
            className={`flex-1 rounded-md py-1.5 ${view === k ? 'btn-heart' : 'text-slate-400'}`}
          >
            {l}
          </button>
        ))}
      </div>
      {view === 'food' ? <FoodView /> : <StayView />}
    </div>
  );
}

function FoodView() {
  const project = useActiveProject()!;
  const list = useAppStore((s) => s.present[s.activeProjectId]?.restaurants ?? []);
  const mutate = useAppStore((s) => s.mutate);

  const categories = useMemo(
    () => ['전체', ...Array.from(new Set(list.map((r) => r.category)))],
    [list],
  );
  // 복합 구역("바딘/올드쿼터")은 개별 토큰으로 분리
  const areas = useMemo(() => {
    const set = new Set<string>();
    for (const r of list) r.area.split(/[/·,]/).map((a) => a.trim()).filter(Boolean).forEach((a) => set.add(a));
    return [...set].sort((a, b) => a.localeCompare(b, 'ko'));
  }, [list]);

  const [cat, setCat] = useState('전체');
  const [order, setOrder] = useState<ColKey[]>(DEFAULT_ORDER);
  const [hidden, setHidden] = useState<Set<ColKey>>(new Set());
  const [nameQ, setNameQ] = useState('');
  const [areaSel, setAreaSel] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{ key: ColKey; dir: 1 | -1 } | null>(null);
  const [adding, setAdding] = useState(false);
  const [detail, setDetail] = useState<Restaurant | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [colsOpen, setColsOpen] = useState(false);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const visibleCols = order.filter((k) => !hidden.has(k));

  const rows = useMemo(() => {
    let r = list.filter((x) => cat === '전체' || x.category === cat);
    if (nameQ) r = r.filter((x) => (disp(x) + x.name).toLowerCase().includes(nameQ.toLowerCase()));
    if (areaSel.size) r = r.filter((x) => [...areaSel].some((a) => x.area.includes(a)));
    if (sort) {
      r = [...r].sort((a, b) => {
        const av = sort.key === 'nameKo' ? disp(a) : (a as any)[sort.key];
        const bv = sort.key === 'nameKo' ? disp(b) : (b as any)[sort.key];
        return (typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv), 'ko')) * sort.dir;
      });
    }
    return r;
  }, [list, cat, nameQ, areaSel, sort]);

  const selectedRow = rows.find((r) => r.id === selected) ?? null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );
  const onColDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setOrder((o) => arrayMove(o, o.indexOf(active.id as ColKey), o.indexOf(over.id as ColKey)));
  };
  const toggleSort = (k: ColKey) => {
    if (!COLS[k].sortable) return;
    setSort((s) => (s?.key === k ? (s.dir === 1 ? { key: k, dir: -1 } : null) : { key: k, dir: 1 }));
  };
  const toggleArea = (a: string) =>
    setAreaSel((s) => {
      const n = new Set(s);
      n.has(a) ? n.delete(a) : n.add(a);
      return n;
    });
  const pickRow = (r: Restaurant) => {
    setSelected(r.id);
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const remove = (id: string) =>
    mutate((doc) => { doc.restaurants = doc.restaurants.filter((x) => x.id !== id); });

  return (
    <div className="space-y-2.5" onClick={() => setColsOpen(false)}>
      {/* 카테고리 (단일 선택) */}
      <div className="no-scrollbar -mx-2.5 flex gap-1.5 overflow-x-auto px-2.5">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              c === cat ? 'btn-heart' : 'bg-white/5 text-slate-300'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* 구역 (다중 선택 칩) */}
      <div className="no-scrollbar -mx-2.5 flex items-center gap-1.5 overflow-x-auto px-2.5">
        <span className="shrink-0 pr-0.5 text-[10px] font-semibold text-slate-500">구역</span>
        {areaSel.size > 0 && (
          <button
            onClick={() => setAreaSel(new Set())}
            className="shrink-0 rounded-full bg-white/5 px-2 py-1 text-[11px] text-slate-400"
          >
            전체
          </button>
        )}
        {areas.map((a) => {
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

      <div ref={mapRef}>
        <MiniMap rows={rows} selected={selectedRow} onPick={pickRow} />
      </div>

      <div className="flex items-center justify-between px-0.5 text-xs text-slate-400">
        <span>{rows.length}곳{areaSel.size ? ` · ${[...areaSel].join(', ')}` : ''}</span>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setColsOpen((v) => !v); }}
              className="flex items-center gap-1 text-slate-400"
            >
              <SlidersHorizontal size={13} /> 열
            </button>
            {colsOpen && (
              <div
                className="modal-surface absolute right-0 z-30 mt-1.5 w-36 space-y-0.5 rounded-xl p-2 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-1 pb-1 text-[10px] text-slate-500">표시할 열</div>
                {order.map((k) => (
                  <label key={k} className="flex items-center gap-2 rounded-lg px-1 py-1 text-slate-200 hover:bg-white/5">
                    <input
                      type="checkbox"
                      className="accent-moose-heart"
                      checked={!hidden.has(k)}
                      onChange={() =>
                        setHidden((h) => {
                          const n = new Set(h);
                          n.has(k) ? n.delete(k) : n.add(k);
                          return n;
                        })
                      }
                    />
                    {COLS[k].label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setAdding((v) => !v)} className="flex items-center gap-1 text-moose-heart">
            <Plus size={14} /> 수기 등록
          </button>
        </div>
      </div>

      {adding && <AddForm projectId={project.id} onDone={() => setAdding(false)} />}

      {/* 테이블 */}
      <div className="no-scrollbar -mx-2.5 overflow-x-auto px-2.5">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onColDragEnd}>
          <table className="border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
            <colgroup>{visibleCols.map((k) => <col key={k} style={{ width: COLS[k].w }} />)}</colgroup>
            <thead>
              <tr className="text-left text-slate-400">
                <SortableContext items={visibleCols} strategy={horizontalListSortingStrategy}>
                  {visibleCols.map((k) => (
                    <HeaderCell key={k} col={k} sort={sort} onSort={() => toggleSort(k)} />
                  ))}
                </SortableContext>
              </tr>
              {visibleCols.includes('nameKo') && (
                <tr>
                  {visibleCols.map((k) => (
                    <th key={k} className="px-1.5 pb-1.5">
                      {k === 'nameKo' && (
                        <input
                          value={nameQ}
                          onChange={(e) => setNameQ(e.target.value)}
                          placeholder="장소 검색"
                          className="w-full rounded-lg bg-white/5 px-2 py-1 text-[11px] font-normal text-slate-200 outline-none ring-1 ring-white/5 placeholder:text-slate-600"
                        />
                      )}
                    </th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => pickRow(r)}
                  className={`cursor-pointer transition ${
                    r.id === selected ? 'bg-moose-heart/10' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {visibleCols.map((k, ci) => (
                    <td
                      key={k}
                      className={`truncate border-b border-white/5 px-1.5 py-2.5 text-slate-200 ${
                        ci === 0 ? 'rounded-l-lg' : ''
                      } ${ci === visibleCols.length - 1 ? 'rounded-r-lg' : ''}`}
                    >
                      {k === 'nameKo' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setDetail(r); }}
                          className="max-w-full truncate text-left font-medium text-white"
                        >
                          {disp(r)}
                          {r.custom && <span className="ml-1 text-[9px] text-moose-heart">직접</span>}
                        </button>
                      )}
                      {k === 'area' && <span className="text-slate-400">{r.area}</span>}
                      {k === 'priceVndAvg' && (r.priceVndAvg ? commas(r.priceVndAvg) : '-')}
                      {k === 'link' && r.mapUrl && (
                        <a
                          href={r.mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-0.5 text-moose-heart"
                        >
                          <ExternalLink size={12} /> 지도
                        </a>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </DndContext>
        {rows.length === 0 && (
          <p className="py-10 text-center text-xs text-slate-600">조건에 맞는 장소가 없어요</p>
        )}
      </div>

      {/* 상세 팝업 */}
      {detail && (
        <Modal
          onClose={() => setDetail(null)}
          title={
            <>
              <div className="font-title text-lg font-bold leading-tight text-white">{disp(detail)}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-slate-400">
                {detail.name}
                <button
                  onClick={() => navigator.clipboard?.writeText(detail.name)}
                  className="rounded p-0.5 text-slate-500 hover:text-moose-heart"
                  title="원어명 복사 (구글맵 검색용)"
                >
                  <Copy size={12} />
                </button>
              </div>
            </>
          }
          footer={
            <div className="flex gap-2">
              <a
                href={detail.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-heart flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold"
              >
                <MapPin size={15} /> 구글 지도에서 열기
              </a>
              {detail.custom && (
                <button
                  onClick={() => { remove(detail.id); setDetail(null); }}
                  className="rounded-xl border border-white/10 px-3 text-slate-400"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          }
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-slate-300">{detail.category}</span>
              {detail.area && <span className="rounded-full bg-white/5 px-2 py-0.5 text-slate-300">📍 {detail.area}</span>}
            </div>

            {detail.menu && (
              <div className="flex gap-2 rounded-xl bg-moose-heart/10 p-3">
                <Utensils size={15} className="mt-0.5 shrink-0 text-moose-heart" />
                <div>
                  <div className="text-[11px] font-semibold text-moose-heart">추천 메뉴</div>
                  <div className="text-[13px] text-slate-100">{detail.menu}</div>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-white/[0.04] p-3 text-xs">
              <div className="text-slate-500">2인 평균</div>
              <div className="text-sm font-semibold text-slate-100">{detail.priceVndText || '-'}</div>
              {detail.priceKrwText && <div className="text-emerald-400">{detail.priceKrwText}</div>}
            </div>

            {detail.note && (
              <div className="text-[13px] leading-relaxed text-slate-300">
                <span className="text-slate-500">이 집은요 · </span>
                {detail.note}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- 드래그 가능한 헤더 ---------- */
function HeaderCell({
  col, sort, onSort,
}: {
  col: ColKey;
  sort: { key: ColKey; dir: 1 | -1 } | null;
  onSort: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col });
  const c = COLS[col];
  return (
    <th
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="select-none whitespace-nowrap px-1.5 pb-1.5 pt-1 font-medium"
    >
      <div className="flex items-center gap-1">
        <span className="cursor-grab touch-none text-slate-700 active:cursor-grabbing" {...attributes} {...listeners}>
          <GripVertical size={11} />
        </span>
        <button onClick={onSort} className={`flex items-center gap-0.5 ${c.sortable ? '' : 'cursor-default'}`}>
          {c.label}
          {c.sortable && (
            sort?.key === col
              ? <span className="text-[9px] text-moose-heart">{sort.dir === 1 ? '▲' : '▼'}</span>
              : <ChevronsUpDown size={10} className="text-slate-700" />
          )}
        </button>
      </div>
    </th>
  );
}

/* ---------- 미니맵 ---------- */
function MiniMap({
  rows, selected, onPick,
}: { rows: Restaurant[]; selected: Restaurant | null; onPick: (r: Restaurant) => void }) {
  const toXY = (lat: number, lng: number) => ({
    x: ((lng - BBOX.lngMin) / (BBOX.lngMax - BBOX.lngMin)) * 100,
    y: ((BBOX.latMax - lat) / (BBOX.latMax - BBOX.latMin)) * 100,
  });
  const pts = rows.slice(0, 60).map((r, i) => {
    const c = coordsForArea(r.area);
    const j = (i % 5) * 0.004 - 0.008;
    return { r, ...toXY(c.lat + j, c.lng + j) };
  });
  const sel = selected ? pts.find((p) => p.r.id === selected.id) : null;

  return (
    <div className="card relative h-32 overflow-hidden !border-white/5 bg-[radial-gradient(circle_at_50%_30%,#241d2e,#171320)]">
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:22px_22px]" />
      <span className="absolute left-2.5 top-2 z-10 text-[10px] text-slate-500">
        {selected ? `📍 ${disp(selected)} · ${selected.area}` : 'Daily 동선 미니맵 · 행을 누르면 위치 표시'}
      </span>
      {pts.map((p) => (
        <button
          key={p.r.id}
          onClick={() => onPick(p.r)}
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all ${
            sel && p.r.id === sel.r.id
              ? 'z-20 h-3 w-3 bg-moose-heart shadow-[0_0_0_5px_rgba(238,134,169,0.25)]'
              : 'h-1.5 w-1.5 bg-slate-500/70'
          }`}
        />
      ))}
    </div>
  );
}

/* ---------- 수기 등록 ---------- */
function AddForm({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const mutate = useAppStore((s) => s.mutate);
  const [f, setF] = useState({ nameKo: '', name: '', category: '', area: '', mapUrl: '', priceVndText: '', menu: '', note: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const areas = Object.keys(AREA_COORDS);

  const submit = () => {
    const display = f.nameKo.trim() || f.name.trim();
    if (!display) return;
    mutate((doc) => {
      doc.restaurants.unshift({
        id: uid(), projectId,
        name: f.name.trim() || display,
        nameKo: f.nameKo.trim() || undefined,
        category: f.category.trim() || '기타',
        area: f.area.trim(),
        mapUrl: f.mapUrl.trim() || `https://maps.google.com/?q=${encodeURIComponent((f.name || display) + ' Hanoi')}`,
        priceVndText: f.priceVndText.trim(), priceKrwText: '',
        priceVndAvg: Number((f.priceVndText.match(/[\d,]+/)?.[0] ?? '').replace(/,/g, '')) || 0,
        menu: f.menu.trim() || undefined,
        note: f.note.trim(), custom: true,
      });
    });
    onDone();
  };

  const inp = 'w-full rounded-lg bg-white/5 px-2.5 py-2 text-slate-100 outline-none ring-1 ring-white/5 placeholder:text-slate-600';
  return (
    <div className="card space-y-2 p-3 text-xs">
      <input value={f.nameKo} onChange={set('nameKo')} placeholder="장소명 (한국어 표기) *" className={inp} />
      <input value={f.name} onChange={set('name')} placeholder="원어명 (구글맵 검색용)" className={inp} />
      <div className="grid grid-cols-2 gap-2">
        <input value={f.category} onChange={set('category')} placeholder="카테고리" className={inp} />
        <input value={f.area} onChange={set('area')} list="area-list" placeholder="구역" className={inp} />
        <datalist id="area-list">{areas.map((a) => <option key={a} value={a} />)}</datalist>
      </div>
      <input value={f.priceVndText} onChange={set('priceVndText')} placeholder="2인 평균 (예: 180,000~240,000 VND)" className={inp} />
      <input value={f.menu} onChange={set('menu')} placeholder="추천 메뉴" className={inp} />
      <input value={f.mapUrl} onChange={set('mapUrl')} placeholder="구글 지도 링크 (비우면 자동)" className={inp} />
      <input value={f.note} onChange={set('note')} placeholder="특징 / 한줄 소개" className={inp} />
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onDone} className="px-3 py-1 text-slate-400">취소</button>
        <button onClick={submit} className="btn-heart rounded-lg px-4 py-1.5 font-semibold">등록</button>
      </div>
    </div>
  );
}

/* ================= 숙소 후보 ================= */
const VIET_DISTRICT: [RegExp, string][] = [
  [/Tây Hồ|Quảng An|Từ Hoa|Lạc Long/i, '서호'],
  [/Hoàn Kiếm|Hàng Bông|Hàng /i, '올드쿼터'],
  [/Ba Đình/i, '바딘'],
  [/Cầu Giấy|Hoàng Quốc Việt|Khuất Duy Tiến|Hoàng Đạo Thúy|Trung Hoà/i, '꺼우저이'],
  [/Nam Từ Liêm|Mễ Trì|Châu Văn Liêm/i, '미딘'],
  [/Hai Bà Trưng/i, '하이바쯩'],
];
const hotelArea = (h: Hotel): string => {
  for (const [re, ko] of VIET_DISTRICT) if (re.test(h.address)) return ko;
  return h.nearby.match(/서호|올드쿼터|바딘|꺼우저이|미딘|하이바쯩|호안끼엠/)?.[0] ?? '';
};

function StayView() {
  const hotels = useAppStore((s) => s.present[s.activeProjectId]?.hotels ?? []);
  const [detail, setDetail] = useState<Hotel | null>(null);
  const access = detail ? accessForArea(hotelArea(detail)) : null;

  const cols: Column<Hotel>[] = [
    { key: 'name', label: '숙소명', width: 150, sortable: true, filter: 'text', get: (h) => h.name,
      render: (h) => <span className="truncate font-medium text-white">{h.name}</span> },
    { key: 'grade', label: '등급', width: 58, sortable: true, filter: 'multi', get: (h) => h.grade },
    { key: 'area', label: '구역', width: 74, sortable: true, filter: 'multi', get: (h) => hotelArea(h) || '-' },
    { key: 'rating', label: '평점', width: 52, sortable: true, filter: 'none', get: (h) => h.rating,
      render: (h) => <span className="text-slate-300">★ {h.rating}</span> },
    { key: 'priceTotalText', label: '2박 총액', width: 92, sortable: true, filter: 'none', get: (h) => won(h.priceTotalText),
      render: (h) => <span className="text-slate-300">{h.priceTotalText}</span> },
    { key: 'nearby', label: '인근', width: 150, sortable: false, filter: 'text', get: (h) => h.nearby,
      render: (h) => <span className="text-slate-400">{h.nearby}</span> },
  ];

  if (!hotels.length) {
    return <p className="py-12 text-center text-xs text-slate-600">이 여행에 숙소 후보 데이터가 없어요</p>;
  }

  return (
    <div>
      <p className="px-0.5 pb-1.5 text-[11px] text-slate-500">9/11~13 · 2박 기준 · 행을 누르면 상세 (조식 후기·특징·지도)</p>
      <DataTable
        rows={hotels}
        columns={cols}
        rowKey={(h) => h.id}
        selectedKey={detail?.id ?? null}
        onRowClick={setDetail}
      />
      {detail && (
        <Modal
          onClose={() => setDetail(null)}
          title={
            <>
              <div className="font-title text-lg font-bold leading-tight text-white">{detail.name}</div>
              <div className="mt-0.5 text-[13px] text-slate-400">{detail.grade} · ★ {detail.rating} · {detail.priceTotalText}</div>
            </>
          }
          footer={
            <a
              href={mapQ(detail.name)}
              target="_blank"
              rel="noreferrer"
              className="btn-heart flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold"
            >
              <MapPin size={15} /> 구글 지도에서 열기
            </a>
          }
        >
          <div className="space-y-3 text-[13px]">
            <div>
              <div className="text-[11px] text-slate-500">주소 {hotelArea(detail) && `· ${hotelArea(detail)}`}</div>
              <div className="text-slate-200">{detail.address}</div>
            </div>

            {access && (
              <div className="rounded-xl bg-white/[0.04] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-moose-heart">🚕 그랩 이동 (예상 · 러시아워 제외)</span>
                </div>
                <div className="mt-1.5 grid grid-cols-1 gap-1 text-[12px] text-slate-200">
                  <div className="flex justify-between"><span>노이바이 공항</span><span className="text-slate-400">{access.airportMin}분 · {fmtVnd(access.airportVnd)}</span></div>
                  <div className="flex justify-between"><span>도심 (호안끼엠)</span><span className="text-slate-400">{access.centerMin}분 · {fmtVnd(access.centerVnd)}</span></div>
                  <div className="flex justify-between"><span>구시가지 (올드쿼터)</span><span className="text-slate-400">{access.oldMin}분 · {fmtVnd(access.oldVnd)}</span></div>
                </div>
                <div className="mt-1.5 text-[10px] text-slate-600">구글 지도 API 키를 넣으면 실시간 소요 시간으로 자동 갱신됩니다</div>
              </div>
            )}

            {detail.nearby && (
              <div>
                <div className="text-[11px] text-slate-500">인근 관광지</div>
                <div className="text-slate-200">{detail.nearby}</div>
              </div>
            )}
            {detail.feature && (
              <div className="rounded-xl bg-white/[0.04] p-3">
                <div className="text-[11px] font-semibold text-moose-heart">핵심 특징</div>
                <div className="text-slate-100">{detail.feature}</div>
              </div>
            )}
            {detail.breakfast && (
              <div className="flex gap-2 rounded-xl bg-moose-heart/10 p-3">
                <Utensils size={15} className="mt-0.5 shrink-0 text-moose-heart" />
                <div>
                  <div className="text-[11px] font-semibold text-moose-heart">조식 후기</div>
                  <div className="text-slate-100">{detail.breakfast}</div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
