import { useCallback, useEffect, useMemo, useState } from 'react'

import { useRequest, type ServiceFn } from './useRequest'

export type PagedListParams = {
  page: number
  pageSize: number
}

export type PagedListResult<TItem> = {
  list: TItem[]
  total: number
}

export function usePagedList<TItem, TParams extends PagedListParams>(
  service: ServiceFn<PagedListResult<TItem>, [TParams]>,
  {
    initialPage = 1,
    initialPageSize = 10,
    getParams,
  }: {
    initialPage?: number
    initialPageSize?: number
    getParams?: (pagination: PagedListParams) => TParams
  } = {}
) {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const request = useRequest(service, { immediate: false })

  const buildParams = useCallback(
    (nextPage: number, nextPageSize: number) =>
      getParams
        ? getParams({ page: nextPage, pageSize: nextPageSize })
        : ({ page: nextPage, pageSize: nextPageSize } as TParams),
    [getParams]
  )
  const params = useMemo(
    () => buildParams(page, pageSize),
    [buildParams, page, pageSize]
  )

  useEffect(() => {
    request.run(params)
  }, [params, request.run])

  // 删除后当前页变空且不是第 1 页时回退，避免停留在空页。
  useEffect(() => {
    if (
      request.data &&
      request.data.list.length === 0 &&
      request.data.total > 0 &&
      page > 1
    ) {
      setPage(1)
    }
  }, [page, request.data])

  const onPageChange = useCallback(
    (nextPage: number, nextPageSize: number) => {
      const isSizeChanged = nextPageSize !== pageSize
      setPage(isSizeChanged ? 1 : nextPage)
      setPageSize(nextPageSize)
    },
    [pageSize]
  )
  const reloadFirstPage = useCallback(() => {
    if (page === 1) {
      request.run(buildParams(1, pageSize))
    } else {
      setPage(1)
    }
  }, [buildParams, page, pageSize, request.run])
  const mutateItems = useCallback(
    (updater: (items: readonly TItem[]) => TItem[]) => {
      request.mutate((prev) => ({
        ...(prev ?? { list: [], total: 0 }),
        list: updater(prev?.list ?? []),
      }))
    },
    [request.mutate]
  )
  const pagination = useMemo(
    () => ({
      total: request.data?.total ?? 0,
      page,
      pageSize,
      onChange: onPageChange,
    }),
    [onPageChange, page, pageSize, request.data?.total]
  )

  return {
    ...request,
    page,
    pageSize,
    pagination,
    mutateItems,
    reloadFirstPage,
  }
}
