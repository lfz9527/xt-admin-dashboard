/// <reference types="vite/client" />

// 通过 envParse 生成的变量
export interface ImportMetaEnv {
  // Auto generate by env-parse
  /**
   * 是否开启代码分析
   */
  readonly VITE_BUILD_ANALYZE: boolean
  /**
   * 是否在打包时开启压缩，支持 gzip 和 brotli
   */
  readonly VITE_BUILD_COMPRESS: string
  /**
   * 是否在打包时生成 sourcemap
   */
  readonly VITE_BUILD_SOURCEMAP: boolean
}
