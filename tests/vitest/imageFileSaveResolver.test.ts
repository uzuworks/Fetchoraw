import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createImageFileSaveResolver } from '../../src/resolvers/imageFileSaveResolver';

vi.mock('fs/promises', async () => ({
  mkdir: vi.fn(async () => {}),
  writeFile: vi.fn(async () => {}),
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

// Default and custom option patterns -> processes or skips saving

describe.each([
  ['default config & HTTP URL', 'https://cdn.example.com/img/logo.svg', '/assets/img/logo.svg'],
  ['custom root & strip prefix', 'https://cdn.example.com/assets/image.png', '/media/image.png', {
    saveRoot: 'public/media', prependPath: 'media', targetPattern: /^https?:\/\/[^\/]+\/assets/, keyString: /^https?:\/\/[^\/]+\/assets/
  }],
  ['no match pattern -> skips', 'https://cdn.example.com/image.jpg', 'https://cdn.example.com/image.jpg', {
    saveRoot: 'public/media', prependPath: 'media', targetPattern: /^no-match/, keyString: ''
  }],
  ['custom strip cdn prefix', 'https://cdn.example.com/static/image.png', '/static/image.png', {
    saveRoot: 'output', prependPath: '', targetPattern: /^https?:\/\//, keyString: /^https?:\/\/cdn\.example\.com\//
  }],
])('%s', (_, url, expected, config = void 0) => {
  it(`${url} -> ${expected}`, async () => {
    const data = new Uint8Array([1, 2, 3]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => data,
    });

    const resolver = createImageFileSaveResolver(config);
    const result = await resolver(url);
    expect(result).toBe(expected);
  });
});

// Skips unsupported protocols & javascript URLs

describe('non-http protocol or javascript: URL -> skipped', () => {
  it('ftp URL -> returns as-is', async () => {
    global.fetch = vi.fn();
    const resolver = createImageFileSaveResolver();
    const url = 'ftp://example.com/file.png';
    const result = await resolver(url);
    expect(result).toBe(url);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('javascript: URL -> returns as-is', async () => {
    global.fetch = vi.fn();
    const resolver = createImageFileSaveResolver();
    const url = 'javascript:alert(1);';
    const result = await resolver(url);
    expect(result).toBe(url);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// targetPattern as array -> processed if any pattern matches

describe('targetPattern: array -> processes matching', () => {
  it('ftp or https -> handled when matching one of them', async () => {
    const data = new Uint8Array([1, 2, 3]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => data,
    });
    const resolver = createImageFileSaveResolver({
      saveRoot: 'out', prependPath: '',
      targetPattern: [/^ftp:\/\//, /^https?:\/\/cdn\.example\.com\//],
      keyString: /^https?:\/\/cdn\.example\.com\//,
    });
    const url = 'https://cdn.example.com/foo/bar.jpg';
    const result = await resolver(url);
    expect(result).toBe('/foo/bar.jpg');
  });
});

// fetch failure -> behavior based on onError

describe.each([
  ['onError: throw -> throws', 'throw' as const, 'error'],
  ['onError: return-url -> returns URL', 'return-url' as const, 'url'],
  ['onError: return-empty -> returns empty', 'return-empty' as const, 'empty'],
])('%s', (_, onError, resultType) => {
  it('fetch returns !ok -> handled according to policy', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0)
    });

    const resolver = createImageFileSaveResolver({ onError });
    const url = 'https://example.com/image.png';

    if (resultType === 'error') {
      await expect(resolver(url)).rejects.toThrow('Failed to fetch');
    } else {
      const result = await resolver(url);
      expect(result).toBe(resultType === 'url' ? url : '');
    }
  });
});
