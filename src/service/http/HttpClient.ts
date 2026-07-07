import type {
  HttpClientConfig,
  RequestConfig,
  HttpResponse,
  HttpError,
  HttpAdapter,
  RetryConfig,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
} from './types'
import { InterceptorManager } from './InterceptorManager'
import { FetchAdapter } from './adapters/FetchAdapter'

/**
 * HttpClient —— 核心 HTTP 客户端
 *
 * 设计理念：
 * - Strategy 模式：Adapter 可替换（fetch / axios / mock / XHR）
 * - Chain of Responsibility：拦截器链
 * - Template Method：子类可 override buildConfig / handleError
 * - Factory Method：静态 create() 快速实例化
 */
export class HttpClient {
  protected config: Required<Omit<HttpClientConfig, 'adapter'>> & {
    adapter: HttpAdapter
  }

  /** 拦截器管理器（公开，方便外部注册） */
  readonly interceptors = {
    request: new InterceptorManager<RequestInterceptor>(),
    response: new InterceptorManager<ResponseInterceptor>(),
    error: new InterceptorManager<ErrorInterceptor>(),
  }

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      baseURL: config.baseURL ?? '',
      timeout: config.timeout ?? 0,
      headers: config.headers ?? {},
      responseType: config.responseType ?? 'json',
      adapter: config.adapter ?? new FetchAdapter(),
      retry: config.retry ?? { count: 0 },
    }
  }

  // 静态工厂
  static create(config?: HttpClientConfig): HttpClient {
    return new HttpClient(config)
  }

  /** 构建完整 URL，拼接 baseURL 和查询参数 */
  protected buildURL(url: string, params?: RequestConfig['params']): string {
    // baseURL 拼接
    const base = this.config.baseURL
    const fullURL = url.startsWith('http') ? url : `${base}${url}`

    if (!params) return fullURL

    // 序列化查询参数
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v != null) searchParams.append(k, String(v))
    })
    const qs = searchParams.toString()
    return qs ? `${fullURL}${fullURL.includes('?') ? '&' : '?'}${qs}` : fullURL
  }

  buildConfig(config: RequestConfig): RequestConfig {
    const merged: RequestConfig = {
      ...config,
      url: this.buildURL(config.url, config.params),
      method: config.method ?? 'GET',
      headers: { ...this.config.headers, ...config.headers },
      timeout: config.timeout ?? this.config.timeout,
      responseType: config.responseType ?? this.config.responseType,
      retry: config.retry ?? this.config.retry,
    }
    return merged
  }
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // 重试
  private async sendWithRetry<T>(
    config: RequestConfig
  ): Promise<HttpResponse<T>> {
    const retry: RetryConfig = config.retry ?? { count: 0 }
    let lastError: HttpError | undefined

    for (let attempt = 0; attempt <= retry.count; attempt++) {
      try {
        return await this.config.adapter.request<T>(config)
      } catch (err) {
        lastError = err as HttpError

        const shouldRetry =
          attempt < retry.count &&
          !lastError.isAborted &&
          (retry.condition ? retry.condition(lastError) : true)

        if (!shouldRetry) break

        // 延迟后重试（指数退避）
        const delay = retry.delay ? retry.delay * Math.pow(2, attempt) : 0
        if (delay > 0) await this.sleep(delay)
      }
    }

    throw lastError
  }

  private async basicRequest<T = unknown>(
    config: RequestConfig
  ): Promise<HttpResponse<T>> {
    // 配置合并
    let mergedConfig = this.buildConfig(config)

    // 执行请求拦截器链
    const requestHandlers: RequestInterceptor[] = []
    this.interceptors.request.forEach((h) => {
      requestHandlers.push(h)
    })
    for (const handler of requestHandlers) {
      mergedConfig = await handler(mergedConfig)
    }

    try {
      let response = await this.sendWithRetry<T>(mergedConfig)
      //  执行响应拦截器链
      const responseHandlers: ResponseInterceptor[] = []
      this.interceptors.response.forEach((h) => {
        responseHandlers.push(h)
      })
      for (const handler of responseHandlers) {
        response = (await (handler as ResponseInterceptor<T>)(
          response
        )) as HttpResponse<T>
      }
      return response
    } catch (rawError) {
      return this.handleError<T>(rawError as HttpError)
    }
  }

  protected async handleError<T>(error: HttpError): Promise<HttpResponse<T>> {
    // 执行错误拦截器链
    const errorHandlers: ErrorInterceptor[] = []
    this.interceptors.error.forEach((h) => {
      errorHandlers.push(h)
    })
    let currentError = error
    for (const handler of errorHandlers) {
      currentError = (await handler(currentError)) as HttpError
    }
    throw currentError
  }

  // 更现实适配器
  setAdapter(adapter: HttpAdapter): this {
    this.config.adapter = adapter
    return this
  }

  // 继承当前配置创建示例
  fork(config?: HttpClientConfig): HttpClient {
    const child = new HttpClient({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: { ...this.config.headers },
      responseType: this.config.responseType,
      adapter: this.config.adapter,
      retry: this.config.retry,
      ...config,
    })
    return child
  }

  request<T = unknown>(
    url: string,
    config?: Omit<RequestConfig, 'url'>
  ): Promise<HttpResponse<T>> {
    return this.basicRequest<T>({ ...config, url })
  }

  get<T = unknown>(
    url: string,
    config?: Omit<RequestConfig, 'url' | 'method'>
  ): Promise<HttpResponse<T>> {
    return this.basicRequest<T>({ ...config, url, method: 'GET' })
  }

  post<T = unknown>(
    url: string,
    data?: unknown,
    config?: Omit<RequestConfig, 'url' | 'method' | 'data'>
  ): Promise<HttpResponse<T>> {
    return this.basicRequest<T>({ ...config, url, method: 'POST', data })
  }

  put<T = unknown>(
    url: string,
    data?: unknown,
    config?: Omit<RequestConfig, 'url' | 'method' | 'data'>
  ): Promise<HttpResponse<T>> {
    return this.basicRequest<T>({ ...config, url, method: 'PUT', data })
  }

  patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: Omit<RequestConfig, 'url' | 'method' | 'data'>
  ): Promise<HttpResponse<T>> {
    return this.basicRequest<T>({ ...config, url, method: 'PATCH', data })
  }

  delete<T = unknown>(
    url: string,
    config?: Omit<RequestConfig, 'url' | 'method'>
  ): Promise<HttpResponse<T>> {
    return this.basicRequest<T>({ ...config, url, method: 'DELETE' })
  }
}
