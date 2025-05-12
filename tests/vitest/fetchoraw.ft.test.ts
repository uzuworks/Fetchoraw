import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Fetchoraw } from '../../src/index';
import { createFileSaveResolver } from '../../src/resolvers/basicFileSaveResolver';

// Mock fs/promises
vi.mock('fs/promises', async () => ({
  mkdir: vi.fn(async () => {}),
  writeFile: vi.fn(async () => {}),
}));

const mockData = new Uint8Array([65, 66, 67]); // ABC

describe('Fetchoraw FT (fileSaveResolver)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => mockData,
      headers: { get: () => 'image/png' },
    });
  });

  describe('Normal config (default settings)', () => {
    it('rewrites img[src] to /assets path', async () => {
      const resolver = createFileSaveResolver({
        saveRoot: 'dist/assets',
        prependPath: 'assets',
        targetPattern: /^https?:\/\/[^\/]+\/?/,
        keyString: /^https?:\/\/[^\/]+\/?/,
      });

      const fetchoraw = new Fetchoraw(resolver, { envModeName: '' });

      const inputHtml = `<html><body><img src="https://example.com/images/a.png"></body></html>`;
      const { output: html, map } = await fetchoraw.html(inputHtml, {
        selectors: [{ selector: 'img[src]', attr: 'src' }],
      });

      expect(html).toContain('src="/assets/images/a.png"');
      expect(map.get('https://example.com/images/a.png')).toBe('/assets/images/a.png');
    });
  });

  describe('Custom config (saveRoot and prependPath customized)', () => {
    it('rewrites img[src] to customized /static path with multibyte support', async () => {
      const resolver = createFileSaveResolver({
        saveRoot: 'out/assets',
        prependPath: 'static',
        targetPattern: /^https?:\/\/[^\/]+\/?/,
        keyString: /^https?:\/\/[^\/]+\/?/,
      });

      const fetchoraw = new Fetchoraw(resolver, { envModeName: '' });

      const inputUrl = 'https://cdn.example.com/dir space/日本語/file @2x.png';
      const inputHtml = `<html><body><img src="${inputUrl}"></body></html>`;

      const { output: html, map } = await fetchoraw.html(inputHtml, {
        selectors: [{ selector: 'img[src]', attr: 'src' }],
      });

      expect(html).toContain('src="/static/dir space/日本語/file @2x.png"');
      expect(map.get(inputUrl)).toBe('/static/dir space/日本語/file @2x.png');
    });
  });
});
