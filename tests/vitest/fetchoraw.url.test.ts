import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest'
import { Fetchoraw } from '../../src/index'
import fs from 'fs/promises'
import path from 'path'

const TEST_CACHE_PATH = 'test-cache.json'
const TEST_URL = 'https://example.com/image.png'
const CACHE_KEY = `${TEST_URL}::{}`
const CACHED_VALUE = 'CACHED_PATH'
const RESOLVED_VALUE = `RESOLVED:${TEST_URL}`

const mockResolver = vi.fn(async (url: string) => RESOLVED_VALUE)

describe('Fetchoraw.url()', () => {
  beforeEach(async () => {
    mockResolver.mockClear()
    await fs.rm(TEST_CACHE_PATH, { force: true }).catch(() => {})
  })

  afterEach(async () => {
    await fs.rm(TEST_CACHE_PATH, { force: true }).catch(() => {})
  })

  it('CACHE mode & hit -> returns cached result', async () => {
    await fs.writeFile(TEST_CACHE_PATH,
      JSON.stringify([[CACHE_KEY, { path: CACHED_VALUE }]], null, 2),
      'utf8'
    )

    process.env.PUBLIC_FETCHORAW_MODE = 'CACHE'
    const f = new Fetchoraw(mockResolver, {
      cacheFilePath: TEST_CACHE_PATH,
    })

    const result = await f.url(TEST_URL)
    expect(result.path).toBe(CACHED_VALUE)
    expect(mockResolver).not.toHaveBeenCalled()
  })

  it('CACHE mode & miss -> returns original URL', async () => {
    await fs.writeFile(TEST_CACHE_PATH, JSON.stringify([]), 'utf8')

    process.env.PUBLIC_FETCHORAW_MODE = 'CACHE'
    const f = new Fetchoraw(mockResolver, {
      cacheFilePath: TEST_CACHE_PATH,
    })

    const result = await f.url(TEST_URL)
    expect(result.path).toBe(TEST_URL)
    expect(mockResolver).not.toHaveBeenCalled()
  })

  it('FETCH mode -> uses resolver and updates cache', async () => {
    process.env.PUBLIC_FETCHORAW_MODE = 'FETCH'
    const f = new Fetchoraw(mockResolver, {
      cacheFilePath: TEST_CACHE_PATH,
    })

    const result = await f.url(TEST_URL)
    expect(result.path).toBe(RESOLVED_VALUE)
    expect(mockResolver).toHaveBeenCalledWith(TEST_URL, {})

    const file = await fs.readFile(TEST_CACHE_PATH, 'utf8')
    const parsed = JSON.parse(file)
    const hasEntry = parsed.find(([key]) => key === CACHE_KEY)
    expect(hasEntry).toBeTruthy()
  })

    it('FETCH mode + cache hit + actual file missing → fallback to resolver', async () => {
    process.env.PUBLIC_FETCHORAW_MODE = 'FETCH'

    const missingFilePath = path.join(__dirname, 'non-existent-file.dat')
    const fakeCacheEntry = [[CACHE_KEY, { path: missingFilePath }]]
    await fs.writeFile(TEST_CACHE_PATH, JSON.stringify(fakeCacheEntry, null, 2), 'utf8')

    // Mock fs.existsSync to simulate missing file
    const existsSync = vi.spyOn(require('fs'), 'existsSync')
    existsSync.mockReturnValue(false)

    const f = new Fetchoraw(mockResolver, {
      cacheFilePath: TEST_CACHE_PATH,
    })

    const result = await f.url(TEST_URL)
    expect(mockResolver).toHaveBeenCalledWith(TEST_URL, {})
    expect(result.path).toBe(RESOLVED_VALUE)

    existsSync.mockRestore()
  })
})
