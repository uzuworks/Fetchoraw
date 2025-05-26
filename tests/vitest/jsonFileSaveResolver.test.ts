import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createJsonFileSaveResolver } from '../../src/resolvers/jsonFileSaveResolver';

vi.mock('fs/promises', async () => ({
  mkdir: vi.fn(async () => {}),
  writeFile: vi.fn(async () => {}),
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('jsonFileSaveResolver: basic cases', () => {
  it('fetches JSON and saves to default path', async () => {
    const mockJson = { hello: 'world' };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockJson,
    });

    const resolver = createJsonFileSaveResolver();
    const url = 'https://api.example.com/posts';
    const result = await resolver(url);

    expect(result).toHaveProperty('path');
    expect(result).toHaveProperty('data');
    expect(result.data).toEqual(mockJson);
    expect(result.path.endsWith('.json')).toBe(true);
  });

  it('generates different filenames for different query params', async () => {
    const mockJson = { items: [1, 2, 3] };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockJson,
    });

    const resolver = createJsonFileSaveResolver();

    const res1 = await resolver('https://api.example.com/data?limit=10');
    const res2 = await resolver('https://api.example.com/data?limit=20');

    expect(res1.path).not.toBe(res2.path);
    expect(res1.data).toEqual(mockJson);
    expect(res2.data).toEqual(mockJson);
  });

  it('handles JSON with unicode path safely', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' }),
    });

    const resolver = createJsonFileSaveResolver();
    const url = 'https://api.example.com/カテゴリ/投稿一覧';
    const result = await resolver(url);

    expect(result.path.endsWith('.json')).toBe(true);
    expect(result.path).not.toMatch(/[%\\:]/);
    expect(result.data).toHaveProperty('status', 'ok');
  });
});

describe('jsonFileSaveResolver: failure modes', () => {
  it('throws on fetch error when onError is "throw"', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const resolver = createJsonFileSaveResolver({ onError: 'throw' });
    await expect(resolver('https://api.example.com/fail')).rejects.toThrow('Failed to fetch');
  });

  it('returns { path: url, data: void 0 } when onError is "return-url"', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const resolver = createJsonFileSaveResolver({ onError: 'return-url' });
    const result = await resolver('https://api.example.com/fail');

    expect(result).toEqual({
      path: 'https://api.example.com/fail',
      data: void 0,
    });
  });

  it('returns { path: "", data: void 0 } when onError is "return-empty"', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const resolver = createJsonFileSaveResolver({ onError: 'return-empty' });
    const result = await resolver('https://api.example.com/fail');

    expect(result).toEqual({
      path: '',
      data: void 0,
    });
  });
});
