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

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

export default function App() {
  const unlocked = useAppStore((s) => s.unlocked);
  const themeAccent = useAppStore((s) => s.settings.themeAccent);
  const themeBg = useAppStore((s) => s.settings.themeBg);
  useUndoRedoHotkeys();
  useEffect(() => { initCloudSync(); }, []);

  useEffect(() => {
    const root = document.documentElement.style;
    if (themeAccent) root.setProperty('--c-accent', hexToRgb(themeAccent));
    else root.removeProperty('--c-accent');
    if (themeBg) root.setProperty('--c-bg', hexToRgb(themeBg));
    else root.removeProperty('--c-bg');
  }, [themeAccent, themeBg]);

  return (
    <div className="h-full bg-moose-night">
      {MAPS_KEY ? <MapsBootstrap /> : null}
      {unlocked ? <Layout /> : <AuthScreen />}
    </div>
  );
}
