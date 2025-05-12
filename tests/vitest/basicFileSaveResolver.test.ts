import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFileSaveResolver } from '../../src/resolvers/basicFileSaveResolver';

// Mock fs/promises for file operations
vi.mock('fs/promises', async () => ({
  mkdir: vi.fn(async () => {}),
  writeFile: vi.fn(async () => {}),
}));

/**
 * Default options:
 * saveRoot      = 'dist/assets'
 * targetPattern = /^https?:\/\/.*?\//
 * keyString     = /^https?:\/\/.*?\//
 * prependPath   = 'assets'
 */
describe('createFileSaveResolver (default options)', () => {
  const mockData = new Uint8Array([1, 2, 3]);
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => mockData,
    });
  });

  it('no options → saves to dist/assets & returns /assets/img/logo.svg', async () => {
    const resolver = createFileSaveResolver();
    const url = 'https://cdn.example.com/img/logo.svg';
    const result = await resolver(url);
    expect(result).toBe('/assets/img/logo.svg');
  });

  it('no options & non-HTTP URL → skips saving', async () => {
    const resolver = createFileSaveResolver();
    global.fetch = vi.fn();
    const url = 'ftp://example.com/file.png';
    const result = await resolver(url);
    expect(result).toBe(url);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

/**
 * Custom options tests
 */
describe('createFileSaveResolver (custom options)', () => {
  const mockData = new Uint8Array([100, 101, 102]);
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => mockData });
  });

  it('saveRoot=public/media & prependPath=media → saves file & returns /media/assets/image.png', async () => {
    const resolver = createFileSaveResolver({
      saveRoot: 'public/media',
      prependPath: 'media',
      targetPattern: /^https?:\/\/[^\/]+\/assets/,
      keyString: /^https?:\/\/[^\/]+\/assets/,
    });
    const url = 'https://cdn.example.com/assets/image.png';
    const result = await resolver(url);
    expect(result).toBe('/media/image.png');
  });

  it('targetPattern=^no-match → skips saving & returns original URL', async () => {
    const resolver = createFileSaveResolver({
      saveRoot: 'public/media',
      prependPath: 'media',
      targetPattern: /^no-match/,
      keyString: '',
    });
    const url = 'https://cdn.example.com/image.jpg';
    const result = await resolver(url);
    expect(result).toBe(url);
  });

  it('keyString=cdn.example.com prefix → strips prefix & returns /static/image.png', async () => {
    const resolver = createFileSaveResolver({
      saveRoot: 'output',
      prependPath: '',
      targetPattern: /^https?:\/\//,
      keyString: /^https?:\/\/cdn\.example\.com\//,
    });
    const url = 'https://cdn.example.com/static/image.png';
    const result = await resolver(url);
    expect(result).toBe('/static/image.png');
  });
});

/**
 * Error handling tests
 */
describe('createFileSaveResolver (error handling)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetch fail → throws detailed error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      arrayBuffer: async () => new ArrayBuffer(0),
    });
    const resolver = createFileSaveResolver({
      saveRoot: 'public/media',
      targetPattern: /^https?:\/\//,
      keyString: /^https?:\/\//,
      prependPath: 'media',
    });
    await expect(resolver('https://example.com/image.jpg')).rejects.toThrow(
      'Failed to fetch: https://example.com/image.jpg (status 404)'
    );
  });
});

describe('createDataUrlResolver (targetPattern array & JS skip)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('targetPattern: array → processes if any pattern matches', async () => {
    const mockData = new Uint8Array([1, 2, 3]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => mockData,
    });
  
    const resolver = createFileSaveResolver({
      saveRoot: 'out',
      prependPath: '',
      targetPattern: [/^ftp:\/\//, /^https?:\/\/cdn\.example\.com\//],
      keyString: /^https?:\/\/cdn\.example\.com\//,
    });
  
    const url = 'https://cdn.example.com/foo/bar.jpg';
    const result = await resolver(url);
  
    expect(result).toBe('/foo/bar.jpg');
  });

  it('javascript: URL → skips fetch and returns original', async () => {
    global.fetch = vi.fn();

    const resolver = createFileSaveResolver();
    const jsUrl = 'javascript:alert(1);';
    const result = await resolver(jsUrl);

    expect(result).toBe(jsUrl);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('createFileSaveResolver (onError behavior)', () => {
  it('onError: throw → throws on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      arrayBuffer: async () => new ArrayBuffer(0),
    })

    const resolver = createFileSaveResolver({ onError: 'throw' })

    await expect(resolver('https://example.com/image.png')).rejects.toThrow('Failed to fetch')
  })

  it('onError: return-url → returns original URL on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      arrayBuffer: async () => new ArrayBuffer(0),
    })

    const resolver = createFileSaveResolver({ onError: 'return-url' })

    const result = await resolver('https://example.com/image.png')
    expect(result).toBe('https://example.com/image.png')
  })

  it('onError: return-empty → returns empty string on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      arrayBuffer: async () => new ArrayBuffer(0),
    })

    const resolver = createFileSaveResolver({ onError: 'return-empty' })

    const result = await resolver('https://example.com/image.png')
    expect(result).toBe('')
  })
})
