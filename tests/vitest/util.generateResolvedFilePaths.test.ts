import { describe, it, expect } from 'vitest';
import { generateResolvedFilePaths } from '../../src/utils';

describe('generateResolvedFilePaths', () => {
  const baseOptions = {
    fetchOptions: {},
    saveRoot: 'public/data',
    keyString: /^https:\/\/api\.example\.com\//,
    prependPath: 'data',
  };

  it('generates path without search or hash, keeping original extension', () => {
    const url = 'https://api.example.com/posts/item.svg';
    const result = generateResolvedFilePaths(
      url,
      baseOptions.fetchOptions,
      false,
      0,
      '',
      baseOptions.saveRoot,
      baseOptions.keyString,
      baseOptions.prependPath
    );
    expect(result.savePath).toMatch(/item\.svg$/);
    expect(result.sitePath).toMatch(/\/data\/posts\/item\.svg$/);
  });

  it('includes search params in filename when useSearch is true', () => {
    const url = 'https://api.example.com/posts/item.svg?theme=dark&lang=en';
    const result = generateResolvedFilePaths(
      url,
      baseOptions.fetchOptions,
      true,
      0,
      '',
      baseOptions.saveRoot,
      baseOptions.keyString,
      baseOptions.prependPath
    );
    expect(result.savePath).toMatch(/item\-themedark\-langen\.svg$/);
  });

  it('adds hash to filename when hashLength > 0', () => {
    const url = 'https://api.example.com/posts/item.svg';
    const result = generateResolvedFilePaths(
      url,
      baseOptions.fetchOptions,
      false,
      6,
      '',
      baseOptions.saveRoot,
      baseOptions.keyString,
      baseOptions.prependPath
    );
    expect(result.savePath).toMatch(/item\-[a-f0-9]{6}\.svg$/);
  });

  it('forces extension if forceExt is provided', () => {
    const url = 'https://api.example.com/posts/item';
    const result = generateResolvedFilePaths(
      url,
      baseOptions.fetchOptions,
      false,
      0,
      '.json',
      baseOptions.saveRoot,
      baseOptions.keyString,
      baseOptions.prependPath
    );
    expect(result.savePath).toMatch(/item\.json$/);
  });

  it('generates both savePath and sitePath correctly', () => {
    const url = 'https://api.example.com/posts/item.svg';
    const result = generateResolvedFilePaths(
      url,
      baseOptions.fetchOptions,
      false,
      6,
      '',
      baseOptions.saveRoot,
      baseOptions.keyString,
      baseOptions.prependPath
    );

    expect(result.savePath).toMatch(/^public\/data\/posts\/item-[a-f0-9]{6}\.svg$/);
    expect(result.sitePath).toMatch(/^\/data\/posts\/item-[a-f0-9]{6}\.svg$/);
  });
});
