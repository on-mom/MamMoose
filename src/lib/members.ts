import { useAppStore } from '../store/useAppStore';

/**
 * 이 여행의 참여자 닉네임 목록 (Todo 담당자 · 필터용).
 * - 클라우드 로그인: 내 이름 + doc.people(참여자 스냅샷) + 메시지 발신자
 * - 로컬 PIN 모드: 내 프로필명 하나
 */
export function useMemberNames(): string[] {
  const people = useAppStore((s) => s.present[s.activeProjectId]?.people);
  const messages = useAppStore((s) => s.present[s.activeProjectId]?.messages ?? []);
  const cloudName = useAppStore((s) => s.cloudUser?.name);
  const myName = useAppStore((s) => s.profile.displayName);

  const set = new Set<string>();
  if (cloudName) set.add(cloudName);
  if (myName) set.add(myName);
  for (const k of Object.keys(people ?? {})) set.add(k);
  for (const m of messages) if (m.author) set.add(m.author);
  return [...set];
}

/** 현재 사용자 표시 이름 */
export function useMyName(): string {
  return useAppStore((s) => s.cloudUser?.name || s.profile.displayName || '나');
}
