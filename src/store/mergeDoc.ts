// 여행 문서 3-way 병합 — 항목(id) 단위 last-write-wins.
// 두 사람이 서로 다른 항목을 편집하면 둘 다 살아남고, 같은 항목을 동시에
// 편집한 경우에만 "내 변경"이 이긴다. (Trello·Linear 류 협업 앱과 같은 방식)
//
// base   = 내가 마지막으로 서버와 맞췄던 문서
// mine   = 지금 내 로컬 문서
// theirs = 방금 서버에서 받은 문서

type Row = { id: string } & Record<string, unknown>;
type Doc = Record<string, unknown>;

export const ARRAY_FIELDS = [
  'timeline', 'restaurants', 'hotels', 'spots', 'todos', 'expenses', 'messages', 'diary',
] as const;

const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function mergeRows(base: Row[] = [], mine: Row[] = [], theirs: Row[] = []): Row[] {
  const bById = new Map(base.map((r) => [r.id, r]));
  const myById = new Map(mine.map((r) => [r.id, r]));
  const myIds = new Set(myById.keys());

  const iDeleted = new Set([...bById.keys()].filter((id) => !myIds.has(id)));
  const iChanged = new Set(
    [...myIds].filter((id) => !bById.has(id) || !eq(myById.get(id), bById.get(id))),
  );

  const out: Row[] = [];
  const seen = new Set<string>();
  for (const r of theirs) {
    if (iDeleted.has(r.id)) continue;                      // 내가 지운 항목은 뺀다
    seen.add(r.id);
    out.push(iChanged.has(r.id) ? myById.get(r.id)! : r);  // 동시 수정 → 내 것, 아니면 상대 것
  }
  for (const r of mine) {                                  // theirs 에 없는 내 항목
    if (seen.has(r.id)) continue;
    if (bById.has(r.id) && !iChanged.has(r.id)) continue;  // 상대가 지운 항목(내가 안 건드림) → 존중
    out.push(r);                                           // 내가 새로 추가 → 유지
  }
  return out;
}

function mergePeople(base: Doc = {}, mine: Doc = {}, theirs: Doc = {}): Doc {
  const out: Doc = { ...theirs };
  for (const k of Object.keys(mine)) {
    if (!(k in base) || !eq(mine[k], base[k])) out[k] = mine[k];        // 내가 추가/수정
  }
  for (const k of Object.keys(base)) {
    if (!(k in mine) && k in out && eq(out[k], base[k])) delete out[k]; // 내가 지웠고 상대는 그대로
  }
  return out;
}

export function mergeDoc<T extends object>(base: T | undefined, mine: T, theirs: T): T {
  if (!base) return mine ?? theirs;               // 기준 없음 → 내 로컬 우선
  const b = base as Doc, m = mine as Doc, t = theirs as Doc;
  const out: Doc = { ...t };
  for (const f of ARRAY_FIELDS) {
    out[f] = mergeRows(b[f] as Row[], m[f] as Row[], t[f] as Row[]);
  }
  out.people = mergePeople(b.people as Doc, m.people as Doc, t.people as Doc);
  return out as T;
}

/** 병합 결과가 서버 문서와 항목 단위로 다른지 (다르면 다시 push 해야 함) */
export function docDiffers<T extends object>(a: T, b: T): boolean {
  const x = a as Doc, y = b as Doc;
  for (const f of [...ARRAY_FIELDS, 'people'] as string[]) {
    if (!eq(x?.[f], y?.[f])) return true;
  }
  return false;
}
