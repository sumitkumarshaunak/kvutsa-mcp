/** One JSON line per event: info on stdout, warn/error on stderr. Silent under NODE_ENV=test. */
type Level = 'info' | 'warn' | 'error';

function write(level: Level, msg: string, fields?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'test') return;
  const line = JSON.stringify({ time: new Date().toISOString(), level, msg, ...fields });
  if (level === 'info') process.stdout.write(line + '\n');
  else process.stderr.write(line + '\n');
}

export function errorFields(err: unknown): Record<string, unknown> {
  return err instanceof Error ? { error: err.message, stack: err.stack } : { error: String(err) };
}

export const logger = {
  info: (msg: string, fields?: Record<string, unknown>): void => write('info', msg, fields),
  warn: (msg: string, fields?: Record<string, unknown>): void => write('warn', msg, fields),
  error: (msg: string, fields?: Record<string, unknown>): void => write('error', msg, fields),
};
