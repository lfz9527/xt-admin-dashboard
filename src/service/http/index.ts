// 核心
export { HttpClient } from './HttpClient'
export { InterceptorManager } from './InterceptorManager'

// 适配器
export { FetchAdapter } from './adapters/FetchAdapter'

// 类型
export type {
  HttpClientConfig,
  RequestConfig,
  HttpResponse,
  HttpError,
  HttpAdapter,
  HttpMethod,
  RetryConfig,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
} from './types'

// 默认导出一个全局单例（类似 axios 默认实例）
import { HttpClient } from './HttpClient'
export default HttpClient.create()
