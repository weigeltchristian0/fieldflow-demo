import test from 'node:test';
import assert from 'node:assert/strict';
import { workingWindowUtc } from './workingHours.ts';

const schedule = { start: '09:00', end: '17:00' };

test('maps a Munich summer day to the right UTC window', () => {
  const w = workingWindowUtc('2026-09-22', 'munich', schedule);
  assert.equal(w.start.toISOString(), '2026-09-22T07:00:00.000Z');
  assert.equal(w.end.toISOString(), '2026-09-22T15:00:00.000Z');
});

test('maps a Leeds summer day to the right UTC window', () => {
  const w = workingWindowUtc('2026-09-22', 'leeds', schedule);
  assert.equal(w.start.toISOString(), '2026-09-22T08:00:00.000Z');
  assert.equal(w.end.toISOString(), '2026-09-22T16:00:00.000Z');
});
