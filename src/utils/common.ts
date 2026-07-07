import { clsx, type ClassValue } from 'clsx'
// 类名合并
export const cn = (...inputs: ClassValue[]) => clsx(inputs)

export const getCurEnv = () => {
  return process.env.NODE_ENV || 'development'
}
