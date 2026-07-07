export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'

export type RequestConfig = {
  url: string
  method?: HttpMethod
  headers?: Record<string, string>
  params?: Record<string, string | number | boolean | null | undefined>
  data?: unknown
  timeout?: number
  signal?: AbortSignal
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer'
  // 重试配置
  retry?: RetryConfig
  // 缓存配置
  cache?: RequestCache
  // 自定义元数据（可在拦截器中使用）
  meta?: Record<string, unknown>
}

export type RetryConfig = {
  count: number
  delay?: number
  // 重试判断条件
  condition?: (error: HttpError) => boolean
}

export type HttpResponse<T = unknown> = {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  config: RequestConfig
  raw: Response
}

export interface HttpError extends Error {
  status?: number
  statusText?: string
  config?: RequestConfig
  response?: HttpResponse
  isAborted?: boolean
  isTimeout?: boolean
  isNetworkError?: boolean
}
// 拦截器
// 请求拦截
export type RequestInterceptor = (
  config: RequestConfig
) => RequestConfig | Promise<RequestConfig>

// 响应拦截
export type ResponseInterceptor<T = unknown> = (
  response: HttpResponse<T>
) => HttpResponse<T> | Promise<HttpResponse<T>>

// 错误拦截
export type ErrorInterceptor = (
  error: HttpError
) => HttpError | Promise<HttpError | never>

export interface InterceptorPair<Req, Res> {
  onRequest?: Req
  onResponse?: Res
  onError?: ErrorInterceptor
}

// 适配器接口
export interface HttpAdapter {
  request<T>(config: RequestConfig): Promise<HttpResponse<T>>
}

// 客户端配置
export interface HttpClientConfig {
  baseURL?: string
  timeout?: number
  headers?: Record<string, string>
  responseType?: RequestConfig['responseType']
  adapter?: HttpAdapter
  retry?: RetryConfig
}
