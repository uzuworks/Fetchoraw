import { test, expect } from '@playwright/test'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

test('install tarball and import Fetchoraw', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fetchoraw-test-'))
  execSync('npm run build', { stdio: 'inherit' })
  const tarballName = execSync('npm pack ./dist').toString().trim()

  // setup temp project
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ type: 'module' }, null, 2))
  execSync(`npm init -y`, { cwd: tmp })
  execSync(`npm install ${path.resolve(tarballName)}`, { cwd: tmp })

  // write test file
  const entry = path.join(tmp, 'test-import.mjs')
  fs.writeFileSync(entry, `
    import { Fetchoraw } from 'fetchoraw'
    import { createImageFileSaveResolver } from 'fetchoraw/resolvers'
    import fs from 'node:fs'
    import path from 'node:path'

    const f = new Fetchoraw(createImageFileSaveResolver({ saveRoot: './saved' }))

    const input = '<img src="https://img.shields.io/badge/fetchoraw-tested-brightgreen.svg">'
    const result = await f.html(input)

    console.log('[e2e_js] Result HTML:', result)

    const match = result.html.match(/src="(.*?)"/)
    if (!match) throw new Error('No rewritten src found')
    const rewrittenUrl = match[1]
    const filePath = path.join(process.cwd(), 'saved', rewrittenUrl.replace('\/assets', ''))
    console.log('[e2e_js] File path:', filePath)

    console.log('[e2e_js] File exists:', fs.existsSync(filePath))

    if(fs.existsSync(filePath)){
      console.log('[e2e_js] __FETCHORAW_E2E_OK__')
    }
  `)
  
  console.log('[e2e] Test file created:', fs.existsSync(entry), entry)

  // run test file and capture output
  const output = execSync(`node ${entry}`, {
    cwd: tmp,
    env: {
      ...process.env,
      FETCHORAW_MODE: 'FETCH',
    },
  }).toString().trim()
  console.log(`[e2e] Output:`, output)

  expect(output).toContain('__FETCHORAW_E2E_OK__')
  
  fs.unlinkSync(path.resolve(tarballName))
  console.log(`[e2e] Tarball removed: ${tarballName}`)
})
