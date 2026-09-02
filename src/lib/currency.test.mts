// node src/lib/currency.test.mts   (Big.js는 순수 계산이라 DOM 불필요)
import { strict as assert } from 'node:assert';
import { toKrw, commas, FALLBACK_VND_KRW } from './currency.ts';

// 정밀 연산: 0.1 + 0.2 류 오차 없이
assert.equal(toKrw(180000, 0.055), '9900');
assert.equal(toKrw('1000000', FALLBACK_VND_KRW), '55000');
assert.equal(toKrw(0, 0.055), '0');
assert.equal(toKrw('', 0.055), '0');
// 반올림
assert.equal(toKrw(12345, 0.0546), '674'); // 674.037 -> 674
// 부동소수점 함정 확인 (0.07 * 3 === 0.21 을 float으로 하면 0.21000000000000002)
assert.equal(toKrw(3, 0.07), '0'); // 0.21 -> round 0
assert.equal(toKrw(300, 0.07), '21');

assert.equal(commas('1234567'), '1,234,567');
assert.equal(commas(55000), '55,000');
assert.equal(commas(''), '0');

console.log('currency.test.mts: OK');
