import { defineConfig, type ConfigEnv } from 'vite'
import path from 'path'
import pkg from '../package.json'

const version = pkg.version ?? ''

type Props = ConfigEnv & {
  isBuild?: boolean
  env: Record<string, string>
}
const buildConfig = ({ mode, env }: Props): ReturnType<typeof defineConfig> => {
  const isProd = mode === 'production'

  const minify = {
    compress: {
      dropConsole: isProd,
      dropDebugger: isProd,
    },
  }

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../src'),
      },
    },
    server: {
      open: true,
      host: true,
      port: 9529,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    build: {
      // 规定触发警告的 chunk 大小。（以 kB 为单位）。它将与未压缩的 chunk 大小进行比较 默认就是500
      chunkSizeWarningLimit: 500,
      // 设置小于 次kb 的资源将内联为base64
      assetsInlineLimit: 10,
      outDir: `dist/${mode}_${version}`,
      rolldownOptions: {
        output: {
          minify,
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (info) => {
            const name = info.names?.[0] ?? info.originalFileNames?.[0] ?? ''
            const ext = name.split('.').pop() ?? ''
            if (/^(gif|jpe?g|png|svg)$/.test(ext))
              return 'assets/[name]-[hash][extname]'
            if (ext === 'css') return 'css/[name]-[hash][extname]'
            if (ext === 'ttf') return 'font/[name]-[hash][extname]'
            return 'assets/[name]-[hash][extname]'
          },
        },
      },
      sourcemap: env.VITE_BUILD_SOURCEMAP === 'true',
    },
  }
}

export default buildConfig
