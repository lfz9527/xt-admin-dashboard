import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Modal } from '@/components/Modal'
import { SelectData } from '@/components/SelectData'
import { useRequest } from '@/hooks'
import { createRole, updateRole, type RoleItem } from '@/service/roles'
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

import { createRoleSchema, type CreateRoleValues } from '../types'

type RoleFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 提交成功回调，父级用于刷新列表 */
  onSuccess: () => void
  /** 待编辑角色；null 为新增模式 */
  role: RoleItem | null
}

const defaultValues: CreateRoleValues = {
  name: '',
  roleKey: '',
  status: 0,
  remark: '',
}

export default function RoleFormDialog({
  open,
  onOpenChange,
  onSuccess,
  role,
}: RoleFormDialogProps) {
  const isEdit = !!role
  const form = useForm<CreateRoleValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues,
  })
  const { runAsync: createAsync, loading: createLoading } = useRequest(
    createRole,
    { immediate: false }
  )
  const { runAsync: updateAsync, loading: updateLoading } = useRequest(
    updateRole,
    { immediate: false }
  )
  const loading = createLoading || updateLoading

  // 每次打开按模式重置表单，避免残留上次输入
  useEffect(() => {
    if (open) {
      form.reset(
        role
          ? {
              name: role.name,
              roleKey: role.roleKey,
              status: role.status,
              remark: role.remark,
            }
          : defaultValues
      )
    }
  }, [open, role, form])

  async function onSubmit(values: CreateRoleValues) {
    try {
      if (isEdit) {
        // roleKey 创建后不可修改，更新不传该字段；后端 DTO 校验 id 必须为数字
        await updateAsync({
          id: Number(role.id),
          name: values.name,
          status: values.status,
          remark: values.remark,
        })
        toast.success('保存成功')
      } else {
        await createAsync(values)
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
      title={isEdit ? '编辑角色' : '新增角色'}
      onCancel={() => onOpenChange(false)}
      confirmLoading={loading}
      okText={loading ? (isEdit ? '保存中...' : '创建中...') : '确认'}
      okButtonProps={{ type: 'submit', form: 'role-form' }}
      className='sm:max-w-md'
    >
      <DialogDescription>角色编码创建后不可修改</DialogDescription>
      <Form
        {...form}
        schema={createRoleSchema}
      >
        <form
          id='role-form'
          className='flex flex-col gap-4'
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>角色名称</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder='如：运营'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='roleKey'
            render={({ field }) => (
              <FormItem>
                <FormLabel>角色编码</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isEdit}
                    placeholder='如：operator'
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
                  options={[
                    { value: '0', label: '启用' },
                    { value: '1', label: '停用' },
                  ]}
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
