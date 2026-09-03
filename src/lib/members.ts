import { useAppStore } from '../store/useAppStore';

/** 현재 사용자 표시 이름 — 앱에서 바꾼 프로필명이 우선(카톡 기본 닉네임보다). */
export function useMyName(): string {
  return useAppStore((s) => nameOf(s));
}
function nameOf(s: ReturnType<typeof useAppStore.getState>): string {
  return (s.profile.displayName || '').trim() || s.cloudUser?.name || '나';
}
export const getMyName = () => nameOf(useAppStore.getState());

/**
 * 이 여행의 참여자 목록 (Todo 담당자 등).
 * = 나 + doc.people 의 다른 참여자. (메시지 발신자는 이름 변경 시 중복 유발해서 제외)
 */
const isJunkName = (k: string) => !k || !k.replace(/[\s.·・_-]/g, '');

export function useMemberNames(): string[] {
  const people = useAppStore((s) => s.present[s.activeProjectId]?.people);
  const cloudName = useAppStore((s) => s.cloudUser?.name);
  const me = useMyName();

  const set = new Set<string>([me]);
  for (const k of Object.keys(people ?? {})) {
    if (k === me || k === cloudName) continue; // 나 / 로그인 기본 닉네임(닉 변경 전 스냅샷)
    if (isJunkName(k)) continue; // "." 같은 카톡 기본 프로필명
    set.add(k);
  }
  return [...set];
}

/**
 * @멘션 후보 — 참여자(people) + 채팅을 보낸 적 있는 사람.
 * 담당자보다 느슨하게: 대화에 등장한 이름이면 멘션 가능.
 */
export function useMentionNames(): string[] {
  const people = useAppStore((s) => s.present[s.activeProjectId]?.people);
  const messages = useAppStore((s) => s.present[s.activeProjectId]?.messages);
  const cloudName = useAppStore((s) => s.cloudUser?.name);
  const me = useMyName();

  const set = new Set<string>();
  const add = (k?: string | null) => {
    if (!k || k === me || k === cloudName || isJunkName(k)) return;
    set.add(k);
  };
  Object.keys(people ?? {}).forEach(add);
  (messages ?? []).forEach((m) => add(m.author));
  return [...set];
}
