// scripts/check-min-node.js
import fs from 'fs';
import { execSync } from 'child_process';
import semver from 'semver';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const allDeps = {
  ...pkg.dependencies,
  ...pkg.devDependencies,
  ...pkg.peerDependencies
};

const ranges = Object.keys(allDeps)
  .map(name => {
    try {
      console.log(`Checking ${name}...`);
      const engines = execSync(`npm view ${name} engines.node --json`, { encoding: 'utf8' });
      console.log(`engines: ${engines}`);
      return JSON.parse(engines) || null;
    } catch {
      return null;
    }
  })
  .filter(Boolean);

console.log({ranges})
const minVersions = ranges
  .map(range => semver.minVersion(range)?.version)
  .filter(Boolean);

if (minVersions.length === 0) {
  console.log('依存ライブラリに engines.node 指定が見つかりませんでした。');
  process.exit(1);
}

// プロジェクトで必要な最低バージョンは「最大の minVersion」
const required = minVersions.sort(semver.rcompare)[0];
console.log(`プロジェクト全体の最低 Node.js バージョン要件: ${required}`);
