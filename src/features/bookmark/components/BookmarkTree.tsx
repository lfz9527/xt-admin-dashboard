import { Folder, Link2, Pencil, Trash2 } from 'lucide-react'

import { TreeNodeAction, TreeView, type TreeViewProps } from '@/components/Tree'
import type { BookmarkNode } from '@/service/bookmarks'

type BookmarkTreeProps = {
  nodes: readonly BookmarkNode[]
  expandedKeys: readonly string[]
  selectedKeys: readonly string[]
  onExpand: TreeViewProps<BookmarkNode>['onExpand']
  onSelect: TreeViewProps<BookmarkNode>['onSelect']
  onEdit: (node: BookmarkNode) => void
  onDelete: (node: BookmarkNode) => void
}

/** 书签节点树：展示和操作保留在书签 feature，递归结构交给公共 TreeView。 */
export default function BookmarkTree({
  nodes,
  expandedKeys,
  selectedKeys,
  onExpand,
  onSelect,
  onEdit,
  onDelete,
}: BookmarkTreeProps) {
  return (
    <TreeView
      treeData={nodes}
      fieldNames={{ key: 'id', title: 'title', children: 'children' }}
      expandedKeys={expandedKeys}
      selectedKeys={selectedKeys}
      onExpand={onExpand}
      onSelect={onSelect}
      expandOnTitleClick
      isLeaf={(node) => node.type !== 1 || node.children.length === 0}
      titleRender={(node) => (
        <div className='flex min-w-0 items-center gap-1.5'>
          {node.type === 1 ? (
            <Folder className='size-4 shrink-0' />
          ) : node.favicon ? (
            <img
              src={node.favicon}
              alt=''
              className='size-4 shrink-0 rounded-sm'
            />
          ) : (
            <Link2 className='text-muted-foreground size-4 shrink-0' />
          )}
          <span className='min-w-0 truncate'>{node.title}</span>
        </div>
      )}
      actionsRender={(node) => (
        <>
          <TreeNodeAction
            label='编辑'
            onClick={() => onEdit(node)}
          >
            <Pencil className='size-3.5' />
          </TreeNodeAction>
          <TreeNodeAction
            label='删除'
            destructive
            onClick={() => onDelete(node)}
          >
            <Trash2 className='size-3.5' />
          </TreeNodeAction>
        </>
      )}
    />
  )
}
