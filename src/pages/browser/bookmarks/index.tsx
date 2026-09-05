import { useCallback, useMemo, useState } from 'react'

import { Folder, Link2, Pencil, Plus, Trash2 } from 'lucide-react'

import { TreePanel } from '@/components/Tree'
import BookmarkFormDialog from '@/features/bookmark/components/BookmarkFormDialog'
import BookmarkTree from '@/features/bookmark/components/BookmarkTree'
import DeleteBookmarkDialog from '@/features/bookmark/components/DeleteBookmarkDialog'
import { useRequest, useTreeState } from '@/hooks'
import { getBookmarkTree, type BookmarkNode } from '@/service/bookmarks'
import { Button } from '@/ui/Button'
import { Empty, EmptyHeader, EmptyTitle } from '@/ui/Empty'
import { countTreeSubtree, findTreeNode } from '@/utils/tree'

export default function Bookmarks() {
  const { data: tree, loading, error, run } = useRequest(getBookmarkTree)
  /** 展开的节点 key；默认全部收起，由用户手动展开。 */
  const { expandedKeys, selectedKeys, setExpandedKeys, setSelectedKeys } =
    useTreeState()
  const [formOpen, setFormOpen] = useState(false)
  /** 正在编辑的节点；null 为新增模式 */
  const [editingNode, setEditingNode] = useState<BookmarkNode | null>(null)
  /** 新增模式的默认父级 id（0=根级） */
  const [defaultParentId, setDefaultParentId] = useState(0)
  /** 待删除节点；null 表示未打开删除确认弹窗 */
  const [deleteTarget, setDeleteTarget] = useState<BookmarkNode | null>(null)

  const nodes = tree ?? []
  const selectedId = selectedKeys.length > 0 ? Number(selectedKeys[0]) : null
  const selectedNode = useMemo(
    () => (selectedId === null ? null : findTreeNode(nodes, selectedId)),
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
      <div className='bg-muted/30 border-border flex h-full w-60 shrink-0 flex-col border-r md:w-72 lg:w-md'>
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
          <TreePanel
            loading={loading}
            error={error?.message}
            empty={nodes.length === 0}
            emptyTitle='暂无收藏'
          >
            <BookmarkTree
              nodes={nodes}
              expandedKeys={expandedKeys}
              selectedKeys={selectedKeys}
              onExpand={setExpandedKeys}
              onSelect={setSelectedKeys}
              onEdit={(item) => {
                setEditingNode(item)
                setFormOpen(true)
              }}
              onDelete={setDeleteTarget}
            />
          </TreePanel>
        </div>
      </div>
      {/* 右侧：选中节点的详情与操作 */}
      <div className='flex min-w-0 flex-1 flex-col'>
        {selectedNode ? (
          <div className='flex flex-col gap-4 p-6'>
            {/* mt-1：标题行盒顶部含半行距空白，图标整体下移后与首行字形视觉顶对齐 */}
            <div className='flex items-start gap-2'>
              {selectedNode.type === 1 ? (
                <Folder className='mt-1 size-5 shrink-0' />
              ) : selectedNode.favicon ? (
                <img
                  src={selectedNode.favicon}
                  alt=''
                  className='mt-1 size-5 shrink-0 rounded-sm'
                />
              ) : (
                <Link2 className='text-muted-foreground mt-1 size-5 shrink-0' />
              )}
              <h2 className='min-w-0 text-base font-medium'>
                {selectedNode.title}
              </h2>
            </div>
            <div className='text-muted-foreground text-sm'>
              {selectedNode.type === 1 ? (
                <span>包含 {countTreeSubtree(selectedNode) - 1} 个子项</span>
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
          if (deleteTarget && String(deleteTarget.id) === selectedKeys[0]) {
            setSelectedKeys([])
          }
          run()
        }}
      />
    </div>
  )
}
