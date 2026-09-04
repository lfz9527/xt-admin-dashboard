import { HttpClient } from './http'
import type { HttpError, HttpResponse } from './http/types'
import useAuthor from '@/store/useAuthor'

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

// 请求拦截：注入鉴权头
http.interceptors.request.use((config) => {
  const token = useAuthor.getState().token
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
    authLogout()
  }
  throw err
})

export function authLogout() {
  useAuthor.getState().setToken('')
  useAuthor.getState().setUser(null)
  useAuthor.getState().setRoleKey(null)
  // 动态导入：顶层静态导入会与 router/routes/页面组件形成加载期循环依赖
  import('@/router').then(({ default: router }) => {
    router.navigate('/login', { replace: true })
  })
}
