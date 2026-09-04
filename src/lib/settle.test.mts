import { test } from 'node:test';
import assert from 'node:assert/strict';
import { settle } from './settle.ts';

test('settle: 커플 — 한 명이 다 냄', () => {
  const r = settle([{ by: '나', krw: 100000 }], ['나', '동행']);
  assert.equal(r.share, 50000);
  assert.deepEqual(r.transfers, [{ from: '동행', to: '나', krw: 50000 }]);
});

test('settle: 반반씩 냄 → 송금 없음', () => {
  const r = settle([{ by: '나', krw: 60000 }, { by: '동행', krw: 60000 }], ['나', '동행']);
  assert.deepEqual(r.transfers, []);
});

test('settle: 3명 최소 송금', () => {
  const r = settle([
    { by: 'A', krw: 90000 },
    { by: 'B', krw: 30000 },
    { by: 'C', krw: 0 },
  ], ['A', 'B', 'C']);
  assert.equal(r.share, 40000);
  // A 는 +50000, B 는 -10000, C 는 -40000 → B·C 가 A 에게
  assert.equal(r.transfers.length, 2);
  assert.equal(r.transfers.reduce((s, t) => s + t.krw, 0), 50000);
  assert.ok(r.transfers.every((t) => t.to === 'A'));
});

test('settle: 지출 없음', () => {
  const r = settle([], ['나', '동행']);
  assert.equal(r.total, 0);
  assert.deepEqual(r.transfers, []);
});

console.log('settle.test.mts: OK');
