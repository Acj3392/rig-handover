import { readLines } from './read.js';
import type { RunStatus } from './types.js';

export type StatusCounts = Record<RunStatus, number>;

// Counts parsed lines (not jobs) by status. Bad lines aren't counted. null when no file.
export function countStatuses(runsDir: string, night: string): StatusCounts | null {
  const read = readLines(runsDir, night);
  if (!read) return null;
  const counts: StatusCounts = { ok: 0, retry: 0, fail: 0 };
  for (const line of read.lines) counts[line.status]++;
  return counts;
}
