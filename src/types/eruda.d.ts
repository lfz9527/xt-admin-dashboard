// eruda 包未声明 types 字段，这里按需补最小类型声明（默认导出 + init）
declare module 'eruda' {
  const eruda: {
    /** 初始化移动端调试控制台，重复调用安全 */
    init: (options?: Record<string, unknown>) => void
  }
  export default eruda
}
