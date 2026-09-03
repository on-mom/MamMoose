/**
 * 구글 번역 API (v2) 연동 — 큐레이션 안 된 언어의 회화 번역용.
 * VITE_GOOGLE_TRANSLATE_API_KEY 가 있을 때만 동작. 결과는 localStorage 에 캐시.
 */
const KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY ?? '';
export const translateEnabled = !!KEY;

const cacheKey = (target: string) => `mammoose-tr-${target}`;

function readCache(target: string): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(cacheKey(target)) || '{}'); } catch { return {}; }
}
function writeCache(target: string, map: Record<string, string>) {
  try { localStorage.setItem(cacheKey(target), JSON.stringify(map)); } catch { /* quota — 무시 */ }
}

/**
 * 한국어 문장 배열 → target 언어 번역 배열 (입력과 같은 순서).
 * 캐시에 있는 건 재사용, 없는 것만 1회 배치 호출. 실패 시 원문 반환.
 */
export async function translateBatch(texts: string[], target: string): Promise<string[]> {
  if (!KEY) return texts;
  const cache = readCache(target);
  const missing = [...new Set(texts.filter((t) => !cache[t]))];

  if (missing.length) {
    try {
      const res = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: missing, source: 'ko', target, format: 'text' }),
        },
      );
      const json = await res.json();
      const out: Array<{ translatedText: string }> = json?.data?.translations ?? [];
      missing.forEach((src, i) => { if (out[i]?.translatedText) cache[src] = out[i].translatedText; });
      writeCache(target, cache);
    } catch { /* 네트워크/키 오류 → 원문 유지 */ }
  }

  return texts.map((t) => cache[t] || t);
}
