import fs from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'

const devPkgPath = './package.json'
const pubPkgTemplatePath = './package/package.json'
const distPkgPath = './dist/package.json'

const devPkg = JSON.parse(await fs.readFile(devPkgPath, 'utf-8'))
const pubPkg = JSON.parse(await fs.readFile(pubPkgTemplatePath, 'utf-8'))
pubPkg.version = devPkg.version
pubPkg.description = devPkg.description
pubPkg.repository = devPkg.repository
pubPkg.homepage = devPkg.homepage
pubPkg.author = devPkg.author
pubPkg.license = devPkg.license
pubPkg.dependencies = devPkg.dependencies

await fs.writeFile(distPkgPath, JSON.stringify(pubPkg, null, 2))

await fs.copyFile('./README.md', './dist/README.md')
await fs.copyFile('./README.ja.md', './dist/README.ja.md')
