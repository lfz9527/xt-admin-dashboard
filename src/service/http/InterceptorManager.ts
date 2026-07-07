// 拦截器管理

import type {
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
} from './types'

import { uid } from '@/utils/easy-uid'

type Fn<T> = (handler: T) => Promise<void> | void

type InterceptorEntry<T> = {
  id: string
  handler: T
  enabled: boolean
}

// 拦截器条目
type Interceptors<T> = Map<string, InterceptorEntry<T>>

/**
 * 泛型拦截器管理器
 * 支持注册、注销、按序执行
 */
export class InterceptorManager<T> {
  private interceptors: Interceptors<T> = new Map()

  // 注册拦截器
  use(handler: T): string {
    const id = uid()
    this.interceptors.set(id, {
      id,
      handler,
      enabled: true,
    })
    return id
  }
  // 注销拦截器
  eject(id: string): boolean {
    return this.interceptors.delete(id)
  }

  // 禁用某个拦截器
  setEnabled(id: string, enabled: boolean = true) {
    const entry = this.interceptors.get(id)
    if (!entry) return
    entry.enabled = enabled
  }
  // 清空拦截器
  clear() {
    this.interceptors.clear()
  }

  /** 遍历激活中的拦截器 */
  forEach(fn: Fn<T>) {
    const inters = Array.from(this.interceptors.values())
    inters.filter((i) => i.enabled).forEach(async (i) => await fn(i.handler))
  }

  // 获取拦截器长度
  get size(): number {
    return this.interceptors.size
  }
}

export type RequestInterceptorManager = InterceptorManager<RequestInterceptor>
export type ResponseInterceptorManager = InterceptorManager<ResponseInterceptor>
export type ErrorInterceptorManager = InterceptorManager<ErrorInterceptor>
