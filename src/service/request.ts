import { HttpClient } from './http'
import type { HttpError, HttpResponse } from './http/types'

export type BusResponse<T = unknown> = {
  code: number
  data: T
  message: string
}

export const http = HttpClient.create({
  timeout: 1000,
})

// 请求拦截
http.interceptors.request.use((config) => {
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
  console.log('err===', err.status)
  throw err
})
