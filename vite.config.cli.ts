// vite.config.cli.ts
import { getCommonConfig } from './vite.common'

export default getCommonConfig(
  { cli: 'src/cli.ts' },
  './tsconfig.cli.json',
  'CLI',
)
