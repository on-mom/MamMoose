import { useEffect, useMemo, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Crosshair, X, LocateFixed, Loader2, Navigation, Route } from 'lucide-react';
import { GMAPS_LIBRARIES, GMAPS_LANGUAGE } from '../lib/gmaps';
import type { TimelineItem } from '../types';
import { useAppStore, useActiveProject } from '../store/useAppStore';
import { geocode } from '../lib/geocode';
import { directionsUrl } from '../lib/maps';
import PlaceMap, { type MapPoint } from '../components/PlaceMap';

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
const HANOI = { lat: 21.0285, lng: 105.8542 };

const tripDays = (s: string, e: string) =>
  Math.max(1, Math.round((Date.parse(e) - Date.parse(s)) / 86400000) + 1);

type Placed = TimelineItem & { lat: number; lng: number };

export default function MapView() {
  const project = useActiveProject()!;
  const items = useAppStore((s) => s.present[s.activeProjectId]?.timeline ?? []);
  const hotels = useAppStore((s) => s.present[s.activeProjectId]?.hotels ?? []);
  const mutate = useAppStore((s) => s.mutate);
  const days = tripDays(project.startDate, project.endDate);
  const [day, setDay] = useState(1);
  const [geoBusy, setGeoBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const { isLoaded } = useJsApiLoader({ id: 'gmaps', googleMapsApiKey: KEY, libraries: GMAPS_LIBRARIES, language: GMAPS_LANGUAGE });

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

  // ---- 동선 정렬: 숙소(주소 지오코딩) 또는 첫 장소를 기준점으로 ----
  const [hotelPt, setHotelPt] = useState<{ lat: number; lng: number; name: string } | null>(null);
  useEffect(() => {
    const h = hotels.find((x) => x.address && x.address.trim());
    if (!h || !KEY) { setHotelPt(null); return; }
    let alive = true;
    geocode(h.address).then((r) => { if (alive && r) setHotelPt({ ...r, name: h.name }); });
    return () => { alive = false; };
  }, [hotels]);

  // 숙소가 기준점 (지오코딩 성공 시). 숙소 위치가 없으면 첫 장소를 '출발점'으로 고정하고 나머지를 정렬.
  const firstMovable = useMemo(
    () => dayItems.find((i) => !i.flightLeg && i.lat != null && i.lng != null) ?? null,
    [dayItems],
  );
  const anchor = hotelPt
    ? { lat: hotelPt.lat, lng: hotelPt.lng, label: `숙소 ${hotelPt.name}` }
    : firstMovable
      ? { lat: firstMovable.lat!, lng: firstMovable.lng!, label: `출발점 ${firstMovable.place}` }
      : null;

  const sortRoute = (mode: 'near' | 'far' | 'reverse') => {
    if (dayItems.length < 2 || (mode !== 'reverse' && !anchor)) return;
    const outbound = dayItems.filter((i) => i.flightLeg === 'outbound');
    const inbound = dayItems.filter((i) => i.flightLeg === 'inbound');
    let movable = dayItems.filter((i) => !i.flightLeg);

    // 숙소 위치가 없어 첫 장소를 기준으로 쓰면, 그 장소는 맨 앞에 고정하고 나머지만 정렬
    const pinId = !hotelPt && firstMovable ? firstMovable.id : null;
    const pinned = pinId ? movable.filter((i) => i.id === pinId) : [];
    movable = pinId ? movable.filter((i) => i.id !== pinId) : movable;

    let ordered: TimelineItem[];
    if (mode === 'reverse') {
      ordered = [...pinned, ...movable].reverse();
    } else {
      const d2 = (i: TimelineItem) =>
        i.lat == null || i.lng == null ? Infinity : (i.lat - anchor!.lat) ** 2 + (i.lng - anchor!.lng) ** 2;
      ordered = [...pinned, ...[...movable].sort((a, b) => (mode === 'near' ? d2(a) - d2(b) : d2(b) - d2(a)))];
    }
    const final = [...outbound, ...ordered, ...inbound];
    mutate((doc) => {
      final.forEach((it, idx) => {
        const t = doc.timeline.find((x) => x.id === it.id);
        if (t) t.order = idx;
      });
    });
  };

  const pickRow = async (it: TimelineItem) => {
    setSelected(it.id);
    if (it.lat == null && KEY && it.place && it.place !== '새 일정') {
      const r = await geocode(it.place);
      if (r) setCoords(it.id, r.lat, r.lng);
    }
  };

  return (
    <div className="edge flex h-full flex-col space-y-3 overflow-y-auto py-3">
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

      {dayItems.filter((i) => !i.flightLeg).length >= 2 && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-moose-dusk/50 px-2.5 py-2 text-[11px]">
          <span className="flex items-center gap-1 text-slate-400"><Route size={12} /> 동선 정렬</span>
          <button
            onClick={() => sortRoute('near')}
            disabled={!anchor}
            className="rounded-md bg-white/5 px-2 py-1 text-slate-200 disabled:opacity-40"
          >가까운 순</button>
          <button
            onClick={() => sortRoute('far')}
            disabled={!anchor}
            className="rounded-md bg-white/5 px-2 py-1 text-slate-200 disabled:opacity-40"
          >먼 순</button>
          <button
            onClick={() => sortRoute('reverse')}
            className="rounded-md bg-white/5 px-2 py-1 text-slate-200"
          >↕ 뒤집기</button>
          {anchor
            ? <span className="w-full text-[10px] text-slate-500">기준: {anchor.label}</span>
            : <span className="w-full text-[10px] text-slate-500">장소에 핀을 찍으면 거리순으로 정렬할 수 있어요</span>}
        </div>
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
            {it.place && it.place !== '새 일정' && (
              <a
                href={directionsUrl(it.place, it.lat, it.lng)}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-0.5 text-moose-heart"
              >
                <Navigation size={11} /> 길찾기
              </a>
            )}
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
