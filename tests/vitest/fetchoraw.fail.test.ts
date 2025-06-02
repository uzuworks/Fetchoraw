import { describe, it, expect } from 'vitest';
import { createImageDataUrlResolver } from '../../src/resolvers/imageDataUrlResolver'; // 仮パス
import { createImageFileSaveResolver } from '../../src/resolvers/imageFileSaveResolver';
import { createJsonFileSaveResolver } from '../../src/resolvers/jsonFileSaveResolver';
import { Fetchoraw } from '../../src/index';

describe('Node module fallback', () => {
  it('falls back when createImageDataUrlResolver', async () => {
    (globalThis as any).__FETCHORAW_FORCE_NODE_FALLBACK__ = true;
    const resolver = createImageDataUrlResolver();

    const result = await resolver('https://example.com/fake.png');
    expect(result).toBe('https://example.com/fake.png');
  });

  it('falls back when createImageFileSaveResolver', async () => {
    (globalThis as any).__FETCHORAW_FORCE_NODE_FALLBACK__ = true;
    const resolver = createImageFileSaveResolver();

    const result = await resolver('https://example.com/fake.png');
    expect(result).toBe('https://example.com/fake.png');
  });

  it('falls back when createJsonFileSaveResolver', async () => {
    (globalThis as any).__FETCHORAW_FORCE_NODE_FALLBACK__ = true;
    const resolver = createJsonFileSaveResolver();

    const result = await resolver('https://example.com/fake.json');
    expect(result.path).toBe('https://example.com/fake.json');
  });

  it('falls back when Fetchoraw.html()', async () => {
    (globalThis as any).__FETCHORAW_FORCE_NODE_FALLBACK__ = true;
    const ins = new Fetchoraw(async () => '');

    const result = await ins.html(`<img src="https://example.com/fake.json">`)
    expect(result.html).toBe(`<img src="https://example.com/fake.json">`);
  });
  it('falls back when Fetchoraw.url()', async () => {
    (globalThis as any).__FETCHORAW_FORCE_NODE_FALLBACK__ = true;
    const ins = new Fetchoraw(async () => '');

    const result = await ins.url("https://example.com/fake.json")
    expect(result.path).toBe("https://example.com/fake.json");
  });

});
