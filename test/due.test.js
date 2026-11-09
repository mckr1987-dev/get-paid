import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bucketFor, daysBetween, addDays } from '../srv/lib/due.js';

test('bucket boundaries', () => {
  const cases = [
    [16, 'Not yet due'],
    [15, 'Due within 15 days'],
    [8,  'Due within 15 days'],
    [7,  'Due within 7 days'],
    [4,  'Due within 7 days'],
    [3,  'Due within 3 days'],
    [0,  'Due within 3 days'],
    [-1, 'Overdue 1-2 days'],
    [-2, 'Overdue 1-2 days'],
    [-3, 'Overdue 3-5 days'],
    [-5, 'Overdue 3-5 days'],
    [-6, 'Overdue 6-7 days'],
    [-7, 'Overdue 6-7 days'],
    [-8, 'Overdue more than 7 days']
  ];
  for (const [days, expected] of cases) {
    assert.equal(bucketFor(days).dueBucket, expected, `days = ${days}`);
  }
});

test('criticality per bucket', () => {
  assert.equal(bucketFor(10).criticality, 3);   // green
  assert.equal(bucketFor(5).criticality, 2);    // amber
  assert.equal(bucketFor(-1).criticality, 1);   // red
  assert.equal(bucketFor(20).criticality, 0);   // neutral
});

test('date helpers', () => {
  assert.equal(daysBetween('2026-11-08', '2026-11-01'), -7);
  assert.equal(daysBetween('2026-11-08', '2026-11-08'), 0);
  assert.equal(addDays('2026-12-30', 5), '2027-01-04');   // across a year end
  assert.equal(addDays('2026-11-08', -60), '2026-09-09');
});