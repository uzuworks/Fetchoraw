import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createImageSmartResolver } from '../../src/resolvers/imageSmartResolver';

const mockDataUrl = vi.fn();
const mockFileSave = vi.fn();

vi.mock('../../src/resolvers/imageDataUrlResolver', async () => ({
  createImageDataUrlResolver: () => mockDataUrl,
}));
vi.mock('../../src/resolvers/imageFileSaveResolver', async () => ({
  createImageFileSaveResolver: () => mockFileSave,
}));

beforeEach(() => {
  vi.restoreAllMocks();
  mockDataUrl.mockReset();
  mockFileSave.mockReset();
});

describe('createSmartResolver (normal flow)', () => {
  describe('requireFilePatterns / targetPattern -> resolution branch control', () => {
    it('requireFilePatterns match -> uses fileSaveResolver', async () => {
      mockFileSave.mockResolvedValueOnce('/forced/save.png');
      const resolver = createImageSmartResolver({
        requireFilePatterns: [/force-this/],
        saveRoot: 'public/media',
      });
      const result = await resolver('https://example.com/force-this/image.png');
      expect(mockFileSave).toHaveBeenCalled();
      expect(result).toBe('/forced/save.png');
    });

    it('requireFilePatterns empty -> uses dataUrlResolver', async () => {
      mockDataUrl.mockResolvedValueOnce('data:image/png;base64,abc');
      const resolver = createImageSmartResolver({ requireFilePatterns: [] });
      const result = await resolver('https://example.com/img.png');
      expect(mockDataUrl).toHaveBeenCalled();
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('dataUrlResolver fails -> falls back to fileSaveResolver', async () => {
      mockDataUrl.mockRejectedValueOnce(new Error('mock fail'));
      mockFileSave.mockResolvedValueOnce('/fallback/saved.png');
      const resolver = createImageSmartResolver({ saveRoot: 'fallback-media' });
      const result = await resolver('https://example.com/img.png');
      expect(mockDataUrl).toHaveBeenCalled();
      expect(mockFileSave).toHaveBeenCalled();
      expect(result).toBe('/fallback/saved.png');
    });

    it('requireFilePatterns as single RegExp -> uses fileSaveResolver', async () => {
      mockFileSave.mockResolvedValueOnce('/saved/single.png');
      const resolver = createImageSmartResolver({
        requireFilePatterns: /\/force-single\//,
        saveRoot: 'out',
      });
      const result = await resolver('https://example.com/force-single/image.png');
      expect(result).toBe('/saved/single.png');
    });

    it('targetPattern mismatch -> returns original URL', async () => {
      const resolver = createImageSmartResolver({
        targetPattern: [/^nope:\/\/invalid/],
        saveRoot: 'skip',
      });
      const url = 'https://example.com/image.png';
      const result = await resolver(url);
      expect(result).toBe(url);
    });
  });

  describe('normal resolution flow -> dataUrl preferred', () => {
    it('dataUrlResolver succeeds -> returns data URL', async () => {
      mockDataUrl.mockResolvedValueOnce('data:image/png;base64,abc');
      const resolver = createImageSmartResolver({ onError: 'throw' });
      const result = await resolver('https://example.com/image.png');
      expect(mockDataUrl).toHaveBeenCalled();
      expect(mockFileSave).not.toHaveBeenCalled();
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('dataUrlResolver fails -> uses fileSaveResolver', async () => {
      mockDataUrl.mockRejectedValueOnce(new Error('dataUrl failed'));
      mockFileSave.mockResolvedValueOnce('/saved/image.png');
      const resolver = createImageSmartResolver({ onError: 'throw' });
      const result = await resolver('https://example.com/image.png');
      expect(mockDataUrl).toHaveBeenCalled();
      expect(mockFileSave).toHaveBeenCalled();
      expect(result).toBe('/saved/image.png');
    });
  });
});
