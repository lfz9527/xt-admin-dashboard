import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  configureAuthHandlers,
  http,
  type BusResponse,
} from '@/service/request'
import type {
  HttpAdapter,
  HttpResponse,
  RequestConfig,
} from '@/service/http/types'

function createResponse<T>(
  config: RequestConfig,
  data: BusResponse<T>
): HttpResponse<BusResponse<T>> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
    raw: {} as Response,
  }
}

describe('request auth handlers', () => {
  const request = vi.fn()

  beforeEach(() => {
    request.mockReset()
    http.setAdapter({ request } as unknown as HttpAdapter)
    configureAuthHandlers({
      getToken: () => null,
      onUnauthorized: () => undefined,
    })
  })

  it('通过注入的 token getter 添加鉴权头', async () => {
    request.mockImplementation((config: RequestConfig) =>
      Promise.resolve(
        createResponse(config, { code: 0, data: null, message: '' })
      )
    )
    configureAuthHandlers({
      getToken: () => 'test-token',
      onUnauthorized: () => undefined,
    })

    await http.get('/secure')

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    )
  })

  it('收到 401 业务响应时调用注入的认证清理函数', async () => {
    const onUnauthorized = vi.fn()
    request.mockImplementation((config: RequestConfig) =>
      Promise.resolve(
        createResponse(config, {
          code: 401,
          data: null,
          message: 'unauthorized',
        })
      )
    )
    configureAuthHandlers({ getToken: () => null, onUnauthorized })

    await expect(http.get('/secure')).rejects.toMatchObject({ status: 401 })

    expect(onUnauthorized).toHaveBeenCalledOnce()
  })
})
