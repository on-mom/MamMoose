/**
 * 구글 지도 URL / 장소명 → Places API 로 기본 정보(주소·영업시간·평점·전화·웹) 조회.
 * Maps JS API + Places 라이브러리가 로드돼 있고, 키에 Places API 가 허용돼야 동작.
 * 안 되면 조용히 null.
 */
import type { PoiInfo } from '../types';
export type { PoiInfo };

/** 다양한 구글맵 URL 형태에서 검색어·좌표·place_id 추출 */
export function parseMapsUrl(url: string): { query?: string; lat?: number; lng?: number; placeId?: string } {
  if (!url) return {};
  try {
    const u = new URL(url.trim());
    const path = decodeURIComponent(u.pathname);
    const placeSeg = path.match(/\/maps\/place\/([^/@]+)/);
    const at = path.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/)
      || (u.searchParams.get('ll') || u.searchParams.get('center') || '').match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    const q = u.searchParams.get('q') || u.searchParams.get('query') || u.searchParams.get('destination');
    const pid = u.searchParams.get('query_place_id') || u.searchParams.get('place_id');
    let query = placeSeg ? placeSeg[1].replace(/\+/g, ' ') : (q ?? undefined);
    if (query && /^-?\d+\.\d+,-?\d+\.\d+$/.test(query)) query = undefined; // q 가 좌표면 검색어 아님
    return {
      query,
      lat: at ? Number(at[1]) : undefined,
      lng: at ? Number(at[2]) : undefined,
      placeId: pid ?? undefined,
    };
  } catch {
    return {};
  }
}

type G = typeof google;
const hasPlaces = () => typeof google !== 'undefined' && !!(google as G).maps?.places?.PlacesService;

function toInfo(p: google.maps.places.PlaceResult): PoiInfo {
  const loc = p.geometry?.location;
  return {
    address: p.formatted_address || undefined,
    hours: p.opening_hours?.weekday_text?.length ? p.opening_hours.weekday_text : undefined,
    openNow: p.opening_hours?.isOpen?.() ?? p.opening_hours?.open_now,
    rating: p.rating || undefined,
    ratingCount: p.user_ratings_total || undefined,
    phone: p.formatted_phone_number || p.international_phone_number || undefined,
    website: p.website || undefined,
    mapUrl: p.url || undefined,
    lat: loc?.lat(),
    lng: loc?.lng(),
    fetchedAt: Date.now(),
  };
}

const FIELDS = [
  'name', 'formatted_address', 'opening_hours', 'rating', 'user_ratings_total',
  'formatted_phone_number', 'international_phone_number', 'website', 'url', 'geometry',
];

/** 장소 정보 조회. 실패/미지원이면 null. */
export async function lookupPlace(input: {
  query?: string; lat?: number; lng?: number; placeId?: string;
}): Promise<PoiInfo | null> {
  if (!hasPlaces()) return null;
  const svc = new google.maps.places.PlacesService(document.createElement('div'));

  const getDetails = (placeId: string) =>
    new Promise<PoiInfo | null>((res) => {
      svc.getDetails({ placeId, fields: FIELDS }, (p, status) => {
        res(status === google.maps.places.PlacesServiceStatus.OK && p ? toInfo(p) : null);
      });
    });

  if (input.placeId) return getDetails(input.placeId);
  if (!input.query?.trim()) return null;

  return new Promise((res) => {
    const req: google.maps.places.FindPlaceFromQueryRequest = {
      query: input.query!.trim(),
      fields: ['place_id'],
    };
    if (input.lat != null && input.lng != null) {
      req.locationBias = new google.maps.LatLng(input.lat, input.lng);
    }
    svc.findPlaceFromQuery(req, (r, status) => {
      const id = status === google.maps.places.PlacesServiceStatus.OK ? r?.[0]?.place_id : undefined;
      if (!id) return res(null);
      getDetails(id).then(res);
    });
  });
}
