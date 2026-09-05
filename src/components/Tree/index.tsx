import type { ReactNode } from 'react'

import { ChevronRight, Loader2 } from 'lucide-react'

import Loading from '@/components/Loading'
import { Empty, EmptyHeader, EmptyTitle } from '@/ui/Empty'
import { cn } from '@/utils/common'
import type { TreeKeyValue } from '@/utils/tree'

export type TreeFieldNames<TNode extends object> = {
  key: keyof TNode
  children: keyof TNode
  title?: keyof TNode
}

export type TreeExpandInfo<TNode> = {
  expanded: boolean
  node: TNode
}

export type TreeSelectInfo<TNode> = {
  selected: boolean
  node: TNode
}

export type TreeViewProps<TNode extends object> = {
  /** 树数据；children 可以为空，懒加载时由 loadData 更新。 */
  treeData: readonly TNode[]
  /** 映射后端节点字段，参考 Ant Design Tree 的 fieldNames。 */
  fieldNames: TreeFieldNames<TNode>
  /** 受控展开节点 key。 */
  expandedKeys?: readonly string[]
  /** 受控选中节点 key。 */
  selectedKeys?: readonly string[]
  /** 已加载过子节点的 key，配合 loadData 使用。 */
  loadedKeys?: readonly string[]
  /** 正在加载子节点的 key。 */
  loadingKeys?: readonly string[]
  /** 展开/收起回调。 */
  onExpand?: (expandedKeys: string[], info: TreeExpandInfo<TNode>) => void
  /** 选中回调。 */
  onSelect?: (selectedKeys: string[], info: TreeSelectInfo<TNode>) => void
  /** 展开未加载节点时调用；请求失败时保持收起状态。 */
  loadData?: (node: TNode) => Promise<void>
  /** 明确节点是否为叶子；未传时按 children 是否为空判断。 */
  isLeaf?: (node: TNode) => boolean
  /** 自定义节点标题区域。 */
  titleRender?: (node: TNode) => ReactNode
  /** 自定义节点右侧操作。 */
  actionsRender?: (node: TNode) => ReactNode
  /** 自定义节点右侧常驻内容，如状态开关。 */
  extraRender?: (node: TNode) => ReactNode
  /** 是否点击标题时同时展开/收起节点。 */
  expandOnTitleClick?: boolean
  className?: string
}

/** 树节点动作按钮，自动隔离冒泡，避免触发行选中或展开。 */
export function TreeNodeAction({
  label,
  destructive = false,
  onClick,
  children,
}: {
  label: string
  destructive?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type='button'
      aria-label={label}
      className={cn(
        'text-muted-foreground hover:bg-background rounded p-0.5',
        destructive ? 'hover:text-destructive' : 'hover:text-foreground'
      )}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    >
      {children}
    </button>
  )
}

function getChildren<TNode extends object>(
  node: TNode,
  fieldNames: TreeFieldNames<TNode>
): readonly TNode[] {
  const children = node[fieldNames.children]
  return Array.isArray(children) ? (children as TNode[]) : []
}

function getNodeKey<TNode extends object>(
  node: TNode,
  fieldNames: TreeFieldNames<TNode>
) {
  return String(node[fieldNames.key] as TreeKeyValue)
}

export function TreeView<TNode extends object>({
  treeData,
  fieldNames,
  expandedKeys = [],
  selectedKeys = [],
  loadedKeys = [],
  loadingKeys = [],
  onExpand,
  onSelect,
  loadData,
  isLeaf,
  titleRender,
  actionsRender,
  extraRender,
  expandOnTitleClick = false,
  className,
}: TreeViewProps<TNode>) {
  const expandedSet = new Set(expandedKeys)
  const selectedSet = new Set(selectedKeys)
  const loadedSet = new Set(loadedKeys)
  const loadingSet = new Set(loadingKeys)

  const isNodeLeaf = (node: TNode) =>
    isLeaf ? isLeaf(node) : getChildren(node, fieldNames).length === 0

  const requestExpand = async (node: TNode, nextExpanded: boolean) => {
    const key = getNodeKey(node, fieldNames)
    const leaf = isNodeLeaf(node)

    if (
      nextExpanded &&
      !leaf &&
      loadData &&
      !loadedSet.has(key) &&
      !loadingSet.has(key)
    ) {
      try {
        await loadData(node)
      } catch {
        return
      }
    }

    const nextKeys = new Set(expandedSet)
    if (nextExpanded) {
      nextKeys.add(key)
    } else {
      nextKeys.delete(key)
    }
    onExpand?.([...nextKeys], { expanded: nextExpanded, node })
  }

  const renderNodes = (nodes: readonly TNode[]) =>
    nodes.map((node) => {
      const key = getNodeKey(node, fieldNames)
      const children = getChildren(node, fieldNames)
      const leaf = isNodeLeaf(node)
      const expanded = expandedSet.has(key)
      const selected = selectedSet.has(key)
      const loading = loadingSet.has(key)
      const actions = actionsRender?.(node)
      const extra = extraRender?.(node)
      const title =
        titleRender?.(node) ??
        (fieldNames.title ? String(node[fieldNames.title]) : key)

      return (
        <div
          key={key}
          className='group'
        >
          <div
            className={cn(
              'flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm',
              (onSelect || (!leaf && expandOnTitleClick)) && 'cursor-pointer',
              'hover:bg-accent',
              selected && 'bg-accent text-accent-foreground'
            )}
            onClick={() => {
              if (onSelect) {
                onSelect([key], { selected: true, node })
              }
              if (expandOnTitleClick && !leaf) {
                void requestExpand(node, !expanded)
              }
            }}
          >
            {leaf ? (
              <span className='size-3.5 shrink-0' />
            ) : (
              <button
                type='button'
                aria-label={expanded ? '收起' : '展开'}
                className='text-muted-foreground rounded-sm p-0.5'
                disabled={loading}
                onClick={(event) => {
                  event.stopPropagation()
                  void requestExpand(node, !expanded)
                }}
              >
                {loading ? (
                  <Loader2 className='size-3.5 animate-spin' />
                ) : (
                  <ChevronRight
                    className={cn(
                      'size-3.5 shrink-0 transition-transform duration-150',
                      expanded && 'rotate-90'
                    )}
                  />
                )}
              </button>
            )}
            <div className='min-w-0 flex-1 truncate'>{title}</div>
            {(extra || actions) && (
              <div
                className='ml-auto flex shrink-0 items-center'
                onClick={(event) => event.stopPropagation()}
              >
                {extra && (
                  <span className={actions ? 'group-hover:hidden' : undefined}>
                    {extra}
                  </span>
                )}
                {actions && (
                  <span className='hidden items-center gap-0.5 group-hover:flex'>
                    {actions}
                  </span>
                )}
              </div>
            )}
          </div>
          {expanded && children.length > 0 && (
            <div className='border-border/60 ml-3 border-l pl-2'>
              {renderNodes(children)}
            </div>
          )}
        </div>
      )
    })

  return (
    <div className={cn('flex flex-col', className)}>
      {renderNodes(treeData)}
    </div>
  )
}

export function TreePanel({
  loading,
  error,
  empty,
  emptyTitle,
  children,
}: {
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyTitle: string
  children: ReactNode
}) {
  if (loading) {
    return (
      <div className='grid place-items-center py-10'>
        <Loading />
      </div>
    )
  }

  if (error) {
    return <div className='text-destructive px-2 py-4 text-sm'>{error}</div>
  }

  if (empty) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    )
  }

  return children
}
