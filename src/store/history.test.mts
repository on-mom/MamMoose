// 순수 히스토리 헬퍼 검증 (Node 타입 스트리핑): node src/store/history.test.mts
import { strict as assert } from 'node:assert';
import { HISTORY_LIMIT, commit, undo, redo, type History } from './history.ts';

let h: History<number> = { past: [], present: 0, future: [] };

h = commit(h, 1);
h = commit(h, 2);
assert.deepEqual(h, { past: [0, 1], present: 2, future: [] });

h = undo(h);
assert.deepEqual(h, { past: [0], present: 1, future: [2] });

h = redo(h);
assert.deepEqual(h, { past: [0, 1], present: 2, future: [] });

// undo 후 새 변경이 들어오면 future 폐기
h = undo(h);
h = commit(h, 9);
assert.deepEqual(h.future, []);
assert.equal(h.present, 9);

// 빈 스택에서 undo/redo는 무해
assert.equal(undo({ past: [], present: 5, future: [] }).present, 5);
assert.equal(redo({ past: [], present: 5, future: [] }).present, 5);

// 히스토리 상한
let big: History<number> = { past: [], present: 0, future: [] };
for (let i = 1; i <= 50; i++) big = commit(big, i);
assert.equal(big.past.length, HISTORY_LIMIT);
assert.equal(big.past[0], 50 - HISTORY_LIMIT);
assert.equal(big.present, 50);

console.log('history.test.mts: OK');
