import { useCallback, useEffect } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'

import { toast } from '@/ui/Toast'

import { useLatest } from './useLatest'
import { useRequest, type ServiceFn } from './useRequest'

type UseFormDialogOptions<
  TValues extends FieldValues,
  TEntity,
  TCreateParams,
  TUpdateParams,
> = {
  form: UseFormReturn<TValues>
  open: boolean
  entity: TEntity | null
  defaultValues: TValues
  getEditValues: (entity: TEntity) => TValues
  create: ServiceFn<unknown, [TCreateParams]>
  update: ServiceFn<unknown, [TUpdateParams]>
  getCreateParams: (values: TValues) => TCreateParams
  getUpdateParams: (entity: TEntity, values: TValues) => TUpdateParams
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  successText?: {
    create?: string
    update?: string
  }
}

function useFormDialog<
  TValues extends FieldValues,
  TEntity,
  TCreateParams,
  TUpdateParams,
>({
  form,
  open,
  entity,
  defaultValues,
  getEditValues,
  create,
  update,
  getCreateParams,
  getUpdateParams,
  onOpenChange,
  onSuccess,
  successText,
}: UseFormDialogOptions<TValues, TEntity, TCreateParams, TUpdateParams>) {
  const getEditValuesRef = useLatest(getEditValues)
  const getCreateParamsRef = useLatest(getCreateParams)
  const getUpdateParamsRef = useLatest(getUpdateParams)
  const onOpenChangeRef = useLatest(onOpenChange)
  const onSuccessRef = useLatest(onSuccess)
  const successTextRef = useLatest(successText)

  const { runAsync: createAsync, loading: createLoading } = useRequest(create, {
    immediate: false,
  })
  const { runAsync: updateAsync, loading: updateLoading } = useRequest(update, {
    immediate: false,
  })

  const isEdit = entity !== null
  const loading = createLoading || updateLoading

  useEffect(() => {
    if (open) {
      form.reset(
        entity === null ? defaultValues : getEditValuesRef.current(entity)
      )
    }
  }, [defaultValues, entity, form, open])

  const submit = useCallback(
    async (values: TValues) => {
      try {
        if (entity === null) {
          await createAsync(getCreateParamsRef.current(values))
          toast.success(successTextRef.current?.create ?? '创建成功')
        } else {
          await updateAsync(getUpdateParamsRef.current(entity, values))
          toast.success(successTextRef.current?.update ?? '保存成功')
        }
        onOpenChangeRef.current(false)
        onSuccessRef.current()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '提交失败')
      }
    },
    [createAsync, entity, updateAsync]
  )

  return { form, isEdit, loading, submit }
}

export { useFormDialog }
export type { UseFormDialogOptions }
