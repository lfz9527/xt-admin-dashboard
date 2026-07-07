import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { createIconsPlugin } from './vite.config/icons'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [createIconsPlugin(path.resolve(__dirname, 'src/assets/icon'))],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
