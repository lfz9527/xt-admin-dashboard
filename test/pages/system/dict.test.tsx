import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dict from '@/pages/system/dict'
import {
  createDictItem,
  createDictType,
  deleteDictItem,
  deleteDictType,
  getDictOptions,
  listAllDictItems,
  listAllDictTypes,
  updateDictItemStatus,
  updateDictTypeStatus,
  type DictItem,
  type DictTypeItem,
} from '@/service/dict'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const toastSuccess = vi.hoisted(() => vi.fn())
const toastError = vi.hoisted(() => vi.fn())

vi.mock('@/ui/Toast', () => ({
  toast: { success: toastSuccess, error: toastError },
}))

vi.mock('@/service/dict', () => ({
  listAllDictTypes: vi.fn(),
  listAllDictItems: vi.fn(),
  createDictType: vi.fn(),
  updateDictType: vi.fn(),
  updateDictTypeStatus: vi.fn(),
  deleteDictType: vi.fn(),
  createDictItem: vi.fn(),
  updateDictItem: vi.fn(),
  updateDictItemStatus: vi.fn(),
  deleteDictItem: vi.fn(),
  getDictOptions: vi.fn(),
  getEnabledDicts: vi.fn(),
}))

const mockedListTypes = vi.mocked(listAllDictTypes)
const mockedListItems = vi.mocked(listAllDictItems)
const mockedGetDictOptions = vi.mocked(getDictOptions)
const mockedCreateType = vi.mocked(createDictType)
const mockedDeleteType = vi.mocked(deleteDictType)
const mockedUpdateTypeStatus = vi.mocked(updateDictTypeStatus)
const mockedCreateItem = vi.mocked(createDictItem)
const mockedDeleteItem = vi.mocked(deleteDictItem)
const mockedUpdateItemStatus = vi.mocked(updateDictItemStatus)

const typeList: DictTypeItem[] = [
  {
    id: '1',
    name: '用户性别',
    dictKey: 'sys_user_sex',
    status: 0,
    sort: 0,
    remark: '',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: '通用状态',
    dictKey: 'sys_status',
    status: 1,
    sort: 1,
    remark: '',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
]

const type1Items: DictItem[] = [
  {
    id: '1',
    dictTypeId: 1,
    parentId: 0,
    type: { id: 1, name: '用户性别', dictKey: 'sys_user_sex' },
    label: '男',
    value: '0',
    status: 0,
    sort: 0,
    remark: '',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: '2',
    dictTypeId: 1,
    parentId: 0,
    type: { id: 1, name: '用户性别', dictKey: 'sys_user_sex' },
    label: '女',
    value: '1',
    status: 0,
    sort: 1,
    remark: '',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: '3',
    dictTypeId: 1,
    parentId: 1,
    type: { id: 1, name: '用户性别', dictKey: 'sys_user_sex' },
    label: '子项',
    value: 'child',
    status: 0,
    sort: 0,
    remark: '',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
]

beforeEach(() => {
  mockedListTypes.mockReset()
  mockedListItems.mockReset()
  mockedCreateType.mockReset()
  mockedDeleteType.mockReset()
  mockedUpdateTypeStatus.mockReset()
  mockedCreateItem.mockReset()
  mockedDeleteItem.mockReset()
  mockedUpdateItemStatus.mockReset()
  mockedGetDictOptions.mockReset()
  toastSuccess.mockReset()
  toastError.mockReset()

  mockedListTypes.mockResolvedValue({ data: typeList } as never)
  mockedListItems.mockImplementation(
    (id) =>
      Promise.resolve({
        data: id === 1 ? type1Items : [],
      }) as never
  )
  // 类型/项表单的状态下拉读取「通用状态」字典
  mockedGetDictOptions.mockResolvedValue({
    data: [
      { id: 1, label: '正常', value: '0', children: [] },
      { id: 2, label: '停用', value: '1', children: [] },
    ],
  } as never)
})

describe('Dict page', () => {
  it('挂载后加载类型并自动选中第一个，渲染其字典项树', async () => {
    render(<Dict />)

    expect(await screen.findByText('字典项 · 用户性别')).toBeInTheDocument()
    expect(screen.getByText('用户性别')).toBeInTheDocument()
    expect(screen.getByText('通用状态')).toBeInTheDocument()
    // 选中第一个类型后加载其字典项（根级 男/女 可见，子项默认收起）
    expect(await screen.findByText('男')).toBeInTheDocument()
    expect(await screen.findByText('女')).toBeInTheDocument()
    expect(mockedListItems).toHaveBeenCalledWith(1, expect.any(AbortSignal))
  })

  it('切换类型后加载所选类型的字典项', async () => {
    const user = userEvent.setup()
    render(<Dict />)
    await screen.findByText('字典项 · 用户性别')

    await user.click(screen.getByText('通用状态'))

    expect(await screen.findByText('字典项 · 通用状态')).toBeInTheDocument()
    expect(mockedListItems).toHaveBeenLastCalledWith(2, expect.any(AbortSignal))
    // 类型 2 无字典项，展示空态
    expect(screen.queryByText('男')).not.toBeInTheDocument()
    expect(await screen.findByText('暂无字典项')).toBeInTheDocument()
  })

  it('新增字典类型：提交 createDictType 并刷新类型列表', async () => {
    mockedCreateType.mockResolvedValue({ data: typeList[0] } as never)
    const user = userEvent.setup()
    render(<Dict />)
    await screen.findByText('字典项 · 用户性别')

    await user.click(screen.getByRole('button', { name: '新增' }))
    await user.type(
      screen.getByRole('textbox', { name: '字典名称' }),
      '测试字典'
    )
    await user.type(
      screen.getByRole('textbox', { name: '字典编码' }),
      'test_dict'
    )
    await user.click(screen.getByRole('button', { name: '确认' }))

    await waitFor(() => {
      expect(mockedCreateType).toHaveBeenCalledWith(
        {
          name: '测试字典',
          dictKey: 'test_dict',
          status: 0,
          sort: 0,
          remark: '',
        },
        expect.any(AbortSignal)
      )
    })
    // 创建成功后重新拉取类型列表
    await waitFor(() => {
      expect(mockedListTypes).toHaveBeenCalledTimes(2)
    })
    expect(toastSuccess).toHaveBeenCalledWith('创建成功')
  })

  it('新增字典项：提交 createDictItem 并刷新项树', async () => {
    mockedCreateItem.mockResolvedValue({ data: type1Items[0] } as never)
    const user = userEvent.setup()
    render(<Dict />)
    await screen.findByText('男')

    await user.click(screen.getByRole('button', { name: '新增字典项' }))
    await user.type(screen.getByRole('textbox', { name: '字典标签' }), '未知')
    await user.type(screen.getByRole('textbox', { name: '字典键值' }), '2')
    await user.click(screen.getByRole('button', { name: '确认' }))

    await waitFor(() => {
      expect(mockedCreateItem).toHaveBeenCalledWith(
        {
          dictTypeId: 1,
          label: '未知',
          value: '2',
          status: 0,
          sort: 0,
          remark: '',
        },
        expect.any(AbortSignal)
      )
    })
    // 创建成功后重新拉取当前类型的项树
    await waitFor(() => {
      expect(mockedListItems).toHaveBeenLastCalledWith(
        1,
        expect.any(AbortSignal)
      )
    })
  })

  it('删除字典项：确认后调用 deleteDictItem 并刷新项树', async () => {
    mockedDeleteItem.mockResolvedValue({ data: null } as never)
    const user = userEvent.setup()
    render(<Dict />)
    await screen.findByText('男')

    // 删除按钮顺序：左栏 2 个类型删除，右栏 2 个项删除（子项收起不渲染）
    await user.click(screen.getAllByLabelText('删除')[2])
    // 男 含有子项，提示级联删除数量
    expect(screen.getByText(/其下 1 个子项将一并删除/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '确认删除' }))

    await waitFor(() => {
      expect(mockedDeleteItem).toHaveBeenCalledWith(1, expect.any(AbortSignal))
    })
    await waitFor(() => {
      expect(mockedListItems).toHaveBeenLastCalledWith(
        1,
        expect.any(AbortSignal)
      )
    })
  })

  it('删除字典类型：确认后调用 deleteDictType 并刷新类型列表', async () => {
    mockedDeleteType.mockResolvedValue({ data: null } as never)
    const user = userEvent.setup()
    render(<Dict />)
    await screen.findByText('男')

    await user.click(screen.getAllByLabelText('删除')[0])
    expect(screen.getByText(/确认删除字典类型「用户性别」/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '确认删除' }))

    await waitFor(() => {
      expect(mockedDeleteType).toHaveBeenCalledWith(1, expect.any(AbortSignal))
    })
    await waitFor(() => {
      expect(mockedListTypes).toHaveBeenCalledTimes(2)
    })
  })

  it('切换字典项状态：调用 updateDictItemStatus 并乐观更新', async () => {
    mockedUpdateItemStatus.mockResolvedValue({
      data: { ...type1Items[0], status: 1 },
    } as never)
    const user = userEvent.setup()
    render(<Dict />)
    await screen.findByText('男')

    // 开关顺序：左栏 2 个类型开关在前，右栏项开关随后，index 2 为第一个项（男）
    const switches = screen.getAllByRole('switch')
    expect(switches[2]).toBeChecked()
    await user.click(switches[2])

    await waitFor(() => {
      expect(mockedUpdateItemStatus).toHaveBeenCalledWith(
        { id: 1, status: 1 },
        expect.any(AbortSignal)
      )
    })
    // 乐观更新为关闭
    await waitFor(() => {
      expect(screen.getAllByRole('switch')[2]).not.toBeChecked()
    })
    expect(toastSuccess).toHaveBeenCalledWith('状态更新成功')
  })

  it('切换字典类型状态：调用 updateDictTypeStatus 并乐观更新', async () => {
    mockedUpdateTypeStatus.mockResolvedValue({
      data: { ...typeList[0], status: 1 },
    } as never)
    const user = userEvent.setup()
    render(<Dict />)
    await screen.findByText('男')

    // 第一个开关为第一个字典类型的开关（用户性别，status=0 开启）
    const switches = screen.getAllByRole('switch')
    expect(switches[0]).toBeChecked()
    await user.click(switches[0])

    await waitFor(() => {
      expect(mockedUpdateTypeStatus).toHaveBeenCalledWith(
        { id: 1, status: 1 },
        expect.any(AbortSignal)
      )
    })
    await waitFor(() => {
      expect(screen.getAllByRole('switch')[0]).not.toBeChecked()
    })
  })
})
