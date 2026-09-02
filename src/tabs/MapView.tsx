import { useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, Crosshair, X, LocateFixed, Loader2 } from 'lucide-react';
import type { TimelineItem } from '../types';
import { useAppStore, useActiveProject } from '../store/useAppStore';
import { geocode } from '../lib/geocode';

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
const BBOX = { latMax: 21.10, latMin: 20.98, lngMin: 105.74, lngMax: 105.90 };
const HANOI = { lat: 21.0285, lng: 105.8542 };

const tripDays = (s: string, e: string) =>
  Math.max(1, Math.round((Date.parse(e) - Date.parse(s)) / 86400000) + 1);

type Placed = TimelineItem & { lat: number; lng: number };

export default function MapView() {
  const project = useActiveProject()!;
  const items = useAppStore((s) => s.present[s.activeProjectId]?.timeline ?? []);
  const mutate = useAppStore((s) => s.mutate);
  const days = tripDays(project.startDate, project.endDate);
  const [day, setDay] = useState(1);
  const [geoBusy, setGeoBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const { isLoaded } = useJsApiLoader({ id: 'gmaps', googleMapsApiKey: KEY });

  const dayItems = useMemo(
    () => items.filter((i) => i.day === day).sort((a, b) => a.order - b.order),
    [items, day],
  );
  const placed = dayItems.filter((i) => i.lat != null && i.lng != null) as Placed[];

  const setCoords = (id: string, lat: number | null, lng: number | null) =>
    mutate((doc) => {
      const it = doc.timeline.find((x) => x.id === id);
      if (it) { it.lat = lat; it.lng = lng; }
    });

  const autoLocate = async () => {
    if (!isLoaded || geoBusy) return;
    setGeoBusy(true);
    for (const it of dayItems) {
      if (it.lat != null || !it.place || it.place === '새 일정') continue;
      const r = await geocode(it.place);
      if (r) setCoords(it.id, r.lat, r.lng);
      await new Promise((res) => setTimeout(res, 140));
    }
    setGeoBusy(false);
  };

  const uncoordCount = dayItems.filter((i) => i.lat == null && i.place && i.place !== '새 일정').length;
  useEffect(() => {
    if (KEY && isLoaded && uncoordCount > 0) {
      const t = setTimeout(autoLocate, 500);
      return () => clearTimeout(t);
    }
  }, [day, isLoaded, uncoordCount]); // eslint-disable-line

  // 다른 날로 넘어가면 선택 해제
  useEffect(() => setSelected(null), [day]);

  const pickRow = async (it: TimelineItem) => {
    setSelected(it.id);
    if (it.lat == null && KEY && it.place && it.place !== '새 일정') {
      const r = await geocode(it.place);
      if (r) setCoords(it.id, r.lat, r.lng);
    }
  };

  return (
    <div className="edge space-y-3 py-3">
      <div className="flex items-center gap-2">
        <div className="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto pb-1">
          {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs ${d === day ? 'btn-heart' : 'bg-white/5 text-slate-300'}`}
            >
              {d}일차
            </button>
          ))}
        </div>
        {KEY && (
          <button
            onClick={autoLocate}
            disabled={geoBusy || !isLoaded}
            className="flex shrink-0 items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 disabled:opacity-50"
          >
            {geoBusy ? <Loader2 size={12} className="animate-spin" /> : <LocateFixed size={12} />} 위치 자동
          </button>
        )}
      </div>

      {KEY ? (
        <GMap items={placed} selectedId={selected} onDrag={setCoords} onSelect={setSelected} />
      ) : (
        <MockMap items={placed} selectedId={selected} onDrag={setCoords} onSelect={setSelected} />
      )}

      <ul className="space-y-1.5">
        {dayItems.length === 0 && (
          <li className="py-4 text-center text-xs text-slate-600">이 날짜의 일정이 없습니다</li>
        )}
        {dayItems.map((it, idx) => (
          <li
            key={it.id}
            onClick={() => pickRow(it)}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
              it.id === selected ? 'bg-moose-heart/15 ring-1 ring-moose-heart/30' : 'bg-moose-dusk/70 hover:bg-white/[0.05]'
            }`}
          >
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] text-white ${
              it.lat != null ? 'bg-moose-heart' : 'bg-slate-700'
            }`}>
              {idx + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-slate-200">{it.place}</span>
            {it.lat != null ? (
              <button
                onClick={(e) => { e.stopPropagation(); setCoords(it.id, null, null); }}
                className="flex items-center gap-0.5 text-slate-500"
              >
                <X size={12} /> 핀 제거
              </button>
            ) : KEY ? (
              <button
                onClick={async (e) => { e.stopPropagation(); const r = await geocode(it.place); if (r) setCoords(it.id, r.lat, r.lng); }}
                className="flex items-center gap-0.5 text-moose-heart"
              >
                <LocateFixed size={12} /> 위치 찾기
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setCoords(it.id, HANOI.lat + (Math.random() - 0.5) * 0.03, HANOI.lng + (Math.random() - 0.5) * 0.03); }}
                className="flex items-center gap-0.5 text-moose-heart"
              >
                <Crosshair size={12} /> 지도에 배치
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="text-center text-[10px] text-slate-600">
        {KEY
          ? '행을 누르면 지도가 그 위치로 이동 · 마커를 끌어 미세 조정하면 타임라인과 동기화'
          : '행을 누르면 핀 강조 · 마커를 끌어 위치 조정 (Google Maps 키 미설정 — Mock 지도)'}
      </p>
    </div>
  );
}

type DragFn = (id: string, lat: number, lng: number) => void;

function GMap({
  items, selectedId, onDrag, onSelect,
}: { items: Placed[]; selectedId: string | null; onDrag: DragFn; onSelect: (id: string) => void }) {
  const { isLoaded } = useJsApiLoader({ id: 'gmaps', googleMapsApiKey: KEY });
  const mapRef = useRef<google.maps.Map | null>(null);

  const fit = () => {
    const m = mapRef.current;
    if (!m || !items.length) return;
    if (items.length === 1) { m.panTo(items[0]); m.setZoom(15); return; }
    const b = new google.maps.LatLngBounds();
    items.forEach((i) => b.extend({ lat: i.lat, lng: i.lng }));
    m.fitBounds(b, 48);
  };

  // 선택된 항목으로 지도 이동
  useEffect(() => {
    const m = mapRef.current;
    const sel = items.find((i) => i.id === selectedId);
    if (m && sel) { m.panTo({ lat: sel.lat, lng: sel.lng }); m.setZoom(16); }
    else if (m && !selectedId) fit();
  }, [selectedId, items.length]); // eslint-disable-line

  if (!isLoaded) return <Box>지도 불러오는 중…</Box>;
  return (
    <div className="overflow-hidden rounded-xl border border-white/5">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '240px' }}
        center={items[0] ?? HANOI}
        zoom={13}
        onLoad={(m) => { mapRef.current = m; fit(); }}
        options={{ disableDefaultUI: true, zoomControl: true, gestureHandling: 'greedy' }}
      >
        {items.map((it, idx) => (
          <Marker
            key={it.id}
            position={{ lat: it.lat, lng: it.lng }}
            label={{ text: String(idx + 1), color: '#fff', fontSize: '11px', fontWeight: '700' }}
            draggable
            onClick={() => onSelect(it.id)}
            onDragEnd={(e) => e.latLng && onDrag(it.id, e.latLng.lat(), e.latLng.lng())}
            zIndex={it.id === selectedId ? 999 : idx}
            animation={it.id === selectedId ? google.maps.Animation.BOUNCE : undefined}
          />
        ))}
        {items.length > 1 && (
          <Polyline
            path={items.map((i) => ({ lat: i.lat, lng: i.lng }))}
            options={{ strokeColor: '#ee86a9', strokeWeight: 3, strokeOpacity: 0.9 }}
          />
        )}
      </GoogleMap>
    </div>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-slate-700 bg-moose-dusk/60 text-xs text-slate-500">
      {children}
    </div>
  );
}

/** Google Maps 키 없이도 동작하는 폴백 지도 */
function MockMap({
  items, selectedId, onDrag, onSelect,
}: { items: Placed[]; selectedId: string | null; onDrag: DragFn; onSelect: (id: string) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const toXY = (lat: number, lng: number) => ({
    x: ((lng - BBOX.lngMin) / (BBOX.lngMax - BBOX.lngMin)) * 100,
    y: ((BBOX.latMax - lat) / (BBOX.latMax - BBOX.latMin)) * 100,
  });
  const fromXY = (px: number, py: number) => ({
    lng: BBOX.lngMin + (px / 100) * (BBOX.lngMax - BBOX.lngMin),
    lat: BBOX.latMax - (py / 100) * (BBOX.latMax - BBOX.latMin),
  });

  const startDrag = (id: string) => (down: React.PointerEvent) => {
    down.preventDefault();
    onSelect(id);
    const box = ref.current!.getBoundingClientRect();
    const move = (e: PointerEvent) => {
      const px = Math.min(100, Math.max(0, ((e.clientX - box.left) / box.width) * 100));
      const py = Math.min(100, Math.max(0, ((e.clientY - box.top) / box.height) * 100));
      const { lat, lng } = fromXY(px, py);
      onDrag(id, lat, lng);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const pts = items.map((i) => ({ ...i, ...toXY(i.lat, i.lng) }));

  return (
    <div
      ref={ref}
      className="relative h-[240px] touch-none overflow-hidden rounded-xl border border-white/5 bg-[linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:24px_24px] bg-moose-dusk"
    >
      <span className="absolute left-2 top-2 text-[10px] text-slate-600">Mock Map · 하노이</span>
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        {pts.length > 1 && (
          <polyline points={pts.map((p) => `${p.x}%,${p.y}%`).join(' ')} fill="none" stroke="#ee86a9" strokeWidth={2} strokeOpacity={0.8} />
        )}
      </svg>
      {pts.map((p, idx) => {
        const on = p.id === selectedId;
        return (
          <button
            key={p.id}
            onPointerDown={startDrag(p.id)}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-full cursor-grab touch-none active:cursor-grabbing"
          >
            <span className="flex flex-col items-center">
              <span className={`flex items-center justify-center rounded-full border-2 border-white bg-moose-heart font-bold text-white ${
                on ? 'h-7 w-7 text-xs shadow-[0_0_0_6px_rgba(238,134,169,0.3)]' : 'h-5 w-5 text-[10px]'
              }`}>
                {idx + 1}
              </span>
              <MapPin size={on ? 13 : 10} className="-mt-1 text-moose-heart" />
            </span>
          </button>
        );
      })}
      {pts.length === 0 && (
        <div className="flex h-full items-center justify-center text-xs text-slate-600">
          아래 목록에서 &lsquo;지도에 배치&rsquo;를 눌러 핀을 추가하세요
        </div>
      )}
    </div>
  );
}
