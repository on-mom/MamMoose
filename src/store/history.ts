// 순수 Undo/Redo 히스토리 헬퍼 — past/present/future 3-스택, 최대 HISTORY_LIMIT.
// 스토어에서 분리해 두어 단독 테스트가 가능하다 (history.test.mjs).

export const HISTORY_LIMIT = 30;

export interface History<T> {
  past: T[];
  present: T;
  future: T[];
}

/** 현재 상태를 past에 밀어넣고 present를 교체, future는 비운다 (일반 변경) */
export function commit<T>(h: History<T>, next: T): History<T> {
  return {
    past: [...h.past, h.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
  };
}

export function undo<T>(h: History<T>): History<T> {
  if (!h.past.length) return h;
  return {
    past: h.past.slice(0, -1),
    present: h.past[h.past.length - 1],
    future: [h.present, ...h.future].slice(0, HISTORY_LIMIT),
  };
}

export function redo<T>(h: History<T>): History<T> {
  if (!h.future.length) return h;
  return {
    past: [...h.past, h.present].slice(-HISTORY_LIMIT),
    present: h.future[0],
    future: h.future.slice(1),
  };
}
