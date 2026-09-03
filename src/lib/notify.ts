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

// ---------- 코멘트 알림 ----------
const SEEN_KEY = 'mammoose-seen-comments';
const loadSeen = (): Set<string> => {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch { return new Set(); }
};
const saveSeen = (s: Set<string>) => {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...s].slice(-800))); } catch { /* noop */ }
};

type Cmt = { id: string; author: string; text: string; mentions?: string[] };
type WithComments = { comments?: Cmt[] };
type DocLike = { timeline?: WithComments[]; restaurants?: WithComments[]; hotels?: WithComments[]; spots?: WithComments[] };

/**
 * 클라우드에서 받은 문서들을 훑어, 내가 처음 보는 + 남이 쓴 코멘트가 있으면 알림.
 * 나를 @멘션한 코멘트는 더 눈에 띄게. 첫 호출(seed)에서는 기록만.
 */
export function notifyNewComments(docs: Record<string, DocLike>, myName: string, enabled: boolean) {
  let seededBefore = false;
  try { seededBefore = localStorage.getItem(SEEN_KEY) !== null; } catch { /* noop */ }
  const seen = loadSeen();
  const fresh: Cmt[] = [];

  for (const doc of Object.values(docs)) {
    for (const arr of [doc.timeline, doc.restaurants, doc.hotels, doc.spots]) {
      for (const row of arr ?? []) {
        for (const c of row.comments ?? []) {
          if (seen.has(c.id)) continue;
          seen.add(c.id);
          if (seededBefore && enabled && c.author && c.author !== myName) fresh.push(c);
        }
      }
    }
  }
  saveSeen(seen);
  if (!fresh.length) return;

  const mention = fresh.find((c) => (c.mentions ?? []).includes(myName));
  if (mention) {
    fireLocalNotification(`맘무스 · ${mention.author}님이 언급했어요`, mention.text);
  } else if (fresh.length === 1) {
    fireLocalNotification('맘무스 · 새 코멘트', `${fresh[0].author}: ${fresh[0].text}`);
  } else {
    fireLocalNotification('맘무스 · 새 코멘트', `동행자가 코멘트 ${fresh.length}개를 남겼어요`);
  }
}
