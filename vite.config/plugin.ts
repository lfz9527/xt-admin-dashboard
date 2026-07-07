import { type ConfigEnv, type PluginOption } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import { compression } from 'vite-plugin-compression2'
import { envParse, parseLoadedEnv } from 'vite-plugin-env-parse'
import { visualizer } from 'rollup-plugin-visualizer'
import stylelint from 'vite-plugin-stylelint'
import { createIconsPlugin } from './icons'
import type { ImportMetaEnv } from '../src/types/env'
import tailwindcss from '@tailwindcss/vite'

type Props = {
  mode: ConfigEnv['mode']
  isBuild: boolean
  env: Record<string, string>
}

export const buildPlugins = ({ env, isBuild }: Props) => {
  const viteEnv = parseLoadedEnv(env) as ImportMetaEnv
  const { VITE_BUILD_COMPRESS, VITE_BUILD_ANALYZE } = viteEnv
  const isGzip = isBuild && VITE_BUILD_COMPRESS?.split(',').includes('gzip')

  const plugins: PluginOption[] = [
    react(),
    tailwindcss(),
    createIconsPlugin(path.resolve(__dirname, '../src/assets/icon')),
    stylelint({
      fix: true, // 开启自动修复
      include: ['**/*.{css,scss,less}'], // 仅检查样式文件
      cache: false, // 开发时建议关闭缓存避免误报
    }),

    // 更具env 自动生成全局类型
    envParse({
      dtsPath: 'src/types/env.d.ts',
    }),

    // 压缩gzip格式

    isGzip &&
      compression({
        algorithms: ['gzip'],
      }),

    // 代码分析
    VITE_BUILD_ANALYZE &&
      visualizer({
        open: true, // 打包后自动打开浏览器
        gzipSize: true, // 显示 gzip 后体积
        brotliSize: true, // 显示 brotli 后体积
        filename: 'analyze.html', // 生成的报告文件名
      }),
  ]

  return plugins
}
