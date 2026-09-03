import { useEffect, useState } from 'react';

// 하노이 날씨 — open-meteo (무료, API 키 불필요). 6시간 localStorage 캐시.
// ponytail: 목적지 좌표는 하노이 고정. 다른 여행 지원 시 geocode(project.destination).
const HANOI = { lat: 21.03, lng: 105.85 };
const CACHE_KEY = 'mammoose-weather';
const TTL = 6 * 3600 * 1000;

export interface DayWx {
  date: string; // YYYY-MM-DD
  code: number;
  tmax: number;
  tmin: number;
  pop: number; // 강수 확률 %
}

const WMO: [number[], string, string][] = [
  [[0], '☀️', '맑음'],
  [[1, 2], '⛅', '구름 조금'],
  [[3], '☁️', '흐림'],
  [[45, 48], '🌫️', '안개'],
  [[51, 53, 55, 56, 57], '🌦️', '이슬비'],
  [[61, 63, 65, 66, 67, 80, 81, 82], '🌧️', '비'],
  [[71, 73, 75, 77, 85, 86], '❄️', '눈'],
  [[95, 96, 99], '⛈️', '뇌우'],
];
export const wxIcon = (code: number) => WMO.find(([c]) => c.includes(code))?.[1] ?? '🌡️';
export const wxLabel = (code: number) => WMO.find(([c]) => c.includes(code))?.[2] ?? '—';

async function load(): Promise<Record<string, DayWx>> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const { at, data } = JSON.parse(raw);
      if (Date.now() - at < TTL) return data;
    }
  } catch { /* noop */ }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${HANOI.lat}&longitude=${HANOI.lng}`
    + `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max`
    + `&timezone=Asia%2FBangkok&forecast_days=16`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('weather fetch failed');
  const j = await res.json();
  const d = j.daily;
  const out: Record<string, DayWx> = {};
  for (let i = 0; i < d.time.length; i++) {
    out[d.time[i]] = {
      date: d.time[i],
      code: d.weather_code[i],
      tmax: Math.round(d.temperature_2m_max[i]),
      tmin: Math.round(d.temperature_2m_min[i]),
      pop: d.precipitation_probability_max?.[i] ?? 0,
    };
  }
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data: out })); } catch { /* noop */ }
  return out;
}

/** 날짜(YYYY-MM-DD) → 일기예보. 범위 밖이면 값 없음. */
export function useWeather(): Record<string, DayWx> {
  const [wx, setWx] = useState<Record<string, DayWx>>({});
  useEffect(() => {
    let live = true;
    load().then((d) => { if (live) setWx(d); }).catch(() => {});
    return () => { live = false; };
  }, []);
  return wx;
}
