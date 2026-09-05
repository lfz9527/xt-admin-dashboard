import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormDialog } from '@/components/FormDialog'
import { DictSelectField } from '@/components/DictSelectField'
import { SelectData } from '@/components/SelectData'
import { useFormDialog } from '@/hooks'
import {
  createDictItem,
  updateDictItem,
  type CreateDictItemParams,
  type DictItem,
  type UpdateDictItemParams,
} from '@/service/dict'
import { DialogDescription } from '@/ui/Dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/Form'
import { Input } from '@/ui/Input'
import { Textarea } from '@/ui/Textarea'

import { dictItemFormSchema, type DictItemFormValues } from '../types'
import {
  buildParentOptions,
  collectItemSubtreeIds,
  findTreeNode,
  type DictItemTreeNode,
} from '../utils'

type DictItemFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 提交成功回调，父级用于刷新列表 */
  onSuccess: () => void
  /** 待编辑字典项；null 为新增模式 */
  item: DictItem | null
  /** 当前类型的管理树（父级下拉选项来源） */
  tree: DictItemTreeNode[]
  /** 所属字典类型 ID */
  dictTypeId: number
  /** 新增模式的默认父级 id（0=根级） */
  defaultParentId: number
}

const defaultValues: DictItemFormValues = {
  parentId: '0',
  label: '',
  value: '',
  status: 0,
  sort: 0,
  remark: '',
}

export default function DictItemFormDialog({
  open,
  onOpenChange,
  onSuccess,
  item,
  tree,
  dictTypeId,
  defaultParentId,
}: DictItemFormDialogProps) {
  const isEdit = !!item
  const form = useForm<DictItemFormValues>({
    resolver: zodResolver(dictItemFormSchema),
    defaultValues,
  })
  const formDefaultValues = useMemo(
    () => ({ ...defaultValues, parentId: String(defaultParentId) }),
    [defaultParentId]
  )
  const { loading, submit } = useFormDialog<
    DictItemFormValues,
    DictItem,
    CreateDictItemParams,
    UpdateDictItemParams
  >({
    form,
    open,
    entity: item,
    defaultValues: formDefaultValues,
    getEditValues: (currentItem) => ({
      parentId: String(currentItem.parentId),
      label: currentItem.label,
      value: currentItem.value,
      status: currentItem.status,
      sort: currentItem.sort,
      remark: currentItem.remark,
    }),
    create: createDictItem,
    update: updateDictItem,
    getCreateParams: (values) => ({
      dictTypeId,
      ...(values.parentId !== '0' ? { parentId: Number(values.parentId) } : {}),
      label: values.label,
      value: values.value,
      status: values.status,
      sort: values.sort,
      remark: values.remark,
    }),
    getUpdateParams: (currentItem, values) => ({
      id: Number(currentItem.id),
      dictTypeId,
      parentId: Number(values.parentId),
      label: values.label,
      value: values.value,
      status: values.status,
      sort: values.sort,
      remark: values.remark,
    }),
    onOpenChange,
    onSuccess,
  })
  // 状态选项从「通用状态」字典读取，避免在表单中写死启用/停用
  // 编辑时父级下拉排除自身及子孙节点（后端禁止移动到自身/子孙下）
  const parentOptions = useMemo(() => {
    const excluded = new Set<number>()
    if (item) {
      const node = findTreeNode(tree, Number(item.id))
      if (node) collectItemSubtreeIds(node).forEach((id) => excluded.add(id))
    }
    return buildParentOptions(tree, excluded)
  }, [item, tree])

  return (
    <FormDialog
      open={open}
      title={isEdit ? '编辑字典项' : '新增字典项'}
      onOpenChange={onOpenChange}
      formId='dict-item-form'
      loading={loading}
      loadingText={isEdit ? '保存中...' : '创建中...'}
      className='sm:max-w-md'
    >
      <DialogDescription>
        同类型下键值唯一；删除项会级联删除其全部子孙节点
      </DialogDescription>
      <Form
        {...form}
        schema={dictItemFormSchema}
      >
        <form
          id='dict-item-form'
          className='flex flex-col gap-4'
          onSubmit={form.handleSubmit(submit)}
        >
          <FormField
            control={form.control}
            name='label'
            render={({ field }) => (
              <FormItem>
                <FormLabel>字典标签</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder='如：男'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='value'
            render={({ field }) => (
              <FormItem>
                <FormLabel>字典键值</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder='如：0'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='parentId'
            render={({ field }) => (
              <FormItem>
                <FormLabel showRequired={false}>父级</FormLabel>
                <SelectData
                  options={[{ value: '0', label: '根级' }, ...parentOptions]}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder='选择父级'
                  className='w-full'
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <DictSelectField
            control={form.control}
            name='status'
            label='状态'
            dictKey='sys_normal_disable'
          />
          <FormField
            control={form.control}
            name='sort'
            render={({ field }) => (
              <FormItem>
                <FormLabel showRequired={false}>排序</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type='number'
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === ''
                          ? 0
                          : Number(event.target.value)
                      )
                    }
                    placeholder='如：0'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='remark'
            render={({ field }) => (
              <FormItem>
                <FormLabel showRequired={false}>备注</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={3}
                    placeholder='选填'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </FormDialog>
  )
}
