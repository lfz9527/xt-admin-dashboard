import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDictOptions, getEnabledDicts } from '@/service/dict'
import useDictStore from '@/store/useDictStore'

vi.mock('@/service/dict', () => ({
  getDictOptions: vi.fn(),
  getEnabledDicts: vi.fn(),
}))

const mockedGetDictOptions = vi.mocked(getDictOptions)
const mockedGetEnabledDicts = vi.mocked(getEnabledDicts)

function mockOptions(dictKey: string, labels: string[]) {
  mockedGetDictOptions.mockImplementation(
    (key) =>
      Promise.resolve({
        data:
          key === dictKey
            ? labels.map((label, index) => ({
                id: index + 1,
                label,
                value: String(index),
                children: [],
              }))
            : [],
      }) as never
  )
}

beforeEach(() => {
  mockedGetDictOptions.mockReset()
  mockedGetEnabledDicts.mockReset()
  // store 是跨测试共享的单例，每例前清空缓存
  useDictStore.getState().invalidate()
})

describe('useDictStore', () => {
  it('loadDict 拉取并扁平化字典选项', async () => {
    mockOptions('sys_user_sex', ['男', '女'])

    await useDictStore.getState().loadDict('sys_user_sex')

    const state = useDictStore.getState()
    expect(state.optionsMap['sys_user_sex']).toEqual([
      { value: '0', label: '男' },
      { value: '1', label: '女' },
    ])
    expect(state.loadingMap['sys_user_sex']).toBe(false)
    expect(state.errorMap['sys_user_sex']).toBeUndefined()
  })

  it('已加载的字典默认跳过，force 时重新请求', async () => {
    mockOptions('sys_user_sex', ['男'])
    await useDictStore.getState().loadDict('sys_user_sex')
    expect(mockedGetDictOptions).toHaveBeenCalledTimes(1)

    // 已加载：不再请求
    await useDictStore.getState().loadDict('sys_user_sex')
    expect(mockedGetDictOptions).toHaveBeenCalledTimes(1)

    // force 刷新：重新请求并更新数据
    mockedGetDictOptions.mockImplementation(
      () =>
        Promise.resolve({
          data: [
            { id: 1, label: '男性', value: '0', children: [] },
            { id: 2, label: '女性', value: '1', children: [] },
          ],
        }) as never
    )
    await useDictStore.getState().loadDict('sys_user_sex', true)
    expect(mockedGetDictOptions).toHaveBeenCalledTimes(2)
    expect(useDictStore.getState().optionsMap['sys_user_sex']).toEqual([
      { value: '0', label: '男性' },
      { value: '1', label: '女性' },
    ])
  })

  it('同一字典的并发请求只发一次', async () => {
    mockedGetDictOptions.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: [{ id: 1, label: '正常', value: '0', children: [] }],
              } as never),
            10
          )
        )
    )

    await Promise.all([
      useDictStore.getState().loadDict('sys_normal_disable'),
      useDictStore.getState().loadDict('sys_normal_disable'),
    ])

    expect(mockedGetDictOptions).toHaveBeenCalledTimes(1)
  })

  it('refresh 不传参刷新全部已加载字典，传参只刷新指定字典', async () => {
    mockOptions('sys_user_sex', ['男'])
    await useDictStore.getState().loadDict('sys_user_sex')

    // 未加载的字典不会被 refresh 触发
    await useDictStore.getState().refresh()
    expect(mockedGetDictOptions).toHaveBeenCalledTimes(2)
    expect(mockedGetDictOptions).toHaveBeenLastCalledWith('sys_user_sex')

    mockedGetDictOptions.mockClear()
    await useDictStore.getState().loadDict('sys_normal_disable')
    await useDictStore.getState().refresh('sys_normal_disable')
    expect(mockedGetDictOptions).toHaveBeenCalledTimes(2)
    expect(mockedGetDictOptions).toHaveBeenLastCalledWith('sys_normal_disable')
  })

  it('prefetchDicts 经启用字典接口预取全部选项', async () => {
    mockedGetEnabledDicts.mockResolvedValue({
      data: [
        { id: 1, name: '用户性别', dictKey: 'sys_user_sex' },
        { id: 2, name: '通用状态', dictKey: 'sys_normal_disable' },
      ],
    } as never)
    mockedGetDictOptions.mockResolvedValue({ data: [] } as never)

    await useDictStore.getState().prefetchDicts()

    expect(mockedGetEnabledDicts).toHaveBeenCalledTimes(1)
    expect(mockedGetDictOptions).toHaveBeenCalledTimes(2)
    expect(mockedGetDictOptions).toHaveBeenCalledWith('sys_user_sex')
    expect(mockedGetDictOptions).toHaveBeenCalledWith('sys_normal_disable')
  })

  it('启用字典列表获取失败时跳过预取，交由挂载时兜底加载', async () => {
    mockedGetEnabledDicts.mockRejectedValue(new Error('网络异常'))

    await useDictStore.getState().prefetchDicts()

    expect(mockedGetDictOptions).not.toHaveBeenCalled()
  })

  it('拉取失败记录错误并保留旧选项供回显兜底', async () => {
    mockOptions('sys_user_sex', ['男'])
    await useDictStore.getState().loadDict('sys_user_sex')

    mockedGetDictOptions.mockRejectedValue(
      new Error('字典类型 sys_user_sex 已停用')
    )
    await useDictStore.getState().loadDict('sys_user_sex', true)

    const state = useDictStore.getState()
    expect(state.errorMap['sys_user_sex']).toBe('字典类型 sys_user_sex 已停用')
    // 旧选项保留，历史数据仍可回显
    expect(state.optionsMap['sys_user_sex']).toEqual([
      { value: '0', label: '男' },
    ])
  })

  it('invalidate 清空指定字典或全部缓存', async () => {
    mockOptions('sys_user_sex', ['男'])
    await useDictStore.getState().loadDict('sys_user_sex')

    useDictStore.getState().invalidate('sys_user_sex')
    expect(useDictStore.getState().optionsMap['sys_user_sex']).toBeUndefined()

    await useDictStore.getState().loadDict('sys_user_sex')
    useDictStore.getState().invalidate()
    expect(useDictStore.getState().optionsMap).toEqual({})
  })
})
