import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
// 类名合并
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getCurEnv = () => {
  return process.env.NODE_ENV || 'development'
}
