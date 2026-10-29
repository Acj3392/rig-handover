import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read.js';

describe('readNight', () => {
  it('reads 2026-10-28 into 5 jobs and counts the bad line', () => {
    const night = readNight('runs', '2026-10-28');
    expect(night?.badLines).toBe(1);
    expect(night?.rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
  });

  it('keeps retries, failures, null owners and the log offset', () => {
    const rows = readNight('runs', '2026-10-28')!.rows;
    const refresh = rows.find((r) => r.job === 'fixtures/refresh')!;
    expect(refresh).toMatchObject({ runs: 4, retries: 3, lastStatus: 'ok', lastError: null });
    expect(rows.find((r) => r.job === 'notes/backup')).toMatchObject({ lastStatus: 'fail', lastError: 'quota exceeded' });
    expect(rows.find((r) => r.job === 'digest/render')?.owner).toBeNull();
    expect(refresh.firstAt).toBe('2026-10-29T01:30:00+01:00');
  });

  it('returns null for a night with no file', () => {
    expect(readNight('runs', '1999-01-01')).toBeNull();
  });
});
