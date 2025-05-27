import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onErrorHandler } from '../../src/utils';
import type { ResolverResult } from '../../src/types';

describe('onErrorHandler (generic version)', () => {
  const urlReturnStr = 'https://example.com/data.json';
  const blankReturnStr = '';
  const urlReturnObj: ResolverResult = { path: urlReturnStr };
  const blankReturnObj: ResolverResult = { path: '' };

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns string url on "return-url"', () => {
    const result = onErrorHandler('fail', 'return-url', urlReturnStr, blankReturnStr);
    expect(result).toBe(urlReturnStr);
  });

  it('returns string blank on "return-empty"', () => {
    const result = onErrorHandler('oops', 'return-empty', urlReturnStr, blankReturnStr);
    expect(result).toBe(blankReturnStr);
  });

  it('returns ResolverResult on "return-url"', () => {
    const result = onErrorHandler('fail', 'return-url', urlReturnObj, blankReturnObj);
    expect(result).toEqual({ path: urlReturnStr });
  });

  it('returns blank ResolverResult on "return-empty"', () => {
    const result = onErrorHandler('fail', 'return-empty', urlReturnObj, blankReturnObj);
    expect(result).toEqual({ path: '' });
  });

  it('throws error on "throw"', () => {
    const error = new Error('boom');
    expect(() => onErrorHandler(error, 'throw', urlReturnStr, blankReturnStr)).toThrow('boom');
  });
});
