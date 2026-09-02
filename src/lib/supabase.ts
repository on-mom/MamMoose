import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** env 가 없으면 null → 앱은 기존 PIN + 로컬 저장 모드로만 동작 */
export const supabase: SupabaseClient | null =
  url && anon ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

export const cloudEnabled = !!supabase;

export type Provider = 'kakao' | 'google';

export async function signInWith(provider: Provider) {
  if (!supabase) return;
  // 참고: 카카오는 Supabase 내장 기본 scope(account_email, profile_image, profile_nickname)가
  // 항상 요청되므로, 카카오 개발자 콘솔의 '동의항목'에서 이 3개를 모두 활성화해야 한다.
  await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  });
}

export async function signOut() {
  await supabase?.auth.signOut();
}
