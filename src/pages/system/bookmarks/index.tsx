import { useCallback, useEffect, useMemo, useState } from 'react'

import { ChevronRight, Folder, Link2, Pencil, Plus, Trash2 } from 'lucide-react'

import Loading from '@/components/Loading'
import BookmarkFormDialog from '@/features/bookmark/components/BookmarkFormDialog'
import DeleteBookmarkDialog from '@/features/bookmark/components/DeleteBookmarkDialog'
import { useRequest } from '@/hooks'
import { getBookmarkTree, type BookmarkNode } from '@/service/bookmarks'
import { Button } from '@/ui/Button'
import { Empty, EmptyHeader, EmptyTitle } from '@/ui/Empty'
import { cn } from '@/utils/common'

/** 在树中按 id 查找节点 */
function findNode(nodes: BookmarkNode[], id: number): BookmarkNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = findNode(node.children, id)
    if (found) return found
  }
  return null
}

/** 收集树中全部文件夹 id */
function collectFolderIds(nodes: BookmarkNode[]): Set<number> {
  const ids = new Set<number>()
  const walk = (items: BookmarkNode[]) => {
    items.forEach((item) => {
      if (item.type === 1) {
        ids.add(item.id)
        walk(item.children)
      }
    })
  }
  walk(nodes)
  return ids
}

/** 统计节点及其全部子孙数量 */
function countSubtree(node: BookmarkNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countSubtree(child), 0)
}

/** 行内 hover 出现的编辑/删除按钮（独立于行主体，避免嵌套交互元素） */
function NodeActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className='absolute top-1/2 right-1 hidden -translate-y-1/2 items-center gap-0.5 group-hover:flex'>
      <button
        type='button'
        aria-label='编辑'
        className='text-muted-foreground hover:text-foreground hover:bg-background rounded p-0.5'
        onClick={onEdit}
      >
        <Pencil className='size-3.5' />
      </button>
      <button
        type='button'
        aria-label='删除'
        className='text-muted-foreground hover:text-destructive hover:bg-background rounded p-0.5'
        onClick={onDelete}
      >
        <Trash2 className='size-3.5' />
      </button>
    </div>
  )
}

type TreeNodeProps = {
  node: BookmarkNode
  expanded: Set<number>
  selectedId: number | null
  onToggle: (id: number) => void
  onSelect: (node: BookmarkNode) => void
  onEdit: (node: BookmarkNode) => void
  onDelete: (node: BookmarkNode) => void
}

/** 树节点：文件夹可展开/收起，收藏为外链（点击打开 + 选中）；子级缩进并带左侧竖线 */
function TreeNode({
  node,
  expanded,
  selectedId,
  onToggle,
  onSelect,
  onEdit,
  onDelete,
}: TreeNodeProps) {
  const isActive = selectedId === node.id
  const rowClass = cn(
    'flex min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 pr-10 text-sm',
    'hover:bg-accent',
    isActive && 'bg-accent text-accent-foreground'
  )
  const actions = (
    <NodeActions
      onEdit={() => onEdit(node)}
      onDelete={() => onDelete(node)}
    />
  )

  if (node.type === 1) {
    const isExpanded = expanded.has(node.id)
    return (
      <div className='group'>
        <div className='relative'>
          <div
            className={rowClass}
            onClick={() => {
              onSelect(node)
              onToggle(node.id)
            }}
          >
            <ChevronRight
              className={cn(
                'size-4 shrink-0 transition-transform duration-150',
                isExpanded && 'rotate-90'
              )}
            />
            <Folder className='size-4 shrink-0' />
            <span className='min-w-0 truncate'>{node.title}</span>
          </div>
          {actions}
        </div>
        {isExpanded && (
          <div className='border-border/60 ml-3 border-l pl-2'>
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                expanded={expanded}
                selectedId={selectedId}
                onToggle={onToggle}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='group relative'>
      <a
        href={node.url}
        target='_blank'
        rel='noreferrer'
        className={rowClass}
        onClick={() => onSelect(node)}
      >
        {node.favicon ? (
          <img
            src={node.favicon}
            alt=''
            className='size-4 shrink-0 rounded-sm'
          />
        ) : (
          <Link2 className='text-muted-foreground size-4 shrink-0' />
        )}
        <span className='min-w-0 truncate'>{node.title}</span>
      </a>
      {actions}
    </div>
  )
}

export default function Bookmarks() {
  const { data: tree, loading, error, run } = useRequest(getBookmarkTree)
  /** 展开的文件夹 id 集合；加载后默认全部展开 */
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  /** 正在编辑的节点；null 为新增模式 */
  const [editingNode, setEditingNode] = useState<BookmarkNode | null>(null)
  /** 新增模式的默认父级 id（0=根级） */
  const [defaultParentId, setDefaultParentId] = useState(0)
  /** 待删除节点；null 表示未打开删除确认弹窗 */
  const [deleteTarget, setDeleteTarget] = useState<BookmarkNode | null>(null)

  const nodes = tree ?? []

  // 数据加载/刷新后默认展开全部文件夹，避免新节点不可见
  useEffect(() => {
    if (tree) setExpanded(collectFolderIds(tree))
  }, [tree])

  const toggleFolder = useCallback((id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectedNode = useMemo(
    () => (selectedId === null ? null : findNode(nodes, selectedId)),
    [nodes, selectedId]
  )

  /** 顶部/面板新增：选中文件夹时默认挂到其下，否则根级 */
  const handleAdd = useCallback((parentId = 0) => {
    setEditingNode(null)
    setDefaultParentId(parentId)
    setFormOpen(true)
  }, [])

  return (
    <div className='flex h-full min-h-0'>
      {/* 左侧：收藏树（自定义文件树结构） */}
      <div className='bg-muted/30 border-border flex h-full w-md shrink-0 flex-col border-r'>
        <div className='flex items-center justify-between p-3'>
          <span className='text-sm font-medium'>书签管理</span>
          <Button
            size='sm'
            onClick={() =>
              handleAdd(selectedNode?.type === 1 ? selectedNode.id : 0)
            }
          >
            <Plus className='size-4' />
            新增
          </Button>
        </div>
        <div className='flex-1 overflow-auto p-2'>
          {loading ? (
            <div className='grid place-items-center py-10'>
              <Loading />
            </div>
          ) : error ? (
            <div className='text-destructive px-2 py-4 text-sm'>
              {error.message}
            </div>
          ) : nodes.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>暂无收藏</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <div>
              {nodes.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  expanded={expanded}
                  selectedId={selectedId}
                  onToggle={toggleFolder}
                  onSelect={(item) => setSelectedId(item.id)}
                  onEdit={(item) => {
                    setEditingNode(item)
                    setFormOpen(true)
                  }}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {/* 右侧：选中节点的详情与操作 */}
      <div className='flex min-w-0 flex-1 flex-col'>
        {selectedNode ? (
          <div className='flex flex-col gap-4 p-6'>
            <div className='flex items-center gap-2'>
              {selectedNode.type === 1 ? (
                <Folder className='size-5 text-sky-500' />
              ) : selectedNode.favicon ? (
                <img
                  src={selectedNode.favicon}
                  alt=''
                  className='size-5 rounded-sm'
                />
              ) : (
                <Link2 className='text-muted-foreground size-5' />
              )}
              <h2 className='text-base font-medium'>{selectedNode.title}</h2>
            </div>
            <div className='text-muted-foreground text-sm'>
              {selectedNode.type === 1 ? (
                <span>包含 {countSubtree(selectedNode) - 1} 个子项</span>
              ) : (
                <a
                  href={selectedNode.url}
                  target='_blank'
                  rel='noreferrer'
                  className='text-primary hover:underline'
                >
                  {selectedNode.url}
                </a>
              )}
            </div>
            <div className='flex gap-2'>
              {selectedNode.type === 1 && (
                <Button
                  size='sm'
                  onClick={() => handleAdd(selectedNode.id)}
                >
                  <Plus className='size-4' />
                  新增子项
                </Button>
              )}
              <Button
                size='sm'
                variant='outline'
                onClick={() => {
                  setEditingNode(selectedNode)
                  setFormOpen(true)
                }}
              >
                <Pencil className='size-4' />
                编辑
              </Button>
              <Button
                size='sm'
                variant='outline'
                className='text-destructive hover:text-destructive'
                onClick={() => setDeleteTarget(selectedNode)}
              >
                <Trash2 className='size-4' />
                删除
              </Button>
            </div>
          </div>
        ) : (
          <div className='grid flex-1 place-items-center'>
            <Empty>
              <EmptyHeader>
                <EmptyTitle>从左侧选择一个节点</EmptyTitle>
              </EmptyHeader>
            </Empty>
          </div>
        )}
      </div>
      <BookmarkFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        node={editingNode}
        tree={nodes}
        defaultParentId={defaultParentId}
        onSuccess={() => {
          run()
        }}
      />
      <DeleteBookmarkDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        node={deleteTarget}
        onSuccess={() => {
          // 删除的是当前选中节点时清除选中态
          if (deleteTarget && deleteTarget.id === selectedId) {
            setSelectedId(null)
          }
          run()
        }}
      />
    </div>
  )
}
