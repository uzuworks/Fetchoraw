import { defineConfig } from 'rollup'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'
import terser from '@rollup/plugin-terser'
import pkg from './package.json' assert { type: 'json' }

const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * (c) 2025 ${pkg.author ?? ''}
 * Released under the ${pkg.license} License.
 */`

export default defineConfig([
  // lib(esm, cjk)
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.mjs',
        format: 'es',
        sourcemap: true,
        banner,
        plugins: [terser()]
      },
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true,
        banner
      }
    ],
    external: [
      'fs', 'path', 'url', 'stream', 'buffer', 'util', 'zlib', 'events',
      'assert', 'tls', 'net', 'http', 'https', 'console', 'worker_threads',
      'querystring', 'diagnostics_channel', 'perf_hooks', 'async_hooks', 'dns',
      'cheerio', 'mime'
    ],
    plugins: [resolve(), json(), commonjs({transformMixedEsModules: true}), typescript({ tsconfig: './tsconfig.json' })],
  },

  // CLI
  // {
  //   input: 'src/cli.ts',
  //   output: {
  //     file: 'dist/cli.cjs',
  //     format: 'cjs',
  //     banner: '#!/usr/bin/env node\n' + banner,
  //   },
  //   plugins: [resolve(), json(), commonjs(), typescript({ tsconfig: './tsconfig.json' })],
  //   external: [],
  // },

  // .d.ts
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
])
