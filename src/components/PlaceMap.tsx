import { useEffect, useRef } from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';
import { GMAPS_LIBRARIES, GMAPS_LANGUAGE } from '../lib/gmaps';

/** 동선·맛집·숙소 공용 지도. 키 있으면 실제 구글맵, 없으면 Mock 그리드. */
const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
const BBOX = { latMax: 21.10, latMin: 20.98, lngMin: 105.74, lngMax: 105.90 };
const HANOI = { lat: 21.0285, lng: 105.8542 };

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  /** 마커에 표시할 번호(동선). 없으면 점 마커 */
  seq?: number;
}

interface Props {
  points: MapPoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** 주면 마커 드래그 가능 (좌표 미세조정) */
  onDrag?: (id: string, lat: number, lng: number) => void;
  /** 점 순서대로 선 연결 (동선) */
  route?: boolean;
  height?: string;
  hint?: string;
}

export const mapsKeyPresent = !!KEY;

export default function PlaceMap(props: Props) {
  return KEY ? <GMap {...props} /> : <MockMap {...props} />;
}

function GMap({ points, selectedId, onSelect, onDrag, route, height = '220px' }: Props) {
  const { isLoaded } = useJsApiLoader({ id: 'gmaps', googleMapsApiKey: KEY, libraries: GMAPS_LIBRARIES, language: GMAPS_LANGUAGE });
  const mapRef = useRef<google.maps.Map | null>(null);

  const fit = () => {
    const m = mapRef.current;
    if (!m || !points.length) return;
    if (points.length === 1) { m.panTo(points[0]); m.setZoom(15); return; }
    const b = new google.maps.LatLngBounds();
    points.forEach((p) => b.extend({ lat: p.lat, lng: p.lng }));
    m.fitBounds(b, 48);
  };

  useEffect(() => {
    const m = mapRef.current;
    const sel = points.find((p) => p.id === selectedId);
    if (m && sel) { m.panTo({ lat: sel.lat, lng: sel.lng }); m.setZoom(16); }
    else if (m && !selectedId) fit();
  }, [selectedId, points.length]); // eslint-disable-line

  if (!isLoaded) {
    return (
      <div style={{ height }} className="flex items-center justify-center rounded-xl border border-white/5 bg-moose-dusk/60 text-xs text-slate-500">
        지도 불러오는 중…
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-white/5">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height }}
        center={points[0] ?? HANOI}
        zoom={13}
        onLoad={(m) => { mapRef.current = m; fit(); }}
        options={{ disableDefaultUI: true, zoomControl: true, gestureHandling: 'greedy' }}
      >
        {points.map((p, idx) => (
          <Marker
            key={p.id}
            position={{ lat: p.lat, lng: p.lng }}
            label={p.seq != null ? { text: String(p.seq), color: '#fff', fontSize: '11px', fontWeight: '700' } : undefined}
            draggable={!!onDrag}
            onClick={() => onSelect?.(p.id)}
            onDragEnd={(e) => e.latLng && onDrag?.(p.id, e.latLng.lat(), e.latLng.lng())}
            zIndex={p.id === selectedId ? 999 : idx}
            animation={p.id === selectedId ? google.maps.Animation.BOUNCE : undefined}
          />
        ))}
        {route && points.length > 1 && (
          <Polyline
            path={points.map((p) => ({ lat: p.lat, lng: p.lng }))}
            options={{ strokeColor: '#ee86a9', strokeWeight: 3, strokeOpacity: 0.9 }}
          />
        )}
      </GoogleMap>
    </div>
  );
}

/** 키 없을 때 폴백 */
function MockMap({ points, selectedId, onSelect, onDrag, route, height = '220px', hint }: Props) {
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
    onSelect?.(id);
    if (!onDrag) return;
    down.preventDefault();
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

  const pts = points.map((p) => ({ ...p, ...toXY(p.lat, p.lng) }));

  return (
    <div
      ref={ref}
      style={{ height }}
      className="relative touch-none overflow-hidden rounded-xl border border-white/5 bg-[linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:24px_24px] bg-moose-dusk"
    >
      <span className="absolute left-2 top-2 z-10 text-[10px] text-slate-600">{hint ?? 'Mock Map · 하노이 (구글맵 키 미설정)'}</span>
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        {route && pts.length > 1 && (
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
            className={`absolute -translate-x-1/2 -translate-y-full touch-none ${onDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
            <span className="flex flex-col items-center">
              <span className={`flex items-center justify-center rounded-full border-2 border-white bg-moose-heart font-bold text-white ${
                on ? 'h-7 w-7 text-xs shadow-[0_0_0_6px_rgba(238,134,169,0.3)]' : 'h-5 w-5 text-[10px]'
              }`}>
                {p.seq ?? idx + 1}
              </span>
              <MapPin size={on ? 13 : 10} className="-mt-1 text-moose-heart" />
            </span>
          </button>
        );
      })}
      {pts.length === 0 && (
        <div className="flex h-full items-center justify-center text-xs text-slate-600">표시할 위치가 없어요</div>
      )}
    </div>
  );
}
