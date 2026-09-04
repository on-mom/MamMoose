import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { stashInviteFromUrl } from './store/cloudSync';
import './index.css';

stashInviteFromUrl(); // 초대 링크(?invite=)로 들어왔으면 코드 보관 → 로그인 후 자동 참여

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// PWA — 배포 환경에서만 서비스 워커 등록 (개발 중엔 캐시 방해 방지)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
