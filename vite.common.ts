import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import banner from 'vite-plugin-banner'
import pkg from './package.json' assert { type: 'json' }

const bannerText = (module: string) => `/*!
 * ${pkg.name}${module ? ` ${module}` : ''} v${pkg.version}
 * (c) 2025 ${pkg.author ?? ''}
 * Released under the ${pkg.license} License.
 */`

export function getCommonConfig(
  entryPair: Record<string, string>,
  tsconfigPath: string,
  moduleName: string = '',
) {
  return defineConfig({
    build: {
      ssr: true,
      emptyOutDir: false,
      lib: {
        entry: { ...entryPair },
        formats: ['es'],
      },
      minify: 'terser'
    },
    plugins: [
      dts({tsconfigPath}),
      banner(bannerText(moduleName))
    ]
  })
}
