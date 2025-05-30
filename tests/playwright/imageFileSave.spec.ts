import { test, expect } from '@playwright/test'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

test('Fetchoraw tarball install and fetch→cache behavior', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fetchoraw-test-'))
  execSync('npm run build', { stdio: 'inherit' })
  const tarballName = execSync('npm pack ./dist').toString().trim()

  // setup temp project
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ type: 'module' }, null, 2))
  execSync(`npm init -y`, { cwd: tmp })
  execSync(`npm install ${path.resolve(tarballName)}`, { cwd: tmp })

  // test script: fetch then cache
  const entry = path.join(tmp, 'test-import.mjs')
  fs.writeFileSync(entry, `
    import { Fetchoraw } from 'fetchoraw'
    import { createImageFileSaveResolver } from 'fetchoraw/resolvers'
    import fs from 'node:fs'
    import path from 'node:path'

    const url = 'https://img.shields.io/badge/fetchoraw-tested-brightgreen.svg'
    const cacheFilePath = './test-cache.json'

    const resolver = createImageFileSaveResolver({
      saveRoot: './saved',
      prependPath: '/assets',
      targetPattern: /^https?:\\/\\/[^/]+/,
      keyString: /^https?:\\/\\/[^/]+/,
    })

    const f1 = new Fetchoraw(resolver, {
      cacheFilePath,
      enableCacheValue: true,
    })

    console.log('[e2e_js] FIRST FETCH')
    const result1 = await f1.html(\`<img src="\${url}">\`)
    console.log('[e2e_js] result1:', result1.html)

    const f2 = new Fetchoraw(resolver, {
      cacheFilePath,
      enableCacheValue: true,
    })
    f2.execMode = 'CACHE'

    console.log('[e2e_js] SECOND CACHE MODE')
    const result2 = await f2.html(\`<img src="\${url}">\`)
    console.log('[e2e_js] result2:', result2.html)

    // path check
    const match = result1.html.match(/src="([^"]+)"/)
    if (!match) throw new Error('No rewritten src found in result1')
    const rewritten = match[1].replace(/^\\/assets\\//, '')
    const savedPath = path.join('./saved', rewritten)

    if (!fs.existsSync(savedPath)) {
      throw new Error(\`Saved file not found: \${savedPath}\`)
    }

    console.log('[e2e_js] ✔ file exists:', savedPath)
    console.log('[e2e_js] __FETCHORAW_E2E_OK__')
  `)

  console.log('[e2e] Executing test-import.mjs in:', tmp)

  // run test file and capture output
  const output = execSync(`node ${entry}`, {
    cwd: tmp,
    env: {
      ...process.env,
      PUBLIC_FETCHORAW_MODE: 'FETCH',
    },
  }).toString().trim()

  console.log(`[e2e] Output:\n${output}`)
  expect(output).toContain('__FETCHORAW_E2E_OK__')

  fs.unlinkSync(path.resolve(tarballName))
  console.log(`[e2e] ✅ Tarball removed: ${tarballName}`)
})
