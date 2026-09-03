import { useEffect, useMemo, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Crosshair, X, LocateFixed, Loader2 } from 'lucide-react';
import type { TimelineItem } from '../types';
import { useAppStore, useActiveProject } from '../store/useAppStore';
import { geocode } from '../lib/geocode';
import PlaceMap, { type MapPoint } from '../components/PlaceMap';

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
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
  const points: MapPoint[] = placed.map((it, idx) => ({ id: it.id, lat: it.lat, lng: it.lng, seq: idx + 1 }));

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

      <PlaceMap
        points={points}
        selectedId={selected}
        onSelect={setSelected}
        onDrag={setCoords}
        route
        height="240px"
        hint="Mock Map · 아래 목록에서 '지도에 배치'로 핀 추가"
      />

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
