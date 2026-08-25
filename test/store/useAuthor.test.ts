import { beforeEach, describe, expect, it } from 'vitest'
import useAuthor from '@/store/useAuthor'

describe('useAuthor roleKey', () => {
  beforeEach(() => {
    useAuthor.setState({ roleKey: null })
  })

  it('初始 roleKey 为 null', () => {
    expect(useAuthor.getState().roleKey).toBeNull()
  })

  it('setRoleKey 更新角色编码', () => {
    useAuthor.getState().setRoleKey('admin')
    expect(useAuthor.getState().roleKey).toBe('admin')
  })

  it('setRoleKey 支持清空', () => {
    useAuthor.setState({ roleKey: 'admin' })
    useAuthor.getState().setRoleKey(null)
    expect(useAuthor.getState().roleKey).toBeNull()
  })
})
