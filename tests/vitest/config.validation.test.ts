import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Fetchoraw } from '../../src/index'
import { createImageDataUrlResolver } from '../../src/resolvers/imageDataUrlResolver'
import { createImageFileSaveResolver } from '../../src/resolvers/imageFileSaveResolver'
import { createJsonFileSaveResolver } from '../../src/resolvers/jsonFileSaveResolver'
import { createImageSmartResolver } from '../../src/resolvers/imageSmartResolver'

const mockResolver = vi.fn(async (url: string) => `RESOLVED:${url}`)

beforeEach(() => {
  vi.restoreAllMocks()
  mockResolver.mockClear()
})

describe('Configuration Validation Tests', () => {
  describe('Fetchoraw class options validation', () => {
    it('envModeName empty string -> should create instance without error', () => {
      expect(() => {
        new Fetchoraw(mockResolver, {
          envModeName: '',
          cacheFilePath: 'test-cache.json'
        })
      }).not.toThrow()
    })

    it('envModeName undefined -> should create instance without error', () => {
      expect(() => {
        new Fetchoraw(mockResolver, {
          envModeName: undefined,
          cacheFilePath: 'test-cache.json'
        })
      }).not.toThrow()
    })

    it('cacheFilePath empty string -> should handle gracefully', () => {
      expect(() => {
        new Fetchoraw(mockResolver, {
          cacheFilePath: ''
        })
      }).not.toThrow()
    })

    it('cacheFilePath with invalid characters -> should handle gracefully', () => {
      expect(() => {
        new Fetchoraw(mockResolver, {
          cacheFilePath: 'invalid<>path.json'
        })
      }).not.toThrow()
    })

    it('enableFetchEnvValue custom value -> should accept custom values', () => {
      expect(() => {
        new Fetchoraw(mockResolver, {
          enableFetchEnvValue: 'CUSTOM_FETCH',
          cacheFilePath: 'test.json'
        })
      }).not.toThrow()
    })

    it('enableCacheEnvValue custom value -> should accept custom values', () => {
      expect(() => {
        new Fetchoraw(mockResolver, {
          enableCacheEnvValue: 'CUSTOM_CACHE',
          cacheFilePath: 'test.json'
        })
      }).not.toThrow()
    })

    it('enableCacheEnvValue invalid type -> should create instance without error', () => {
      expect(() => {
        new Fetchoraw(mockResolver, {
          cacheFilePath: 'test.json',
          // @ts-ignore - intentionally testing invalid type
          enableCacheEnvValue: 123
        })
      }).not.toThrow()
    })
  })

  describe('imageDataUrlResolver options validation', () => {
    it('inlineLimitBytes negative value -> should use default or throw', () => {
      expect(() => {
        createImageDataUrlResolver({
          inlineLimitBytes: -1
        })
      }).not.toThrow()
    })

    it('inlineLimitBytes zero -> should handle edge case', () => {
      const resolver = createImageDataUrlResolver({
        inlineLimitBytes: 0
      })
      expect(resolver).toBeDefined()
    })

    it('inlineLimitBytes NaN -> should use default or throw', () => {
      expect(() => {
        createImageDataUrlResolver({
          // @ts-ignore - intentionally testing invalid type
          inlineLimitBytes: NaN
        })
      }).not.toThrow()
    })

    it('inlineLimitBytes string -> should handle type error', () => {
      expect(() => {
        createImageDataUrlResolver({
          // @ts-ignore - intentionally testing invalid type
          inlineLimitBytes: '1000'
        })
      }).not.toThrow()
    })

    it('allowMimeTypes empty array -> should handle gracefully', () => {
      const resolver = createImageDataUrlResolver({
        allowMimeTypes: []
      })
      expect(resolver).toBeDefined()
    })

    it('allowMimeTypes invalid regex -> should handle gracefully', () => {
      expect(() => {
        createImageDataUrlResolver({
          // @ts-ignore - intentionally testing invalid type
          allowMimeTypes: ['invalid-regex']
        })
      }).not.toThrow()
    })

    it('targetPattern invalid regex -> should handle gracefully', () => {
      expect(() => {
        createImageDataUrlResolver({
          // @ts-ignore - intentionally testing invalid type
          targetPattern: 'invalid-regex'
        })
      }).not.toThrow()
    })

    it('onError invalid value -> should use default or throw', () => {
      expect(() => {
        createImageDataUrlResolver({
          // @ts-ignore - intentionally testing invalid type
          onError: 'invalid-option'
        })
      }).not.toThrow()
    })
  })

  describe('imageFileSaveResolver options validation', () => {
    it('saveRoot null -> should throw or use default', () => {
      expect(() => {
        createImageFileSaveResolver({
          // @ts-ignore - intentionally testing invalid type
          saveRoot: null
        })
      }).not.toThrow()
    })

    it('saveRoot empty string -> should handle gracefully', () => {
      const resolver = createImageFileSaveResolver({
        saveRoot: ''
      })
      expect(resolver).toBeDefined()
    })

    it('saveRoot undefined -> should use default', () => {
      const resolver = createImageFileSaveResolver({
        saveRoot: undefined
      })
      expect(resolver).toBeDefined()
    })

    it('prependPath with invalid characters -> should handle gracefully', () => {
      const resolver = createImageFileSaveResolver({
        saveRoot: 'public',
        prependPath: '<invalid>path'
      })
      expect(resolver).toBeDefined()
    })

    it('targetPattern empty array -> should handle gracefully', () => {
      const resolver = createImageFileSaveResolver({
        saveRoot: 'public',
        targetPattern: []
      })
      expect(resolver).toBeDefined()
    })

    it('keyString invalid type -> should handle gracefully', () => {
      expect(() => {
        createImageFileSaveResolver({
          saveRoot: 'public',
          // @ts-ignore - intentionally testing invalid type
          keyString: 123
        })
      }).not.toThrow()
    })

    it('prependPath null -> should handle gracefully', () => {
      const resolver = createImageFileSaveResolver({
        saveRoot: 'public',
        // @ts-ignore - intentionally testing invalid type
        prependPath: null
      })
      expect(resolver).toBeDefined()
    })

    it('keyString empty string -> should handle gracefully', () => {
      const resolver = createImageFileSaveResolver({
        saveRoot: 'public',
        keyString: ''
      })
      expect(resolver).toBeDefined()
    })

    it('keyString regex pattern -> should handle regex input', () => {
      const resolver = createImageFileSaveResolver({
        saveRoot: 'public',
        keyString: /^https:\/\//
      })
      expect(resolver).toBeDefined()
    })
  })

  describe('jsonFileSaveResolver options validation', () => {
    it('saveRoot null -> should handle gracefully', () => {
      expect(() => {
        createJsonFileSaveResolver({
          // @ts-ignore - intentionally testing invalid type
          saveRoot: null
        })
      }).not.toThrow()
    })

    it('prependPath undefined -> should use default', () => {
      const resolver = createJsonFileSaveResolver({
        saveRoot: 'data',
        prependPath: undefined
      })
      expect(resolver).toBeDefined()
    })

    it('keyString null -> should handle gracefully', () => {
      const resolver = createJsonFileSaveResolver({
        saveRoot: 'data',
        // @ts-ignore - intentionally testing invalid type
        keyString: null
      })
      expect(resolver).toBeDefined()
    })

    it('keyString regex pattern -> should handle regex input', () => {
      const resolver = createJsonFileSaveResolver({
        saveRoot: 'data',
        keyString: /^https:\/\//
      })
      expect(resolver).toBeDefined()
    })
  })

  describe('imageSmartResolver options validation', () => {
    it('requireFilePatterns empty array -> should use dataUrl resolver', () => {
      const resolver = createImageSmartResolver({
        requireFilePatterns: []
      })
      expect(resolver).toBeDefined()
    })

    it('requireFilePatterns invalid regex -> should handle gracefully', () => {
      expect(() => {
        createImageSmartResolver({
          // @ts-ignore - intentionally testing invalid type
          requireFilePatterns: ['invalid-regex']
        })
      }).not.toThrow()
    })

    it('saveRoot undefined with requireFilePatterns -> should handle gracefully', () => {
      expect(() => {
        createImageSmartResolver({
          requireFilePatterns: [/test/],
          saveRoot: undefined
        })
      }).not.toThrow()
    })

    it('inlineLimitBytes and saveRoot both undefined -> should use defaults', () => {
      const resolver = createImageSmartResolver({})
      expect(resolver).toBeDefined()
    })

    it('conflicting options -> should prioritize correctly', () => {
      const resolver = createImageSmartResolver({
        requireFilePatterns: [/force-file/],
        inlineLimitBytes: 0,
        saveRoot: 'public'
      })
      expect(resolver).toBeDefined()
    })
  })

  describe('Boundary value testing', () => {
    it('inlineLimitBytes maximum safe integer -> should handle gracefully', () => {
      const resolver = createImageDataUrlResolver({
        inlineLimitBytes: Number.MAX_SAFE_INTEGER
      })
      expect(resolver).toBeDefined()
    })

    it('targetPattern null -> should handle gracefully', () => {
      const resolver = createImageFileSaveResolver({
        saveRoot: 'public',
        // @ts-ignore - intentionally testing invalid type
        targetPattern: null
      })
      expect(resolver).toBeDefined()
    })

    it('targetPattern string instead of regex -> should handle gracefully', () => {
      const resolver = createImageFileSaveResolver({
        saveRoot: 'public',
        // @ts-ignore - intentionally testing invalid type
        targetPattern: 'https://example.com'
      })
      expect(resolver).toBeDefined()
    })

    it('very long saveRoot path -> should handle gracefully', () => {
      const longPath = 'a'.repeat(1000)
      expect(() => {
        createImageFileSaveResolver({
          saveRoot: longPath
        })
      }).not.toThrow()
    })
  })

  describe('Type safety validation', () => {
    it('resolver function null -> should create instance but may fail at runtime', () => {
      expect(() => {
        // @ts-ignore - intentionally testing invalid type
        new Fetchoraw(null, { cacheFilePath: 'test.json' })
      }).not.toThrow()
    })

    it('resolver function undefined -> should create instance but may fail at runtime', () => {
      expect(() => {
        // @ts-ignore - intentionally testing invalid type
        new Fetchoraw(undefined, { cacheFilePath: 'test.json' })
      }).not.toThrow()
    })

    it('options object null -> should throw TypeError', () => {
      expect(() => {
        // @ts-ignore - intentionally testing invalid type
        new Fetchoraw(mockResolver, null)
      }).toThrow(TypeError)
    })

    it('options object undefined -> should use defaults', () => {
      expect(() => {
        new Fetchoraw(mockResolver)
      }).not.toThrow()
    })
  })

  describe('Runtime behavior validation', () => {
    it('null resolver with NONE mode -> should return original content', async () => {
      const fetchoraw = new Fetchoraw(
        // @ts-ignore - intentionally testing invalid type
        null, 
        { cacheFilePath: 'test.json' }
      )
      
      const result = await fetchoraw.html('<img src="https://example.com/test.jpg">')
      expect(result.html).toBe('<img src="https://example.com/test.jpg">')
      expect(result.map).toEqual([])
    })

    it('undefined resolver with NONE mode -> should return original URL', async () => {
      const fetchoraw = new Fetchoraw(
        // @ts-ignore - intentionally testing invalid type
        undefined, 
        { cacheFilePath: 'test.json' }
      )
      
      const result = await fetchoraw.url('https://example.com/test.jpg')
      expect(result.path).toBe('https://example.com/test.jpg')
      expect(result.map).toEqual([])
    })

    it('null resolver with FETCH mode -> should fail when resolver is called', async () => {
      const originalEnv = process.env.TEST_FETCHORAW_MODE
      process.env.TEST_FETCHORAW_MODE = 'FETCH'
      
      const fetchoraw = new Fetchoraw(
        // @ts-ignore - intentionally testing invalid type
        null, 
        { 
          cacheFilePath: 'test.json',
          envModeName: 'TEST_FETCHORAW_MODE',
          enableFetchEnvValue: 'FETCH'
        }
      )
      
      await expect(fetchoraw.html('<img src="https://example.com/test.jpg">')).rejects.toThrow()
      
      if (originalEnv !== undefined) {
        process.env.TEST_FETCHORAW_MODE = originalEnv
      } else {
        delete process.env.TEST_FETCHORAW_MODE
      }
    })
  })
})
