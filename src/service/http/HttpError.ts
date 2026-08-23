import type { HttpError, RequestConfig, HttpResponse } from './types'

export class HttpErrorCls extends Error implements HttpError {
  status?: number
  statusText?: string
  config?: RequestConfig
  response?: HttpResponse
  isAborted?: boolean
  isTimeout?: boolean
  isNetworkError?: boolean

  constructor(
    message: string,
    options: {
      status?: number
      statusText?: string
      config?: RequestConfig
      response?: HttpResponse
    } = {}
  ) {
    super(message)
    this.name = 'HttpError'
    this.status = options.status
    this.statusText = options.statusText
    this.config = options.config
    this.response = options.response
  }
}
