// 장소명 → 좌표. Google Maps JS(Geocoder)가 로드돼 있어야 동작. 결과는 localStorage 캐시.
const KEY = 'mammoose-geo-cache';

let cache: Record<string, { lat: number; lng: number } | null> = {};
try { cache = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { /* noop */ }

const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* noop */ } };

export function mapsReady(): boolean {
  return !!(globalThis as any).google?.maps?.Geocoder;
}

export async function geocode(place: string): Promise<{ lat: number; lng: number } | null> {
  const q = place.trim();
  if (!q) return null;
  if (q in cache) return cache[q];
  const g = (globalThis as any).google;
  if (!g?.maps?.Geocoder) return null;
  const result = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
    new g.maps.Geocoder().geocode(
      { address: `${q}, Hà Nội, Việt Nam` },
      (res: any, status: string) => {
        const loc = status === 'OK' && res?.[0]?.geometry?.location;
        resolve(loc ? { lat: loc.lat(), lng: loc.lng() } : null);
      },
    );
  });
  cache[q] = result;
  save();
  return result;
}
