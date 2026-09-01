import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Bookmarks from '@/pages/system/bookmarks'
import {
  createBookmark,
  deleteBookmark,
  getBookmarkTree,
  updateBookmark,
  type BookmarkNode,
} from '@/service/bookmarks'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// jsdom 缺少 matchMedia，SidebarProvider 的 useIsMobile 依赖它
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = () => ({ matches: false }) as MediaQueryList
}

const toastSuccess = vi.hoisted(() => vi.fn())
const toastError = vi.hoisted(() => vi.fn())

vi.mock('@/ui/Toast', () => ({
  toast: { success: toastSuccess, error: toastError },
}))

vi.mock('@/service/bookmarks', () => ({
  getBookmarkTree: vi.fn(),
  createBookmark: vi.fn(),
  updateBookmark: vi.fn(),
  deleteBookmark: vi.fn(),
}))

const mockedGetBookmarkTree = vi.mocked(getBookmarkTree)
const mockedCreateBookmark = vi.mocked(createBookmark)
const mockedUpdateBookmark = vi.mocked(updateBookmark)
const mockedDeleteBookmark = vi.mocked(deleteBookmark)

const tree: BookmarkNode[] = [
  {
    id: 1,
    parentId: 0,
    type: 1,
    title: '常用网站',
    url: '',
    favicon: '',
    sort: 0,
    children: [
      {
        id: 2,
        parentId: 1,
        type: 2,
        title: 'GitHub',
        url: 'https://github.com',
        favicon: '',
        sort: 0,
        children: [],
      },
    ],
  },
  {
    id: 3,
    parentId: 0,
    type: 2,
    title: '掘金',
    url: 'https://juejin.cn',
    favicon: '',
    sort: 0,
    children: [],
  },
]

beforeEach(() => {
  mockedGetBookmarkTree.mockReset()
  mockedCreateBookmark.mockReset()
  mockedUpdateBookmark.mockReset()
  mockedDeleteBookmark.mockReset()
  toastSuccess.mockReset()
  toastError.mockReset()
  mockedGetBookmarkTree.mockResolvedValue({
    res: {} as never,
    data: tree,
  } as never)
})

describe('Bookmarks page', () => {
  it('挂载即请求收藏树并渲染节点（默认全部展开）', async () => {
    render(<Bookmarks />)
    expect(await screen.findByText('常用网站')).toBeInTheDocument()
    // 等 useEffect 完成默认展开后再断言子节点
    expect(await screen.findByText('GitHub')).toBeInTheDocument()
    expect(screen.getByText('掘金')).toBeInTheDocument()
    // 收藏行渲染为外链
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com'
    )
    expect(mockedGetBookmarkTree).toHaveBeenCalledWith(expect.any(AbortSignal))
  })

  it('点击文件夹收起子节点', async () => {
    const user = userEvent.setup()
    render(<Bookmarks />)
    await screen.findByText('常用网站')

    await user.click(screen.getByText('常用网站'))

    await waitFor(() => {
      expect(screen.queryByText('GitHub')).not.toBeInTheDocument()
    })
  })

  it('新增文件夹：填写名称提交 createBookmark 并刷新列表', async () => {
    mockedCreateBookmark.mockResolvedValue({
      res: {} as never,
      data: tree[0],
    } as never)
    const user = userEvent.setup()
    render(<Bookmarks />)
    await screen.findByText('常用网站')

    await user.click(screen.getByRole('button', { name: '新增' }))
    await user.type(screen.getByRole('textbox', { name: '名称' }), '开发工具')
    await user.click(screen.getByRole('button', { name: '确认' }))

    await waitFor(() => {
      expect(mockedCreateBookmark).toHaveBeenCalledWith(
        { type: 1, title: '开发工具' },
        expect.any(AbortSignal)
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('创建成功')
    // 创建成功后重新请求收藏树
    await waitFor(() => {
      expect(mockedGetBookmarkTree).toHaveBeenCalledTimes(2)
    })
  })

  it('新增收藏：切换类型为收藏，必填网址提交', async () => {
    mockedCreateBookmark.mockResolvedValue({
      res: {} as never,
      data: tree[1],
    } as never)
    const user = userEvent.setup()
    render(<Bookmarks />)
    await screen.findByText('常用网站')

    await user.click(screen.getByRole('button', { name: '新增' }))
    // 第 1 个 Select 为类型（默认「文件夹」），切换为「收藏」
    await user.click(screen.getAllByRole('combobox')[0])
    await user.click(await screen.findByRole('option', { name: '收藏' }))
    await user.type(screen.getByRole('textbox', { name: '名称' }), 'MDN')
    await user.type(
      screen.getByRole('textbox', { name: '网址' }),
      'https://developer.mozilla.org'
    )
    await user.click(screen.getByRole('button', { name: '确认' }))

    await waitFor(() => {
      expect(mockedCreateBookmark).toHaveBeenCalledWith(
        {
          type: 2,
          title: 'MDN',
          url: 'https://developer.mozilla.org',
        },
        expect.any(AbortSignal)
      )
    })
  })

  it('新增收藏未填网址：校验拦截且不提交', async () => {
    const user = userEvent.setup()
    render(<Bookmarks />)
    await screen.findByText('常用网站')

    await user.click(screen.getByRole('button', { name: '新增' }))
    await user.click(screen.getAllByRole('combobox')[0])
    await user.click(await screen.findByRole('option', { name: '收藏' }))
    await user.type(screen.getByRole('textbox', { name: '名称' }), 'MDN')
    await user.click(screen.getByRole('button', { name: '确认' }))

    expect(await screen.findByText('收藏必须填写网址')).toBeInTheDocument()
    expect(mockedCreateBookmark).not.toHaveBeenCalled()
  })

  it('编辑收藏：回填行数据提交 updateBookmark 并刷新列表', async () => {
    mockedUpdateBookmark.mockResolvedValue({
      res: {} as never,
      data: { ...tree[0].children[0], title: 'GitHub 主站' },
    } as never)
    const user = userEvent.setup()
    render(<Bookmarks />)
    await screen.findByText('常用网站')
    // 等 useEffect 完成默认展开，确保子节点按钮已渲染
    await screen.findByText('GitHub')

    // 树中第 2 个编辑按钮为收藏「GitHub」（第 1 个为文件夹「常用网站」）
    await user.click(screen.getAllByLabelText('编辑')[1])
    // 回填原值
    const titleInput = screen.getByRole('textbox', { name: '名称' })
    expect(titleInput).toHaveValue('GitHub')
    await user.clear(titleInput)
    await user.type(titleInput, 'GitHub 主站')
    await user.click(screen.getByRole('button', { name: '确认' }))

    await waitFor(() => {
      expect(mockedUpdateBookmark).toHaveBeenCalledWith(
        {
          id: 2,
          title: 'GitHub 主站',
          url: 'https://github.com',
          parentId: 1,
        },
        expect.any(AbortSignal)
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('保存成功')
    // 编辑成功后重新请求收藏树
    await waitFor(() => {
      expect(mockedGetBookmarkTree).toHaveBeenCalledTimes(2)
    })
  })

  it('删除文件夹：确认弹窗提示连带子项，确认后调用 deleteBookmark', async () => {
    mockedDeleteBookmark.mockResolvedValue({
      res: {} as never,
      data: null,
    } as never)
    const user = userEvent.setup()
    render(<Bookmarks />)
    await screen.findByText('常用网站')

    await user.click(screen.getAllByLabelText('删除')[0])
    expect(screen.getByText(/其下 1 个子项将一并删除/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '确认删除' }))

    await waitFor(() => {
      expect(mockedDeleteBookmark).toHaveBeenCalledWith(
        1,
        expect.any(AbortSignal)
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('删除成功')
  })

  it('删除失败：提示错误且不刷新列表', async () => {
    mockedDeleteBookmark.mockRejectedValue(new Error('网络异常'))
    const user = userEvent.setup()
    render(<Bookmarks />)
    await screen.findByText('常用网站')
    await screen.findByText('掘金')

    await user.click(screen.getAllByLabelText('删除')[2])
    await user.click(screen.getByRole('button', { name: '确认删除' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('网络异常')
    })
    expect(mockedGetBookmarkTree).toHaveBeenCalledTimes(1)
  })
})
