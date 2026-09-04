import { test } from 'node:test';
import assert from 'node:assert/strict';
import { staleSelfKeys } from './selfKeys.ts';

test('members: staleSelfKeys', () => {
  // 로그인: userId 로 옛 이름 전부 잡음, 남은 사람은 보존
  assert.deepEqual(
    staleSelfKeys(
      { '태': { userId: 'u1' }, '태랑': { userId: 'u1' }, '태랑해': { userId: 'u1' }, '동행자': { userId: 'u2' } },
      { me: '태랑해', uid: 'u1' },
    ).sort(),
    ['태', '태랑'],
  );

  // 비로그인 PIN: userId 없음 → 직전 이름(was)으로 옛 스냅샷 정리
  assert.deepEqual(
    staleSelfKeys(
      { '철수': undefined, '영희친구': undefined },
      { me: '영희', was: '철수' },
    ),
    ['철수'],
  );

  // 현재 이름과 무관한 참여자는 건드리지 않음
  assert.deepEqual(
    staleSelfKeys({ '나연': undefined, '나': undefined }, { me: '나연', was: '나' }),
    ['나'],
  );
});
