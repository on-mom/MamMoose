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

export default function App() {
  const unlocked = useAppStore((s) => s.unlocked);
  useUndoRedoHotkeys();
  useEffect(() => { initCloudSync(); }, []);

  return (
    <div className="h-full bg-moose-night">
      {MAPS_KEY ? <MapsBootstrap /> : null}
      {unlocked ? <Layout /> : <AuthScreen />}
    </div>
  );
}
