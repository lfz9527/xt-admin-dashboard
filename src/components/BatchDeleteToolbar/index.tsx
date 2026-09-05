import type { ReactNode } from 'react'

import { Button } from '@/ui/Button'

export function BatchDeleteToolbar({
  selectedIds,
  maxCount = 50,
  onDelete,
  children,
}: {
  selectedIds: readonly number[]
  maxCount?: number
  onDelete: (ids: number[]) => void
  children?: ReactNode
}) {
  const selectedCount = selectedIds.length
  const overLimit = selectedCount > maxCount

  return (
    <>
      {selectedCount > 0 && (
        <>
          <span className='text-muted-foreground self-center text-sm'>
            已选 {selectedCount} 项
          </span>
          {overLimit && (
            <span className='text-muted-foreground self-center text-sm'>
              单次最多删除 {maxCount} 条
            </span>
          )}
          <Button
            variant='destructive'
            disabled={overLimit}
            onClick={() => onDelete([...selectedIds])}
          >
            批量删除
          </Button>
        </>
      )}
      {children}
    </>
  )
}
