import { useCallback, useEffect, useMemo, useState } from 'react'

import { Pencil, Plus, Trash2 } from 'lucide-react'

import { TreeNodeAction, TreePanel } from '@/components/Tree'
import DeleteDictItemDialog from '@/features/dict/components/DeleteDictItemDialog'
import DeleteDictTypeDialog from '@/features/dict/components/DeleteDictTypeDialog'
import DictItemFormDialog from '@/features/dict/components/DictItemFormDialog'
import DictItemTree from '@/features/dict/components/DictItemTree'
import DictTypeFormDialog from '@/features/dict/components/DictTypeFormDialog'
import { buildDictItemTree, type DictItemTreeNode } from '@/features/dict/utils'
import { useOptimisticStatus, useRequest, useTreeState } from '@/hooks'
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
import { cn } from '@/utils/common'

type TypeRowProps = {
  type: DictTypeItem
  selected: boolean
  isStatusLoading: (type: DictTypeItem) => boolean
  onSelect: (type: DictTypeItem) => void
  onEdit: (type: DictTypeItem) => void
  onDelete: (type: DictTypeItem) => void
  onStatusChange: (type: DictTypeItem, checked: boolean) => void
}

/** 左侧字典类型行：名称 + 编码 + 状态开关，hover 显示编辑/删除 */
function TypeRow({
  type,
  selected,
  isStatusLoading,
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
            loading={isStatusLoading(type)}
            onCheckedChange={(checked) => onStatusChange(type, checked)}
          />
        </span>
        <span className='hidden items-center gap-0.5 group-hover:flex'>
          <TreeNodeAction
            label='编辑'
            onClick={() => onEdit(type)}
          >
            <Pencil className='size-3.5' />
          </TreeNodeAction>
          <TreeNodeAction
            label='删除'
            destructive
            onClick={() => onDelete(type)}
          >
            <Trash2 className='size-3.5' />
          </TreeNodeAction>
        </span>
      </div>
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
    mutate: mutateItemData,
  } = useRequest(listAllDictItems, { immediate: false })
  const items = itemData ?? []
  const itemTree = useMemo(() => buildDictItemTree(items), [items])
  const { expandedKeys, setExpandedKeys } = useTreeState()

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
    setExpandedKeys([])
    // 切换类型时清空旧数据，避免加载期间短暂展示上一类型的项
    mutateItemData([])
    if (selectedTypeId == null) {
      return
    }
    runItems(Number(selectedTypeId))
  }, [selectedTypeId, runItems, mutateItemData, setExpandedKeys])

  const selectedType = useMemo(
    () =>
      selectedTypeId == null
        ? undefined
        : types.find((type) => String(type.id) === selectedTypeId),
    [types, selectedTypeId]
  )

  const mutateTypeItems = useCallback(
    (updater: (items: readonly DictTypeItem[]) => DictTypeItem[]) => {
      mutateTypes((prev) => updater(prev ?? []))
    },
    [mutateTypes]
  )
  const mutateDictItems = useCallback(
    (updater: (items: readonly DictItem[]) => DictItem[]) => {
      mutateItemData((prev) => updater(prev ?? []))
    },
    [mutateItemData]
  )
  const refreshDictOptions = useCallback(() => {
    // 字典选项已变更，同步刷新全局字典 store。
    useDictStore.getState().refresh()
  }, [])
  const typeStatus = useOptimisticStatus(updateDictTypeStatus, {
    mutateItems: mutateTypeItems,
    getParams: (type, nextStatus) => ({
      id: Number(type.id),
      status: nextStatus,
    }),
    onSuccess: refreshDictOptions,
  })
  const itemStatus = useOptimisticStatus(updateDictItemStatus, {
    mutateItems: mutateDictItems,
    getParams: (node, nextStatus) => ({
      id: Number(node.id),
      status: nextStatus,
    }),
    onSuccess: refreshDictOptions,
  })

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
          <TreePanel
            loading={typeLoading}
            error={typeError?.message}
            empty={types.length === 0}
            emptyTitle='暂无字典类型'
          >
            {types.map((type) => (
              <TypeRow
                key={type.id}
                type={type}
                selected={String(type.id) === selectedTypeId}
                isStatusLoading={typeStatus.isSwitching}
                onSelect={(item) => {
                  setSelectedTypeId(String(item.id))
                }}
                onEdit={handleEditType}
                onDelete={setDeleteTypeTarget}
                onStatusChange={typeStatus.handleStatusChange}
              />
            ))}
          </TreePanel>
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
          ) : (
            <TreePanel
              loading={itemLoading}
              error={itemError?.message}
              empty={itemTree.length === 0}
              emptyTitle='暂无字典项'
            >
              <DictItemTree
                nodes={itemTree}
                expandedKeys={expandedKeys}
                onExpand={setExpandedKeys}
                isStatusLoading={itemStatus.isSwitching}
                onAddChild={(item) => handleAddItem(Number(item.id))}
                onEdit={handleEditItem}
                onDelete={setDeleteItemTarget}
                onStatusChange={itemStatus.handleStatusChange}
              />
            </TreePanel>
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
