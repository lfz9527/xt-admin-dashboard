type Generator = () => string

const createGenerator = (base: number): Generator => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.getRandomValues === 'function'
  ) {
    return (): string => {
      const num = crypto.getRandomValues(new Uint8Array(1))[0]
      return (num >= base ? num % base : num).toString(base)
    }
  }

  return (): string => {
    return Math.floor(Math.random() * base).toString(base)
  }
}

export const uid = (length: number = 7, hex: boolean = false): string => {
  const base = hex ? 16 : 36
  const generator = createGenerator(base)

  // 时间戳（毫秒）
  const timestamp = Date.now().toString(base)

  const randomPart = Array.from({ length }, (): string => generator()).join('')

  // 时间戳 + 随机部分
  return `${timestamp}${randomPart}`
}
