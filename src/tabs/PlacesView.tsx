import { useMemo, useRef, useState } from 'react';
import { Plus, ExternalLink, Check } from 'lucide-react';
import { useAppStore, useActiveProject } from '../store/useAppStore';
import { uid } from '../lib/uid';
import { usePlaces, splitAreas, KIND_LABEL, type Place } from '../lib/places';
import { coordsForArea } from '../lib/areaCoords';
import { geocode } from '../lib/geocode';
import PlaceFilter from '../components/PlaceFilter';
import PlaceMap, { type MapPoint } from '../components/PlaceMap';

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
const tripDays = (s: string, e: string) =>
  Math.max(1, Math.round((Date.parse(e) - Date.parse(s)) / 86400000) + 1);
const jitter = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return { dlat: ((h % 100) / 100 - 0.5) * 0.012, dlng: (((h >> 8) % 100) / 100 - 0.5) * 0.012 };
};

/** 일정 › 장소 — 관광지·맛집·숙소 통합 뷰. 1·2·3차 필터 + 지도 + 타임라인 담기. */
export default function PlacesView() {
  const project = useActiveProject()!;
  const places = usePlaces();
  const mutate = useAppStore((s) => s.mutate);
  const days = tripDays(project.startDate, project.endDate);
  const [day, setDay] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [geo, setGeo] = useState<Record<string, { lat: number; lng: number }>>({});
  const mapRef = useRef<HTMLDivElement | null>(null);

  const addToTimeline = (p: Place) => {
    mutate((doc) => {
      const order = doc.timeline.filter((i) => i.day === day).length;
      const c = p.area ? coordsForArea(p.area) : null;
      doc.timeline.push({
        id: uid(), projectId: project.id, day, order,
        startTime: '10:00', durationMin: p.kind === 'stay' ? 0 : 60,
        place: p.name, lat: c?.lat ?? null, lng: c?.lng ?? null,
        memo: p.menu || p.note || '',
      });
    });
    navigator.vibrate?.(10);
    setAdded((s) => new Set(s).add(p.id));
  };

  const pickRow = (p: Place) => {
    setSelected(p.id);
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (!geo[p.id] && KEY) {
      geocode(p.origName || p.name).then((r) => { if (r) setGeo((m) => ({ ...m, [p.id]: r })); });
    }
  };

  return (
    <div className="edge space-y-3 py-3">
      <div className="flex items-center gap-2">
        <h2 className="font-title text-lg font-bold text-white">장소 둘러보기</h2>
        <span className="text-[11px] text-slate-500">담기 →</span>
        <div className="no-scrollbar flex flex-1 gap-1 overflow-x-auto">
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
      </div>

      <PlaceFilter
        places={places}
        render={(filtered) => (
          <PlacesResult
            filtered={filtered}
            selected={selected}
            geo={geo}
            added={added}
            mapRef={mapRef}
            onPick={pickRow}
            onAdd={addToTimeline}
          />
        )}
      />
    </div>
  );
}

function PlacesResult({
  filtered, selected, geo, added, mapRef, onPick, onAdd,
}: {
  filtered: Place[];
  selected: string | null;
  geo: Record<string, { lat: number; lng: number }>;
  added: Set<string>;
  mapRef: React.RefObject<HTMLDivElement>;
  onPick: (p: Place) => void;
  onAdd: (p: Place) => void;
}) {
  const points: MapPoint[] = useMemo(
    () => filtered.slice(0, 80).map((p) => {
      const g = geo[p.id];
      if (g) return { id: p.id, lat: g.lat, lng: g.lng };
      const c = coordsForArea(p.area);
      const j = jitter(p.id);
      return { id: p.id, lat: c.lat + j.dlat, lng: c.lng + j.dlng };
    }),
    [filtered, geo],
  );

  return (
    <>
      <div ref={mapRef}>
        <PlaceMap points={points} selectedId={selected} onSelect={(id) => {
          const p = filtered.find((x) => x.id === id);
          if (p) onPick(p);
        }} height="150px" hint="장소 미니맵 · 목록을 누르면 위치 강조" />
      </div>

      <div className="text-[11px] text-slate-500">{filtered.length}곳</div>

      <div className="space-y-1.5">
        {filtered.map((p) => (
          <div
            key={p.id}
            onClick={() => onPick(p)}
            className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 transition ${
              p.id === selected ? 'border-moose-heart/40 bg-moose-heart/10' : 'border-white/5 bg-moose-dusk/70 hover:bg-white/[0.05]'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-white">{p.name}</span>
                {p.rating ? <span className="shrink-0 text-[10px] text-slate-400">★ {p.rating}</span> : null}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                <span className="rounded bg-white/5 px-1.5 py-0.5">{KIND_LABEL[p.kind].split('·')[0]}</span>
                <span className="rounded bg-white/5 px-1.5 py-0.5">{p.category}</span>
                {p.area && <span>📍 {splitAreas(p.area).join(' · ')}</span>}
                {p.priceText && <span>· {p.priceText}</span>}
              </div>
            </div>
            {p.mapUrl && (
              <a
                href={p.mapUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 text-slate-500 hover:text-moose-heart"
              >
                <ExternalLink size={13} />
              </a>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onAdd(p); }}
              className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold ${
                added.has(p.id) ? 'bg-emerald-500/20 text-emerald-300' : 'btn-heart'
              }`}
            >
              {added.has(p.id) ? <Check size={13} /> : <Plus size={13} />}
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-xs text-slate-600">조건에 맞는 장소가 없어요</p>
        )}
      </div>
    </>
  );
}
