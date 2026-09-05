import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { SidebarProvider } from '@/ui/Sidebar'
import { ProgressProvider } from '@bprogress/react'
import routes from '@/router/routes'
import { buildRouter } from '@/router/utils'
import useAuthor from '@/store/useAuthor'

vi.hoisted(() => {
  if (typeof window !== 'undefined' && !window.matchMedia) {
    window.matchMedia = () => ({ matches: false }) as MediaQueryList
  }
})

const userInfo = vi.hoisted(() => ({
  id: '1',
  nickname: 'admin',
  email: 'admin@example.com',
  avatar: '',
  gender: 0,
  status: 0,
  lastLoginTime: '2026-08-25T08:00:00.000Z',
  lastLoginIp: '127.0.0.1',
  roleId: 1,
  role: { id: 1, name: '管理员', roleKey: 'admin' },
  createdAt: '2026-08-01T06:00:00.000Z',
  updatedAt: '2026-08-01T06:00:00.000Z',
}))

vi.mock('@/service/users', () => ({
  getUserInfo: vi.fn().mockResolvedValue({ data: userInfo }),
  getUsers: vi.fn().mockResolvedValue({ data: { list: [], total: 0 } }),
  getUser: vi.fn().mockResolvedValue({ data: userInfo }),
  createUser: vi.fn().mockResolvedValue({ data: { message: 'ok' } }),
  updateUser: vi.fn().mockResolvedValue({ data: { message: 'ok' } }),
  deleteUser: vi.fn().mockResolvedValue({ data: { message: 'ok' } }),
  updateProfile: vi.fn().mockResolvedValue({
    data: { ...userInfo, nickname: 'admin-new', gender: 0 },
  }),
  uploadAvatar: vi.fn().mockResolvedValue({
    data: { ...userInfo, avatar: 'http://localhost/uploads/avatar.png' },
  }),
}))

vi.mock('@/service/roles', () => ({
  getRoles: vi.fn().mockResolvedValue({ data: { list: [], total: 0 } }),
  getRole: vi.fn().mockResolvedValue({ data: null }),
  createRole: vi.fn().mockResolvedValue({ data: { message: 'ok' } }),
  updateRole: vi.fn().mockResolvedValue({ data: { message: 'ok' } }),
  deleteRole: vi.fn().mockResolvedValue({ data: { message: 'ok' } }),
}))

vi.mock('@/service/auth', () => ({
  logout: vi.fn().mockResolvedValue({ data: { message: 'ok' } }),
  sendResetCode: vi.fn().mockResolvedValue({
    data: { message: '验证码已发送' },
  }),
  resetPassword: vi.fn().mockResolvedValue({
    data: { message: 'ok' },
  }),
}))

// 个人中心性别/状态回显与编辑下拉从字典读取，需 mock 字典下拉接口
vi.mock('@/service/dict', () => ({
  getEnabledDicts: vi.fn().mockResolvedValue({ data: [] }),
  getDictOptions: vi.fn((dictKey: string) =>
    Promise.resolve({
      data:
        dictKey === 'sys_user_sex'
          ? [
              { id: 1, label: '男', value: '0', children: [] },
              { id: 2, label: '女', value: '1', children: [] },
              { id: 3, label: '未知', value: '2', children: [] },
            ]
          : [
              { id: 1, label: '正常', value: '0', children: [] },
              { id: 2, label: '停用', value: '1', children: [] },
            ],
    })
  ),
}))

// jsdom 未实现浏览器全屏 API：以可控 stub 模拟全屏状态与 fullscreenchange 时序
let fullscreenElement: Element | null = null
const requestFullscreen = vi.fn(() => {
  fullscreenElement = document.documentElement
  document.dispatchEvent(new Event('fullscreenchange'))
  return Promise.resolve()
})
const exitFullscreen = vi.fn(() => {
  fullscreenElement = null
  document.dispatchEvent(new Event('fullscreenchange'))
  return Promise.resolve()
})
const originalFullscreenElementDescriptor = Object.getOwnPropertyDescriptor(
  document,
  'fullscreenElement'
)

beforeEach(() => {
  localStorage.clear()
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      disconnect() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver
  }
  if (!Element.prototype.getAnimations) {
    Element.prototype.getAnimations = () => []
  }
  // jsdom 未实现 createObjectURL，UploadThingAvatar 本地预览会调用
  if (!URL.createObjectURL) {
    URL.createObjectURL = vi.fn(() => 'blob:mock-preview')
  }
  useAuthor.setState({ token: 'test-token', roleKey: 'admin', user: null })

  // 安装浏览器全屏 API stub
  fullscreenElement = null
  requestFullscreen.mockClear()
  exitFullscreen.mockClear()
  Object.defineProperty(document, 'fullscreenElement', {
    configurable: true,
    get: () => fullscreenElement,
  })
  ;(document.documentElement as unknown as Record<string, unknown>)[
    'requestFullscreen'
  ] = requestFullscreen
  ;(document as unknown as Record<string, unknown>)['exitFullscreen'] =
    exitFullscreen
})

afterEach(() => {
  // 移除全屏 API stub，恢复 jsdom 原始实现
  delete (document.documentElement as unknown as Record<string, unknown>)[
    'requestFullscreen'
  ]
  delete (document as unknown as Record<string, unknown>)['exitFullscreen']
  if (originalFullscreenElementDescriptor) {
    Object.defineProperty(
      document,
      'fullscreenElement',
      originalFullscreenElementDescriptor
    )
  } else {
    delete (document as unknown as Record<string, unknown>)['fullscreenElement']
  }
})

function renderApp(initialEntry: string) {
  const router = createMemoryRouter(buildRouter(routes), {
    initialEntries: [initialEntry],
  })
  render(
    <SidebarProvider>
      <ProgressProvider>
        <RouterProvider router={router} />
      </ProgressProvider>
    </SidebarProvider>
  )
  return router
}

/** 等待 Header 渲染完成且用户信息已写入 store */
async function waitForHeaderReady() {
  await waitFor(() => {
    expect(document.querySelector('button.rounded-full')).not.toBeNull()
    expect(screen.getByRole('button', { name: '全屏' })).toBeInTheDocument()
  })
  await waitFor(() => {
    expect(useAuthor.getState().user?.nickname).toBe('admin')
  })
}

describe('Header', () => {
  it('点击个人中心弹出当前用户信息弹窗', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await waitForHeaderReady()

    // 点击头像（AvatarImage 在 jsdom 不渲染，以 trigger 按钮定位）打开下拉菜单
    const avatarTrigger = document.querySelector('button.rounded-full')
    expect(avatarTrigger).not.toBeNull()
    await user.click(avatarTrigger as HTMLElement)

    // 点击个人中心菜单项
    const menuItem = await screen.findByText('个人中心')
    await user.click(menuItem)

    // 弹窗展示当前用户信息
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('个人中心')
    expect(dialog).toHaveTextContent('admin@example.com')
    expect(dialog).toHaveTextContent('管理员')
    expect(dialog).toHaveTextContent('男')
  })

  it('点击修改密码进入复用登录页密码重置的表单', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await waitForHeaderReady()

    // 打开个人中心弹窗
    const avatarTrigger = document.querySelector('button.rounded-full')
    expect(avatarTrigger).not.toBeNull()
    await user.click(avatarTrigger as HTMLElement)
    const menuItem = await screen.findByText('个人中心')
    await user.click(menuItem)

    // 点击修改密码
    await user.click(screen.getByRole('button', { name: '修改密码' }))

    // 复用登录页密码重置表单：标题、邮箱（预填当前邮箱）、新密码等字段
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('修改密码')
    expect(screen.getByLabelText(/邮箱/)).toHaveValue('admin@example.com')
    expect(screen.getByLabelText(/新密码/)).toBeInTheDocument()
    expect(screen.getByLabelText(/确认密码/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '获取验证码' })
    ).toBeInTheDocument()
  })

  it('点击编辑进入编辑资料视图，保存后昵称与性别可更新', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await waitForHeaderReady()

    // 打开个人中心弹窗
    const avatarTrigger = document.querySelector('button.rounded-full')
    expect(avatarTrigger).not.toBeNull()
    await user.click(avatarTrigger as HTMLElement)
    const menuItem = await screen.findByText('个人中心')
    await user.click(menuItem)

    // 点击编辑，进入编辑资料视图
    await user.click(screen.getByRole('button', { name: '编辑' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('编辑资料')
    // 昵称预填当前值；性别 Select 展示当前选项（测试中 mock 用户为男）
    const nicknameInput = screen.getByLabelText(/昵称/)
    expect(nicknameInput).toHaveValue('admin')
    expect(screen.getByText('男')).toBeInTheDocument()

    // 修改昵称并保存
    await user.clear(nicknameInput)
    await user.type(nicknameInput, 'admin-new')
    await user.click(screen.getByRole('button', { name: '保存' }))

    // 保存后回到信息视图并展示新昵称
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveTextContent('个人中心')
    })
    expect(screen.getByRole('dialog')).toHaveTextContent('admin-new')
  })

  it('个人中心头像支持上传，成功后更新 store 中头像', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await waitForHeaderReady()

    // 打开个人中心弹窗
    const avatarTrigger = document.querySelector('button.rounded-full')
    expect(avatarTrigger).not.toBeNull()
    await user.click(avatarTrigger as HTMLElement)
    const menuItem = await screen.findByText('个人中心')
    await user.click(menuItem)

    // 通过隐藏 file input 选择图片上传
    const fileInput = screen.getByLabelText('Upload avatar')
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    await user.upload(fileInput, file)

    // 上传成功后 store 中头像更新为接口返回的地址
    await waitFor(() => {
      expect(useAuthor.getState().user?.avatar).toBe(
        'http://localhost/uploads/avatar.png'
      )
    })
    expect(screen.getByRole('dialog')).toHaveTextContent('个人中心')
  })

  it('主题切换旁全屏按钮进入与退出浏览器全屏，状态与图标联动', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await waitForHeaderReady()

    // 初始为非全屏态，按钮可定位
    const fullscreenButton = screen.getByRole('button', { name: '全屏' })
    expect(fullscreenButton).toBeInTheDocument()
    // 全屏按钮位于主题切换按钮左侧（同一容器内第一个按钮）
    const actionGroup = fullscreenButton.parentElement!
    expect(actionGroup.children).toHaveLength(2)
    expect(actionGroup.children[0]).toBe(fullscreenButton)

    // 点击进入浏览器全屏
    await user.click(screen.getByRole('button', { name: '全屏' }))
    expect(requestFullscreen).toHaveBeenCalledTimes(1)
    expect(
      await screen.findByRole('button', { name: '退出全屏' })
    ).toBeInTheDocument()

    // 再点击退出全屏
    await user.click(screen.getByRole('button', { name: '退出全屏' }))
    expect(exitFullscreen).toHaveBeenCalledTimes(1)
    expect(
      await screen.findByRole('button', { name: '全屏' })
    ).toBeInTheDocument()
  })

  it('浏览器级退出全屏（ESC）后按钮状态自动同步为全屏', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await waitForHeaderReady()

    await user.click(screen.getByRole('button', { name: '全屏' }))
    expect(
      await screen.findByRole('button', { name: '退出全屏' })
    ).toBeInTheDocument()

    // 模拟浏览器级退出：全屏元素清空并触发 fullscreenchange，不经过按钮
    fullscreenElement = null
    fireEvent(document, new Event('fullscreenchange'))

    expect(
      await screen.findByRole('button', { name: '全屏' })
    ).toBeInTheDocument()
  })
})
