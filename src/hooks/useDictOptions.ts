import { useCallback, useEffect } from 'react'

import useDictStore, { type DictOption } from '@/store/useDictStore'

const EMPTY_OPTIONS: DictOption[] = []

/**
 * 通过字典编码获取下拉选项（如 `sys_user_sex`），数据来自全局字典 store。
 * store 在登录成功后预取常用字典；此处挂载时兜底加载未就绪的字典，
 * 同一字典编码全局共享，字典更新由字典管理页触发 store 刷新。
 * 失败时容错返回空选项，不抛错。
 */
export function useDictOptions(dictKey: string | undefined) {
  const optionsMap = useDictStore((state) => state.optionsMap)
  const loading = useDictStore((state) =>
    dictKey ? !!state.loadingMap[dictKey] : false
  )
  const error = useDictStore((state) =>
    dictKey ? state.errorMap[dictKey] : undefined
  )
  const options = (dictKey ? optionsMap[dictKey] : undefined) ?? EMPTY_OPTIONS

  useEffect(() => {
    if (dictKey) useDictStore.getState().loadDict(dictKey)
  }, [dictKey])

  /** 根据存储值（数字或字符串）查找展示文本；找不到返回 undefined */
  const labelOf = useCallback(
    (value: string | number | null | undefined) =>
      options.find((option) => option.value === String(value))?.label,
    [options]
  )

  return { options, loading, error, labelOf }
}
