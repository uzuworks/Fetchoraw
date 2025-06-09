import { describe, it, beforeEach, expect, vi } from 'vitest'
import { Fetchoraw } from '../../src/index'
import path from 'path'
import fs from 'fs/promises'

const TEST_URL = 'https://example.com/image.png'
const TEST_CACHE_PATH = 'test-cache.json'
const IMG_TAG = `<img src="${TEST_URL}">`
const SELECTORS = [Fetchoraw.SelectorPresets.ImgSrc]

describe('Fetchoraw.html()', () => {
  beforeEach(async () => {
    delete process.env.FETCHORAW_MODE
    await fs.rm(TEST_CACHE_PATH, { force: true })
  })

  it('FETCHORAW_MODE unset -> keeps original URL', async () => {
    const mockResolver = vi.fn(async url => `rewritten:${url}`)
    const f = new Fetchoraw(mockResolver)

    const { html, map } = await f.html(IMG_TAG, { selectors: SELECTORS })

    expect(mockResolver).not.toHaveBeenCalled()
    expect(html).toContain(TEST_URL)
    expect(map).toHaveLength(0)
  })

  it('FETCHORAW_MODE=FETCH -> rewrites URL using resolver', async () => {
    process.env.PUBLIC_FETCHORAW_MODE = 'FETCH'
    const mockResolver = vi.fn(async url => `rewritten:${url}`)
    const f = new Fetchoraw(mockResolver, { cacheFilePath: TEST_CACHE_PATH })

    const { html, map } = await f.html(IMG_TAG, { selectors: SELECTORS })

    expect(mockResolver).toHaveBeenCalledWith(TEST_URL)
    expect(html).toContain(`src="rewritten:${TEST_URL}"`)
    expect(map).toContainEqual({
      url: TEST_URL,
      resolvedPath: `rewritten:${TEST_URL}`,
      fetchOptions: {},
    })
  })

  it('resolver throws -> propagates error', async () => {
    process.env.PUBLIC_FETCHORAW_MODE = 'FETCH'
    const mockResolver = vi.fn(async () => { throw new Error('fail') })
    const f = new Fetchoraw(mockResolver, { cacheFilePath: TEST_CACHE_PATH })

    await expect(
      f.html(IMG_TAG, { selectors: SELECTORS })
    ).rejects.toThrow('fail')
  })
  
  it('FETCH mode + cache hit + missing actual file → fallback to resolver', async () => {
    process.env.PUBLIC_FETCHORAW_MODE = 'FETCH'

    // Prepare dummy cache entry pointing to a non-existent file
    const dummyResolvedPath = path.join(__dirname, 'dummy.png')
    const cacheContent = [{
      url: TEST_URL,
      resolvedPath: dummyResolvedPath,
      fetchOptions: {},
    }]
    await fs.writeFile(TEST_CACHE_PATH, JSON.stringify(cacheContent, null, 2), 'utf-8')

    // Mock fs.existsSync to simulate missing actual file
    const existsSync = vi.spyOn(require('fs'), 'existsSync')
    existsSync.mockReturnValue(false)

    // Resolver should be called as a fallback
    const mockResolver = vi.fn(async url => `fallback:${url}`)
    const f = new Fetchoraw(mockResolver, { cacheFilePath: TEST_CACHE_PATH })

    const { html, map } = await f.html(IMG_TAG, { selectors: SELECTORS })

    expect(mockResolver).toHaveBeenCalledWith(TEST_URL)
    expect(html).toContain(`src="fallback:${TEST_URL}"`)
    expect(map).toContainEqual({
      url: TEST_URL,
      resolvedPath: `fallback:${TEST_URL}`,
      fetchOptions: {},
    })

    existsSync.mockRestore()
  })
})
