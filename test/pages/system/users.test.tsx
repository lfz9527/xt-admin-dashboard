import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router'
import UserDetail from '@/pages/system/users/detail'
import Users from '@/pages/system/users'
import {
  createUser,
  deleteUser,
  deleteUsers,
  getUsers,
  getUser,
  updateUser,
  type UserListResult,
} from '@/service/users'
import { getRoles } from '@/service/roles'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const toastSuccess = vi.hoisted(() => vi.fn())
const toastError = vi.hoisted(() => vi.fn())

vi.mock('@/ui/Toast', () => ({
  toast: { success: toastSuccess, error: toastError },
}))

vi.mock('@/service/users', () => ({
  getUsers: vi.fn(),
  getUser: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  deleteUsers: vi.fn(),
}))

vi.mock('@/service/roles', () => ({
  getRoles: vi.fn(),
}))

const mockedGetUsers = vi.mocked(getUsers)
const mockedGetUser = vi.mocked(getUser)
const mockedCreateUser = vi.mocked(createUser)
const mockedUpdateUser = vi.mocked(updateUser)
const mockedDeleteUser = vi.mocked(deleteUser)
const mockedDeleteUsers = vi.mocked(deleteUsers)
const mockedGetRoles = vi.mocked(getRoles)

const userList: UserListResult['list'] = [
  {
    id: '1',
    nickname: 'admin',
    email: '123456@qq.com',
    avatar: '',
    gender: 0,
    status: 0,
    lastLoginTime: '2026-08-22T06:00:00.000Z',
    roleId: '1',
    role: { id: '1', name: '管理员', roleKey: 'admin' },
    createdAt: '2026-08-01T08:30:00.000Z',
    updatedAt: '2026-08-01T08:30:00.000Z',
  },
  {
    id: '2',
    nickname: '运营小王',
    email: 'user@example.com',
    avatar: '',
    gender: 2,
    status: 1,
    lastLoginTime: null,
    roleId: null,
    role: null,
    createdAt: '2026-08-02T08:30:00.000Z',
    updatedAt: '2026-08-02T08:30:00.000Z',
  },
]

const roleList = [
  {
    id: '1',
    name: '管理员',
    roleKey: 'admin',
    status: 0,
    sort: 0,
    remark: '',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: '运营',
    roleKey: 'operator',
    status: 0,
    sort: 1,
    remark: '',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
]

function renderUsers() {
  return render(
    <MemoryRouter>
      <Users />
    </MemoryRouter>
  )
}

beforeEach(() => {
  mockedGetUsers.mockReset()
  mockedGetUser.mockReset()
  mockedCreateUser.mockReset()
  mockedUpdateUser.mockReset()
  mockedDeleteUser.mockReset()
  mockedDeleteUsers.mockReset()
  mockedGetRoles.mockReset()
  toastSuccess.mockReset()
  toastError.mockReset()
  mockedGetUsers.mockResolvedValue({
    res: {} as never,
    data: { list: userList, total: 12 },
  } as never)
  mockedGetRoles.mockResolvedValue({
    res: {} as never,
    data: { list: roleList, total: 2 },
  } as never)
})

describe('Users page', () => {
  it('挂载即请求列表并渲染用户数据', async () => {
    renderUsers()
    expect(await screen.findByText('admin')).toBeInTheDocument()
    expect(screen.getByText('123456@qq.com')).toBeInTheDocument()
    expect(screen.getByText('运营小王')).toBeInTheDocument()
    expect(screen.getByText('user@example.com')).toBeInTheDocument()
    // 性别映射：0=男、2=未知
    expect(screen.getByText('男')).toBeInTheDocument()
    expect(screen.getByText('未知')).toBeInTheDocument()
    // 角色列展示角色名
    expect(screen.getByText('管理员')).toBeInTheDocument()
    expect(mockedGetUsers).toHaveBeenCalledWith(
      { page: 1, pageSize: 10 },
      expect.any(AbortSignal)
    )
  })

  it('status 映射：0 为开启、1 为关闭', async () => {
    renderUsers()
    await screen.findByText('admin')
    const switches = screen.getAllByRole('switch')
    // admin status=0（正常）、运营小王 status=1（停用）
    expect(switches[0]).toBeChecked()
    expect(switches[1]).not.toBeChecked()
  })

  it('点击 Switch 切换状态：调用 updateUser 并更新列表', async () => {
    mockedUpdateUser.mockResolvedValue({
      res: {} as never,
      data: { ...userList[0], status: 1 },
    } as never)
    const user = userEvent.setup()
    renderUsers()
    await screen.findByText('admin')

    await user.click(screen.getAllByRole('switch')[0])

    await waitFor(() => {
      expect(mockedUpdateUser).toHaveBeenCalledWith(
        { id: 1, status: 1 },
        expect.any(AbortSignal)
      )
    })
    // 乐观更新：列表状态立即变为停用
    await waitFor(() => {
      expect(screen.getAllByRole('switch')[0]).not.toBeChecked()
    })
    expect(toastSuccess).toHaveBeenCalledWith('状态更新成功')
  })

  it('切换状态失败：回滚状态并提示错误', async () => {
    mockedUpdateUser.mockRejectedValue(new Error('网络异常'))
    const user = userEvent.setup()
    renderUsers()
    await screen.findByText('admin')

    await user.click(screen.getAllByRole('switch')[0])

    await waitFor(() => {
      expect(screen.getAllByRole('switch')[0]).toBeChecked()
    })
    expect(toastError).toHaveBeenCalledWith('网络异常')
  })

  it('翻页后以新页码请求', async () => {
    const user = userEvent.setup()
    renderUsers()
    await screen.findByText('admin')
    await user.click(screen.getByLabelText('Go to next page'))
    expect(mockedGetUsers).toHaveBeenLastCalledWith(
      { page: 2, pageSize: 10 },
      expect.any(AbortSignal)
    )
  })

  it('新增用户：填写表单提交 createUser 并刷新列表', async () => {
    mockedCreateUser.mockResolvedValue({
      res: {} as never,
      data: userList[0],
    } as never)
    const user = userEvent.setup()
    renderUsers()
    await screen.findByText('admin')

    await user.click(screen.getByRole('button', { name: /新增用户/ }))
    // 打开弹窗时加载角色下拉数据
    expect(mockedGetRoles).toHaveBeenCalledWith(
      { page: 1, pageSize: 100 },
      expect.any(AbortSignal)
    )
    await user.type(screen.getByRole('textbox', { name: '昵称' }), '测试用户')
    await user.type(
      screen.getByRole('textbox', { name: '邮箱' }),
      'test@example.com'
    )
    // password 类型输入无 textbox role，用 placeholder 定位
    await user.type(screen.getByPlaceholderText('请输入密码'), '123456')
    // 新增角色必填：选择角色「运营」（Select trigger 无 accessible name，用占位文本定位）
    await user.click(screen.getByText('请选择角色'))
    await user.click(await screen.findByRole('option', { name: '运营' }))
    await user.click(screen.getByRole('button', { name: '确认' }))

    await waitFor(() => {
      expect(mockedCreateUser).toHaveBeenCalledWith(
        {
          nickname: '测试用户',
          email: 'test@example.com',
          password: '123456',
          gender: 2,
          roleId: 2,
          status: 0,
        },
        expect.any(AbortSignal)
      )
    })
    // 创建成功后回到第 1 页并重新请求列表
    await waitFor(() => {
      expect(mockedGetUsers).toHaveBeenLastCalledWith(
        { page: 1, pageSize: 10 },
        expect.any(AbortSignal)
      )
    })
  })

  it('新增用户未选择角色：校验拦截且不提交', async () => {
    const user = userEvent.setup()
    renderUsers()
    await screen.findByText('admin')

    await user.click(screen.getByRole('button', { name: /新增用户/ }))
    await user.type(screen.getByRole('textbox', { name: '昵称' }), '测试用户')
    await user.type(
      screen.getByRole('textbox', { name: '邮箱' }),
      'test@example.com'
    )
    await user.type(screen.getByPlaceholderText('请输入密码'), '123456')
    await user.click(screen.getByRole('button', { name: '确认' }))

    // 校验提示出现（含占位与错误消息），接口不被调用
    await waitFor(() => {
      expect(screen.getAllByText('请选择角色').length).toBeGreaterThan(0)
    })
    expect(mockedCreateUser).not.toHaveBeenCalled()
  })

  it('编辑用户：预填行数据提交 updateUser 并刷新列表', async () => {
    mockedUpdateUser.mockResolvedValue({
      res: {} as never,
      data: userList[0],
    } as never)
    const user = userEvent.setup()
    renderUsers()
    await screen.findByText('admin')

    await user.click(screen.getAllByRole('button', { name: '编辑' })[0])
    const nicknameInput = screen.getByRole('textbox', { name: '昵称' })
    expect(nicknameInput).toHaveValue('admin')
    expect(screen.getByRole('textbox', { name: '邮箱' })).toHaveValue(
      '123456@qq.com'
    )
    // 编辑不允许修改密码：无密码输入框
    expect(screen.queryByPlaceholderText('请输入密码')).not.toBeInTheDocument()
    await user.clear(nicknameInput)
    await user.type(nicknameInput, '超级管理员')
    await user.click(screen.getByRole('button', { name: '确认' }))

    await waitFor(() => {
      expect(mockedUpdateUser).toHaveBeenCalledWith(
        {
          id: 1,
          nickname: '超级管理员',
          email: '123456@qq.com',
          gender: 0,
          roleId: 1,
          status: 0,
        },
        expect.any(AbortSignal)
      )
    })
    await waitFor(() => {
      expect(mockedGetUsers).toHaveBeenLastCalledWith(
        { page: 1, pageSize: 10 },
        expect.any(AbortSignal)
      )
    })
  })

  it('编辑用户未选择角色：校验拦截且不提交', async () => {
    const user = userEvent.setup()
    renderUsers()
    await screen.findByText('admin')

    // 运营小王为无角色用户（roleId 为 null），编辑时角色必填
    await user.click(screen.getAllByRole('button', { name: '编辑' })[1])
    await user.click(screen.getByRole('button', { name: '确认' }))

    await waitFor(() => {
      expect(screen.getAllByText('请选择角色').length).toBeGreaterThan(0)
    })
    expect(mockedUpdateUser).not.toHaveBeenCalled()
  })

  it('超级管理员用户行删除按钮禁用，普通用户行可点击', async () => {
    renderUsers()
    await screen.findByText('admin')

    const deleteButtons = screen.getAllByRole('button', { name: '删除' })
    expect(deleteButtons).toHaveLength(2)
    // 第 1 行 admin 绑定超级管理员角色，删除按钮禁用
    expect(deleteButtons[0]).toBeDisabled()
    // 第 2 行运营小王无角色，删除按钮可用
    expect(deleteButtons[1]).not.toBeDisabled()
  })

  it('删除用户：确认后调用 deleteUser 并刷新列表', async () => {
    mockedDeleteUser.mockResolvedValue({
      res: {} as never,
      data: null,
    } as never)
    const user = userEvent.setup()
    renderUsers()
    await screen.findByText('admin')

    await user.click(screen.getAllByRole('button', { name: '删除' })[1])
    expect(screen.getByText(/确认删除用户「运营小王」/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '确认删除' }))

    await waitFor(() => {
      expect(mockedDeleteUser).toHaveBeenCalledWith(2, expect.any(AbortSignal))
    })
    await waitFor(() => {
      expect(mockedGetUsers).toHaveBeenLastCalledWith(
        { page: 1, pageSize: 10 },
        expect.any(AbortSignal)
      )
    })
  })

  it('批量删除用户：勾选多行确认后调用 deleteUsers 并刷新列表', async () => {
    mockedDeleteUsers.mockResolvedValue({
      res: {} as never,
      data: null,
    } as never)
    const user = userEvent.setup()
    renderUsers()
    await screen.findByText('admin')

    // 未勾选时不展示批量删除入口
    expect(
      screen.queryByRole('button', { name: '批量删除' })
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: '选择第 1 行' }))
    await user.click(screen.getByRole('checkbox', { name: '选择第 2 行' }))
    expect(screen.getByText('已选 2 项')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '批量删除' }))

    expect(screen.getByText(/确认删除选中的 2 个用户/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '确认删除' }))

    await waitFor(() => {
      expect(mockedDeleteUsers).toHaveBeenCalledWith(
        [1, 2],
        expect.any(AbortSignal)
      )
    })
    await waitFor(() => {
      expect(mockedGetUsers).toHaveBeenLastCalledWith(
        { page: 1, pageSize: 10 },
        expect.any(AbortSignal)
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('删除成功')
  })

  it('批量删除用户失败：提示错误且不清空选中状态', async () => {
    mockedDeleteUsers.mockRejectedValue(new Error('超级管理员用户不允许删除'))
    const user = userEvent.setup()
    renderUsers()
    await screen.findByText('admin')

    await user.click(screen.getByRole('checkbox', { name: '选择第 1 行' }))
    await user.click(screen.getByRole('checkbox', { name: '选择第 2 行' }))
    await user.click(screen.getByRole('button', { name: '批量删除' }))
    await user.click(screen.getByRole('button', { name: '确认删除' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('超级管理员用户不允许删除')
    })
    // 弹窗仍打开，列表中仍展示已选数量
    expect(screen.getByText(/确认删除选中的 2 个用户/)).toBeInTheDocument()
    expect(screen.getByText('已选 2 项')).toBeInTheDocument()
  })

  it('查看用户：跳转详情路由并渲染详情', async () => {
    mockedGetUser.mockResolvedValue({
      res: {} as never,
      data: userList[0],
    } as never)
    const router = createMemoryRouter(
      [
        { path: '/system/users', element: <Users /> },
        { path: '/system/users/:id', element: <UserDetail /> },
      ],
      { initialEntries: ['/system/users'] }
    )
    const user = userEvent.setup()
    render(<RouterProvider router={router} />)

    await user.click(
      (await screen.findAllByRole('button', { name: '查看' }))[0]
    )

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/system/users/1')
    })
    expect(await screen.findByText('admin')).toBeInTheDocument()
    expect(await screen.findByText('123456@qq.com')).toBeInTheDocument()
    expect(mockedGetUser).toHaveBeenCalledWith('1', expect.any(AbortSignal))
  })
})
