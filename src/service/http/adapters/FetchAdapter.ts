import type {
  HttpAdapter,
  HttpResponse,
  RequestConfig,
  HttpError,
} from '../types'

/**
 * 默认 Fetch 适配器
 * 实现 HttpAdapter 接口，基于原生 fetch
 */
export class FetchAdapter implements HttpAdapter {
  async request<T>(config: RequestConfig): Promise<HttpResponse<T>> {
    const {
      url,
      method = 'GET',
      headers = {},
      data,
      timeout,
      signal,
      responseType = 'json',
      cache,
    } = config

    // 判断是否请求超时
    let timedOut = false

    // 超时控制
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let combinedSignal = signal

    if (timeout) {
      const controller = new AbortController()
      timeoutId = setTimeout(() => {
        timedOut = true
        controller.abort()
      }, timeout)

      // 合并外部 signal 与超时 signal
      if (signal) {
        signal.addEventListener('abort', () => controller.abort())
      }
      combinedSignal = controller.signal
    }

    // 列化请求体
    const body = this.serializeBody(data, headers)

    try {
      const raw = await fetch(url, {
        method,
        headers,
        body,
        signal: combinedSignal,
        cache,
      })
      if (timeoutId) clearTimeout(timeoutId)
      // 解析响应体
      const response = await this.parseResponse<T>(raw, responseType)

      if (!raw.ok) {
        const err = new Error(
          `HTTP Error ${raw.status}: ${raw.statusText}`
        ) as HttpError
        err.status = raw.status
        err.statusText = raw.statusText
        err.config = config
        err.response = {
          data: response,
          status: raw.status,
          statusText: raw.statusText,
          headers: this.parseHeaders(raw.headers),
          config,
          raw,
        }
        throw err
      }

      return {
        data: response,
        status: raw.status,
        statusText: raw.statusText,
        headers: this.parseHeaders(raw.headers),
        config,
        raw,
      }
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId)
      const err = error as HttpError
      if (err.name === 'AbortError') {
        if (timedOut && timeout) {
          err.isTimeout = true
          err.message = `Request timeout after ${timeout}ms`
        } else {
          // 主动取消
          err.isAborted = true
        }
      }
      // 网络错误
      else if (!err.status) {
        err.isNetworkError = true
      }
      err.config = config
      throw err
    }
  }
  private parseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {}
    headers.forEach((value, key) => {
      result[key] = value
    })
    return result
  }
  async parseResponse<T>(raw: Response, responseType: string) {
    switch (responseType) {
      case 'text':
        return raw.text() as Promise<T>
      case 'blob':
        return raw.blob() as Promise<T>
      case 'arrayBuffer':
        return raw.arrayBuffer() as Promise<T>
      case 'json':
        return raw.json() as Promise<T>
    }
    // 空响应体保护
    const text = await raw.text()
    return text ? JSON.parse(text) : (null as T)
  }
  serializeBody(data: unknown, headers: Record<string, string>) {
    if (data == null) return undefined
    if (
      data instanceof FormData ||
      data instanceof URLSearchParams ||
      data instanceof Blob
    ) {
      return data as BodyInit
    }
    if (typeof data === 'string') return data
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }
    return JSON.stringify(data)
  }
}
