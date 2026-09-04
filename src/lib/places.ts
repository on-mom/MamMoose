import { useMemo } from 'react';
import type { EntryComment, Hotel, PoiInfo } from '../types';
import { useAppStore, useActiveProject } from '../store/useAppStore';
import { regionFor } from '../data/regions';

/**
 * 통합 "장소" 뷰 모델 — 관광지(spots) · 맛집(restaurants) · 숙소(hotels)를
 * 읽는 시점에 하나의 Place 형태로 합친다. (원본 3개 배열은 각 탭이 그대로 소유·편집)
 * ponytail: persist 마이그레이션 없이 파생 뷰로. 담기는 timeline 항목 추가라 원본 불변.
 */
export type PlaceKind = 'landmark' | 'food' | 'stay';

export const KIND_LABEL: Record<PlaceKind, string> = {
  landmark: '랜드마크·관광지',
  food: '맛집·카페·식당',
  stay: '숙소',
};

export interface Place {
  id: string;
  kind: PlaceKind;
  /** 화면 표기 (한국어 우선) */
  name: string;
  /** 원어명 (구글맵 검색용) */
  origName?: string;
  area: string;
  category: string;
  priceText?: string;
  priceValue?: number;
  rating?: number;
  note?: string;
  menu?: string;
  mapUrl?: string;
  comments?: EntryComment[];
  /** 구글 지도에서 불러온 기본 정보 */
  poi?: PoiInfo;
  /** 숙소(stay) 전용 정보 */
  breakfast?: string;
  nearby?: string;
  grade?: string;
}

// 숙소 주소 → 한국식 구역명 (RestaurantsTab 에서 이동)
const VIET_DISTRICT: [RegExp, string][] = [
  [/Tây Hồ|Quảng An|Từ Hoa|Lạc Long/i, '서호'],
  [/Hoàn Kiếm|Hàng Bông|Hàng /i, '올드쿼터'],
  [/Ba Đình/i, '바딘'],
  [/Cầu Giấy|Hoàng Quốc Việt|Khuất Duy Tiến|Hoàng Đạo Thúy|Trung Hoà/i, '꺼우저이'],
  [/Nam Từ Liêm|Mễ Trì|Châu Văn Liêm/i, '미딘'],
  [/Hai Bà Trưng/i, '하이바쯩'],
];
export const hotelArea = (h: Hotel): string => {
  for (const [re, ko] of VIET_DISTRICT) if (re.test(h.address)) return ko;
  return h.nearby.match(/서호|올드쿼터|바딘|꺼우저이|미딘|하이바쯩|호안끼엠/)?.[0] ?? '';
};

const won = (t: string) =>
  Number((t.match(/[\d,]+/)?.[0] ?? '0').replace(/,/g, '')) * (/만/.test(t) ? 10000 : 1);

/** 구역 토큰 분리: "바딘/올드쿼터" → ["바딘","올드쿼터"] */
export const splitAreas = (area: string) =>
  area.split(/[/·,、|]|\s-\s/).map((a) => a.trim()).filter(Boolean);

/** true = 여행지 기본 제공 데이터 (문서에 저장 안 됨, 편집 불가) */
export const isSeedPlace = (id: string) => id.startsWith('region:');

export function usePlaces(): Place[] {
  const spots = useAppStore((s) => s.present[s.activeProjectId]?.spots ?? []);
  const restaurants = useAppStore((s) => s.present[s.activeProjectId]?.restaurants ?? []);
  const hotels = useAppStore((s) => s.present[s.activeProjectId]?.hotels ?? []);
  const project = useActiveProject();
  const dest = project?.destination || '';

  return useMemo(() => {
    const q = (name: string) => `https://maps.google.com/?q=${encodeURIComponent(`${name} ${dest}`.trim())}`;
    const out: Place[] = [];
    for (const sp of spots) {
      out.push({
        id: sp.id, kind: 'landmark', name: sp.name, area: sp.area,
        category: sp.category || '관광지', note: sp.tip, comments: sp.comments, poi: sp.poi,
        mapUrl: q(sp.name),
      });
    }
    for (const r of restaurants) {
      out.push({
        id: r.id, kind: 'food', name: r.nameKo || r.name, origName: r.name, area: r.area,
        category: r.category || '기타', priceText: r.priceVndText || undefined,
        priceValue: r.priceVndAvg || undefined, note: r.note, menu: r.menu, mapUrl: r.mapUrl,
        comments: r.comments, poi: r.poi,
      });
    }
    for (const h of hotels) {
      out.push({
        id: h.id, kind: 'stay', name: h.name, area: hotelArea(h),
        category: h.grade || '숙소', priceText: h.priceTotalText || undefined,
        priceValue: won(h.priceTotalText), rating: h.rating, note: h.feature,
        mapUrl: q(h.name),
        comments: h.comments, poi: h.poi,
        breakfast: h.breakfast || undefined, nearby: h.nearby || undefined, grade: h.grade || undefined,
      });
    }
    // 여행지 기본 제공 스팟/맛집 (문서에 없는 이름만 추가 — 중복 방지)
    const region = regionFor(project?.destination, project?.timezone, project?.name);
    if (region) {
      const known = new Set(out.map((p) => (p.origName || p.name)));
      region.spots.forEach((sp, i) => {
        if (known.has(sp.name) || known.has(sp.nameKo ?? '')) return;
        out.push({
          id: `region:${region.id}:s${i}`, kind: 'landmark', name: sp.nameKo || sp.name,
          origName: sp.name, area: sp.area, category: sp.category || '관광지', note: sp.note,
          mapUrl: q(sp.name),
        });
      });
      region.restaurants.forEach((r, i) => {
        if (known.has(r.name) || known.has(r.nameKo ?? '')) return;
        out.push({
          id: `region:${region.id}:r${i}`, kind: 'food', name: r.nameKo || r.name,
          origName: r.name, area: r.area, category: r.category || '맛집', note: r.note, menu: r.menu,
          mapUrl: q(r.name),
        });
      });
    }
    return out;
  }, [spots, restaurants, hotels, dest, project?.timezone, project?.name]);
}
