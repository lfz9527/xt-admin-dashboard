import { Pencil, Plus, Trash2 } from 'lucide-react'

import { TreeNodeAction, TreeView, type TreeViewProps } from '@/components/Tree'
import type { DictItemTreeNode } from '@/features/dict/utils'
import { Switch } from '@/ui/Switch'

type DictItemTreeProps = {
  nodes: readonly DictItemTreeNode[]
  expandedKeys: readonly string[]
  onExpand: TreeViewProps<DictItemTreeNode>['onExpand']
  isStatusLoading: (node: DictItemTreeNode) => boolean
  onAddChild: (node: DictItemTreeNode) => void
  onEdit: (node: DictItemTreeNode) => void
  onDelete: (node: DictItemTreeNode) => void
  onStatusChange: (node: DictItemTreeNode, checked: boolean) => void
}

/** 字典项节点树：节点字段和操作属于字典 feature，递归展示交给公共 TreeView。 */
export default function DictItemTree({
  nodes,
  expandedKeys,
  onExpand,
  isStatusLoading,
  onAddChild,
  onEdit,
  onDelete,
  onStatusChange,
}: DictItemTreeProps) {
  return (
    <TreeView
      treeData={nodes}
      fieldNames={{ key: 'id', title: 'label', children: 'children' }}
      expandedKeys={expandedKeys}
      onExpand={onExpand}
      extraRender={(node) => (
        <Switch
          size='sm'
          aria-label='切换状态'
          checked={node.status === 0}
          loading={isStatusLoading(node)}
          onCheckedChange={(checked) => onStatusChange(node, checked)}
        />
      )}
      titleRender={(node) => (
        <div className='flex min-w-0 items-center gap-1.5'>
          <span className='min-w-0 truncate'>{node.label}</span>
          {node.value && (
            <span className='text-muted-foreground shrink-0 text-xs'>
              {node.value}
            </span>
          )}
        </div>
      )}
      actionsRender={(node) => (
        <>
          <TreeNodeAction
            label='新增子项'
            onClick={() => onAddChild(node)}
          >
            <Plus className='size-3.5' />
          </TreeNodeAction>
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
