import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Modal } from '@/components/Modal'
import { SelectData } from '@/components/SelectData'
import { useRequest } from '@/hooks'
import { createDictItem, updateDictItem, type DictItem } from '@/service/dict'
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
import { toast } from '@/ui/Toast'

import { STATUS_OPTIONS } from '../constant'
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
  const { runAsync: createAsync, loading: createLoading } = useRequest(
    createDictItem,
    { immediate: false }
  )
  const { runAsync: updateAsync, loading: updateLoading } = useRequest(
    updateDictItem,
    { immediate: false }
  )
  const loading = createLoading || updateLoading

  // 每次打开按模式重置表单，避免残留上次输入
  useEffect(() => {
    if (open) {
      form.reset(
        item
          ? {
              parentId: String(item.parentId),
              label: item.label,
              value: item.value,
              status: item.status,
              sort: item.sort,
              remark: item.remark,
            }
          : { ...defaultValues, parentId: String(defaultParentId) }
      )
    }
  }, [open, item, defaultParentId, form])

  // 编辑时父级下拉排除自身及子孙节点（后端禁止移动到自身/子孙下）
  const parentOptions = useMemo(() => {
    const excluded = new Set<number>()
    if (item) {
      const node = findTreeNode(tree, Number(item.id))
      if (node) collectItemSubtreeIds(node).forEach((id) => excluded.add(id))
    }
    return buildParentOptions(tree, excluded)
  }, [item, tree])

  async function onSubmit(values: DictItemFormValues) {
    try {
      if (isEdit) {
        // 后端 DTO 校验 id 必须为数字；parentId 显式提交（0 表示根级）
        await updateAsync({
          id: Number(item.id),
          dictTypeId,
          parentId: Number(values.parentId),
          label: values.label,
          value: values.value,
          status: values.status,
          sort: values.sort,
          remark: values.remark,
        })
        toast.success('保存成功')
      } else {
        await createAsync({
          dictTypeId,
          ...(values.parentId !== '0'
            ? { parentId: Number(values.parentId) }
            : {}),
          label: values.label,
          value: values.value,
          status: values.status,
          sort: values.sort,
          remark: values.remark,
        })
        toast.success('创建成功')
      }
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? '编辑字典项' : '新增字典项'}
      onCancel={() => onOpenChange(false)}
      confirmLoading={loading}
      okText={loading ? (isEdit ? '保存中...' : '创建中...') : '确认'}
      okButtonProps={{ type: 'submit', form: 'dict-item-form' }}
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
          onSubmit={form.handleSubmit(onSubmit)}
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
          <FormField
            control={form.control}
            name='status'
            render={({ field }) => (
              <FormItem>
                <FormLabel showRequired={false}>状态</FormLabel>
                <SelectData
                  options={STATUS_OPTIONS}
                  value={String(field.value)}
                  onChange={(value) => field.onChange(Number(value))}
                  className='w-full'
                />
                <FormMessage />
              </FormItem>
            )}
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
    </Modal>
  )
}
