import { name } from '../../package.json'

export const IS_PROD = import.meta.env.PROD
export const IS_DEV = import.meta.env.DEV

// 移动端 锚点
export const MOBILE_BREAKPOINT = 768

export const APP_NAMES = name
