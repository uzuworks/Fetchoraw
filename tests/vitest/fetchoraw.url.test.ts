import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Fetchoraw } from '../../src/index';

const testUrl = 'https://example.com/image.png';

describe('Fetchoraw.url()', () => {
  const mockResolver = vi.fn(async (url: string) => `resolved:${url}`);

  beforeEach(() => {
    mockResolver.mockClear();
    delete process.env.FETCHORAW_MODE;
  });

  it('absolute URL + FETCHORAW_MODE active -> resolves via resolver', async () => {
    process.env.FETCHORAW_MODE = 'FETCH';
    const fetchoraw = new Fetchoraw(mockResolver);
    const { output } = await fetchoraw.url(testUrl);
    expect(output).toBe(`resolved:${testUrl}`);
    expect(mockResolver).toHaveBeenCalledWith(testUrl);
  });

  it('FETCHORAW_MODE unset -> skips resolution & returns input', async () => {
    const fetchoraw = new Fetchoraw(mockResolver);
    const { output } = await fetchoraw.url(testUrl);
    expect(output).toBe(testUrl);
    expect(mockResolver).not.toHaveBeenCalled();
  });

  it('relative URL with origin -> resolves to absolute URL', async () => {
    process.env.FETCHORAW_MODE = 'FETCH';
    const fetchoraw = new Fetchoraw(mockResolver);
    const { output } = await fetchoraw.url('/a/b.png', 'https://site.com');
    expect(output).toBe('resolved:https://site.com/a/b.png');
  });

  it('protocol-relative URL -> prepends https:// and resolves', async () => {
    process.env.FETCHORAW_MODE = 'FETCH';
    const fetchoraw = new Fetchoraw(mockResolver);
    const { output } = await fetchoraw.url('//cdn.com/x.jpg');
    expect(output).toBe('resolved:https://cdn.com/x.jpg');
  });

  it('same URL used twice -> reuses cached value (no re-resolution)', async () => {
    process.env.FETCHORAW_MODE = 'FETCH';
    const fetchoraw = new Fetchoraw(mockResolver);
    await fetchoraw.url(testUrl);
    await fetchoraw.url(testUrl);
    expect(mockResolver).toHaveBeenCalledTimes(1);
  });

  it('resolver throws -> url() also throws', async () => {
    process.env.FETCHORAW_MODE = 'FETCH';
    const throwing = vi.fn(async () => { throw new Error('boom') });
    const fetchoraw = new Fetchoraw(throwing);
    await expect(fetchoraw.url(testUrl)).rejects.toThrow('boom');
  });

  it('empty URL string -> returns empty and does not call resolver', async () => {
    process.env.FETCHORAW_MODE = 'FETCH';
    const mockResolver = vi.fn();
    const fetchoraw = new Fetchoraw(mockResolver);
  
    const { output, map } = await fetchoraw.url('');
  
    expect(output).toBe('');
    expect(map.size).toBe(0);
    expect(mockResolver).not.toHaveBeenCalled();
  });
  
});
