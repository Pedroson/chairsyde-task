import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults, type ConfigEnv } from 'vitest/config'
import viteConfig from './vite.config'

export default defineConfig((configEnv: ConfigEnv) =>
  mergeConfig(
    typeof viteConfig === 'function' ? viteConfig(configEnv) : viteConfig,
    defineConfig({
      test: {
        environment: 'jsdom',
        exclude: [...configDefaults.exclude, 'e2e/**'],
        root: fileURLToPath(new URL('./', import.meta.url)),
      },
    }),
  ),
)
