import { useEffect } from 'react';
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
    if (k === '나' && me !== '나') continue;   // 이름 정하기 전 내 스냅샷
    if (isJunkName(k)) continue;               // "." 같은 카톡 기본 프로필명
    set.add(k);
  }
  return [...set];
}

/** @멘션 후보 = 이 여행 참여자(나 제외). 담당자 목록과 동일 범위. */
export function useMentionNames(): string[] {
  const me = useMyName();
  return useMemberNames().filter((n) => n !== me);
}

/**
 * 이 여행에 내 프로필 스냅샷을 등록해 둔다 (참여자 목록·멘션 대상에 잡히도록).
 * 채팅을 안 열어봐도 앱을 켜면 참여자로 표시됨 → "소리 없이 보는" 상황 방지.
 */
export function useRegisterMe() {
  const projectId = useAppStore((s) => s.activeProjectId);
  const me = useMyName();
  const profile = useAppStore((s) => s.profile);
  const cloudUser = useAppStore((s) => s.cloudUser);
  const mutate = useAppStore((s) => s.mutate);

  useEffect(() => {
    if (!projectId) return;
    const cur = useAppStore.getState().present[projectId]?.people ?? {};
    const wantAvatar = profile.avatarDataUrl || cloudUser?.avatar || null;
    const staleKeys = [cloudUser?.name, profile.displayName, '나'].filter(
      (n): n is string => !!n && n !== me && !!cur[n],
    );
    if (cur[me]?.name === me && cur[me]?.avatar === wantAvatar && !staleKeys.length) return;
    mutate((doc) => {
      doc.people = doc.people ?? {};
      for (const k of staleKeys) delete doc.people[k];
      doc.people[me] = {
        ...(doc.people[me] ?? { bg: null, statusMessage: '' }),
        name: me,
        avatar: wantAvatar,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, me, profile.avatarDataUrl, cloudUser?.avatar]);
}
