/**
 * 軽量ロガー。将来的に Sentry や Crashlytics などのクラッシュレポート連携を差し込める抽象化。
 *
 * 現状は `console.warn` / `console.error` にフォールバックするが、`setLogger` で差し替え可能。
 * - エラー以外の `info` / `warn` はリリースビルドで抑制してもよい設計だが、現状は常に出す。
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  category: string;
  message: string;
  meta?: Record<string, unknown>;
  cause?: unknown;
  timestamp: number;
}

export interface LoggerSink {
  (entry: LogEntry): void;
}

const defaultSink: LoggerSink = (entry) => {
  const detail = formatMeta(entry);
  switch (entry.level) {
    case 'error':
      console.error(`[${entry.category}] ${entry.message}`, detail);
      break;
    case 'warn':
      console.warn(`[${entry.category}] ${entry.message}`, detail);
      break;
    default:
      // info/debug はリリースで抑制したい場合に差し替え
      console.log(`[${entry.category}] ${entry.message}`, detail);
      break;
  }
};

let sink: LoggerSink = defaultSink;

function formatMeta(entry: LogEntry): unknown {
  const detail: Record<string, unknown> = {};
  if (entry.meta) detail.meta = entry.meta;
  if (entry.cause !== undefined) detail.cause = entry.cause;
  return Object.keys(detail).length > 0 ? detail : '';
}

function emit(level: LogLevel, category: string, message: string, meta?: Record<string, unknown>, cause?: unknown): void {
  sink({ level, category, message, meta, cause, timestamp: Date.now() });
}

export const logger = {
  debug(category: string, message: string, meta?: Record<string, unknown>): void {
    emit('debug', category, message, meta);
  },
  info(category: string, message: string, meta?: Record<string, unknown>): void {
    emit('info', category, message, meta);
  },
  warn(category: string, message: string, meta?: Record<string, unknown>, cause?: unknown): void {
    emit('warn', category, message, meta, cause);
  },
  error(category: string, message: string, cause?: unknown, meta?: Record<string, unknown>): void {
    emit('error', category, message, meta, cause);
  },
};

/**
 * シンクを差し替える（テストやクラッシュレポート連携で使用）。
 */
export function setLogger(next: LoggerSink): void {
  sink = next;
}

/**
 * デフォルトシンクへ戻す。
 */
export function resetLogger(): void {
  sink = defaultSink;
}
