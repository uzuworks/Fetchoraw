import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Fetchoraw } from '../../src/index';

const testUrl = 'https://example.com/test.png';

describe('Fetchoraw.html()', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.FETCHORAW_MODE;
  });

  it('FETCHORAW_MODE unset -> skips resolver & keeps original URL', async () => {
    const mockResolver = vi.fn(async url => `ok:${url}`);
    const fetchoraw = new Fetchoraw(mockResolver);

    const { output, map } = await fetchoraw.html(
      `<img src="${testUrl}">`,
      { selectors: [Fetchoraw.SelectorPresets.ImgSrc] }
    );

    expect(mockResolver).not.toHaveBeenCalled();
    expect(output).toContain(`src="${testUrl}"`);
    expect(map.get(testUrl)).toBe(void 0);
  });

  it('FETCHORAW_MODE non-matching -> skips resolver & keeps original URL', async () => {
    process.env.FETCHORAW_MODE = 'OTHER';
    const mockResolver = vi.fn(async url => `ok:${url}`);
    const fetchoraw = new Fetchoraw(mockResolver);

    const { output, map } = await fetchoraw.html(
      `<img src="${testUrl}">`,
      { selectors: [Fetchoraw.SelectorPresets.ImgSrc] }
    );

    expect(mockResolver).not.toHaveBeenCalled();
    expect(output).toContain(`src="${testUrl}"`);
    expect(map.get(testUrl)).toBe(void 0);
  });

  it('FETCHORAW_MODE matching -> calls resolver & rewrites URL', async () => {
    process.env.FETCHORAW_MODE = 'FETCH';
    const mockResolver = vi.fn(async url => `ok:${url}`);
    const fetchoraw = new Fetchoraw(mockResolver);

    const { output, map } = await fetchoraw.html(
      `<img src="${testUrl}">`,
      { selectors: [Fetchoraw.SelectorPresets.ImgSrc] }
    );

    expect(mockResolver).toHaveBeenCalledWith(testUrl);
    expect(output).toContain(`src="ok:${testUrl}"`);
    expect(map.get(testUrl)).toBe(`ok:${testUrl}`);
  });
});

describe('Fetchoraw (Selectors: default and custom)', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.FETCHORAW_MODE;
  });

  it('default selectors -> skips <a href> elements', async () => {
    process.env.FETCHORAW_MODE = 'FETCH';
    const mockResolver = vi.fn();
    const fetchoraw = new Fetchoraw(mockResolver);

    const skipUrl = 'https://example.com/skip.css';
    const { output, map } = await fetchoraw.html(
      `<a href="${skipUrl}">link</a>`,
    );

    expect(mockResolver).not.toHaveBeenCalled();
    expect(output).toContain(`<a href="${skipUrl}">link</a>`);
    expect(map.size).toBe(0);
  });

  it('default selectors -> rewrites <video poster>', async () => {
    process.env.FETCHORAW_MODE = 'FETCH';
    const posterUrl = 'https://example.com/cover.jpg';
    const mockResolver = vi.fn(async u => `ok:${u}`);
    const fetchoraw = new Fetchoraw(mockResolver);

    const { output, map } = await fetchoraw.html(
      `<video poster="${posterUrl}"></video>`,
    );

    expect(mockResolver).toHaveBeenCalledWith(posterUrl);
    expect(output).toContain(`poster="ok:${posterUrl}"`);
    expect(map.get(posterUrl)).toBe(`ok:${posterUrl}`);
  });

  it('custom selectors -> skips <video poster> elements', async () => {
    process.env.FETCHORAW_MODE = 'FETCH';
    const mockResolver = vi.fn(async u => `ok:${u}`);
    const fetchoraw = new Fetchoraw(mockResolver);

    const htmlIn = `<img src="x.png"><video poster="y.jpg"></video>`;
    const { output, map } = await fetchoraw.html(
      htmlIn,
      { selectors: [Fetchoraw.SelectorPresets.ImgSrc] }
    );

    expect(mockResolver).toHaveBeenCalledWith('x.png');
    expect(output).toContain(`poster="y.jpg"`);
    expect(map.size).toBe(1);
  });

  it('custom selectors -> skips elements without target attribute', async () => {
    process.env.FETCHORAW_MODE = 'FETCH';
    const mockResolver = vi.fn(async u => `ok:${u}`);
    const fetchoraw = new Fetchoraw(mockResolver);

    const htmlIn = `<img><img src="${testUrl}">`;
    const { output, map } = await fetchoraw.html(
      htmlIn,
      { selectors: [Fetchoraw.SelectorPresets.ImgSrc] }
    );

    expect(mockResolver).toHaveBeenCalledTimes(1);
    expect(mockResolver).toHaveBeenCalledWith(testUrl);
    expect(output).toContain(`ok:${testUrl}`);
    expect(output).toContain(`<img>`);
    expect(map.size).toBe(1);
  });

  it('custom selectors -> deduplicates resolver calls for same URL', async () => {
    process.env.FETCHORAW_MODE = 'FETCH';
    const mockResolver = vi.fn(async u => `ok:${u}`);
    const fetchoraw = new Fetchoraw(mockResolver);

    const htmlIn = `<img src="${testUrl}"><img src="${testUrl}">`;
    const { output, map } = await fetchoraw.html(
      htmlIn,
      { selectors: [Fetchoraw.SelectorPresets.ImgSrc] }
    );

    expect(mockResolver).toHaveBeenCalledTimes(1);
    expect((output.match(/ok:/g) || []).length).toBe(2);
    expect(map.size).toBe(1);
    expect(map.get(testUrl)).toBe(`ok:${testUrl}`);
  });
});

describe('Fetchoraw (Environment: custom BUILD_FETCH)', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.BUILD_FETCH;
  });

  it('BUILD_FETCH matching -> calls resolver & rewrites URL', async () => {
    process.env.BUILD_FETCH = '1';
    const mockResolver = vi.fn(async url => `custom:${url}`);
    const fetchoraw = new Fetchoraw(mockResolver, {
      envModeName: 'BUILD_FETCH',
      enableEnvValue: '1',
    });

    const { output, map } = await fetchoraw.html(
      `<img src="${testUrl}">`,
      { selectors: [Fetchoraw.SelectorPresets.ImgSrc] }
    );

    expect(mockResolver).toHaveBeenCalledWith(testUrl);
    expect(output).toContain(`src="custom:${testUrl}"`);
    expect(map.get(testUrl)).toBe(`custom:${testUrl}`);
  });

  it('BUILD_FETCH non-matching -> skips resolver & keeps original URL', async () => {
    process.env.BUILD_FETCH = 'OTHER';
    const mockResolver = vi.fn(async url => `x:${url}`);
    const fetchoraw = new Fetchoraw(mockResolver, {
      envModeName: 'BUILD_FETCH',
      enableEnvValue: '1',
    });

    const { output, map } = await fetchoraw.html(
      `<img src="${testUrl}">`,
      { selectors: [Fetchoraw.SelectorPresets.ImgSrc] }
    );

    expect(mockResolver).not.toHaveBeenCalled();
    expect(output).toContain(`src="${testUrl}"`);
    expect(map.get(testUrl)).toBe(void 0);
  });
});

describe('Fetchoraw (Exceptional: resolver error)', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.FETCHORAW_MODE;
  });

  it('resolver throws error -> exec throws error', async () => {
    process.env.FETCHORAW_MODE = 'FETCH';
    const mockResolver = vi.fn(async () => {
      throw new Error('mock resolver error');
    });
    const fetchoraw = new Fetchoraw(mockResolver);

    await expect(
      fetchoraw.html(
        `<img src="${testUrl}">`,
        { selectors: [Fetchoraw.SelectorPresets.ImgSrc] }
      )
    ).rejects.toThrow('mock resolver error');
  });

  it('empty attribute -> skips and does not call resolver', async () => {
    process.env.FETCHORAW_MODE = 'FETCH';
    const mockResolver = vi.fn(async u => `ok:${u}`);
    const fetchoraw = new Fetchoraw(mockResolver);
  
    const htmlIn = `<img src=""><img>`;
    const { output, map } = await fetchoraw.html(htmlIn, {
      selectors: [Fetchoraw.SelectorPresets.ImgSrc]
    });
  
    expect(mockResolver).not.toHaveBeenCalled();
    expect(output).toContain(`<img src="">`);
    expect(output).toContain(`<img>`); // no attr at all
    expect(map.size).toBe(0);
  });
});
