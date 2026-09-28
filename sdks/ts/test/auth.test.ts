import { describe, expect, it } from 'vitest';

import { sanitizeToken, TokenHolder } from '../src/index.js';

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
 * Boundary coverage for `TokenHolder.get()` (sdks/ts/src/auth.ts:17 —
 * `return this.#token;`).
 *
 * `get()` is the only read path for the bearer token; both sides of its
 * `string | undefined` return type are observable, so pin them down so a
 * future refactor cannot silently start returning an empty string (or throw)
 * for the "no token" case.
 */
describe('TokenHolder.get() boundary', () => {
  it('returns undefined when constructed without a token', () => {
    const holder = new TokenHolder();
    expect(holder.get()).toBeUndefined();
  });

  it('returns undefined when explicitly constructed with undefined', () => {
    const holder = new TokenHolder(undefined);
    expect(holder.get()).toBeUndefined();
  });

  it('returns the exact token it was constructed with', () => {
    const holder = new TokenHolder('abc123');
    expect(holder.get()).toBe('abc123');
  });

  it('reflects the latest value after set(), including clearing back to undefined', () => {
    const holder = new TokenHolder('first');
    expect(holder.get()).toBe('first');
    holder.set('second');
    expect(holder.get()).toBe('second');
    holder.set(undefined);
    expect(holder.get()).toBeUndefined();
  });

  it('returns the stored value verbatim on repeated reads', () => {
    const holder = new TokenHolder('stable');
    expect(holder.get()).toBe(holder.get());
    expect(holder.get()).toBe('stable');
  });

  it('hasToken() stays false at the empty-string boundary while get() echoes it', () => {
    // get() performs no sanitising, so an empty string round-trips; the
    // presence check is hasToken() and must report false. This locks the
    // empty-string boundary so the two accessors cannot drift apart.
    const holder = new TokenHolder('');
    expect(holder.get()).toBe('');
    expect(holder.hasToken()).toBe(false);

    holder.set('t');
    expect(holder.hasToken()).toBe(true);

    holder.set(undefined);
    expect(holder.get()).toBeUndefined();
    expect(holder.hasToken()).toBe(false);
  });
});
