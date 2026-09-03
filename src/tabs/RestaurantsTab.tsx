import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus, ExternalLink, Copy, MapPin, Utensils, X,
} from 'lucide-react';
import type { Restaurant, Hotel } from '../types';
import { useAppStore, useActiveProject } from '../store/useAppStore';
import { uid } from '../lib/uid';
import { commas } from '../lib/currency';
import { coordsForArea, AREA_COORDS } from '../lib/areaCoords';
import { geocode } from '../lib/geocode';
import Modal from '../components/Modal';
import DataTable, { type Column } from '../components/DataTable';
import PlaceMap, { type MapPoint } from '../components/PlaceMap';
import { accessForArea, fmtVnd } from '../lib/hanoiAccess';

// 구역 토큰 분리: "바딘/올드쿼터", "바딘 · 올드쿼터", "바딘, 올드쿼터" 모두 개별 칩으로
const splitAreas = (area: string) =>
  area.split(/[/·,、|]|\s-\s/).map((a) => a.trim()).filter(Boolean);
const disp = (r: Restaurant) => r.nameKo || r.name;
const won = (t: string) => Number((t.match(/[\d,]+/)?.[0] ?? '0').replace(/,/g, '')) * (/만/.test(t) ? 10000 : 1);
const mapQ = (name: string) => `https://maps.google.com/?q=${encodeURIComponent(name + ' Hanoi')}`;
// id 기반 결정적 지터 — 같은 구역 핀이 완전히 겹치지 않게
const jitter = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return { dlat: ((h % 100) / 100 - 0.5) * 0.012, dlng: (((h >> 8) % 100) / 100 - 0.5) * 0.012 };
};

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
  // 복합 구역("바딘/올드쿼터")은 개별 토큰으로 분리 · "전역 체인" 등은 그대로 하나의 칩
  const areas = useMemo(() => {
    const set = new Set<string>();
    for (const r of list) splitAreas(r.area).forEach((a) => set.add(a));
    return [...set].sort((a, b) => a.localeCompare(b, 'ko'));
  }, [list]);

  const [cat, setCat] = useState('전체');
  const [areaSel, setAreaSel] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [detail, setDetail] = useState<Restaurant | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [geo, setGeo] = useState<Record<string, { lat: number; lng: number }>>({});
  const mapRef = useRef<HTMLDivElement | null>(null);

  const rows = useMemo(() => {
    let r = list.filter((x) => cat === '전체' || x.category === cat);
    if (areaSel.size) r = r.filter((x) => splitAreas(x.area).some((a) => areaSel.has(a)));
    return r;
  }, [list, cat, areaSel]);

  // 지도 핀: 기본은 구역 중심 + 지터, 선택/지오코딩된 항목은 정밀 좌표
  const points: MapPoint[] = useMemo(
    () => rows.slice(0, 80).map((r) => {
      const g = geo[r.id];
      if (g) return { id: r.id, lat: g.lat, lng: g.lng };
      const c = coordsForArea(r.area);
      const j = jitter(r.id);
      return { id: r.id, lat: c.lat + j.dlat, lng: c.lng + j.dlng };
    }),
    [rows, geo],
  );

  // 선택된 항목은 정밀 지오코딩 (보이는 것만, 1건씩)
  useEffect(() => {
    const r = rows.find((x) => x.id === selected);
    if (!r || geo[r.id]) return;
    let live = true;
    geocode(r.name || disp(r)).then((res) => {
      if (live && res) setGeo((m) => ({ ...m, [r.id]: res }));
    });
    return () => { live = false; };
  }, [selected]); // eslint-disable-line

  const pickRow = (r: Restaurant) => {
    setSelected(r.id);
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const toggleArea = (a: string) =>
    setAreaSel((s) => {
      const n = new Set(s);
      n.has(a) ? n.delete(a) : n.add(a);
      return n;
    });
  const remove = (id: string) =>
    mutate((doc) => { doc.restaurants = doc.restaurants.filter((x) => x.id !== id); });

  const cols: Column<Restaurant>[] = [
    {
      key: 'nameKo', label: '장소명', width: 150, sortable: true, filter: 'text',
      get: (r) => disp(r),
      render: (r) => (
        <button
          onClick={(e) => { e.stopPropagation(); setDetail(r); }}
          className="max-w-full truncate text-left font-medium text-white"
        >
          {disp(r)}
          {r.custom && <span className="ml-1 text-[9px] text-moose-heart">직접</span>}
        </button>
      ),
    },
    { key: 'category', label: '분류', width: 78, sortable: true, filter: 'multi', get: (r) => r.category,
      render: (r) => <span className="text-slate-400">{r.category}</span> },
    { key: 'area', label: '구역', width: 92, sortable: true, filter: 'multi', get: (r) => r.area || '-',
      render: (r) => <span className="text-slate-400">{r.area || '-'}</span> },
    { key: 'priceVndAvg', label: '2인 VND', width: 88, sortable: true, filter: 'range', get: (r) => r.priceVndAvg,
      render: (r) => (r.priceVndAvg ? commas(r.priceVndAvg) : '-') },
    {
      key: 'link', label: '바로가기', width: 62, sortable: false, filter: 'none', get: () => '',
      render: (r) => r.mapUrl && (
        <a
          href={r.mapUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-0.5 text-moose-heart"
        >
          <ExternalLink size={12} /> 지도
        </a>
      ),
    },
  ];

  return (
    <div className="space-y-2.5">
      {/* 1차: 카테고리 (단일 선택) */}
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

      {/* 2차: 구역 (다중 선택 칩) */}
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
        <PlaceMap
          points={points}
          selectedId={selected}
          onSelect={setSelected}
          height="160px"
          hint="맛집 미니맵 · 행을 누르면 위치 강조 (구글맵 키 미설정)"
        />
        {selected && (
          <div className="mt-1 px-0.5 text-[10px] text-slate-500">
            📍 {(() => { const r = rows.find((x) => x.id === selected); return r ? `${disp(r)} · ${r.area}` : ''; })()}
            {!geo[selected] && ' · 정확한 위치 찾는 중…'}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-0.5 text-xs text-slate-400">
        <span>{rows.length}곳{areaSel.size ? ` · ${[...areaSel].join(', ')}` : ''}</span>
        <button onClick={() => setAdding((v) => !v)} className="flex items-center gap-1 text-moose-heart">
          <Plus size={14} /> 수기 등록
        </button>
      </div>

      {adding && <AddForm projectId={project.id} onDone={() => setAdding(false)} />}

      {/* 3차: 표 — 열별 검색·다중필터·정렬·열 순서변경 (구글시트식) */}
      <DataTable
        rows={rows}
        columns={cols}
        rowKey={(r) => r.id}
        selectedKey={selected}
        onRowClick={pickRow}
        empty={<p className="py-10 text-center text-xs text-slate-600">조건에 맞는 장소가 없어요</p>}
      />

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
    { key: 'rating', label: '평점', width: 62, sortable: true, filter: 'range', get: (h) => h.rating,
      render: (h) => <span className="text-slate-300">★ {h.rating}</span> },
    { key: 'priceTotalText', label: '2박 총액', width: 96, sortable: true, filter: 'range', get: (h) => won(h.priceTotalText),
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
