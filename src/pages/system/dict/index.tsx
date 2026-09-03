import { useCallback, useEffect, useMemo, useState } from 'react'

import { ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'

import Loading from '@/components/Loading'
import DeleteDictItemDialog from '@/features/dict/components/DeleteDictItemDialog'
import DeleteDictTypeDialog from '@/features/dict/components/DeleteDictTypeDialog'
import DictItemFormDialog from '@/features/dict/components/DictItemFormDialog'
import DictTypeFormDialog from '@/features/dict/components/DictTypeFormDialog'
import { buildDictItemTree, type DictItemTreeNode } from '@/features/dict/utils'
import { useRequest } from '@/hooks'
import {
  listAllDictItems,
  listAllDictTypes,
  updateDictItemStatus,
  updateDictTypeStatus,
  type DictItem,
  type DictTypeItem,
} from '@/service/dict'
import useDictStore from '@/store/useDictStore'
import { Button } from '@/ui/Button'
import { Empty, EmptyHeader, EmptyTitle } from '@/ui/Empty'
import { Switch } from '@/ui/Switch'
import { toast } from '@/ui/Toast'
import { cn } from '@/utils/common'

/** 树节点 hover 动作按钮（独立于行主体，避免嵌套交互元素） */
function NodeAction({
  label,
  destructive = false,
  onClick,
  children,
}: {
  label: string
  destructive?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type='button'
      aria-label={label}
      className={cn(
        'text-muted-foreground hover:bg-background rounded p-0.5',
        destructive ? 'hover:text-destructive' : 'hover:text-foreground'
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

type TypeRowProps = {
  type: DictTypeItem
  selected: boolean
  statusLoading: boolean
  switchingId: string | null
  onSelect: (type: DictTypeItem) => void
  onEdit: (type: DictTypeItem) => void
  onDelete: (type: DictTypeItem) => void
  onStatusChange: (type: DictTypeItem, checked: boolean) => void
}

/** 左侧字典类型行：名称 + 编码 + 状态开关，hover 显示编辑/删除 */
function TypeRow({
  type,
  selected,
  statusLoading,
  switchingId,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
}: TypeRowProps) {
  return (
    <div
      className={cn(
        'group flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm',
        'hover:bg-accent',
        selected && 'bg-accent text-accent-foreground'
      )}
      onClick={() => onSelect(type)}
    >
      <span className='min-w-0 flex-1 truncate font-medium'>{type.name}</span>
      <span className='text-muted-foreground max-w-28 shrink-0 truncate text-xs'>
        {type.dictKey}
      </span>
      {/* 状态开关与 hover 操作共处右侧（行内排布，避免绝对定位遮挡内容）：hover 时显示操作、隐藏开关 */}
      <div className='ml-auto flex shrink-0 items-center'>
        <span className='group-hover:hidden'>
          <Switch
            size='sm'
            aria-label='切换状态'
            checked={type.status === 0}
            loading={statusLoading && switchingId === type.id}
            onCheckedChange={(checked) => onStatusChange(type, checked)}
          />
        </span>
        <span className='hidden items-center gap-0.5 group-hover:flex'>
          <NodeAction
            label='编辑'
            onClick={() => onEdit(type)}
          >
            <Pencil className='size-3.5' />
          </NodeAction>
          <NodeAction
            label='删除'
            destructive
            onClick={() => onDelete(type)}
          >
            <Trash2 className='size-3.5' />
          </NodeAction>
        </span>
      </div>
    </div>
  )
}

type ItemTreeNodeProps = {
  node: DictItemTreeNode
  expanded: Set<number>
  statusLoading: boolean
  switchingId: string | null
  onToggle: (id: number) => void
  onAddChild: (node: DictItemTreeNode) => void
  onEdit: (node: DictItemTreeNode) => void
  onDelete: (node: DictItemTreeNode) => void
  onStatusChange: (node: DictItemTreeNode, checked: boolean) => void
}

/** 右侧字典项树节点：可展开收起；hover 显示新增子项/编辑/删除 */
function ItemTreeNode({
  node,
  expanded,
  statusLoading,
  switchingId,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
  onStatusChange,
}: ItemTreeNodeProps) {
  const isExpanded = expanded.has(Number(node.id))
  const hasChildren = node.children.length > 0
  const itemStatusLoading = statusLoading && switchingId === node.id

  return (
    <div className='group'>
      <div
        className={cn(
          'flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm',
          'hover:bg-accent'
        )}
      >
        {hasChildren ? (
          <button
            type='button'
            aria-label={isExpanded ? '收起' : '展开'}
            className='text-muted-foreground rounded-sm p-0.5'
            onClick={(event) => {
              event.stopPropagation()
              onToggle(Number(node.id))
            }}
          >
            <ChevronRight
              className={cn(
                'size-3.5 shrink-0 transition-transform duration-150',
                isExpanded && 'rotate-90'
              )}
            />
          </button>
        ) : (
          <span className='size-3.5 shrink-0' />
        )}
        <span className='min-w-0 truncate'>{node.label}</span>
        {node.value && (
          <span className='text-muted-foreground shrink-0 text-xs'>
            {node.value}
          </span>
        )}
        <div className='ml-auto flex shrink-0 items-center'>
          <span className='group-hover:hidden'>
            <Switch
              size='sm'
              aria-label='切换状态'
              checked={node.status === 0}
              loading={itemStatusLoading}
              onCheckedChange={(checked) => onStatusChange(node, checked)}
            />
          </span>
          <span className='hidden items-center gap-0.5 group-hover:flex'>
            <NodeAction
              label='新增子项'
              onClick={() => onAddChild(node)}
            >
              <Plus className='size-3.5' />
            </NodeAction>
            <NodeAction
              label='编辑'
              onClick={() => onEdit(node)}
            >
              <Pencil className='size-3.5' />
            </NodeAction>
            <NodeAction
              label='删除'
              destructive
              onClick={() => onDelete(node)}
            >
              <Trash2 className='size-3.5' />
            </NodeAction>
          </span>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className='border-border/60 ml-3 border-l pl-2'>
          {node.children.map((child) => (
            <ItemTreeNode
              key={child.id}
              node={child}
              expanded={expanded}
              statusLoading={statusLoading}
              switchingId={switchingId}
              onToggle={onToggle}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Dict() {
  // ── 左侧：字典类型列表 ─────────────────────────────────
  const {
    data: typeData,
    loading: typeLoading,
    error: typeError,
    run: runTypes,
    mutate: mutateTypes,
  } = useRequest(listAllDictTypes, { immediate: false })
  const types = typeData ?? []
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)

  // ── 右侧：选中类型的字典项树 ───────────────────────────
  const {
    data: itemData,
    loading: itemLoading,
    error: itemError,
    run: runItems,
    mutate: mutateItems,
  } = useRequest(listAllDictItems, { immediate: false })
  const items = itemData ?? []
  const itemTree = useMemo(() => buildDictItemTree(items), [items])
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  // ── 弹窗状态 ─────────────────────────────────────────
  const [typeFormOpen, setTypeFormOpen] = useState(false)
  /** 正在编辑的字典类型；null 为新增模式 */
  const [editingType, setEditingType] = useState<DictTypeItem | null>(null)
  /** 待删除字典类型；null 表示未打开删除确认弹窗 */
  const [deleteTypeTarget, setDeleteTypeTarget] = useState<DictTypeItem | null>(
    null
  )

  const [itemFormOpen, setItemFormOpen] = useState(false)
  /** 正在编辑的字典项；null 为新增模式 */
  const [editingItem, setEditingItem] = useState<DictItem | null>(null)
  /** 新增模式的默认父级 id（0=根级） */
  const [itemDefaultParentId, setItemDefaultParentId] = useState(0)
  /** 待删除字典项节点；null 表示未打开删除确认弹窗 */
  const [deleteItemTarget, setDeleteItemTarget] =
    useState<DictItemTreeNode | null>(null)

  // ── 状态切换请求 ─────────────────────────────────────
  const { runAsync: updateTypeStatusAsync, loading: updateTypeStatusLoading } =
    useRequest(updateDictTypeStatus, { immediate: false })
  const [switchingTypeId, setSwitchingTypeId] = useState<string | null>(null)

  const { runAsync: updateItemStatusAsync, loading: updateItemStatusLoading } =
    useRequest(updateDictItemStatus, { immediate: false })
  const [switchingItemId, setSwitchingItemId] = useState<string | null>(null)

  // 初始加载字典类型
  useEffect(() => {
    runTypes()
  }, [runTypes])

  // 未选中时默认选中第一个类型
  useEffect(() => {
    if (selectedTypeId == null && types.length > 0) {
      setSelectedTypeId(String(types[0].id))
    }
  }, [types, selectedTypeId])

  // 选中类型变化 → 重置展开状态并加载其字典项
  useEffect(() => {
    setExpanded(new Set())
    // 切换类型时清空旧数据，避免加载期间短暂展示上一类型的项
    mutateItems([])
    if (selectedTypeId == null) {
      return
    }
    runItems(Number(selectedTypeId))
  }, [selectedTypeId, runItems, mutateItems])

  const selectedType = useMemo(
    () =>
      selectedTypeId == null
        ? undefined
        : types.find((type) => String(type.id) === selectedTypeId),
    [types, selectedTypeId]
  )

  // 行内切换字典类型状态：先乐观更新本地列表，接口失败时回滚
  const handleTypeStatusChange = useCallback(
    async (type: DictTypeItem, checked: boolean) => {
      const nextStatus = checked ? 0 : 1
      const prevStatus = type.status
      mutateTypes((prev) =>
        (prev ?? []).map((item) =>
          item.id === type.id ? { ...item, status: nextStatus } : item
        )
      )
      setSwitchingTypeId(type.id)
      try {
        await updateTypeStatusAsync({ id: Number(type.id), status: nextStatus })
        toast.success('状态更新成功')
        // 字典选项已变更，同步刷新全局字典 store
        useDictStore.getState().refresh()
      } catch (err) {
        mutateTypes((prev) =>
          (prev ?? []).map((item) =>
            item.id === type.id ? { ...item, status: prevStatus } : item
          )
        )
        toast.error((err as Error).message)
      } finally {
        setSwitchingTypeId(null)
      }
    },
    [mutateTypes, updateTypeStatusAsync]
  )

  // 行内切换字典项状态：先乐观更新本地列表，接口失败时回滚
  const handleItemStatusChange = useCallback(
    async (node: DictItemTreeNode, checked: boolean) => {
      const nextStatus = checked ? 0 : 1
      const prevStatus = node.status
      mutateItems((prev) =>
        (prev ?? []).map((item) =>
          item.id === node.id ? { ...item, status: nextStatus } : item
        )
      )
      setSwitchingItemId(node.id)
      try {
        await updateItemStatusAsync({ id: Number(node.id), status: nextStatus })
        toast.success('状态更新成功')
        // 字典选项已变更，同步刷新全局字典 store
        useDictStore.getState().refresh()
      } catch (err) {
        mutateItems((prev) =>
          (prev ?? []).map((item) =>
            item.id === node.id ? { ...item, status: prevStatus } : item
          )
        )
        toast.error((err as Error).message)
      } finally {
        setSwitchingItemId(null)
      }
    },
    [mutateItems, updateItemStatusAsync]
  )

  // ── 交互回调 ─────────────────────────────────────────
  const handleAddType = useCallback(() => {
    setEditingType(null)
    setTypeFormOpen(true)
  }, [])
  const handleEditType = useCallback((type: DictTypeItem) => {
    setEditingType(type)
    setTypeFormOpen(true)
  }, [])

  const handleTypeFormSuccess = useCallback(() => {
    // 类型新增/编辑可能变更编码与状态，刷新全部已加载字典
    useDictStore.getState().refresh()
    runTypes()
  }, [runTypes])

  const handleDeleteTypeSuccess = useCallback(() => {
    // 被删类型为当前选中时清空选中，由默认选中逻辑回退到首个剩余类型
    if (deleteTypeTarget && String(deleteTypeTarget.id) === selectedTypeId) {
      setSelectedTypeId(null)
    }
    useDictStore.getState().refresh()
    runTypes()
  }, [deleteTypeTarget, selectedTypeId, runTypes])

  const handleAddItem = useCallback((parentId: number) => {
    setEditingItem(null)
    setItemDefaultParentId(parentId)
    setItemFormOpen(true)
  }, [])
  const handleEditItem = useCallback((node: DictItemTreeNode) => {
    setEditingItem(node)
    setItemFormOpen(true)
  }, [])

  const handleItemFormSuccess = useCallback(() => {
    // 字典项新增/编辑影响下拉选项，刷新全局字典 store
    useDictStore.getState().refresh()
    if (selectedTypeId != null) {
      runItems(Number(selectedTypeId))
    }
  }, [selectedTypeId, runItems])

  const handleDeleteItemSuccess = useCallback(() => {
    // 字典项删除影响下拉选项，刷新全局字典 store
    useDictStore.getState().refresh()
    if (selectedTypeId != null) {
      runItems(Number(selectedTypeId))
    }
  }, [selectedTypeId, runItems])

  const toggleNode = useCallback((id: number) => {
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

  return (
    <div className='flex h-full min-h-0'>
      {/* 左栏：字典类型 */}
      <div className='bg-muted/30 border-border flex h-full w-72 shrink-0 flex-col border-r lg:w-80'>
        <div className='flex items-center justify-between p-3'>
          <span className='text-sm font-medium'>字典类型</span>
          <Button
            size='sm'
            onClick={handleAddType}
          >
            <Plus className='size-4' />
            新增
          </Button>
        </div>
        <div className='flex-1 overflow-auto p-2'>
          {typeLoading ? (
            <div className='grid place-items-center py-10'>
              <Loading />
            </div>
          ) : typeError ? (
            <div className='text-destructive px-2 py-4 text-sm'>
              {typeError.message}
            </div>
          ) : types.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>暂无字典类型</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            types.map((type) => (
              <TypeRow
                key={type.id}
                type={type}
                selected={String(type.id) === selectedTypeId}
                statusLoading={updateTypeStatusLoading}
                switchingId={switchingTypeId}
                onSelect={(item) => {
                  setSelectedTypeId(String(item.id))
                }}
                onEdit={handleEditType}
                onDelete={setDeleteTypeTarget}
                onStatusChange={handleTypeStatusChange}
              />
            ))
          )}
        </div>
      </div>

      {/* 右栏：选中类型的字典项树 */}
      <div className='flex min-w-0 flex-1 flex-col'>
        <div className='flex items-center justify-between p-3'>
          <span className='text-sm font-medium'>
            {selectedType ? `字典项 · ${selectedType.name}` : '字典项'}
          </span>
          {selectedType && (
            <Button
              size='sm'
              onClick={() => handleAddItem(0)}
            >
              <Plus className='size-4' />
              新增字典项
            </Button>
          )}
        </div>
        <div className='flex-1 overflow-auto p-2'>
          {!selectedType ? (
            <div className='grid flex-1 place-items-center'>
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>请选择左侧字典类型</EmptyTitle>
                </EmptyHeader>
              </Empty>
            </div>
          ) : itemLoading ? (
            <div className='grid place-items-center py-10'>
              <Loading />
            </div>
          ) : itemError ? (
            <div className='text-destructive px-2 py-4 text-sm'>
              {itemError.message}
            </div>
          ) : itemTree.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>暂无字典项</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            itemTree.map((node) => (
              <ItemTreeNode
                key={node.id}
                node={node}
                expanded={expanded}
                statusLoading={updateItemStatusLoading}
                switchingId={switchingItemId}
                onToggle={toggleNode}
                onAddChild={(item) => handleAddItem(Number(item.id))}
                onEdit={handleEditItem}
                onDelete={setDeleteItemTarget}
                onStatusChange={handleItemStatusChange}
              />
            ))
          )}
        </div>
      </div>

      <DictTypeFormDialog
        open={typeFormOpen}
        onOpenChange={setTypeFormOpen}
        type={editingType}
        onSuccess={handleTypeFormSuccess}
      />
      <DeleteDictTypeDialog
        open={!!deleteTypeTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTypeTarget(null)
        }}
        type={deleteTypeTarget}
        onSuccess={handleDeleteTypeSuccess}
      />
      <DictItemFormDialog
        open={itemFormOpen}
        onOpenChange={setItemFormOpen}
        item={editingItem}
        tree={itemTree}
        dictTypeId={Number(selectedType?.id ?? 0)}
        defaultParentId={itemDefaultParentId}
        onSuccess={handleItemFormSuccess}
      />
      <DeleteDictItemDialog
        open={!!deleteItemTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteItemTarget(null)
        }}
        node={deleteItemTarget}
        onSuccess={handleDeleteItemSuccess}
      />
    </div>
  )
}
