import { useCallback, useState } from 'react'

import { toast } from '@/ui/Toast'

import { useLatest } from './useLatest'
import { useRequest, type ServiceFn } from './useRequest'

type StatusItem = {
  id: string | number
  status: number
}

type MutateItems<TItem> = (
  updater: (items: readonly TItem[]) => TItem[]
) => void

export function useOptimisticStatus<TItem extends StatusItem, TParams, TResult>(
  service: ServiceFn<TResult, [TParams]>,
  {
    mutateItems,
    getParams,
    onSuccess,
  }: {
    mutateItems: MutateItems<TItem>
    getParams: (item: TItem, nextStatus: number) => TParams
    onSuccess?: (item: TItem, nextStatus: number) => void
  }
) {
  const { runAsync, loading } = useRequest(service, { immediate: false })
  const getParamsRef = useLatest(getParams)
  const onSuccessRef = useLatest(onSuccess)
  const [switchingKey, setSwitchingKey] = useState<string | null>(null)

  const handleStatusChange = useCallback(
    async (item: TItem, checked: boolean) => {
      const nextStatus = checked ? 0 : 1
      const previousStatus = item.status
      const itemKey = String(item.id)
      const applyStatus = (status: number) => {
        mutateItems((items) =>
          items.map((current) =>
            String(current.id) === itemKey ? { ...current, status } : current
          )
        )
      }

      applyStatus(nextStatus)
      setSwitchingKey(itemKey)
      try {
        await runAsync(getParamsRef.current(item, nextStatus))
        toast.success('状态更新成功')
        onSuccessRef.current?.(item, nextStatus)
      } catch (err) {
        applyStatus(previousStatus)
        toast.error((err as Error).message)
      } finally {
        setSwitchingKey(null)
      }
    },
    [getParamsRef, mutateItems, onSuccessRef, runAsync]
  )

  const isSwitching = useCallback(
    (item: Pick<TItem, 'id'>) => loading && switchingKey === String(item.id),
    [loading, switchingKey]
  )

  return {
    loading,
    switchingKey,
    isSwitching,
    handleStatusChange,
  }
}
