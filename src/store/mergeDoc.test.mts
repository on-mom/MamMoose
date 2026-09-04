import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeDoc, docDiffers } from './mergeDoc.ts';

const doc = (timeline: any[] = [], people: any = {}) => ({
  timeline, restaurants: [], hotels: [], spots: [], todos: [], expenses: [], messages: [], diary: [], people,
});

test('mergeDoc: 서로 다른 항목 편집 → 둘 다 유지', () => {
  const base = doc([{ id: 'a', t: '1' }, { id: 'b', t: '1' }]);
  const mine = doc([{ id: 'a', t: 'MINE' }, { id: 'b', t: '1' }]);
  const theirs = doc([{ id: 'a', t: '1' }, { id: 'b', t: 'THEIRS' }]);
  const m = mergeDoc(base, mine, theirs) as any;
  assert.deepEqual(m.timeline, [{ id: 'a', t: 'MINE' }, { id: 'b', t: 'THEIRS' }]);
});

test('mergeDoc: 같은 항목 동시 편집 → 내 것이 이김', () => {
  const base = doc([{ id: 'a', t: '1' }]);
  const mine = doc([{ id: 'a', t: 'MINE' }]);
  const theirs = doc([{ id: 'a', t: 'THEIRS' }]);
  assert.deepEqual((mergeDoc(base, mine, theirs) as any).timeline, [{ id: 'a', t: 'MINE' }]);
});

test('mergeDoc: 상대가 추가한 항목 유지', () => {
  const base = doc([{ id: 'a' }]);
  const mine = doc([{ id: 'a' }]);
  const theirs = doc([{ id: 'a' }, { id: 'new', t: 'x' }]);
  assert.deepEqual((mergeDoc(base, mine, theirs) as any).timeline, [{ id: 'a' }, { id: 'new', t: 'x' }]);
});

test('mergeDoc: 내가 지운 항목은 다시 살아나지 않음', () => {
  const base = doc([{ id: 'a' }, { id: 'b' }]);
  const mine = doc([{ id: 'a' }]);
  const theirs = doc([{ id: 'a' }, { id: 'b' }]);
  assert.deepEqual((mergeDoc(base, mine, theirs) as any).timeline, [{ id: 'a' }]);
});

test('mergeDoc: 상대가 지운 항목(내가 안 건드림) 존중', () => {
  const base = doc([{ id: 'a' }, { id: 'b' }]);
  const mine = doc([{ id: 'a' }, { id: 'b' }]);
  const theirs = doc([{ id: 'a' }]);
  assert.deepEqual((mergeDoc(base, mine, theirs) as any).timeline, [{ id: 'a' }]);
});

test('mergeDoc: people 맵도 키 단위 병합', () => {
  const base = doc([], { 나: { name: '나' } });
  const mine = doc([], { 나: { name: '나' }, 동행: { name: '동행', mine: 1 } });
  const theirs = doc([], { 나: { name: '나', status: 'hi' } });
  const m = mergeDoc(base, mine, theirs) as any;
  assert.deepEqual(m.people, { 나: { name: '나', status: 'hi' }, 동행: { name: '동행', mine: 1 } });
});

test('mergeDoc: base 없으면 내 것 우선', () => {
  const mine = doc([{ id: 'a', t: 'MINE' }]);
  assert.equal(mergeDoc(undefined, mine, doc()), mine);
});

test('docDiffers', () => {
  assert.equal(docDiffers(doc([{ id: 'a' }]), doc([{ id: 'a' }])), false);
  assert.equal(docDiffers(doc([{ id: 'a', t: '1' }]), doc([{ id: 'a', t: '2' }])), true);
});

console.log('mergeDoc.test.mts: OK');
