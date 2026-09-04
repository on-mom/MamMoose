import { useEffect, useState } from 'react';

// 장소 대표 사진 — 위키백과 PageImages API (무료·키 없음·CORS 허용).
// 결과(있음/없음)를 localStorage 에 영구 캐시해 재조회 안 함.

const CACHE_KEY = 'mammoose-placephoto';
type Cache = Record<string, string | null>;

const load = (): Cache => { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; } };
const save = (c: Cache) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch { /* quota */ } };

async function wikiThumb(title: string, lang: 'ko' | 'en'): Promise<string | null> {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json`
    + `&pithumbsize=640&redirects=1&titles=${encodeURIComponent(title)}&origin=*`;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    for (const p of Object.values(j?.query?.pages ?? {}) as Array<{ thumbnail?: { source?: string } }>) {
      if (p?.thumbnail?.source) return p.thumbnail.source.split('?')[0];
    }
  } catch { /* offline */ }
  return null;
}

/** 장소명으로 대표 사진 URL 조회 (없으면 null). name=한글표기, origName=원어명. */
export function usePlacePhoto(name?: string, origName?: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const key = (name || origName || '').trim();
    if (!key) { setUrl(null); return; }
    const cache = load();
    if (key in cache) { setUrl(cache[key]); return; }
    setUrl(null);
    let alive = true;
    (async () => {
      let hit = await wikiThumb(name || key, 'ko');
      if (!hit && origName && origName !== name) hit = await wikiThumb(origName, 'en');
      if (!alive) return;
      const c = load(); c[key] = hit; save(c);
      setUrl(hit);
    })();
    return () => { alive = false; };
  }, [name, origName]);
  return url;
}
