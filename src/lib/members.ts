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
export function useMemberNames(): string[] {
  const people = useAppStore((s) => s.present[s.activeProjectId]?.people);
  const me = useMyName();

  const set = new Set<string>([me]);
  for (const k of Object.keys(people ?? {})) {
    if (k && k !== me) set.add(k);
  }
  return [...set];
}
