// vite.config.ts
import { getCommonConfig } from './vite.common'

export default getCommonConfig(
  { index: 'src/index.ts' },
  './tsconfig.index.json'
)
