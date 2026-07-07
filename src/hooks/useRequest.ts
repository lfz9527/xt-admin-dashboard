import { useCallback, useEffect, useRef, useState } from 'react'

import { type BusResponse } from '@/service/request'
import type { HttpError } from '@/service/http/types'

import { useLatest } from './useLatest'
import { useDebounceFn } from './useDebounceFn'

export type ServiceFn<TData, TParams extends unknown[]> = (
  ...args: [...TParams, AbortSignal?]
) => Promise<BusResponse<TData>>

type UseRequestResult<TData, TParams extends unknown[]> = {
  data: TData | undefined
  loading: boolean
  error: HttpError | undefined
  /** 手动触发，吞掉 rejection */
  run: (...args: TParams) => void
  debouncedRun: (...args: TParams) => void
  /** 手动触发，返回 Promise */
  runAsync: (...args: TParams) => Promise<TData>
  /** 用上次参数重新请求 */
  refresh: () => void
  /** 取消当前请求 */
  cancel: () => void
  /** 乐观更新本地 data */
  mutate: (data: TData | ((prev: TData | undefined) => TData)) => void
}

type UseRequestOptions<TData, TParams extends unknown[]> = {
  /** ，默认 true */
  immediate?: boolean
  /** 自动请求的初始参数 */
  defaultParams?: TParams
  /** 防抖延迟（ms） */
  debounceWait?: number
  /** 成功回调 */
  onSuccess?: (data: TData, params: TParams) => void
  /** 失败回调 */
  onError?: (error: HttpError, params: TParams) => void
  /** 请求完成回调（无论成功失败） */
  onFinally?: (params: TParams) => void
  /** 初始 data */
  initialData?: TData
  // 毕竟函数
  comparison?: (old: TParams, newData: TParams) => void
}

/**
 *
 * @param fn 接口请求函数
 * @param {number} [options.immediate=true] - 是否在挂载时自动发起请求
 * @returns
 */
export function useRequest<TData, TParams extends any[]>(
  service: ServiceFn<TData, TParams>,
  options: UseRequestOptions<TData, TParams> = {}
): UseRequestResult<TData, TParams> {
  const {
    immediate = true,
    defaultParams,
    debounceWait,
    onSuccess,
    onError,
    onFinally,
    initialData,
  } = options

  const [data, setData] = useState<TData | undefined>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<HttpError | undefined>()

  const lastParamsRef = useRef<TParams | undefined>(defaultParams)
  const abortRef = useRef<AbortController | null>(null)
  const unmountedRef = useRef(false)

  // 用 ref 保存最新 callbacks，避免 runAsync 的 deps 频繁变化
  const onSuccessRef = useLatest(onSuccess)
  const onErrorRef = useLatest(onError)
  const onFinallyRef = useLatest(onFinally)

  const runAsync = useCallback(
    async (...args: TParams): Promise<TData> => {
      abortRef.current?.abort()
      abortRef.current = new AbortController()

      lastParamsRef.current = args

      if (!unmountedRef.current) {
        setLoading(true)
        setError(undefined)
      }
      try {
        const result = await service(...args, abortRef.current.signal)

        if (!unmountedRef.current) {
          setData(result.data)
          onSuccessRef.current?.(result.data, args)
        }
        return result?.data
      } catch (err) {
        const httpErr = err as HttpError
        if (!unmountedRef.current && !httpErr.isAborted) {
          setError(httpErr)
          onErrorRef.current?.(httpErr, args)
        }
        throw httpErr
      } finally {
        if (!unmountedRef.current) {
          setLoading(false)
          onFinallyRef.current?.(args)
        }
      }
    },
    [service]
  )

  const run = useCallback(
    (...args: TParams) => {
      runAsync(...args).catch(() => {})
    },
    [runAsync]
  )
  const { run: debouncedRun } = useDebounceFn(
    run as (...args: unknown[]) => void,
    {
      delay: debounceWait,
    }
  )

  const finalRun = useCallback(
    (...args: TParams) => {
      if (debounceWait) {
        return (debouncedRun as (...a: TParams) => void)(...args)
      }
      return run(...args)
    },
    [run, debouncedRun, debounceWait]
  )

  // ── refresh ───────────────────────────────────────────────
  const refresh = useCallback(() => {
    run(...((lastParamsRef.current ?? []) as TParams))
  }, [run])

  // ── cancel ────────────────────────────────────────────────
  const cancel = useCallback(() => {
    abortRef.current?.abort()
    if (!unmountedRef.current) setLoading(false)
  }, [])

  useEffect(() => {
    unmountedRef.current = false
    return () => {
      unmountedRef.current = true
      cancel()
    }
  }, [cancel])

  // ── mutate ────────────────────────────────────────────────
  const mutate = useCallback(
    (updater: TData | ((prev: TData | undefined) => TData)) => {
      setData((prev) =>
        typeof updater === 'function'
          ? (updater as (p: TData | undefined) => TData)(prev)
          : updater
      )
    },
    []
  )

  useEffect(() => {
    // 只在挂载时执行一次
    if (immediate) {
      run(...((defaultParams ?? []) as TParams))
    }
  }, [])

  return {
    data,
    loading,
    error,
    runAsync,
    run: finalRun,
    cancel,
    mutate,
    refresh,
    debouncedRun,
  }
}
