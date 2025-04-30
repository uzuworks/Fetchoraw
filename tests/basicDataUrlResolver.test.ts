import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDataUrlResolver } from '../src/resolvers/basicDataUrlResolver';

describe('createDataUrlResolver (size rules)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('default inlineLimit (2MB) under → returns data URL', async () => {
    const smallData = new Uint8Array(10); // 10 bytes
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => smallData,
      headers: { get: (key) => key === 'Content-Type' ? 'image/png' : null },
    });

    const resolver = createDataUrlResolver();
    const result = await resolver('https://example.com/img.png');

    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('default inlineLimit (2MB) over → returns original URL', async () => {
    const bigData = new Uint8Array(3 * 1024 * 1024); // 3 MB
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => bigData,
      headers: { get: (key) => key === 'Content-Type' ? 'image/jpeg' : null },
    });

    const resolver = createDataUrlResolver();
    const url = 'https://example.com/photo.jpg';
    const result = await resolver(url);

    expect(result).toBe(url);
  });

  it('custom inlineLimit (1KB) under → returns data URL', async () => {
    const smallData = new Uint8Array(500); // 500 bytes
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => smallData,
      headers: { get: () => 'image/jpeg' },
    });

    const resolver = createDataUrlResolver({ inlineLimitBytes: 1024 });
    const result = await resolver('https://example.com/img.jpg');

    expect(result).toMatch(/^data:image\/jpeg;base64,/);
  });

  it('custom inlineLimit (1KB) over → returns original URL', async () => {
    const bigData = new Uint8Array(2048); // 2KB
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => bigData,
      headers: { get: () => 'image/jpeg' },
    });

    const resolver = createDataUrlResolver({ inlineLimitBytes: 1024 });
    const url = 'https://example.com/photo.jpg';
    const result = await resolver(url);

    expect(result).toBe(url);
  });
});

describe('createDataUrlResolver (MIME rules)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('default allow image/png → returns data URL', async () => {
    const data = new Uint8Array(10);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => data,
      headers: { get: () => 'image/png' },
    });

    const resolver = createDataUrlResolver();
    const result = await resolver('https://example.com/img.png');

    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('default allow application/pdf → returns data URL', async () => {
    const data = new Uint8Array(10);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => data,
      headers: { get: () => 'application/pdf' },
    });

    const resolver = createDataUrlResolver();
    const result = await resolver('https://example.com/doc.pdf');

    expect(result).toMatch(/^data:application\/pdf;base64,/);
  });

  it('deny-always MIME application/octet-stream → returns original URL', async () => {
    const data = new Uint8Array(10);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => data,
      headers: { get: () => 'application/octet-stream' },
    });

    const resolver = createDataUrlResolver();
    const url = 'https://example.com/file.bin';
    const result = await resolver(url);

    expect(result).toBe(url);
  });

  it('default reject application/json → returns original URL', async () => {
    const data = new Uint8Array(10);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => data,
      headers: { get: () => 'application/json' },
    });

    const resolver = createDataUrlResolver();
    const url = 'https://example.com/data.json';
    const result = await resolver(url);

    expect(result).toBe(url);
  });

  it('custom allowMimeTypes application/json → returns data URL', async () => {
    const data = new Uint8Array(10);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => data,
      headers: { get: () => 'application/json' },
    });

    const resolver = createDataUrlResolver({
      allowMimeTypes: [/^application\/json$/],
    });
    const result = await resolver('https://example.com/data.json');

    expect(result).toMatch(/^data:application\/json;base64,/);
  });
});

describe('createDataUrlResolver (targetPattern rules)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('default targetPattern → skips non-HTTP URLs', async () => {
    global.fetch = vi.fn();
    const resolver = createDataUrlResolver();
    const url = 'ftp://example.com/asset.png';
    const result = await resolver(url);

    expect(result).toBe(url);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('custom targetPattern FTP → processes matching URLs', async () => {
    const data = new Uint8Array(10);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => data,
      headers: { get: () => 'image/png' },
    });

    const resolver = createDataUrlResolver({
      targetPattern: /^ftp:\/\//,
    });
    const url = 'ftp://example.com/asset.png';
    const result = await resolver(url);

    expect(global.fetch).toHaveBeenCalledWith(url);
    expect(result).toMatch(/^data:image\/png;base64,/);
  });
});

describe('createDataUrlResolver (error handling)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // default config → HTTP error → throw detailed error
  it('default config & fetch fail → throws error with status', async () => {
    const url = 'https://example.com/fail.png';
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      arrayBuffer: async () => new ArrayBuffer(0),
      headers: { get: () => null },
    });

    const resolver = createDataUrlResolver();
    await expect(resolver(url)).rejects.toThrow(
      `Failed to fetch: ${url} (status 500)`
    );
  });

  // custom inlineLimit → still throws on fetch failure
  it('custom inlineLimit & fetch fail → throws error with status', async () => {
    const url = 'https://example.com/timeout.png';
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 504,
      arrayBuffer: async () => new ArrayBuffer(0),
      headers: { get: () => 'image/png' },
    });

    const resolver = createDataUrlResolver({ inlineLimitBytes: 1024 });
    await expect(resolver(url)).rejects.toThrow(
      `Failed to fetch: ${url} (status 504)`
    );
  });

  // default config → no Content-Type & no file extension → throw MIME error
  it('default config & missing Content-Type & no extension → throws MIME error', async () => {
    const url = 'https://example.com/noextension';
    const data = new Uint8Array([1, 2, 3]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => data,
      headers: { get: () => null },
    });

    const resolver = createDataUrlResolver();
    await expect(resolver(url)).rejects.toThrow(
      `Unable to determine MIME type for: ${url}`
    );
  });

  // custom allowMimeTypes → still throws when Content-Type cannot be determined
  it('custom allowMimeTypes & missing Content-Type & no extension → throws MIME error', async () => {
    const url = 'https://example.com/noextension';
    const data = new Uint8Array([1, 2, 3]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => data,
      headers: { get: () => null },
    });

    const resolver = createDataUrlResolver({
      allowMimeTypes: [/^application\/json$/],
    });
    await expect(resolver(url)).rejects.toThrow(
      `Unable to determine MIME type for: ${url}`
    );
  });
});

describe('createDataUrlResolver (targetPattern array & JS skip)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('custom targetPattern array → processes URLs matching any pattern', async () => {
    const smallData = new Uint8Array(10);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => smallData,
      headers: { get: () => 'image/png' },
    });

    // targetPattern を配列で指定: HTTP と FTP の両方を対象
    const resolver = createDataUrlResolver({
      targetPattern: [/^ftp:\/\//, /^https?:\/\//],
    });

    const url = 'https://example.com/photo.png';
    const result = await resolver(url);

    expect(global.fetch).toHaveBeenCalledWith(url);
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('javascript: URL → skips fetch and returns original', async () => {
    global.fetch = vi.fn();

    const resolver = createDataUrlResolver();
    const jsUrl = 'javascript:alert(1);';
    const result = await resolver(jsUrl);

    expect(result).toBe(jsUrl);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('createDataUrlResolver (onError behavior)', () => {
  it('onError: throw → throws on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      arrayBuffer: async () => new ArrayBuffer(0),
      headers: { get: () => null },
    })

    const resolver = createDataUrlResolver({ onError: 'throw' })

    await expect(resolver('https://example.com/image.png')).rejects.toThrow('Failed to fetch')
  })

  it('onError: return-url → returns original URL on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      arrayBuffer: async () => new ArrayBuffer(0),
      headers: { get: () => null },
    })

    const resolver = createDataUrlResolver({ onError: 'return-url' })

    const result = await resolver('https://example.com/image.png')
    expect(result).toBe('https://example.com/image.png')
  })

  it('onError: return-empty → returns empty string on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      arrayBuffer: async () => new ArrayBuffer(0),
      headers: { get: () => null },
    })

    const resolver = createDataUrlResolver({ onError: 'return-empty' })

    const result = await resolver('https://example.com/image.png')
    expect(result).toBe('')
  })
})
