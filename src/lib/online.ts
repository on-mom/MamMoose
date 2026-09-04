import { useEffect, useState } from 'react';

/** 네트워크 연결 상태 (navigator.onLine + online/offline 이벤트). */
export function useOnline(): boolean {
  const [on, setOn] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const up = () => setOn(true);
    const down = () => setOn(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  return on;
}

/** 앱 셸(HTML·JS·CSS)을 서비스워커 캐시에 강제로 채워 넣는다 — 비행기 탑승 전 "지금 저장". */
export async function precacheShell(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const reg = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((r) => setTimeout(() => r(null), 1500)), // 개발모드 등 SW 없을 때 무한대기 방지
  ]).catch(() => null);
  const sw = reg?.active ?? navigator.serviceWorker.controller;
  if (!sw) return;
  const urls = ['/', ...performance.getEntriesByType('resource')
    .map((e) => e.name)
    .filter((n) => n.startsWith(location.origin) && /\/assets\//.test(n))];
  sw.postMessage({ type: 'precache', urls });
  // SW 가 응답을 줄 때까지 잠깐 기다림 (없어도 진행)
  await new Promise<void>((resolve) => {
    const t = setTimeout(resolve, 2500);
    const done = (e: MessageEvent) => {
      if (e.data?.type === 'precache-done') { clearTimeout(t); navigator.serviceWorker.removeEventListener('message', done); resolve(); }
    };
    navigator.serviceWorker.addEventListener('message', done);
  });
}
