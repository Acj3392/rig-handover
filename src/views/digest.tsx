import type { DigestRow, Night } from '../digest/types.js';

const dash = '—';

function isWarn(row: DigestRow): boolean {
  return row.retries >= 3 || row.lastStatus === 'fail';
}

function DigestRowView({ row }: { row: DigestRow }) {
  const warn = isWarn(row);
  return (
    <tr class={warn ? 'warn' : undefined}>
      <td>{row.job}</td>
      <td>{row.owner ?? dash}</td>
      <td>{row.runs}</td>
      <td class={row.retries >= 3 ? 'warn' : undefined}>{row.retries}</td>
      <td class={row.lastStatus === 'fail' ? 'warn' : undefined}>{row.lastStatus}</td>
      <td>{row.lastError ?? dash}</td>
      <td>{row.firstAt}</td>
      <td>{row.lastAt}</td>
    </tr>
  );
}

export function DigestPage({ night }: { night: Night }) {
  const empty = night.rows.length === 0 && night.badLines === 0;
  return (
    <>
      <h1>digest · {night.night}</h1>
      {night.badLines > 0 ? (
        <p class="warn">
          {night.badLines} bad {night.badLines === 1 ? 'line' : 'lines'} skipped
        </p>
      ) : null}
      {empty ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first</th>
              <th>last</th>
            </tr>
          </thead>
          <tbody>
            {night.rows.map((row) => (
              <DigestRowView row={row} />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export function NotFoundPage({ night }: { night: string }) {
  return (
    <>
      <h1>not found</h1>
      <p class="mute">no run log for {night}</p>
    </>
  );
}
