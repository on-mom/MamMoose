// node src/lib/timezone.test.mts
import { strict as assert } from 'node:assert';
import { computeFocus, wallClock } from './timezone.ts';
import type { Project, TimelineItem } from '../types.ts';

const project: Project = {
  id: 'p', name: 't', destination: 'Hanoi',
  startDate: '2026-09-11', endDate: '2026-09-13', timezone: 'Asia/Ho_Chi_Minh',
};

const items: TimelineItem[] = [
  { id: 'a', projectId: 'p', day: 1, order: 0, startTime: '09:00', durationMin: 60, place: 'A', lat: null, lng: null },
  { id: 'b', projectId: 'p', day: 1, order: 1, startTime: '13:00', durationMin: 90, place: 'B', lat: null, lng: null },
  { id: 'c', projectId: 'p', day: 2, order: 0, startTime: '10:00', durationMin: 60, place: 'C', lat: null, lng: null },
];

// ICT = UTC+7. 2026-09-11 08:00 UTC => 15:00 ICT, day 1, 지난 09:00 항목 이후 => 'b'
let f = computeFocus(project, items, new Date('2026-09-11T08:00:00Z'));
assert.equal(f.day, 1);
assert.equal(f.focusId, 'b');
assert.equal(f.inTrip, true);
assert.equal(f.localHHMM, '15:00');

// 여행 전
f = computeFocus(project, items, new Date('2026-09-01T00:00:00Z'));
assert.equal(f.day, 1);
assert.equal(f.focusId, 'a');
assert.equal(f.inTrip, false);

// 여행 후 => 마지막 일차(3)엔 항목 없음 => focusId null, day 3
f = computeFocus(project, items, new Date('2026-10-01T00:00:00Z'));
assert.equal(f.day, 3);
assert.equal(f.focusId, null);

// day 2 아침 => 'c'
f = computeFocus(project, items, new Date('2026-09-12T02:00:00Z')); // 09:00 ICT
assert.equal(f.day, 2);
assert.equal(f.focusId, 'c');

// wallClock 경계
assert.equal(wallClock('Asia/Ho_Chi_Minh', new Date('2026-09-11T17:00:00Z')).date, '2026-09-12');

console.log('timezone.test.mts: OK');
