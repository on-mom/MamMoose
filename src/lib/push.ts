import { supabase } from './supabase';
import { useAppStore } from '../store/useAppStore';

/**
 * 웹 푸시 — 온마음 구조를 Supabase 로 이식.
 * 구독 저장은 여기(anon key + 사용자 세션). 실제 발송은 Edge Function(push-notify).
 * VITE_VAPID_PUBLIC_KEY 없으면 조용히 비활성(로컬 알림만 동작).
 */
const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export const pushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  !!VAPID_PUBLIC &&
  !!supabase;

function urlBase64ToUint8Array(base64: string) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** 알림 켜기: SW 등록 → 권한 → 구독 생성 → 서버(테이블) 저장 */
export async function enablePush(): Promise<boolean> {
  if (!pushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    if (Notification.permission !== 'granted') {
      if ((await Notification.requestPermission()) !== 'granted') return false;
    }
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC!),
      }));

    const j = sub.toJSON();
    const s = useAppStore.getState();
    await supabase!.from('push_subscriptions').upsert(
      {
        user_id: s.cloudUser?.id,
        endpoint: j.endpoint,
        p256dh: j.keys?.p256dh,
        auth: j.keys?.auth,
        display_name: s.cloudUser?.name ?? s.profile.displayName ?? null,
        user_agent: navigator.userAgent.slice(0, 200),
        last_used_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' },
    );
    return true;
  } catch (e) {
    console.warn('[push] enable 실패', e);
    return false;
  }
}

export async function disablePush() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await supabase?.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    }
  } catch { /* noop */ }
}

/** 멘션 등으로 특정 사람에게 푸시 (Edge Function 미배포면 조용히 무시) */
export async function pushNotify(toNames: string[], title: string, body: string, url = '/') {
  if (!supabase || toNames.length === 0) return;
  try {
    await supabase.functions.invoke('push-notify', { body: { toNames, title, body, url } });
  } catch { /* 함수 미배포 — 무시 */ }
}
