import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createImageDataUrlResolver } from '../../src/resolvers/imageDataUrlResolver';

beforeEach(() => {
  vi.restoreAllMocks();
});

// size & MIME variations -> returns either data URL or original URL

describe.each([
  ['under limit & allowed MIME', 100, 'image/png', true],
  ['over limit', 3_000_000, 'image/png', false],
  ['disallowed MIME', 100, 'application/octet-stream', false],
  ['allowed via config', 100, 'application/json', true, [/^application\/json$/]],
])('%s', (_, size, mime, expectInline, allowMimeTypes?) => {
  it(`input: ${size}B / ${mime} -> returns ${expectInline ? 'data URL' : 'original URL'}`, async () => {
    const data = new Uint8Array(size);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => data,
      headers: { get: () => mime },
    });

    const resolver = createImageDataUrlResolver(allowMimeTypes ? { allowMimeTypes } : {});
    const url = 'https://example.com/asset';
    const result = await resolver(url);

    expect(global.fetch).toHaveBeenCalledWith(url, {});
    if (expectInline) {
      expect(result).toMatch(/^data:/);
    } else {
      expect(result).toBe(url);
    }
  });
});

// targetPattern variations -> controls which URLs are processed

describe('targetPattern: custom and default rules', () => {
  it('default -> skips non-HTTP URL', async () => {
    global.fetch = vi.fn();
    const resolver = createImageDataUrlResolver();
    const url = 'ftp://example.com/img.png';
    const result = await resolver(url);
    expect(result).toBe(url);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('custom targetPattern -> processes FTP URL', async () => {
    const data = new Uint8Array(50);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => data,
      headers: { get: () => 'image/png' },
    });

    const resolver = createImageDataUrlResolver({ targetPattern: /^ftp:\/\// });
    const url = 'ftp://example.com/asset.png';
    const result = await resolver(url);

    expect(global.fetch).toHaveBeenCalledWith(url, {});
    expect(result).toMatch(/^data:image\/png;base64,/);
  });
});

// error scenarios -> control behavior via onError

describe.each([
  ['onError: throw -> throws error', 'throw' as const, 'error'],
  ['onError: return-url -> returns original URL', 'return-url' as const, 'url'],
  ['onError: return-empty -> returns empty string', 'return-empty' as const, 'empty'],
])('%s', (_, onError, outcome) => {
  it(`HTTP 500 fetch failure -> handles as ${outcome}`, async () => {
    const url = 'https://example.com/image.png';
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      arrayBuffer: async () => new ArrayBuffer(0),
      headers: { get: () => null },
    });

    const resolver = createImageDataUrlResolver({ onError });

    if (outcome === 'error') {
      await expect(resolver(url)).rejects.toThrow();
    } else {
      const result = await resolver(url);
      expect(result).toBe(outcome === 'url' ? url : '');
    }
  });
});

// MIME fallback failure -> throws

describe('fallback MIME detection -> throws if undetermined', () => {
  it('no Content-Type & no extension -> throws error', async () => {
    const data = new Uint8Array([1, 2, 3]);
    const url = 'https://example.com/noext';
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => data,
      headers: { get: () => null },
    });

    const resolver = createImageDataUrlResolver();
    await expect(resolver(url)).rejects.toThrow(
      `Unable to determine MIME type for: ${url}`
    );
  });
});
