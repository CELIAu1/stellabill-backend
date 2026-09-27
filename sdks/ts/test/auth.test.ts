import { describe, expect, it } from 'vitest';

import { TokenHolder, sanitizeToken } from '../src/index.js';

describe('TokenHolder', () => {
  describe('hasToken', () => {
    it('returns true when a valid token is set', () => {
      const holder = new TokenHolder('valid-token');
      expect(holder.hasToken()).toBe(true);
    });

    it('returns false for undefined token', () => {
      const holder = new TokenHolder();
      expect(holder.hasToken()).toBe(false);
    });

    it('returns false for empty string token', () => {
      const holder = new TokenHolder('');
      expect(holder.hasToken()).toBe(false);
    });

    it('returns false for non-string token', () => {
      const holderNum = new TokenHolder(123 as unknown as string);
      expect(holderNum.hasToken()).toBe(false);

      const holderNull = new TokenHolder(null as unknown as string);
      expect(holderNull.hasToken()).toBe(false);
    });
  });
});

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
