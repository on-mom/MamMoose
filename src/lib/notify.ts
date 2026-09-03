/**
 * 여행 종료 후 "추억함 확인" 알림.
 * 지금은 브라우저 로컬 Notification (앱을 한 번이라도 연 상태에서 동작).
 * 앱이 완전히 닫혀 있어도 오는 백그라운드 웹푸시는 VAPID 공개키 + 서비스워커 +
 * 발송 서버가 필요 → 온마음 푸시 인프라 연동 시 subscribeForPush() 자리에 연결.
 */
export const canNotify = () => typeof Notification !== 'undefined';

export async function ensureNotifyPermission(): Promise<boolean> {
  if (!canNotify()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

export function fireLocalNotification(title: string, body: string) {
  if (!canNotify() || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, { body, icon: '/moose-face.png', badge: '/moose-face.png' });
    n.onclick = () => { window.focus(); n.close(); };
  } catch {
    /* Safari 등 생성자 제한 — 무시 */
  }
}

const KEY = (id: string) => `mammoose-notified-${id}`;
export const alreadyNotified = (tripId: string) => {
  try { return localStorage.getItem(KEY(tripId)) === '1'; } catch { return false; }
};
export const markNotified = (tripId: string) => {
  try { localStorage.setItem(KEY(tripId), '1'); } catch { /* private mode */ }
};
