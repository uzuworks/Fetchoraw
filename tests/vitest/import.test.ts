import { describe, it, expect } from 'vitest'

describe('Library import structure', () => {
  it('[direct]ESM import from dist/resolvers -> exposes createSmartResolver', async () => {
    const mod = await import('../../dist/resolvers/index.mjs')
    //@ts-ignore
    expect(mod.createSmartResolver).toBeTypeOf('function')
  })

  it('[direct]ESM import from dist root -> exposes Fetchoraw', async () => {
    const mod = await import('../../dist/index.mjs')
    expect(mod.Fetchoraw).toBeTypeOf('function')
  })

  it('[mod]ESM import from dist/resolvers -> exposes createSmartResolver', async () => {
    //@ts-ignore
    const mod = await import('fetchoraw/resolvers')
    //@ts-ignore
    expect(mod.createSmartResolver).toBeTypeOf('function')
  })

  it('[mod]ESM import from dist root -> exposes Fetchoraw', async () => {
    //@ts-ignore
    const mod = await import('fetchoraw')
    expect(mod.Fetchoraw).toBeTypeOf('function')
  })

});
