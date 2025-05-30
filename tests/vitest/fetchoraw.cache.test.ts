import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest'
import { Fetchoraw } from '../../src/index'
import fs from 'fs/promises'
import path from 'path'

const TEST_CACHE_PATH = 'test-cache.json'
const TEST_URL = 'https://example.com/image.png'
const CACHE_KEY = `${TEST_URL}::{}`
const CACHED_RESULT = { path: 'CACHED_PATH' }
const RESOLVED_RESULT = `RESOLVED:${TEST_URL}`

const mockResolver = vi.fn(async (url: string) => RESOLVED_RESULT)

describe('Fetchoraw.url() in CACHE mode', () => {
  beforeEach(async () => {
    process.env.PUBLIC_FETCHORAW_MODE = 'CACHE'
    await fs.rm(TEST_CACHE_PATH, { force: true })
    mockResolver.mockClear()
  })

  afterEach(async () => {
    await fs.rm(TEST_CACHE_PATH, { force: true })
  })

  it('CACHE mode with no cache file -> throws error at construction', () => {
    expect(() => {
      new Fetchoraw(mockResolver, {
        enableCacheEnvValue: 'CACHE',
        cacheFilePath: TEST_CACHE_PATH,
      })
    }).toThrow(/Cache file path is not set or does not exist/)
  })

  it('CACHE mode with valid cache -> returns cached result', async () => {
    const cacheContent = [[CACHE_KEY, CACHED_RESULT]]
    await fs.writeFile(TEST_CACHE_PATH, JSON.stringify(cacheContent, null, 2), 'utf8')

    const f = new Fetchoraw(mockResolver, {
      enableCacheEnvValue: 'CACHE',
      cacheFilePath: TEST_CACHE_PATH,
    })

    const result = await f.url(TEST_URL)
    expect(result.path).toBe(CACHED_RESULT.path)
    expect(mockResolver).not.toHaveBeenCalled()
  })

  it('CACHE mode with cache miss -> returns original URL', async () => {
    await fs.writeFile(TEST_CACHE_PATH, JSON.stringify([], null, 2), 'utf8')

    const f = new Fetchoraw(mockResolver, {
      enableCacheEnvValue: 'CACHE',
      cacheFilePath: TEST_CACHE_PATH,
    })

    const result = await f.url(TEST_URL)

    expect(result.path).toBe(TEST_URL)
    expect(mockResolver).not.toHaveBeenCalled()
  })
})
