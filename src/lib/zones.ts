/**
 * 하노이 구역을 넓은 범주(존)로 묶는다.
 * 시드의 세분화된 area("성요셉 근처", "올드쿼터 북동쪽"…)를 6개 큰 존으로.
 * (DATE POP 처럼 큰 지역 단위로 고르게 하기 위함)
 */
export const ZONES = [
  { id: 'oldq', label: '올드쿼터·호안끼엠', emoji: '🏮', re: /올드쿼터|호안끼엠|항카이|성요셉|프렌치|뻐남/ },
  { id: 'badinh', label: '바딘·서호', emoji: '🏛️', re: /바딘|서호|롯데|죽백호|딴롱/ },
  { id: 'caugiay', label: '꺼우저이·신도심', emoji: '🏙️', re: /꺼우저이|미딘|남뜨리엠|탄쑤언|팜흥/ },
  { id: 'haibat', label: '하이바쯩·동다', emoji: '🌳', re: /하이바쯩|동다/ },
  { id: 'hadong', label: '하동·서부외곽', emoji: '🛍️', re: /하동|안카인|즈엉노이/ },
  { id: 'longbien', label: '롱비엔·강동', emoji: '🌉', re: /롱비엔|비엣흥|자럼/ },
] as const;

export type ZoneId = (typeof ZONES)[number]['id'];
export const ALL_ZONE_IDS: ZoneId[] = ZONES.map((z) => z.id);
export const zoneLabel = (id: string) => ZONES.find((z) => z.id === id)?.label ?? id;
export const zoneEmoji = (id: string) => ZONES.find((z) => z.id === id)?.emoji ?? '📍';

/** area 문자열이 속한 존들. "전역/체인"은 모든 존에 노출. 매칭 없으면 올드쿼터로 근사. */
export function zonesOf(area: string): ZoneId[] {
  if (!area || /전역|체인/.test(area)) return ALL_ZONE_IDS;
  const hit = ZONES.filter((z) => z.re.test(area)).map((z) => z.id);
  return hit.length ? hit : ['oldq'];
}
