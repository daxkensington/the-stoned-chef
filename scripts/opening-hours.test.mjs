import test from 'node:test';
import assert from 'node:assert/strict';
import { getOpeningStatus } from '../shared/openingHours.ts';

test('Toronto summer hours are independent of the visitor timezone', () => {
  assert.deepEqual(getOpeningStatus(new Date('2026-09-18T20:38:00Z')), {
    isOpen: true, nextOpenText: 'Open until 7:00 PM',
  });
  assert.deepEqual(getOpeningStatus(new Date('2026-09-18T14:59:00Z')), {
    isOpen: false, nextOpenText: 'Opens today at 11:00 AM',
  });
  assert.equal(getOpeningStatus(new Date('2026-09-18T15:00:00Z')).isOpen, true);
  assert.deepEqual(getOpeningStatus(new Date('2026-09-18T22:59:00Z')), {
    isOpen: true, nextOpenText: 'Closing in 1 min',
  });
  assert.deepEqual(getOpeningStatus(new Date('2026-09-18T23:00:00Z')), {
    isOpen: false, nextOpenText: 'Opens Saturday at 11:00 AM',
  });
});

test('winter and daylight-saving changes retain 11am Toronto opening', () => {
  for (const [before, opening] of [
    ['2026-01-18T15:59:00Z','2026-01-18T16:00:00Z'],
    ['2026-03-08T14:59:00Z','2026-03-08T15:00:00Z'],
    ['2026-11-01T15:59:00Z','2026-11-01T16:00:00Z'],
  ]) {
    assert.equal(getOpeningStatus(new Date(before)).isOpen, false);
    assert.equal(getOpeningStatus(new Date(opening)).isOpen, true);
  }
});

test('next opening follows the Toronto weekday across UTC midnight', () => {
  assert.deepEqual(getOpeningStatus(new Date('2026-09-20T01:00:00Z')), {
    isOpen: false, nextOpenText: 'Opens Sunday at 11:00 AM',
  });
});
