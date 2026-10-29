import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { Night } from '../src/digest/types.js';

const base = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60 };
const real = createApp({ ...base, runsDir: 'runs' });

let tmp: string;
let temp: ReturnType<typeof createApp>;

beforeAll(() => {
  tmp = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  mkdirSync(tmp, { recursive: true });
  writeFileSync(join(tmp, '2026-01-01.jsonl'), '');
  writeFileSync(
    join(tmp, '2026-01-02.jsonl'),
    [
      '{"at":"2026-01-02T01:00:00+01:00","job":"b/job","status":"ok","owner":"rook"}',
      'not json at all',
      '{"at":"2026-01-02T02:00:00+01:00","job":"a/job","status":"fail","owner":null,"error":"boom"}',
    ].join('\n') + '\n',
  );
  temp = createApp({ ...base, runsDir: tmp });
});

afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe('digest page', () => {
  it('renders 2026-10-28 from the real runs', async () => {
    const res = await real.request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('fixtures/refresh');
    expect(html).toContain('quota exceeded');
  });

  it('returns 404 for a night with no file', async () => {
    const res = await real.request('/digest/2020-01-01');
    expect(res.status).toBe(404);
    expect(await res.text()).toContain('no run log for 2020-01-01');
  });

  it('returns 404 for a night that is not a date', async () => {
    expect((await real.request('/digest/not-a-date')).status).toBe(404);
  });

  it('says nothing ran for the empty night', async () => {
    const res = await temp.request('/digest/2026-01-01');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('shows the bad line count, the dash for a null owner and marks the fail', async () => {
    const res = await temp.request('/digest/2026-01-02');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('1 bad line skipped');
    expect(html).toContain('<td>—</td>');
    expect(html).toContain('<td class="warn">fail</td>');
    expect(html).not.toContain('nothing ran');
  });
});

describe('digest JSON', () => {
  it('returns night, rows and badLines for 2026-10-28', async () => {
    const res = await real.request('/api/digest/2026-10-28');
    const body = (await res.json()) as Night;
    expect(res.status).toBe(200);
    expect(body.night).toBe('2026-10-28');
    expect(body.badLines).toBe(1);
    expect(body.rows).toHaveLength(5);
  });

  it('returns 404 JSON for a night with no file', async () => {
    const res = await real.request('/api/digest/2020-01-01');
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: 'not found' });
  });

  it('returns an empty row list for the empty night', async () => {
    const body = (await (await temp.request('/api/digest/2026-01-01')).json()) as Night;
    expect(body).toEqual({ night: '2026-01-01', rows: [], badLines: 0 });
  });

  it('returns the bad line count for the bad-line night', async () => {
    const body = (await (await temp.request('/api/digest/2026-01-02')).json()) as Night;
    expect(body.badLines).toBe(1);
    expect(body.rows.map((r) => r.job)).toEqual(['a/job', 'b/job']);
  });
});

describe('page and JSON agree', () => {
  it('list the same jobs in the same order', async () => {
    const page = await (await real.request('/digest/2026-10-28')).text();
    const body = (await (await real.request('/api/digest/2026-10-28')).json()) as Night;
    const jobs = body.rows.map((r) => r.job);
    const inPage = [...page.matchAll(/<tr[^>]*><td>([^<]+)<\/td>/g)].map((m) => m[1]);
    expect(inPage).toEqual(jobs);
    expect(jobs).toEqual([...jobs].sort((a, b) => a.localeCompare(b)));
  });
});
