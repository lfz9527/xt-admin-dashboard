import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

const ignore = ['dist', 'node_modules', 'public', 'pnpm-lock.yaml', 'README.md']

export default defineConfig([
  globalIgnores(ignore),
  {
    files: ['**/*.{js}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      prettier,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // 禁止在同一个文件中重复导入相同的模块。
      'no-duplicate-imports': 'error',
      // 允许写any
      '@typescript-eslint/no-explicit-any': 'off',
      // 允许未使用的变量
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/preserve-manual-memoization': 'warn',
      'no-empty': 'off',
    },
  },
])
