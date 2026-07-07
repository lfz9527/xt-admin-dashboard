import { defineConfig, loadEnv } from 'vite'
import { buildPlugins } from './vite.config/plugin'
import buildConfig from './vite.config/config'

export default defineConfig((conf) => {
  const { mode, command } = conf
  const env = loadEnv(mode, process.cwd())
  const isBuild = command === 'build'
  return {
    ...buildConfig({ ...conf, isBuild, env }),
    plugins: buildPlugins({ mode, isBuild, env }),
  }
})
