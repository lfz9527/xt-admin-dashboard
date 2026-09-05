import { beforeEach, describe, expect, it, vi } from 'vitest'

const { http } = vi.hoisted(() => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock('@/service/request', () => ({ http }))

import {
  getCaptcha,
  login,
  logout,
  register,
  resetPassword,
  sendRegisterCode,
  sendResetCode,
} from '@/service/auth'
import {
  createBookmark,
  deleteBookmark,
  getBookmarkTree,
  updateBookmark,
} from '@/service/bookmarks'
import {
  createDictItem,
  createDictType,
  deleteDictItem,
  deleteDictType,
  getDictItems,
  getDictOptions,
  getDictTypes,
  listAllDictItems,
  listAllDictTypes,
  updateDictItem,
  updateDictItemStatus,
  updateDictType,
  updateDictTypeStatus,
} from '@/service/dict'
import {
  createRole,
  deleteRole,
  deleteRoles,
  getRole,
  getRoles,
  updateRole,
} from '@/service/roles'
import {
  createUser,
  deleteUser,
  deleteUsers,
  getUser,
  getUserInfo,
  getUsers,
  updateProfile,
  updateUser,
  uploadAvatar,
} from '@/service/users'

describe('service endpoints', () => {
  const signal = new AbortController().signal

  beforeEach(() => {
    http.get.mockReset()
    http.post.mockReset()
    http.get.mockResolvedValue({ data: { list: [], totalPages: 1 } })
    http.post.mockResolvedValue({ data: null })
  })

  it('maps auth services to their endpoints and forwards signal', async () => {
    await getCaptcha(signal)
    await login(
      {
        email: 'a@b.com',
        password: 'secret',
        captchaId: 'id',
        captchaCode: '1234',
      },
      signal
    )
    await sendRegisterCode({ email: 'a@b.com' }, signal)
    await register(
      {
        email: 'a@b.com',
        nickname: 'A',
        password: 'secret',
        emailCode: '1234',
      },
      signal
    )
    await sendResetCode({ email: 'a@b.com' }, signal)
    await resetPassword(
      { email: 'a@b.com', emailCode: '1234', password: 'new-secret' },
      signal
    )
    await logout(signal)

    expect(http.get).toHaveBeenCalledWith('/auth/captcha', { signal })
    expect(http.post).toHaveBeenNthCalledWith(
      1,
      '/auth/login',
      expect.any(Object),
      { signal }
    )
    expect(http.post).toHaveBeenNthCalledWith(6, '/auth/logout', undefined, {
      signal,
    })
  })

  it('maps user and role CRUD services', async () => {
    await getUsers({ page: 1, pageSize: 20 }, signal)
    await getUser('a/b', signal)
    await createUser(
      { nickname: 'A', email: 'a@b.com', password: 'secret' },
      signal
    )
    await updateUser({ id: 1, nickname: 'B' }, signal)
    await deleteUser(1, signal)
    await deleteUsers([1, 2], signal)
    await getUserInfo(signal)
    await updateProfile({ nickname: 'C' }, signal)
    await uploadAvatar(new File(['avatar'], 'avatar.png'), signal)
    await getRoles({ page: 1, pageSize: 20 }, signal)
    await getRole('x/y', signal)
    await createRole({ name: 'R', roleKey: 'r' }, signal)
    await updateRole({ id: 1, name: 'R2' }, signal)
    await deleteRole(1, signal)
    await deleteRoles([1, 2], signal)

    expect(http.get).toHaveBeenCalledWith('/users', {
      params: { page: 1, pageSize: 20 },
      signal,
    })
    expect(http.get).toHaveBeenCalledWith('/users/a%2Fb', { signal })
    expect(http.post).toHaveBeenCalledWith(
      '/users/delete/batch',
      { ids: [1, 2] },
      { signal }
    )
    expect(http.get).toHaveBeenCalledWith('/roles/x%2Fy', { signal })
    expect(http.post).toHaveBeenCalledWith(
      '/roles/delete',
      { id: 1 },
      { signal }
    )
  })

  it('maps bookmark and dictionary services, including encoded keys', async () => {
    await getBookmarkTree(signal)
    await createBookmark(
      { type: 2, title: 'Site', url: 'https://example.com' },
      signal
    )
    await updateBookmark({ id: 1, title: 'Updated' }, signal)
    await deleteBookmark(1, signal)
    await getDictTypes({ page: 1, pageSize: 20 }, signal)
    await createDictType({ name: 'Type', dictKey: 'sys.test' }, signal)
    await updateDictType({ id: 1, name: 'Type 2' }, signal)
    await updateDictTypeStatus({ id: 1, status: 1 }, signal)
    await deleteDictType(1, signal)
    await getDictItems({ page: 1, pageSize: 20, dictTypeId: 1 }, signal)
    await createDictItem({ dictTypeId: 1, label: 'A', value: 'a' }, signal)
    await updateDictItem({ id: 1, label: 'B', value: 'b' }, signal)
    await updateDictItemStatus({ id: 1, status: 1 }, signal)
    await deleteDictItem(1, signal)
    await getDictOptions('sys/a test', signal)

    expect(http.get).toHaveBeenCalledWith('/bookmarks/tree', { signal })
    expect(http.get).toHaveBeenCalledWith('/dicts/sys%2Fa%20test/items', {
      signal,
    })
    expect(http.post).toHaveBeenCalledWith(
      '/dict-items/status',
      { id: 1, status: 1 },
      { signal }
    )
  })

  it('collects all dictionary pages', async () => {
    http.get
      .mockResolvedValueOnce({ data: { list: [{ id: '1' }], totalPages: 2 } })
      .mockResolvedValueOnce({ data: { list: [{ id: '2' }], totalPages: 2 } })

    await expect(listAllDictTypes(signal)).resolves.toEqual({
      data: [{ id: '1' }, { id: '2' }],
    })
    expect(http.get).toHaveBeenNthCalledWith(1, '/dict-types', {
      params: { page: 1, pageSize: 100 },
      signal,
    })
    expect(http.get).toHaveBeenNthCalledWith(2, '/dict-types', {
      params: { page: 2, pageSize: 100 },
      signal,
    })

    http.get.mockResolvedValueOnce({
      data: { list: [{ id: '3' }], totalPages: 1 },
    })
    await expect(listAllDictItems(7, signal)).resolves.toEqual({
      data: [{ id: '3' }],
    })
    expect(http.get).toHaveBeenCalledWith('/dict-items', {
      params: { page: 1, pageSize: 100, dictTypeId: 7 },
      signal,
    })
  })
})
