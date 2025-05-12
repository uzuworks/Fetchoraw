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
  // ESM build
  {
    input: {
      index: 'src/index.ts',
    },
    output: {
      dir: 'dist',
      format: 'esm',
      entryFileNames: '[name].mjs',
      inlineDynamicImports: true,
      banner
    },
    plugins: [
      resolve(),
      json(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser()
    ],
    external: []
  },
  {
    input: {
      'resolvers/index': 'src/resolvers/index.ts'
    },
    output: {
      dir: 'dist',
      format: 'esm',
      entryFileNames: '[name].mjs',
      inlineDynamicImports: true,
      banner
    },
    plugins: [
      resolve(),
      json(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser()
    ],
    external: []
  },

  // CLI build
  // {
  //   input: 'src/cli.ts',
  //   output: {
  //     file: 'dist/cli.cjs',
  //     format: 'cjs',
  //     banner: '#!/usr/bin/env node\n' + banner
  //   },
  //   plugins: [
  //     resolve(),
  //     json(),
  //     commonjs(),
  //     typescript({ tsconfig: './tsconfig.json' })
  //   ],
  //   external: []
  // },

  // Types
  {
    input: {
      index: 'src/index.ts',
      'resolvers/index': 'src/resolvers/index.ts'
    },
    output: {
      dir: 'dist',
      format: 'esm',
      entryFileNames: '[name].d.ts',
      preserveModules: false,
    },
    plugins: [dts()],
  },

])
