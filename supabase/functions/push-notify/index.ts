// 맘무스 웹 푸시 발송 — Supabase Edge Function
// 배포: 대시보드 → Edge Functions → push-notify → 이 코드 붙여넣기 → Deploy
// 시크릿(대시보드 → Edge Functions → Manage secrets):
//   VAPID_PUBLIC_KEY   = (클라이언트와 동일한 공개키)
//   VAPID_PRIVATE_KEY  = (비공개키)
//   VAPID_SUBJECT      = mailto:heart@onmom-agency.com
// (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 는 자동 주입됨)

import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { toNames = [], toUserIds = [], title, body, url = '/' } = await req.json();

    let q = admin.from('push_subscriptions').select('endpoint, p256dh, auth');
    if (toUserIds.length) q = q.in('user_id', toUserIds);
    else if (toNames.length) q = q.in('display_name', toNames);
    else return new Response(JSON.stringify({ sent: 0 }), { headers: { ...cors, 'Content-Type': 'application/json' } });

    const { data: subs, error } = await q;
    if (error) throw error;

    const payload = JSON.stringify({ title: title ?? '맘무스', body: body ?? '', url });
    let sent = 0;
    const dead: string[] = [];

    await Promise.all((subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.endpoint);
      }
    }));

    if (dead.length) await admin.from('push_subscriptions').delete().in('endpoint', dead);

    return new Response(JSON.stringify({ sent, cleaned: dead.length }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
