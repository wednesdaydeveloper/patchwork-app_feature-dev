import { logger, resetLogger, setLogger, type LogEntry } from '@/utils/logger';

describe('utils/logger', () => {
  afterEach(() => {
    resetLogger();
  });

  test('emits log entries through custom sink for each level', () => {
    const entries: LogEntry[] = [];
    setLogger((entry) => entries.push(entry));

    logger.debug('cat', 'd');
    logger.info('cat', 'i');
    logger.warn('cat', 'w', { k: 1 });
    logger.error('cat', 'e', new Error('boom'), { k: 2 });

    expect(entries.map((e) => e.level)).toEqual(['debug', 'info', 'warn', 'error']);
    expect(entries[2].meta).toEqual({ k: 1 });
    expect(entries[3].cause).toBeInstanceOf(Error);
    expect(entries[3].meta).toEqual({ k: 2 });
    entries.forEach((e) => {
      expect(typeof e.timestamp).toBe('number');
      expect(e.category).toBe('cat');
    });
  });

  test('resetLogger restores default sink (no throw)', () => {
    const entries: LogEntry[] = [];
    setLogger((e) => entries.push(e));
    resetLogger();
    // Default sink writes to console; suppress to keep test output clean.
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    try {
      expect(() => logger.info('x', 'msg')).not.toThrow();
      expect(() => logger.warn('x', 'msg')).not.toThrow();
      expect(() => logger.error('x', 'msg', new Error('e'))).not.toThrow();
    } finally {
      console.log = origLog;
      console.warn = origWarn;
      console.error = origError;
    }
    // custom sink should not have received post-reset entries
    expect(entries).toHaveLength(0);
  });
});
