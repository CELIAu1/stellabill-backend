import { describe, expect, it } from 'vitest';

import { sanitizeToken } from '../src/index.js';

describe('sanitizeToken', () => {
  it('returns undefined for undefined input', () => {
    expect(sanitizeToken(undefined)).toBeUndefined();
  });
  it('returns undefined for non-string input', () => {
    expect(sanitizeToken(123 as unknown as string)).toBeUndefined();
    expect(sanitizeToken({} as unknown as string)).toBeUndefined();
    expect(sanitizeToken(null as unknown as string)).toBeUndefined();
  });
  it('returns undefined for empty string after trim', () => {
    expect(sanitizeToken('')).toBeUndefined();
    expect(sanitizeToken('   ')).toBeUndefined();
  });
  it('returns undefined when trimmed string still contains whitespace', () => {
    expect(sanitizeToken('a b')).toBeUndefined();
    expect(sanitizeToken('a b c')).toBeUndefined();
  });
  it('returns trimmed token when surrounding whitespace is stripped', () => {
    // sanitizeToken first trims, then rejects strings still containing whitespace.
    expect(sanitizeToken('  abc  ')).toBe('abc');
    expect(sanitizeToken('\tabc\n')).toBe('abc');
    expect(sanitizeToken('abc')).toBe('abc');
  });
});

/**
 * Rejected-input contract around the `return trimmed;` path
 * (sdks/ts/src/auth.ts:39).
 *
 * Every invalid shape must funnel to the *same* stable outcome — `undefined` —
 * with no throw and no partial/ambiguous value. The cases above check a few
 * examples individually; this block pins the contract as a whole so a refactor
 * cannot quietly swap `undefined` for `''`, start throwing on odd input, or
 * return a partially-repaired token.
 */
describe('sanitizeToken rejected-input contract', () => {
  const rejectedInputs: unknown[] = [
    undefined,
    null,
    0,
    42,
    true,
    false,
    {},
    [],
    () => 'x',
    '',
    '   ',
    '\t\n\r',
    'foo bar',
    'foo\tbar',
    'foo\nbar',
    'foo\u00a0bar', // non-breaking space is matched by the /\s/ guard
  ];

  it('returns undefined for every rejected input and never throws', () => {
    for (const input of rejectedInputs) {
      let result: string | undefined = 'sentinel';
      expect(() => {
        result = sanitizeToken(input as string);
      }).not.toThrow();
      expect(result).toBeUndefined();
    }
  });

  it('is deterministic: repeated calls with the same rejected input agree', () => {
    for (const input of ['two words', '\t', 'a\u00a0b']) {
      expect(sanitizeToken(input)).toBeUndefined();
      expect(sanitizeToken(input)).toBe(sanitizeToken(input));
    }
  });

  it('rejects committed invalid tokens instead of silently repairing them', () => {
    // Leading/trailing padding is stripped first, but the token body is still
    // invalid once trimmed, so the result must be rejected — never returned
    // empty and never partially truncated.
    expect(sanitizeToken(' a b ')).toBeUndefined();
    expect(sanitizeToken('\tbad token\n')).toBeUndefined();
  });
});
