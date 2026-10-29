// Plan morning-digest § 1. The contract every part of § 2 builds against.
export type RunStatus = 'ok' | 'retry' | 'fail';

// One job's night. Times keep the offset from the log (styleguide).
export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: RunStatus;
  lastError: string | null;
  firstAt: string;
  lastAt: string;
};

// rows sorted by job; badLines counts lines that didn't parse.
export type Night = { night: string; rows: DigestRow[]; badLines: number };

// Returns null when runs/<night>.jsonl doesn't exist.
export type ReadNight = (runsDir: string, night: string) => Night | null;
