import { test, expect } from '@playwright/test'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

test('Fetchoraw tarball + jsonFileSaveResolver fetch→cache', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fetchoraw-test-json-'))
  execSync('npm run build', { stdio: 'inherit' })
  const tarballName = execSync('npm pack ./dist').toString().trim()

  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ type: 'module' }, null, 2))
  execSync(`npm init -y`, { cwd: tmp })
  execSync(`npm install ${path.resolve(tarballName)}`, { cwd: tmp })

  const entry = path.join(tmp, 'test-json-import.mjs')
  fs.writeFileSync(entry, `
    import { Fetchoraw } from 'fetchoraw'
    import { createJsonFileSaveResolver } from 'fetchoraw/resolvers'
    import fs from 'node:fs'
    import path from 'node:path'

    const url = 'https://jsonplaceholder.typicode.com/todos/1'
    const cacheFilePath = './test-json-cache.json'

    const resolver = createJsonFileSaveResolver({
      saveRoot: './saved',
      prependPath: '/assets',
      targetPattern: /^https?:\\/\\/[^/]+/,
      keyString: /^https?:\\/\\/[^/]+/,
    })

    const f1 = new Fetchoraw(resolver, {
      cacheFilePath,
      enableCacheValue: true,
    })

    console.log('[e2e_json] FIRST FETCH')
    const result1 = await f1.html(\`<script src="\${url}"></script>\`, { selectors: [{ selector: 'script[src]', attr: 'src' }]})
    console.log('[e2e_json] result1:', result1.html)

    const f2 = new Fetchoraw(resolver, {
      cacheFilePath,
      enableCacheValue: true,
    })
    f2.execMode = 'CACHE'

    console.log('[e2e_json] SECOND CACHE MODE')
    const result2 = await f2.html(\`<script src="\${url}"></script>\`)
    console.log('[e2e_json] result2:', result2.html)

    // ファイル存在確認
    const match = result1.html.match(/src="\\/assets\\/([^"]+)"/)
    if (!match) throw new Error('No rewritten src found')
    const jsonFile = match[1]
    const savedPath = path.join('./saved', jsonFile)

    if (!fs.existsSync(savedPath)) {
      throw new Error(\`Saved file not found: \${savedPath}\`)
    }

    const content = JSON.parse(fs.readFileSync(savedPath, 'utf-8'))
    if (typeof content !== 'object' || !content.id) {
      throw new Error('Parsed JSON is invalid')
    }

    console.log('[e2e_json] ✔ file exists and parsed OK:', savedPath)
    console.log('[e2e_json] __FETCHORAW_JSON_E2E_OK__')
  `)

  const output = execSync(`node ${entry}`, {
    cwd: tmp,
    env: {
      ...process.env,
      PUBLIC_FETCHORAW_MODE: 'FETCH',
    },
  }).toString().trim()

  console.log(`[e2e] Output:\n${output}`)
  expect(output).toContain('__FETCHORAW_JSON_E2E_OK__')

  fs.unlinkSync(path.resolve(tarballName))
  console.log(`[e2e] ✅ Tarball removed: ${tarballName}`)
})
