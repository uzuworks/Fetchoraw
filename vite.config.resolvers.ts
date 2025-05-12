// vite.config.ts
import { getCommonConfig } from './vite.common'

export default getCommonConfig(
  { 'resolvers/index': 'src/resolvers/index.ts' },
  './tsconfig.resolvers.json',
  'Resolvers',
)
