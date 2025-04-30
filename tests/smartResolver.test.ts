import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSmartResolver } from '../src/resolvers/smartResolver';

const mockDataUrl = vi.fn();
const mockFileSave = vi.fn();

vi.mock('../src/resolvers/basicDataUrlResolver', async () => ({
  createDataUrlResolver: () => mockDataUrl,
}));
vi.mock('../src/resolvers/basicFileSaveResolver', async () => ({
  createFileSaveResolver: () => mockFileSave,
}));

beforeEach(() => {
  vi.restoreAllMocks();
  mockDataUrl.mockReset();
  mockFileSave.mockReset();
});

describe('createSmartResolver-Normal', () => {
  describe('requireFilePatterns / targetPattern behavior', () => {
    it('requireFilePatterns match -> resolves via fileSaveResolver', async () => {
      mockFileSave.mockResolvedValueOnce('/forced/save.png');

      const resolver = createSmartResolver({
        requireFilePatterns: [/force-this/],
        saveRoot: 'public/media',
      });

      const result = await resolver('https://example.com/force-this/image.png');

      expect(mockFileSave).toHaveBeenCalled();
      expect(result).toBe('/forced/save.png');
    });

    it('requireFilePatterns empty -> resolves via dataUrlResolver', async () => {
      mockDataUrl.mockResolvedValueOnce('data:image/png;base64,abc');

      const resolver = createSmartResolver({ requireFilePatterns: [] });
      const result = await resolver('https://example.com/img.png');

      expect(mockDataUrl).toHaveBeenCalled();
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('dataUrlResolver fails -> falls back to fileSaveResolver', async () => {
      mockDataUrl.mockRejectedValueOnce(new Error('mock fail'));
      mockFileSave.mockResolvedValueOnce('/fallback/saved.png');

      const resolver = createSmartResolver({ saveRoot: 'fallback-media' });
      const result = await resolver('https://example.com/img.png');

      expect(mockDataUrl).toHaveBeenCalled();
      expect(mockFileSave).toHaveBeenCalled();
      expect(result).toBe('/fallback/saved.png');
    });

    it('targetPattern & requireFilePatterns match -> resolves via fileSaveResolver', async () => {
      mockFileSave.mockResolvedValueOnce('/saved/by/array.png');

      const resolver = createSmartResolver({
        targetPattern: [/^https?:\/\/[^\/]+\//],
        requireFilePatterns: [/\/must-save\//],
        saveRoot: 'out',
      });

      const result = await resolver('https://example.com/must-save/image.png');

      expect(mockFileSave).toHaveBeenCalled();
      expect(result).toBe('/saved/by/array.png');
    });

    it('requireFilePatterns is single RegExp -> resolves via fileSaveResolver', async () => {
      mockFileSave.mockResolvedValueOnce('/saved/single.png');

      const resolver = createSmartResolver({
        requireFilePatterns: /\/force-single\//,
        saveRoot: 'out',
      });

      const result = await resolver('https://example.com/force-single/image.png');

      expect(mockFileSave).toHaveBeenCalled();
      expect(result).toBe('/saved/single.png');
    });

    it('targetPattern does not match -> returns original URL', async () => {
      const resolver = createSmartResolver({
        targetPattern: [/^nope:\/\/invalid/],
        saveRoot: 'skip',
      });

      const url = 'https://example.com/image.png';
      const result = await resolver(url);

      expect(result).toBe(url);
    });
  });

  describe('dataUrl & fileSave normal flow', () => {
    it('dataUrlResolver succeeds -> returns data URL', async () => {
      mockDataUrl.mockResolvedValueOnce('data:image/png;base64,abc');

      const resolver = createSmartResolver({ onError: 'throw' });
      const result = await resolver('https://example.com/image.png');

      expect(mockDataUrl).toHaveBeenCalled();
      expect(mockFileSave).not.toHaveBeenCalled();
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('dataUrlResolver fails & fileSaveResolver succeeds -> returns saved file path', async () => {
      mockDataUrl.mockRejectedValueOnce(new Error('dataUrl failed'));
      mockFileSave.mockResolvedValueOnce('/saved/image.png');

      const resolver = createSmartResolver({ onError: 'throw' });
      const result = await resolver('https://example.com/image.png');

      expect(mockDataUrl).toHaveBeenCalled();
      expect(mockFileSave).toHaveBeenCalled();
      expect(result).toBe('/saved/image.png');
    });
  });
});

describe('createSmartResolver-exceptional', () => {
  describe('onError behavior after dataUrl & fileSave both fail', () => {
    beforeEach(() => {
      mockDataUrl.mockRejectedValue(new Error('dataUrl failed'));
      mockFileSave.mockRejectedValue(new Error('fileSave failed'));
    });

    it('dataUrlResolver fails & fileSaveResolver fails & onError="throw" -> throws error', async () => {
      const resolver = createSmartResolver({ onError: 'throw' });

      await expect(
        resolver('https://example.com/image.png')
      ).rejects.toThrow();
    });

    it('dataUrlResolver fails & fileSaveResolver fails & onError="return-url" -> returns original URL', async () => {
      const resolver = createSmartResolver({ onError: 'return-url' });

      const url = 'https://example.com/image.png';
      const result = await resolver(url);

      expect(result).toBe(url);
    });

    it('dataUrlResolver fails & fileSaveResolver fails & onError="return-empty" -> returns empty string', async () => {
      const resolver = createSmartResolver({ onError: 'return-empty' });

      const result = await resolver('https://example.com/image.png');

      expect(result).toBe('');
    });
  });

  describe('requireFilePatterns error handling', () => {
    beforeEach(() => {
      mockDataUrl.mockReset();
      mockFileSave.mockReset();
    });

    it('requireFilePatterns match & fileSaveResolver fails & onError="return-url" -> returns original URL', async () => {
      mockFileSave.mockRejectedValueOnce(new Error('save failed'));
      mockDataUrl.mockResolvedValue('data:image/png;base64,xxx');

      const resolver = createSmartResolver({
        requireFilePatterns: [/force-error/],
        onError: 'return-url',
        saveRoot: 'out',
      });

      const url = 'https://example.com/force-error/image.png';
      const result = await resolver(url);

      expect(mockFileSave).toHaveBeenCalled();
      expect(result).toBe(url);
    });

    it('requireFilePatterns match & fileSaveResolver fails & onError="return-empty" -> returns empty string', async () => {
      mockFileSave.mockRejectedValueOnce(new Error('save failed'));
      mockDataUrl.mockResolvedValue('data:image/png;base64,xxx');

      const resolver = createSmartResolver({
        requireFilePatterns: [/force-error/],
        onError: 'return-empty',
        saveRoot: 'out',
      });

      const url = 'https://example.com/force-error/image.png';
      const result = await resolver(url);

      expect(mockFileSave).toHaveBeenCalled();
      expect(result).toBe('');
    });

    it('requireFilePatterns match & fileSaveResolver fails & onError="throw" -> throws error', async () => {
      mockFileSave.mockRejectedValueOnce(new Error('save failed'));
      mockDataUrl.mockResolvedValue('data:image/png;base64,xxx');

      const resolver = createSmartResolver({
        requireFilePatterns: [/force-error/],
        onError: 'throw',
        saveRoot: 'out',
      });

      const url = 'https://example.com/force-error/image.png';
      
      await expect(resolver(url)).rejects.toThrow('save failed');
    });
  });
});
