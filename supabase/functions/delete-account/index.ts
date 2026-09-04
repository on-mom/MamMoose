// 맘무스 회원 탈퇴 — Supabase Edge Function
// 클라이언트에서는 지울 수 없는 auth.users 행까지 서비스 롤로 완전 삭제한다.
//
// 배포: 대시보드 → Edge Functions → delete-account → 이 코드 붙여넣기 → Deploy
// (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 는 자동 주입됨. 별도 시크릿 없음)
// 호출: supabase.functions.invoke('delete-account')  — 로그인 JWT 가 자동 첨부됨

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    // 1) 호출자 신원 확인 — Authorization 헤더의 사용자 JWT
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) return json({ error: 'no auth' }, 401);
    const { data: u, error: ue } = await admin.auth.getUser(jwt);
    if (ue || !u.user) return json({ error: 'invalid token' }, 401);
    const uid = u.user.id;

    // 2) 내가 만든 여행 삭제 (trip_members·invites 는 FK cascade)
    const { error: te } = await admin.from('trips').delete().eq('owner', uid);
    if (te) return json({ error: '여행 삭제 실패: ' + te.message }, 500);

    // 3) 참여 기록·푸시 구독 정리 (실패해도 계속)
    await admin.from('trip_members').delete().eq('user_id', uid).then(() => {}, () => {});
    await admin.from('push_subscriptions').delete().eq('user_id', uid).then(() => {}, () => {});

    // 4) 인증 계정 자체 삭제
    const { error: de } = await admin.auth.admin.deleteUser(uid);
    if (de) return json({ error: '계정 삭제 실패: ' + de.message }, 500);

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
