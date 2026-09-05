import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormDialog } from '@/components/FormDialog'
import { DictSelectField } from '@/components/DictSelectField'
import { useFormDialog } from '@/hooks'
import {
  createDictType,
  updateDictType,
  type CreateDictTypeParams,
  type UpdateDictTypeParams,
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
  const { loading, submit } = useFormDialog<
    DictTypeFormValues,
    DictTypeItem,
    CreateDictTypeParams,
    UpdateDictTypeParams
  >({
    form,
    open,
    entity: type,
    defaultValues,
    getEditValues: (item) => ({
      name: item.name,
      dictKey: item.dictKey,
      status: item.status,
      sort: item.sort,
      remark: item.remark,
    }),
    create: createDictType,
    update: updateDictType,
    getCreateParams: (values) => values,
    getUpdateParams: (item, values) => ({
      id: Number(item.id),
      name: values.name,
      dictKey: values.dictKey,
      status: values.status,
      sort: values.sort,
      remark: values.remark,
    }),
    onOpenChange,
    onSuccess,
  })
  return (
    <FormDialog
      open={open}
      title={isEdit ? '编辑字典类型' : '新增字典类型'}
      onOpenChange={onOpenChange}
      formId='dict-type-form'
      loading={loading}
      loadingText={isEdit ? '保存中...' : '创建中...'}
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
          onSubmit={form.handleSubmit(submit)}
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
