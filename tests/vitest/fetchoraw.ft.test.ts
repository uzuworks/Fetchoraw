import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path, { join } from 'path'
import { Fetchoraw } from '../../src/index'
import { createImageFileSaveResolver } from '../../src/resolvers/imageFileSaveResolver'
import { createJsonFileSaveResolver } from '../../src/resolvers/jsonFileSaveResolver'

const TMP_DIR = path.join(process.cwd(), 'tmp-assets')
const TEST_CACHE_PATH = 'test-cache.json'

// URLs
const IMG_URL = 'https://example.com/foo/bar.png'
const JSON_URL = 'https://example.com/data/foo.json'
const TEST_JSON = { message: 'Hello world!', count: 42 }
const RESOLVED_VALUE = `RESOLVED:${IMG_URL}`

const mockResolver = vi.fn(async (url: string) => RESOLVED_VALUE)

beforeEach(async () => {
  await fs.rm(TMP_DIR, { recursive: true, force: true })
  await fs.rm(path.join(process.cwd(), TEST_CACHE_PATH), { force: true })
  await fs.mkdir(TMP_DIR, { recursive: true })
  process.env.PUBLIC_FETCHORAW_MODE = 'FETCH'
})

afterEach(async () => {
  await fs.rm(TMP_DIR, { recursive: true, force: true })
  await fs.rm(path.join(process.cwd(), TEST_CACHE_PATH), { force: true })
})

describe('Fetchoraw FT: imageFileSaveResolver integration (real fs)', () => {
  it('writes image file to local fs', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]),
      headers: {
        get: (key: string) => (key.toLowerCase() === 'content-type' ? 'image/png' : null),
      },
    })

    const resolver = createImageFileSaveResolver({
      saveRoot: TMP_DIR,
      prependPath: 'static',
      targetPattern: /^https?:\/\/[^/]+/,
      keyString: /^https?:\/\/[^/]+/,
    })

    const fetchoraw = new Fetchoraw(resolver, {
      cacheFilePath: TEST_CACHE_PATH,
    })

    const { html, map } = await fetchoraw.html(
      `<img src="${IMG_URL}">`,
      { selectors: [{ selector: 'img[src]', attr: 'src' }] }
    )

    const expectedPath = '/static/foo/bar.png'
    const expectedFile = path.join(TMP_DIR, 'foo/bar.png')
    const saved = await fs.readFile(expectedFile)

    expect(html).toContain(`src="${expectedPath}"`)
    expect(saved).toBeInstanceOf(Uint8Array)
    expect(saved.length).toBe(3)

    expect(map[0]).toEqual({
      url: IMG_URL,
      resolvedPath: expectedPath,
      fetchOptions: {},
    })
  })
})

describe('Fetchoraw FT: jsonFileSaveResolver integration (real fs)', () => {
  it('writes JSON file to local fs', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => TEST_JSON, // ← これが必須！！！
      arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(TEST_JSON)),
      headers: {
        get: (key: string) => (key.toLowerCase() === 'content-type' ? 'application/json' : null),
      },
    })

    const resolver = createJsonFileSaveResolver({
      saveRoot: TMP_DIR,
      prependPath: 'static',
      targetPattern: /^https?:\/\/[^/]+/,
      keyString: /^https?:\/\/[^/]+/,
    })

    const fetchoraw = new Fetchoraw(resolver, {
      cacheFilePath: TEST_CACHE_PATH,
    })

    const { html, map } = await fetchoraw.html(
      `<script src="${JSON_URL}"></script>`,
      { selectors: [{ selector: 'script[src]', attr: 'src' }] }
    )

    const files = await fs.readdir(join(TMP_DIR, 'data'), { withFileTypes: true })
    const jsonFile = files.find(file => file.isFile() && /^foo-[\w\d]+\.json$/.test(file.name))

    const expectedPath = `/static/data/${jsonFile?.name || ''}`
    const expectedFile = join(TMP_DIR, 'data', jsonFile?.name || '')
    const saved = await fs.readFile(expectedFile, 'utf-8')
    const parsed = JSON.parse(saved)

    expect(html).toContain(`src="${expectedPath}"`)
    expect(parsed).toEqual(TEST_JSON)

    expect(map[0]).toEqual({
      url: JSON_URL,
      resolvedPath: expectedPath,
      fetchOptions: {},
    })
  })
})

describe('Fetchoraw (execMode: NONE and FETCH behavior)', () => {
  it('should do nothing when execMode is NONE', async () => {
    process.env.PUBLIC_FETCHORAW_MODE = 'NONE'
    const fetchoraw = new Fetchoraw(mockResolver, {
      cacheFilePath: TEST_CACHE_PATH,
    })

    const html = `<html><head></head><body><img src="${IMG_URL}" /></body></html>`
    const result = await fetchoraw.html(html)

    expect(result.html).toBe(html)
    expect(mockResolver).not.toHaveBeenCalled()
  })

  it('should not throw even when cache file is missing in FETCH mode', async () => {
    const fetchoraw = new Fetchoraw(mockResolver, {
      cacheFilePath: TEST_CACHE_PATH,
    })

    const html = `<html><head></head><body><img src="${IMG_URL}" /></body></html>`
    const result = await fetchoraw.html(html)

    expect(result.html).not.toBe(html)
    expect(result.html).toContain('RESOLVED:')
    expect(mockResolver).toBeCalledTimes(1)
  })
})
