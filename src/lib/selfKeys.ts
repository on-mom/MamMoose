/** 내 옛 이름 스냅샷 키들 — 프로필명/로그인이 바뀔 때 doc.people 에서 지울 대상.
 *  로그인: userId 로 매칭 (입력 중 생긴 중간 이름까지) / 비로그인: 직전 이름·로그인닉·현재 displayName·'나'. */
export function staleSelfKeys(
  people: Record<string, { userId?: string } | undefined>,
  o: { me: string; was?: string; uid?: string | null; cloudName?: string | null; displayName?: string | null },
): string[] {
  return Object.keys(people).filter((k) => {
    if (k === o.me) return false;
    if (o.uid && people[k]?.userId === o.uid) return true;
    return k === o.was || k === o.cloudName || k === o.displayName || k === '나';
  });
}
