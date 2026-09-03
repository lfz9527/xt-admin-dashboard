import { create } from 'zustand'

import {
  getDictOptions,
  getEnabledDicts,
  type DictOptionNode,
} from '@/service/dict'

/** 下拉选项（value 为后端字典项的字符串 value） */
export type DictOption = { value: string; label: string }

type DictStoreState = {
  /** 已加载的字典选项，key 为字典编码（如 sys_user_sex） */
  optionsMap: Record<string, DictOption[]>
  /** 加载中的字典编码集合 */
  loadingMap: Record<string, boolean>
  /** 拉取失败的错误信息，key 为字典编码；失败时保留旧选项供回显兜底 */
  errorMap: Record<string, string | undefined>
  /** 拉取字典选项（已加载则跳过；force 为 true 时强制重新请求） */
  loadDict: (dictKey: string, force?: boolean) => Promise<void>
  /** 登录成功后预取全部启用字典（经 GET /dicts 获取启用列表） */
  prefetchDicts: () => Promise<void>
  /** 字典更新后刷新：重新拉取已加载的字典（不传刷新全部已加载） */
  refresh: (dictKey?: string) => Promise<void>
  /** 失效缓存：带 dictKey 只清除该字典，否则清空全部 */
  invalidate: (dictKey?: string) => void
}

/** 将树形字典节点展开为扁平选项（性别/状态等无子级，直接遍历返回全部项） */
function flatten(nodes: DictOptionNode[]): DictOption[] {
  const options: DictOption[] = []
  const walk = (items: DictOptionNode[]) => {
    for (const item of items) {
      options.push({ value: item.value, label: item.label })
      walk(item.children ?? [])
    }
  }
  walk(nodes)
  return options
}

// 同一字典的并发请求去重（非响应式状态，不放入 store）
const pending = new Map<string, Promise<void>>()

// 说明：store 为非 hook 环境，无法搭配 useRequest 使用，故直接调用接口函数；
// 并发去重与失败兜底（保留旧选项）在 store 内实现。
const useDictStore = create<DictStoreState>()((set, get) => ({
  optionsMap: {},
  loadingMap: {},
  errorMap: {},

  loadDict: (dictKey, force = false) => {
    const inFlight = pending.get(dictKey)
    if (inFlight) return inFlight
    if (!force && get().optionsMap[dictKey]) return Promise.resolve()

    const promise = (async () => {
      set((state) => ({
        loadingMap: { ...state.loadingMap, [dictKey]: true },
      }))
      try {
        const res = await getDictOptions(dictKey)
        set((state) => ({
          optionsMap: { ...state.optionsMap, [dictKey]: flatten(res.data) },
          errorMap: { ...state.errorMap, [dictKey]: undefined },
        }))
      } catch (err) {
        // 失败保留旧选项：类型被停用/删除时，历史数据的 label 仍可回显兜底
        set((state) => ({
          errorMap: {
            ...state.errorMap,
            [dictKey]: (err as Error).message,
          },
        }))
      } finally {
        set((state) => ({
          loadingMap: { ...state.loadingMap, [dictKey]: false },
        }))
        pending.delete(dictKey)
      }
    })()
    pending.set(dictKey, promise)
    return promise
  },

  prefetchDicts: async () => {
    try {
      // 启用字典列表来自 GET /dicts，不在前端写死编码清单
      const res = await getEnabledDicts()
      await Promise.allSettled(
        res.data.map(({ dictKey }) => get().loadDict(dictKey))
      )
    } catch {
      // 列表获取失败时跳过预取：各消费方挂载时会经 loadDict 兜底按需加载
    }
  },

  refresh: (dictKey) => {
    const { loadDict, optionsMap } = get()
    const keys = dictKey ? [dictKey] : Object.keys(optionsMap)
    return Promise.allSettled(keys.map((key) => loadDict(key, true))).then(
      () => undefined
    )
  },

  invalidate: (dictKey) => {
    set((state) => {
      if (dictKey === undefined) {
        return { optionsMap: {}, loadingMap: {}, errorMap: {} }
      }
      const optionsMap = { ...state.optionsMap }
      const loadingMap = { ...state.loadingMap }
      const errorMap = { ...state.errorMap }
      delete optionsMap[dictKey]
      delete loadingMap[dictKey]
      delete errorMap[dictKey]
      return { optionsMap, loadingMap, errorMap }
    })
  },
}))

export default useDictStore
