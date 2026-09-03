import { useMemo, useState } from 'react';
import { Plus, ExternalLink, Check, Search, Map as MapIcon, X, Utensils, Navigation, PencilLine } from 'lucide-react';
import type { EntryComment, PoiInfo, TripDoc } from '../types';
import { useAppStore, useActiveProject } from '../store/useAppStore';
import { uid } from '../lib/uid';
import { useMyName } from '../lib/members';
import { usePlaces, splitAreas, KIND_LABEL, type Place, type PlaceKind } from '../lib/places';
import { coordsForArea, AREA_COORDS } from '../lib/areaCoords';
import { geocode } from '../lib/geocode';
import { directionsUrl } from '../lib/maps';
import { pushNotify } from '../lib/push';
import { firstSentence } from '../lib/notify';
import {
  PlaceFilterControls, applyPlaceFilter, filterSummary, emptyFilterState, type PlaceFilterState,
} from '../components/PlaceFilter';
import { BottomSheet } from '../components/Modal';
import Modal from '../components/Modal';
import CommentThread from '../components/CommentThread';
import PlaceMap, { type MapPoint } from '../components/PlaceMap';
import PoiPanel, { PoiFetchButton, useLookupPoi } from '../components/PoiPanel';
import { accessForArea, fmtVnd } from '../lib/hanoiAccess';
import HotelTable from '../components/HotelTable';

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
const tripDays = (s: string, e: string) =>
  Math.max(1, Math.round((Date.parse(e) - Date.parse(s)) / 86400000) + 1);
const jitter = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return { dlat: ((h % 100) / 100 - 0.5) * 0.012, dlng: (((h >> 8) % 100) / 100 - 0.5) * 0.012 };
};
const arrOf = (kind: PlaceKind): keyof TripDoc =>
  kind === 'landmark' ? 'spots' : kind === 'food' ? 'restaurants' : 'hotels';

/** 장소 통합 뷰 — 검색 시트 + 결과 + 다중선택 담기 + 상세(댓글). 맛집 탭에 임베드. */
export default function PlacesView({ embedded }: { embedded?: boolean }) {
  const project = useActiveProject()!;
  const places = usePlaces();
  const hotels = useAppStore((s) => s.present[s.activeProjectId]?.hotels ?? []);
  const mutate = useAppStore((s) => s.mutate);
  const me = useMyName();
  const days = tripDays(project.startDate, project.endDate);

  const [filter, setFilter] = useState<PlaceFilterState>(emptyFilterState);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [day, setDay] = useState(1);
  const [selMode, setSelMode] = useState(false);
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapSel, setMapSel] = useState<string | null>(null);
  const [geo, setGeo] = useState<Record<string, { lat: number; lng: number }>>({});

  const results = useMemo(() => applyPlaceFilter(places, filter), [places, filter]);
  const detail = detailId ? places.find((p) => p.id === detailId) ?? null : null;

  const addOne = (p: Place, d = day) => {
    mutate((doc) => {
      const order = doc.timeline.filter((i) => i.day === d).length;
      const c = p.area ? coordsForArea(p.area) : null;
      doc.timeline.push({
        id: uid(), projectId: project.id, day: d, order,
        startTime: '10:00', durationMin: p.kind === 'stay' ? 0 : 60,
        place: p.name, lat: c?.lat ?? null, lng: c?.lng ?? null, memo: p.menu || p.note || '',
      });
    });
    navigator.vibrate?.(8);
    setAdded((s) => new Set(s).add(p.id));
  };
  const addPicked = () => {
    const list = results.filter((p) => picked.has(p.id));
    mutate((doc) => {
      let order = doc.timeline.filter((i) => i.day === day).length;
      for (const p of list) {
        const c = p.area ? coordsForArea(p.area) : null;
        doc.timeline.push({
          id: uid(), projectId: project.id, day, order: order++,
          startTime: '10:00', durationMin: p.kind === 'stay' ? 0 : 60,
          place: p.name, lat: c?.lat ?? null, lng: c?.lng ?? null, memo: p.menu || p.note || '',
        });
      }
    });
    navigator.vibrate?.(12);
    setAdded((s) => new Set([...s, ...list.map((p) => p.id)]));
    setPicked(new Set());
    setSelMode(false);
  };
  const toggle = (id: string) =>
    setPicked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // 상세 모달의 댓글은 원본 엔티티(spots/restaurants/hotels)에 저장
  const patchComments = (p: Place, fn: (list: EntryComment[]) => EntryComment[]) =>
    mutate((doc) => {
      const arr = doc[arrOf(p.kind)] as Array<{ id: string; comments?: EntryComment[] }>;
      const row = arr.find((x) => x.id === p.id);
      if (row) row.comments = fn(row.comments ?? []);
    });
  const patchPoi = (p: Place, poi: PoiInfo) =>
    mutate((doc) => {
      const arr = doc[arrOf(p.kind)] as Array<{ id: string; poi?: PoiInfo }>;
      const row = arr.find((x) => x.id === p.id);
      if (row) row.poi = poi;
    });

  const points: MapPoint[] = useMemo(
    () => results.slice(0, 80).map((p) => {
      const g = geo[p.id];
      if (g) return { id: p.id, lat: g.lat, lng: g.lng };
      const c = coordsForArea(p.area);
      const j = jitter(p.id);
      return { id: p.id, lat: c.lat + j.dlat, lng: c.lng + j.dlng };
    }),
    [results, geo],
  );

  const searchBar = (
    <button
      onClick={() => setSheetOpen(true)}
      className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-moose-dusk/70 px-3 py-2.5 text-left"
    >
      <Search size={15} className="shrink-0 text-moose-heart" />
      <span className="min-w-0 flex-1 truncate text-[13px] text-slate-200">{filterSummary(filter)}</span>
      <span className="shrink-0 text-[11px] text-slate-500">{results.length}곳</span>
    </button>
  );

  return (
    <div className={embedded ? 'edge flex min-h-0 flex-1 flex-col py-3' : 'edge space-y-2.5 py-3'}>
      {!embedded && searchBar}
      {embedded && <h2 className="mb-2 shrink-0 font-title text-xl font-bold text-white">탐색</h2>}
      <div className={embedded ? '-mx-0.5 min-h-0 flex-1 space-y-2.5 overflow-y-auto px-0.5' : 'space-y-2.5'}>

      {/* 액션 줄 */}
      <div className="flex items-center justify-between text-xs">
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${d === day ? 'btn-heart' : 'bg-white/5 text-slate-300'}`}
            >
              {d}일차
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2 pl-2">
          <button onClick={() => setAdding(true)} className="flex items-center gap-0.5 text-slate-400">
            <PencilLine size={13} /> 직접 추가
          </button>
          <button onClick={() => setShowMap((v) => !v)} className={`flex items-center gap-0.5 ${showMap ? 'text-moose-heart' : 'text-slate-400'}`}>
            <MapIcon size={13} /> 지도
          </button>
          <button
            onClick={() => { setSelMode((v) => !v); setPicked(new Set()); }}
            className={selMode ? 'text-moose-heart' : 'text-slate-400'}
          >
            {selMode ? '선택 취소' : '다중선택'}
          </button>
        </div>
      </div>

      {adding && <AddPlaceForm projectId={project.id} onDone={() => setAdding(false)} />}

      {showMap && (
        <PlaceMap
          points={points}
          selectedId={mapSel}
          onSelect={(id) => {
            setMapSel(id);
            const p = results.find((x) => x.id === id);
            if (p && !geo[id] && KEY) geocode(p.origName || p.name).then((r) => { if (r) setGeo((m) => ({ ...m, [id]: r })); });
          }}
          height="160px"
          hint="장소 미니맵 · 핀을 누르면 강조"
        />
      )}

      {/* 결과 — 숙소만 필터한 경우 비교표, 그 외엔 카드 목록 */}
      {filter.kind === 'stay' && !selMode ? (
        <HotelTable
          hotels={hotels.filter((h) => results.some((r) => r.id === h.id))}
          selectedId={detailId}
          onRowClick={setDetailId}
        />
      ) : (
      <div className="space-y-1.5">
        {results.map((p) => (
          <div
            key={p.id}
            onClick={() => (selMode ? toggle(p.id) : setDetailId(p.id))}
            className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 transition ${
              picked.has(p.id) ? 'border-moose-heart bg-moose-heart/10' : 'border-white/5 bg-moose-dusk/70 hover:bg-white/[0.05]'
            }`}
          >
            {selMode && (
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                picked.has(p.id) ? 'border-moose-heart bg-moose-heart text-white' : 'border-white/20'
              }`}>
                {picked.has(p.id) && <Check size={13} />}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-white">{p.name}</span>
                {p.rating ? <span className="shrink-0 text-[10px] text-slate-400">★ {p.rating}</span> : null}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                <span className="rounded bg-white/5 px-1.5 py-0.5">{p.category}</span>
                {p.area && <span>📍 {splitAreas(p.area).join(' · ')}</span>}
                {p.priceText && <span>· {p.priceText}</span>}
              </div>
            </div>
            {!selMode && (
              <>
                {p.mapUrl && (
                  <a href={p.mapUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                    className="shrink-0 text-slate-500 hover:text-moose-heart"><ExternalLink size={13} /></a>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); addOne(p); }}
                  className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold ${
                    added.has(p.id) ? 'bg-emerald-500/20 text-emerald-300' : 'btn-heart'
                  }`}
                >
                  {added.has(p.id) ? <Check size={13} /> : <Plus size={13} />}
                </button>
              </>
            )}
          </div>
        ))}
        {results.length === 0 && <p className="py-10 text-center text-xs text-slate-600">조건에 맞는 장소가 없어요</p>}
      </div>
      )}

      {/* 다중선택 담기 바 */}
      {selMode && picked.size > 0 && (
        <div className="sticky bottom-1 z-10 flex items-center gap-2 rounded-xl bg-moose-heart px-3 py-2 text-sm font-semibold text-white shadow-lg">
          <span className="flex-1">{picked.size}곳 선택</span>
          <select
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="rounded-md bg-white/20 px-2 py-1 text-xs outline-none"
          >
            {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d} className="bg-moose-edge">{d}일차</option>
            ))}
          </select>
          <button onClick={addPicked} className="rounded-md bg-white px-3 py-1 text-xs text-moose-berry">담기</button>
        </div>
      )}

      </div>{/* /스크롤 영역 */}

      {/* 검색 바 — 항상 하단 고정 (장소·숙소 탭 바로 위) */}
      {embedded && (
        <div className="shrink-0 border-t border-white/5 bg-moose-night/95 pt-2 backdrop-blur">
          {searchBar}
        </div>
      )}

      {/* 검색 시트 */}
      {sheetOpen && (
        <PlaceSearchSheet
          places={places}
          initial={filter}
          onClose={() => setSheetOpen(false)}
          onApply={(f) => { setFilter(f); setSheetOpen(false); }}
        />
      )}

      {/* 상세 모달 */}
      {detail && (
        <Modal
          onClose={() => setDetailId(null)}
          title={
            <>
              <div className="font-title text-base font-bold text-white">{detail.name}</div>
              <div className="mt-0.5 text-[12px] text-slate-400">
                {[
                  KIND_LABEL[detail.kind].split('·')[0],
                  detail.category !== KIND_LABEL[detail.kind].split('·')[0] ? detail.category : null,
                  detail.area ? splitAreas(detail.area).join(' · ') : null,
                ].filter(Boolean).join(' · ')}
              </div>
            </>
          }
          footer={
            <div className="flex gap-2">
              <a href={directionsUrl(detail.origName || detail.name)} target="_blank" rel="noreferrer"
                className="flex items-center justify-center rounded-xl border border-white/10 px-3 text-slate-300" title="길찾기">
                <Navigation size={15} />
              </a>
              {detail.mapUrl && (
                <a href={detail.mapUrl} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center rounded-xl border border-white/10 px-3 text-slate-300">
                  <ExternalLink size={15} />
                </a>
              )}
              <button
                onClick={() => addOne(detail)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold ${
                  added.has(detail.id) ? 'bg-emerald-500/20 text-emerald-300' : 'btn-heart'
                }`}
              >
                {added.has(detail.id) ? <><Check size={15} /> {day}일차에 담음</> : <><Plus size={15} /> {day}일차에 담기</>}
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            {detail.rating ? <div className="text-[13px] text-slate-300">★ {detail.rating}</div> : null}
            {detail.menu && (
              <div className="flex gap-2 rounded-xl bg-moose-heart/10 p-3">
                <Utensils size={15} className="mt-0.5 shrink-0 text-moose-heart" />
                <div>
                  <div className="text-[11px] font-semibold text-moose-heart">추천 메뉴</div>
                  <div className="text-[13px] text-slate-100">{detail.menu}</div>
                </div>
              </div>
            )}
            {detail.priceText && (
              <div className="rounded-xl bg-white/[0.04] p-3 text-xs">
                <div className="text-slate-500">{detail.kind === 'stay' ? '2박 총액' : '가격'}</div>
                <div className="text-sm font-semibold text-slate-100">{detail.priceText}</div>
              </div>
            )}
            {detail.note && <div className="text-[13px] leading-relaxed text-slate-300">{detail.note}</div>}

            {detail.kind === 'stay' && <StayExtra place={detail} />}

            <PoiSection place={detail} onSave={(poi) => patchPoi(detail, poi)} />

            <CommentThread
              comments={detail.comments}
              onAdd={(t, mentions) => {
                patchComments(detail, (list) => [...list, { id: uid(), author: me, text: t, at: Date.now(), mentions: mentions.length ? mentions : undefined }]);
                if (mentions.length) pushNotify(mentions, `${me}님이 언급했어요`, `${detail.name} · "${firstSentence(t)}"`);
              }}
              onDelete={(cid) => patchComments(detail, (list) => list.filter((c) => c.id !== cid))}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- 숙소 상세 추가 정보 (조식·인근·그랩 이동) ---------- */
function StayExtra({ place }: { place: Place }) {
  const access = place.area ? accessForArea(place.area) : null;
  return (
    <div className="space-y-2.5">
      {place.nearby && (
        <div>
          <div className="text-[11px] text-slate-500">인근 관광지</div>
          <div className="text-[13px] text-slate-200">{place.nearby}</div>
        </div>
      )}
      {place.breakfast && (
        <div className="flex gap-2 rounded-xl bg-moose-heart/10 p-3">
          <Utensils size={15} className="mt-0.5 shrink-0 text-moose-heart" />
          <div>
            <div className="text-[11px] font-semibold text-moose-heart">조식 후기</div>
            <div className="text-[13px] text-slate-100">{place.breakfast}</div>
          </div>
        </div>
      )}
      {access && (
        <div className="rounded-xl bg-white/[0.04] p-3">
          <div className="text-[11px] font-semibold text-moose-heart">🚕 그랩 이동 (예상 · 러시아워 제외)</div>
          <div className="mt-1.5 grid grid-cols-1 gap-1 text-[12px] text-slate-200">
            <div className="flex justify-between"><span>노이바이 공항</span><span className="text-slate-400">{access.airportMin}분 · {fmtVnd(access.airportVnd)}</span></div>
            <div className="flex justify-between"><span>도심 (호안끼엠)</span><span className="text-slate-400">{access.centerMin}분 · {fmtVnd(access.centerVnd)}</span></div>
            <div className="flex justify-between"><span>구시가지 (올드쿼터)</span><span className="text-slate-400">{access.oldMin}분 · {fmtVnd(access.oldVnd)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- 상세 모달의 구글 지도 정보 (없으면 불러오기 버튼) ---------- */
function PoiSection({ place, onSave }: { place: Place; onSave: (poi: PoiInfo) => void }) {
  const { run, busy, error } = useLookupPoi();
  const fetch = async () => {
    const info = await run({ mapUrl: place.mapUrl, name: place.origName || place.name });
    if (info) onSave(info);
  };
  if (place.poi) return <PoiPanel poi={place.poi} onRefresh={fetch} />;
  return <PoiFetchButton busy={busy} error={error} onClick={fetch} />;
}

/* ---------- 장소 직접 추가 (맛집으로 등록) ---------- */
function AddPlaceForm({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const mutate = useAppStore((s) => s.mutate);
  const [f, setF] = useState({ nameKo: '', name: '', category: '', area: '', mapUrl: '', priceVndText: '', menu: '', note: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const areas = Object.keys(AREA_COORDS);
  const [poi, setPoi] = useState<PoiInfo | undefined>();
  const { run, busy, error } = useLookupPoi();

  const fetchPoi = async () => {
    const info = await run({ mapUrl: f.mapUrl, name: f.name || f.nameKo });
    if (!info) return;
    setPoi(info);
    setF((p) => ({
      ...p,
      area: p.area || info.address?.split(',').slice(-3, -2)[0]?.trim() || p.area,
      mapUrl: p.mapUrl || info.mapUrl || p.mapUrl,
    }));
  };

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
        mapUrl: f.mapUrl.trim() || poi?.mapUrl || `https://maps.google.com/?q=${encodeURIComponent((f.name || display) + ' Hanoi')}`,
        priceVndText: f.priceVndText.trim(), priceKrwText: '',
        priceVndAvg: Number((f.priceVndText.match(/[\d,]+/)?.[0] ?? '').replace(/,/g, '')) || 0,
        menu: f.menu.trim() || undefined,
        note: f.note.trim(), custom: true,
        poi,
      });
    });
    onDone();
  };

  const inp = 'w-full rounded-lg bg-white/5 px-2.5 py-2 text-slate-100 outline-none ring-1 ring-white/5';
  return (
    <div className="card space-y-2 p-3 text-xs">
      <input value={f.nameKo} onChange={set('nameKo')} placeholder="장소 이름 (한국어 표기 · 필수)" className={inp} />
      <input value={f.name} onChange={set('name')} placeholder="현지어·영문 표기 (지도 검색용)" className={inp} />
      <input value={f.mapUrl} onChange={set('mapUrl')} placeholder="구글 지도 링크 붙여넣기 (선택)" className={inp} />
      <PoiFetchButton busy={busy} error={error} onClick={fetchPoi} />
      {poi && <PoiPanel poi={poi} />}
      <div className="grid grid-cols-2 gap-2">
        <input value={f.category} onChange={set('category')} placeholder="종류 (맛집·카페·관광 등)" className={inp} />
        <input value={f.area} onChange={set('area')} list="area-list" placeholder="지역·구역" className={inp} />
        <datalist id="area-list">{areas.map((a) => <option key={a} value={a} />)}</datalist>
      </div>
      <input value={f.priceVndText} onChange={set('priceVndText')} placeholder="예상 가격 (예: 1인 2만원, 180k VND)" className={inp} />
      <input value={f.menu} onChange={set('menu')} placeholder="추천 메뉴 · 볼거리" className={inp} />
      <input value={f.note} onChange={set('note')} placeholder="한 줄 소개 · 메모" className={inp} />
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onDone} className="px-3 py-1 text-slate-400">취소</button>
        <button onClick={submit} className="btn-heart rounded-lg px-4 py-1.5 font-semibold">등록</button>
      </div>
    </div>
  );
}

function PlaceSearchSheet({
  places, initial, onClose, onApply,
}: {
  places: Place[];
  initial: PlaceFilterState;
  onClose: () => void;
  onApply: (f: PlaceFilterState) => void;
}) {
  const [draft, setDraft] = useState<PlaceFilterState>(initial);
  const count = applyPlaceFilter(places, draft).length;
  return (
    <BottomSheet title="장소 검색" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-[11px] text-slate-500">
          지역·종류 중 하나만 골라도 되고, 둘 다 좁혀도 됩니다. 정하고 아래 [검색하기].
        </p>
        <PlaceFilterControls places={places} state={draft} onChange={setDraft} />
        <div className="flex gap-2 pt-1">
          <button onClick={() => setDraft(emptyFilterState)} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300">
            <X size={15} />
          </button>
          <button onClick={() => onApply(draft)} className="btn-heart flex-1 rounded-xl py-2.5 text-sm font-semibold">
            {count}곳 검색하기
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
