import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Modal } from '@/components/Modal'
import { SelectData } from '@/components/SelectData'
import { useRequest, useDictOptions } from '@/hooks'
import {
  createDictType,
  updateDictType,
  type DictTypeItem,
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
import { toast } from '@/ui/Toast'

import { dictTypeFormSchema, type DictTypeFormValues } from '../types'

type DictTypeFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 提交成功回调，父级用于刷新列表 */
  onSuccess: () => void
  /** 待编辑字典类型；null 为新增模式 */
  type: DictTypeItem | null
}

const defaultValues: DictTypeFormValues = {
  name: '',
  dictKey: '',
  status: 0,
  sort: 0,
  remark: '',
}

export default function DictTypeFormDialog({
  open,
  onOpenChange,
  onSuccess,
  type,
}: DictTypeFormDialogProps) {
  const isEdit = !!type
  const form = useForm<DictTypeFormValues>({
    resolver: zodResolver(dictTypeFormSchema),
    defaultValues,
  })
  const { runAsync: createAsync, loading: createLoading } = useRequest(
    createDictType,
    { immediate: false }
  )
  const { runAsync: updateAsync, loading: updateLoading } = useRequest(
    updateDictType,
    { immediate: false }
  )
  const loading = createLoading || updateLoading
  // 状态选项从「通用状态」字典读取，避免在表单中写死启用/停用
  const { options: statusOptions } = useDictOptions('sys_normal_disable')

  // 每次打开按模式重置表单，避免残留上次输入
  useEffect(() => {
    if (open) {
      form.reset(
        type
          ? {
              name: type.name,
              dictKey: type.dictKey,
              status: type.status,
              sort: type.sort,
              remark: type.remark,
            }
          : defaultValues
      )
    }
  }, [open, type, form])

  async function onSubmit(values: DictTypeFormValues) {
    try {
      if (isEdit) {
        // 后端 DTO 校验 id 必须为数字，列表返回的字符串 id 需转换
        await updateAsync({
          id: Number(type.id),
          name: values.name,
          dictKey: values.dictKey,
          status: values.status,
          sort: values.sort,
          remark: values.remark,
        })
        toast.success('保存成功')
      } else {
        await createAsync({
          name: values.name,
          dictKey: values.dictKey,
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
      title={isEdit ? '编辑字典类型' : '新增字典类型'}
      onCancel={() => onOpenChange(false)}
      confirmLoading={loading}
      okText={loading ? (isEdit ? '保存中...' : '创建中...') : '确认'}
      okButtonProps={{ type: 'submit', form: 'dict-type-form' }}
      className='sm:max-w-md'
    >
      <DialogDescription>
        字典编码全局唯一，删除类型会级联删除其下全部字典项
      </DialogDescription>
      <Form
        {...form}
        schema={dictTypeFormSchema}
      >
        <form
          id='dict-type-form'
          className='flex flex-col gap-4'
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>字典名称</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder='如：用户性别'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='dictKey'
            render={({ field }) => (
              <FormItem>
                <FormLabel>字典编码</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder='如：sys_user_sex'
                  />
                </FormControl>
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
                  options={statusOptions}
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
