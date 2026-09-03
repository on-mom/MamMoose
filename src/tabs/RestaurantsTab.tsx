import { useMemo, useState } from 'react';
import { MapPin, Utensils, Map as MapIcon } from 'lucide-react';
import type { Hotel, PoiInfo } from '../types';
import { useAppStore } from '../store/useAppStore';
import { uid } from '../lib/uid';
import { useMyName } from '../lib/members';
import { pushNotify } from '../lib/push';
import { firstSentence } from '../lib/notify';
import { hotelArea } from '../lib/places';
import { coordsForArea } from '../lib/areaCoords';
import { geocode } from '../lib/geocode';
import Modal from '../components/Modal';
import DataTable, { type Column } from '../components/DataTable';
import CommentThread from '../components/CommentThread';
import PoiPanel, { PoiFetchButton, useLookupPoi } from '../components/PoiPanel';
import PlaceMap, { type MapPoint } from '../components/PlaceMap';
import { accessForArea, fmtVnd } from '../lib/hanoiAccess';
import PlacesView from './PlacesView';

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
const jitter = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return { dlat: ((h % 100) / 100 - 0.5) * 0.01, dlng: (((h >> 8) % 100) / 100 - 0.5) * 0.01 };
};

const won = (t: string) => Number((t.match(/[\d,]+/)?.[0] ?? '0').replace(/,/g, '')) * (/만/.test(t) ? 10000 : 1);
const mapQ = (name: string) => `https://maps.google.com/?q=${encodeURIComponent(name + ' Hanoi')}`;

export default function RestaurantsTab() {
  const [view, setView] = useState<'place' | 'stay'>('place');
  return (
    <div className="flex h-full flex-col">
      <div className="edge min-h-0 flex-1 space-y-3 overflow-y-auto py-3">
        <h2 className="font-title text-xl font-bold text-white">{view === 'place' ? '장소' : '숙소 후보'}</h2>
        {view === 'place' ? <PlacesView embedded /> : <StayView />}
      </div>
      {/* 하단 고정 전환 바 (엄지 접근) */}
      <div className="edge shrink-0 border-t border-moose-edge bg-moose-night/95 py-2 backdrop-blur">
        <div className="flex gap-1 rounded-lg bg-moose-dusk p-1 text-xs">
          {([['place', '장소'], ['stay', '숙소']] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setView(k)}
              className={`flex-1 rounded-md py-2 ${view === k ? 'btn-heart' : 'text-slate-400'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function HotelPoi({ hotel, onSave }: { hotel: Hotel; onSave: (poi: PoiInfo) => void }) {
  const { run, busy, error } = useLookupPoi();
  const fetch = async () => {
    const info = await run({ name: `${hotel.name} ${hotel.address}` });
    if (info) onSave(info);
  };
  if (hotel.poi) return <PoiPanel poi={hotel.poi} onRefresh={fetch} />;
  return <PoiFetchButton busy={busy} error={error} onClick={fetch} label="구글 지도에서 정보 불러오기" />;
}

/* ================= 숙소 후보 ================= */
function StayView() {
  const hotels = useAppStore((s) => s.present[s.activeProjectId]?.hotels ?? []);
  const mutate = useAppStore((s) => s.mutate);
  const me = useMyName();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapSel, setMapSel] = useState<string | null>(null);
  const [geo, setGeo] = useState<Record<string, { lat: number; lng: number }>>({});
  const detail = detailId ? hotels.find((h) => h.id === detailId) ?? null : null;
  const access = detail ? accessForArea(hotelArea(detail)) : null;

  const points: MapPoint[] = useMemo(
    () => hotels.map((h) => {
      const g = geo[h.id] ?? (h.poi?.lat != null ? { lat: h.poi.lat, lng: h.poi.lng! } : null);
      if (g) return { id: h.id, lat: g.lat, lng: g.lng };
      const c = coordsForArea(hotelArea(h));
      const j = jitter(h.id);
      return { id: h.id, lat: c.lat + j.dlat, lng: c.lng + j.dlng };
    }),
    [hotels, geo],
  );

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
      <div className="flex items-center justify-between gap-2 px-0.5 pb-1.5">
        <p className="text-[11px] text-slate-500">2박 기준 · 행을 누르면 상세 (조식 후기·특징)</p>
        <button
          onClick={() => setShowMap((v) => !v)}
          className={`flex shrink-0 items-center gap-1 text-[11px] ${showMap ? 'text-moose-heart' : 'text-slate-400'}`}
        >
          <MapIcon size={13} /> 지도
        </button>
      </div>

      {showMap && (
        <div className="mb-2">
          <PlaceMap
            points={points}
            selectedId={mapSel}
            onSelect={(id) => {
              setMapSel(id);
              const h = hotels.find((x) => x.id === id);
              if (h && !geo[id] && KEY) {
                geocode(h.address || h.name).then((r) => { if (r) setGeo((m) => ({ ...m, [id]: r })); });
              }
            }}
            height="200px"
            hint="숙소 위치 미니맵 · 핀을 누르면 상세 위치"
          />
          {mapSel && (
            <button
              onClick={() => setDetailId(mapSel)}
              className="mt-1 w-full rounded-lg bg-white/5 py-1.5 text-[11px] text-slate-300"
            >
              {hotels.find((h) => h.id === mapSel)?.name} 상세 보기
            </button>
          )}
        </div>
      )}

      <DataTable
        rows={hotels}
        columns={cols}
        rowKey={(h) => h.id}
        selectedKey={detail?.id ?? mapSel}
        onRowClick={(h) => setDetailId(h.id)}
      />
      {detail && (
        <Modal
          onClose={() => setDetailId(null)}
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

            <HotelPoi hotel={detail} onSave={(poi) => mutate((doc) => {
              const row = doc.hotels.find((x) => x.id === detail.id);
              if (row) row.poi = poi;
            })} />

            <CommentThread
              comments={detail.comments}
              onAdd={(t, mentions) => {
                mutate((doc) => {
                  const row = doc.hotels.find((x) => x.id === detail.id);
                  if (row) (row.comments ??= []).push({ id: uid(), author: me, text: t, at: Date.now(), mentions: mentions.length ? mentions : undefined });
                });
                if (mentions.length) pushNotify(mentions, `${me}님이 언급했어요`, `${detail.name} · "${firstSentence(t)}"`);
              }}
              onDelete={(cid) => mutate((doc) => {
                const row = doc.hotels.find((x) => x.id === detail.id);
                if (row?.comments) row.comments = row.comments.filter((c) => c.id !== cid);
              })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
