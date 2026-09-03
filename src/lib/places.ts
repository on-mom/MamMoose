import { useMemo } from 'react';
import type { Hotel } from '../types';
import { useAppStore } from '../store/useAppStore';

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

export function usePlaces(): Place[] {
  const spots = useAppStore((s) => s.present[s.activeProjectId]?.spots ?? []);
  const restaurants = useAppStore((s) => s.present[s.activeProjectId]?.restaurants ?? []);
  const hotels = useAppStore((s) => s.present[s.activeProjectId]?.hotels ?? []);

  return useMemo(() => {
    const out: Place[] = [];
    for (const sp of spots) {
      out.push({
        id: sp.id, kind: 'landmark', name: sp.name, area: sp.area,
        category: sp.category || '관광지', note: sp.tip,
        mapUrl: `https://maps.google.com/?q=${encodeURIComponent(sp.name + ' Hanoi')}`,
      });
    }
    for (const r of restaurants) {
      out.push({
        id: r.id, kind: 'food', name: r.nameKo || r.name, origName: r.name, area: r.area,
        category: r.category || '기타', priceText: r.priceVndText || undefined,
        priceValue: r.priceVndAvg || undefined, note: r.note, menu: r.menu, mapUrl: r.mapUrl,
      });
    }
    for (const h of hotels) {
      out.push({
        id: h.id, kind: 'stay', name: h.name, area: hotelArea(h),
        category: h.grade || '숙소', priceText: h.priceTotalText || undefined,
        priceValue: won(h.priceTotalText), rating: h.rating, note: h.feature,
        mapUrl: `https://maps.google.com/?q=${encodeURIComponent(h.name + ' Hanoi')}`,
      });
    }
    return out;
  }, [spots, restaurants, hotels]);
}
