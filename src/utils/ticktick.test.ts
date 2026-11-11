import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyFocusSegment,
  toTurkeyDateString,
  consolidateTickTickRecords,
  buildTickTickFocusSummary,
  resolveEnvValue,
  safeParseJsonResponse,
  RawTickTickFocusRecord
} from './ticktick';

test('classifyFocusSegment follows README 4-tier formula', () => {
  assert.equal(classifyFocusSegment(0), '0-3 Saat');
  assert.equal(classifyFocusSegment(2.99), '0-3 Saat');
  assert.equal(classifyFocusSegment(3.0), '3-7 Saat');
  assert.equal(classifyFocusSegment(7.5), '3-7 Saat');
  assert.equal(classifyFocusSegment(8.0), '8-10 Saat');
  assert.equal(classifyFocusSegment(10.0), '8-10 Saat');
  assert.equal(classifyFocusSegment(10.01), '10+ Saat');
  assert.equal(classifyFocusSegment(13.18), '10+ Saat');
});

test('toTurkeyDateString shifts UTC timestamps by +3 hours to Turkey local date', () => {
  // 2026-10-28 22:30 UTC is 2026-10-29 01:30 in Turkey (UTC+3)
  assert.equal(toTurkeyDateString('2026-10-28T22:30:00.000+0000'), '2026-10-29');
  // 2026-10-31 07:10 UTC is 2026-10-31 10:10 in Turkey (UTC+3)
  assert.equal(toTurkeyDateString('2026-10-31T07:10:13.000+0000'), '2026-10-31');
});

test('consolidateTickTickRecords merges Pomodoro (type=0) and Stopwatch (type=1) and deduplicates IDs', () => {
  const sampleRecords: RawTickTickFocusRecord[] = [
    {
      id: 'pomo-1',
      type: 0,
      startTime: '2026-10-29T08:00:00.000+0000',
      endTime: '2026-10-29T14:00:00.000+0000',
      duration: 360 * 60000, // 360 dk
      note: 'Periodontoloji T+0'
    },
    {
      id: 'pomo-1', // Duplicate should be ignored
      type: 0,
      startTime: '2026-10-29T08:00:00.000+0000',
      endTime: '2026-10-29T14:00:00.000+0000',
      duration: 360 * 60000
    },
    {
      id: 'sw-1',
      type: 1,
      startTime: '2026-10-29T15:00:00.000+0000',
      endTime: '2026-10-29T17:00:00.000+0000',
      duration: 120 * 60000, // 120 dk
      tasks: [{ title: 'Endodonti 40 Soru T+3' }]
    }
  ];

  const days = consolidateTickTickRecords(sampleRecords);
  assert.equal(days.length, 1);
  assert.equal(days[0].date, '2026-10-29');
  assert.equal(days[0].dayNameTR, 'Perşembe');
  assert.equal(days[0].pomoMinutes, 360);
  assert.equal(days[0].stopwatchMinutes, 120);
  assert.equal(days[0].totalMinutes, 480);
  assert.equal(days[0].totalHours, 8);
  assert.equal(days[0].segment, '8-10 Saat');
  assert.deepEqual(days[0].notes, ['Periodontoloji T+0', 'Endodonti 40 Soru T+3']);
});

test('buildTickTickFocusSummary computes 7-day average and segment distribution', () => {
  const records: RawTickTickFocusRecord[] = [
    {
      id: 'r1',
      type: 0,
      startTime: '2026-10-28T09:00:00.000+0000',
      endTime: '2026-10-28T20:00:00.000+0000',
      duration: 660 * 60000 // 11 hours -> 10+ Saat
    },
    {
      id: 'r2',
      type: 1,
      startTime: '2026-10-29T09:00:00.000+0000',
      endTime: '2026-10-29T14:00:00.000+0000',
      duration: 300 * 60000 // 5 hours -> 3-7 Saat
    }
  ];

  const summary = buildTickTickFocusSummary(records, '2026-11-10');
  assert.equal(summary.totalTrackedDays, 2);
  assert.equal(summary.activeDate, '2026-10-29'); // Defaults to latest active day if today is empty
  assert.equal(summary.sevenDayAvgHours, 8); // (11 + 5) / 2 = 8.0
  assert.equal(summary.segmentDistribution['10+ Saat'], 1);
  assert.equal(summary.segmentDistribution['3-7 Saat'], 1);
});

test('resolveEnvValue filters out YOUR_* and MY_* placeholder values and returns fallback', () => {
  assert.equal(
    resolveEnvValue('YOUR_TICKTICK_ACCESS_TOKEN', 'f91fae7a-ee3d-4452-bbd7-42a1c1cea335'),
    'f91fae7a-ee3d-4452-bbd7-42a1c1cea335'
  );
  assert.equal(
    resolveEnvValue('MY_APP_URL', 'http://localhost:3000'),
    'http://localhost:3000'
  );
  assert.equal(
    resolveEnvValue('', 'fallback-val'),
    'fallback-val'
  );
  assert.equal(
    resolveEnvValue('real-token-123', 'fallback-val'),
    'real-token-123'
  );
});

test('safeParseJsonResponse safely handles HTML <!doctype> and valid JSON without throwing SyntaxError', () => {
  const htmlRes = safeParseJsonResponse('<!doctype html><html><body>SPA</body></html>');
  assert.equal(htmlRes.ok, false);
  if (!htmlRes.ok) {
    assert.equal(htmlRes.isHtml, true);
  }

  const jsonRes = safeParseJsonResponse<{ connected: boolean }>('{"connected":true}');
  assert.equal(jsonRes.ok, true);
  if (jsonRes.ok) {
    assert.equal(jsonRes.data.connected, true);
  }
});

