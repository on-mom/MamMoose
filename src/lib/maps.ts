/** 구글맵 길찾기 딥링크 — 폰에선 구글맵 앱 내비가 바로 뜬다. */
export function directionsUrl(place: string, lat?: number | null, lng?: number | null): string {
  const dest = lat != null && lng != null ? `${lat},${lng}` : `${place} Hanoi`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}
