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
  it('when given a simple URL → should fetch JSON, save it, and return path and data', async () => {
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

  it('when URLs differ by query parameters → should produce different filenames', async () => {
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

  it('when URL contains Unicode characters → should sanitize path and return JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' }),
    });

    const resolver = createJsonFileSaveResolver();
    const url = 'https://api.example.com/カテゴリ/投稿一覧';
    const result = await resolver(url);

    expect(result.path.endsWith('.json')).toBe(true);
    expect(result.path).not.toMatch(/[%\\:]/); // prevent unsafe characters in path
    expect(result.data).toHaveProperty('status', 'ok');
  });
});
