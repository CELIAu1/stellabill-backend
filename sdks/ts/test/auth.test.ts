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

  // Issue #842 — explicitly cover the trimmed accepted-input branch at auth.ts:38.
  //
  // After token.trim() the `trimmed` value must pass the /\s/ check (no
  // internal whitespace) to reach the `return trimmed` path.  This suite
  // names that branch directly so it can never be silently removed.
  describe('trimmed accepted input (auth.ts:38 — /\\s/.test(trimmed) is false)', () => {
    it('accepts a token whose surrounding whitespace is stripped and returns the bare token', () => {
      // Leading + trailing spaces: trimmed = 'tok-abc', no internal whitespace →
      // line 38 evaluates /\s/.test('tok-abc') === false → returns 'tok-abc'.
      const result = sanitizeToken('  tok-abc  ');
      expect(result).toBe('tok-abc');
    });

    it('accepts a token padded with tab and newline characters and returns the bare token', () => {
      // Mixed surrounding whitespace characters: trimmed = 'Bearer_xyz',
      // /\s/.test('Bearer_xyz') === false → accepted.
      const result = sanitizeToken('\t Bearer_xyz \n');
      expect(result).toBe('Bearer_xyz');
    });

    it('accepts the minimal single-character token after trimming', () => {
      // Boundary: smallest possible valid value after trim.
      // trimmed = 'x', length > 0, /\s/.test('x') === false → returns 'x'.
      expect(sanitizeToken('  x  ')).toBe('x');
      expect(sanitizeToken('x')).toBe('x');
    });

    it('rejects a token that still contains internal whitespace after trimming', () => {
      // Confirms the /\s/ check at line 38 fires when trimmed still has spaces.
      // trimmed = 'tok abc', /\s/.test('tok abc') === true → returns undefined.
      expect(sanitizeToken('  tok abc  ')).toBeUndefined();
    });

    it('rejects a token whose only content is internal whitespace (tab between non-space chars)', () => {
      // trimmed = 'a\tb', /\s/.test('a\tb') === true → returns undefined.
      expect(sanitizeToken('a\tb')).toBeUndefined();
    });
  });
});
