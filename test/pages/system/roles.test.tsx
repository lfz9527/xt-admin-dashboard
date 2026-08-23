import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Roles from '@/pages/system/roles'
import {
  createRole,
  deleteRole,
  getRoles,
  updateRole,
  type RoleListResult,
} from '@/service/roles'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const toastSuccess = vi.hoisted(() => vi.fn())
const toastError = vi.hoisted(() => vi.fn())

vi.mock('@/ui/Toast', () => ({
  toast: { success: toastSuccess, error: toastError },
}))

vi.mock('@/service/roles', () => ({
  getRoles: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
}))

const mockedGetRoles = vi.mocked(getRoles)
const mockedCreateRole = vi.mocked(createRole)
const mockedUpdateRole = vi.mocked(updateRole)
const mockedDeleteRole = vi.mocked(deleteRole)

const roleList: RoleListResult['list'] = [
  {
    // 后端列表返回字符串 id，接口入参需转数字
    id: '1' as unknown as number,
    name: '管理员',
    roleKey: 'admin',
    status: 0,
    sort: 0,
    remark: '系统内置角色',
    createdAt: '2026-08-01T08:30:00.000Z',
    updatedAt: '2026-08-01T08:30:00.000Z',
  },
  {
    id: '2' as unknown as number,
    name: '运营',
    roleKey: 'operator',
    status: 1,
    sort: 1,
    remark: '',
    createdAt: '2026-08-02T08:30:00.000Z',
    updatedAt: '2026-08-02T08:30:00.000Z',
  },
]

beforeEach(() => {
  mockedGetRoles.mockReset()
  mockedCreateRole.mockReset()
  mockedUpdateRole.mockReset()
  mockedDeleteRole.mockReset()
  toastSuccess.mockReset()
  toastError.mockReset()
  mockedGetRoles.mockResolvedValue({
    res: {} as never,
    data: { list: roleList, total: 12 },
  } as never)
})

describe('Roles page', () => {
  it('挂载即请求列表并渲染角色数据', async () => {
    render(<Roles />)
    expect(await screen.findByText('管理员')).toBeInTheDocument()
    expect(screen.getByText('运营')).toBeInTheDocument()
    expect(screen.getByText('系统内置角色')).toBeInTheDocument()
    expect(screen.getByText('备注')).toBeInTheDocument()
    expect(mockedGetRoles).toHaveBeenCalledWith(
      { page: 1, pageSize: 10 },
      expect.any(AbortSignal)
    )
  })

  it('status 映射：0 为开启、1 为关闭', async () => {
    render(<Roles />)
    await screen.findByText('管理员')
    const switches = screen.getAllByRole('switch')
    // 管理员 status=0（开启）、运营 status=1（关闭）
    expect(switches[0]).toBeChecked()
    expect(switches[1]).not.toBeChecked()
  })

  it('点击 Switch 切换状态：调用 updateRole 并更新列表', async () => {
    mockedUpdateRole.mockResolvedValue({
      res: {} as never,
      data: { ...roleList[0], status: 1 },
    } as never)
    const user = userEvent.setup()
    render(<Roles />)
    await screen.findByText('管理员')

    await user.click(screen.getAllByRole('switch')[0])

    await waitFor(() => {
      expect(mockedUpdateRole).toHaveBeenCalledWith(
        { id: 1, name: '管理员', status: 1 },
        expect.any(AbortSignal)
      )
    })
    // 乐观更新：列表状态立即变为关闭
    await waitFor(() => {
      expect(screen.getAllByRole('switch')[0]).not.toBeChecked()
    })
    expect(toastSuccess).toHaveBeenCalledWith('状态更新成功')
  })

  it('切换状态失败：回滚状态并提示错误', async () => {
    mockedUpdateRole.mockRejectedValue(new Error('网络异常'))
    const user = userEvent.setup()
    render(<Roles />)
    await screen.findByText('管理员')

    await user.click(screen.getAllByRole('switch')[0])

    await waitFor(() => {
      expect(screen.getAllByRole('switch')[0]).toBeChecked()
    })
    expect(toastError).toHaveBeenCalledWith('网络异常')
  })

  it('切换中仅被操作的行显示 loading', async () => {
    let resolveUpdate!: (value: never) => void
    mockedUpdateRole.mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve as (value: never) => void
      }) as never
    )
    const user = userEvent.setup()
    render(<Roles />)
    await screen.findByText('管理员')

    await user.click(screen.getAllByRole('switch')[0])

    // 请求挂起期间：第 1 行（被操作）禁用并显示加载，第 2 行不受影响
    await waitFor(() => {
      expect(screen.getAllByRole('switch')[0]).toHaveAttribute(
        'aria-disabled',
        'true'
      )
    })
    expect(screen.getAllByRole('switch')[1]).not.toHaveAttribute(
      'aria-disabled'
    )
    expect(screen.getAllByRole('switch')[1]).not.toBeDisabled()

    // 请求完成后 loading 清除
    resolveUpdate({} as never)
    await waitFor(() => {
      expect(screen.getAllByRole('switch')[0]).not.toHaveAttribute(
        'aria-disabled'
      )
    })
  })

  it('翻页后以新页码请求', async () => {
    const user = userEvent.setup()
    render(<Roles />)
    await screen.findByText('管理员')
    await user.click(screen.getByLabelText('Go to next page'))
    expect(mockedGetRoles).toHaveBeenLastCalledWith(
      { page: 2, pageSize: 10 },
      expect.any(AbortSignal)
    )
  })

  it('新增角色：填写表单提交 createRole 并刷新列表', async () => {
    mockedCreateRole.mockResolvedValue({
      res: {} as never,
      data: roleList[0],
    } as never)
    const user = userEvent.setup()
    render(<Roles />)
    await screen.findByText('管理员')

    await user.click(screen.getByRole('button', { name: /新增角色/ }))
    await user.type(
      screen.getByRole('textbox', { name: '角色名称' }),
      '测试角色'
    )
    await user.type(
      screen.getByRole('textbox', { name: '角色编码' }),
      'test_role'
    )
    await user.click(screen.getByRole('button', { name: '确认' }))

    await waitFor(() => {
      expect(mockedCreateRole).toHaveBeenCalledWith(
        { name: '测试角色', roleKey: 'test_role', status: 0, remark: '' },
        expect.any(AbortSignal)
      )
    })
    // 创建成功后回到第 1 页并重新请求列表
    await waitFor(() => {
      expect(mockedGetRoles).toHaveBeenLastCalledWith(
        { page: 1, pageSize: 10 },
        expect.any(AbortSignal)
      )
    })
  })

  it('编辑角色：预填行数据提交 updateRole 并刷新列表', async () => {
    mockedUpdateRole.mockResolvedValue({
      res: {} as never,
      data: roleList[0],
    } as never)
    const user = userEvent.setup()
    render(<Roles />)
    await screen.findByText('管理员')

    await user.click(screen.getAllByRole('button', { name: '编辑' })[0])
    const nameInput = screen.getByRole('textbox', { name: '角色名称' })
    expect(nameInput).toHaveValue('管理员')
    // roleKey 创建后不可修改
    expect(screen.getByRole('textbox', { name: '角色编码' })).toBeDisabled()
    await user.clear(nameInput)
    await user.type(nameInput, '超级管理员')
    await user.click(screen.getByRole('button', { name: '确认' }))

    await waitFor(() => {
      expect(mockedUpdateRole).toHaveBeenCalledWith(
        { id: 1, name: '超级管理员', status: 0, remark: '系统内置角色' },
        expect.any(AbortSignal)
      )
    })
    await waitFor(() => {
      expect(mockedGetRoles).toHaveBeenLastCalledWith(
        { page: 1, pageSize: 10 },
        expect.any(AbortSignal)
      )
    })
  })

  it('删除角色：确认后调用 deleteRole 并刷新列表', async () => {
    mockedDeleteRole.mockResolvedValue({
      res: {} as never,
      data: null,
    } as never)
    const user = userEvent.setup()
    render(<Roles />)
    await screen.findByText('管理员')

    await user.click(screen.getAllByRole('button', { name: '删除' })[0])
    expect(screen.getByText(/确认删除角色「管理员」/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '确认删除' }))

    await waitFor(() => {
      expect(mockedDeleteRole).toHaveBeenCalledWith(1, expect.any(AbortSignal))
    })
    await waitFor(() => {
      expect(mockedGetRoles).toHaveBeenLastCalledWith(
        { page: 1, pageSize: 10 },
        expect.any(AbortSignal)
      )
    })
  })
})
