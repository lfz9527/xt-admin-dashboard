import { HttpClient } from './http'
import type { HttpError, HttpResponse } from './http/types'

export type BusResponse<T = unknown> = {
  code: number
  data: T
  message: string
}

const CODE = {
  AUTHCODE: 401,
}

const port = import.meta.env.VITE_API_BASE_PORT
  ? `:${import.meta.env.VITE_API_BASE_PORT}`
  : ''

export const http = HttpClient.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}${port}`,
  timeout: 10000,
})

type AuthHandlers = {
  getToken: () => string | number | null
  onUnauthorized: () => void
}

let authHandlers: AuthHandlers = {
  getToken: () => null,
  onUnauthorized: () => undefined,
}

/** 由应用组合层注入认证状态，避免请求基础设施反向依赖 store。 */
export function configureAuthHandlers(handlers: AuthHandlers) {
  authHandlers = handlers
}

// 请求拦截：注入鉴权头
http.interceptors.request.use((config) => {
  const token = authHandlers.getToken()
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }
  return config
})

// 响应拦截
function unwrapResponse<T>(res: HttpResponse<T>): HttpResponse<T> {
  const { data } = res
  const result = data as BusResponse<T>
  // 业务中的错误处理
  if (result.code !== 0) {
    const err = new Error(result.message) as HttpError
    err.status = result.code
    err.response = res as unknown as HttpResponse
    throw err
  }
  return {
    res,
    data: result.data,
  } as unknown as HttpResponse<T>
}

http.interceptors.response.use(unwrapResponse)

// 错误拦截：统一处理
http.interceptors.error.use(async (err: HttpError) => {
  // 401 未授权：清除凭证并重定向到登录页
  if (err.status === CODE.AUTHCODE) {
    authHandlers.onUnauthorized()
  }
  throw err
})
