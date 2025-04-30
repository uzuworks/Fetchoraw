import { describe, expect, it } from 'vitest'
import { execa } from 'execa'
import { join } from 'path'

const cliPath = join(__dirname, '../dist/cli.cjs')

// 🟢 normal(require only)
it('CLI: minimum args → runs with resolver + input only', () => {})

// 🟢 normal(full options)
it('CLI: full args → runs with all supported options', () => {})

// 🟡 meta
describe('CLI meta options', () => {
  it('CLI: --version → shows version and exits', () => {})

  it('CLI: --help → shows help and exits', () => {})

  it('CLI: smart --help → shows smart resolver help', () => {})

  it('CLI: file --help → shows file resolver help', () => {})

  it('CLI: dataurl --help → shows dataurl resolver help', () => {})
});

// 🔴 Exceptional
it('CLI: unknown resolver → exits with error', () => {})
it('CLI: missing input file → exits with error', () => {})
it('CLI: invalid selector format → throws error', () => {})
it('CLI: invalid inline-limit (NaN) → exits or warns', () => {})
