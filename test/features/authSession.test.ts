import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authLogout, getAuthToken } from '@/features/auth/session'
import useAuthor from '@/store/useAuthor'
import type { AuthUser } from '@/service/auth'

const navigate = vi.hoisted(() => vi.fn())

vi.mock('@/router', () => ({
  default: { navigate },
}))

describe('auth session', () => {
  beforeEach(() => {
    navigate.mockReset()
    useAuthor.setState({
      token: 'test-token',
      user: {} as AuthUser,
      roleKey: 'admin',
    })
  })

  it('向请求层提供当前 token', () => {
    expect(getAuthToken()).toBe('test-token')
  })

  it('登出时清理认证状态并跳转登录页', async () => {
    authLogout()

    expect(useAuthor.getState()).toMatchObject({
      token: '',
      user: null,
      roleKey: null,
    })
    await vi.waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/login', { replace: true })
    })
  })
})
