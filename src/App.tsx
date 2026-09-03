import { useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { useAppStore } from './store/useAppStore';
import { initCloudSync } from './store/cloudSync';
import { useUndoRedoHotkeys } from './lib/useUndoRedoHotkeys';
import AuthScreen from './components/AuthScreen';
import Layout from './components/Layout';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/** Google Maps JS를 앱 전역에 1회 로드 (지도·지오코딩·소요시간 공용). 키 있을 때만 렌더됨 */
function MapsBootstrap() {
  useJsApiLoader({ id: 'gmaps', googleMapsApiKey: MAPS_KEY! });
  return null;
}

type RGB = [number, number, number];
const parseHex = (hex: string): RGB => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const triplet = ([r, g, b]: RGB) => `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`;
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// 지각 밝기 (0~1)
const luminance = ([r, g, b]: RGB) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;

const THEME_VARS = ['--c-accent', '--c-bg', '--c-surface', '--c-surface-2', '--c-edge', '--c-fg', '--c-fg-dim'] as const;

function applyTheme(accent?: string, bg?: string) {
  const rootEl = document.documentElement;
  const S = rootEl.style;
  if (!accent && !bg) {
    THEME_VARS.forEach((v) => S.removeProperty(v));
    rootEl.removeAttribute('data-lighttheme');
    return;
  }
  const acc = parseHex(accent ?? '#ee86a9');
  const base = parseHex(bg ?? '#131019');
  const light = luminance(base) > 0.55;
  const fg: RGB = light ? [26, 24, 32] : [237, 237, 241];
  S.setProperty('--c-accent', triplet(acc));
  S.setProperty('--c-bg', triplet(base));
  S.setProperty('--c-surface', triplet(mix(base, fg, light ? 0.05 : 0.07)));
  S.setProperty('--c-surface-2', triplet(mix(base, fg, light ? 0.1 : 0.13)));
  S.setProperty('--c-edge', triplet(mix(base, fg, 0.17)));
  S.setProperty('--c-fg', triplet(fg));
  S.setProperty('--c-fg-dim', triplet(mix(fg, base, 0.42)));
  rootEl.toggleAttribute('data-lighttheme', light);
}

export default function App() {
  const unlocked = useAppStore((s) => s.unlocked);
  const themeAccent = useAppStore((s) => s.settings.themeAccent);
  const themeBg = useAppStore((s) => s.settings.themeBg);
  useUndoRedoHotkeys();
  useEffect(() => { initCloudSync(); }, []);

  useEffect(() => { applyTheme(themeAccent, themeBg); }, [themeAccent, themeBg]);

  return (
    <div className="h-full bg-moose-night">
      {MAPS_KEY ? <MapsBootstrap /> : null}
      {unlocked ? <Layout /> : <AuthScreen />}
    </div>
  );
}
