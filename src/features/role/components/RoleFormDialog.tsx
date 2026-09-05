import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormDialog } from '@/components/FormDialog'
import { DictSelectField } from '@/components/DictSelectField'
import { useFormDialog } from '@/hooks'
import {
  createRole,
  updateRole,
  type CreateRoleParams,
  type RoleItem,
  type UpdateRoleParams,
} from '@/service/roles'
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
  const { loading, submit } = useFormDialog<
    CreateRoleValues,
    RoleItem,
    CreateRoleParams,
    UpdateRoleParams
  >({
    form,
    open,
    entity: role,
    defaultValues,
    getEditValues: (item) => ({
      name: item.name,
      roleKey: item.roleKey,
      status: item.status,
      remark: item.remark,
    }),
    create: createRole,
    update: updateRole,
    getCreateParams: (values) => values,
    getUpdateParams: (item, values) => ({
      id: Number(item.id),
      name: values.name,
      status: values.status,
      remark: values.remark,
    }),
    onOpenChange,
    onSuccess,
  })
  // 状态选项从「通用状态」字典读取，避免在表单中写死启用/停用
  return (
    <FormDialog
      open={open}
      title={isEdit ? '编辑角色' : '新增角色'}
      onOpenChange={onOpenChange}
      formId='role-form'
      loading={loading}
      loadingText={isEdit ? '保存中...' : '创建中...'}
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
          onSubmit={form.handleSubmit(submit)}
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
          <DictSelectField
            control={form.control}
            name='status'
            label='状态'
            dictKey='sys_normal_disable'
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
