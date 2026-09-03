import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Modal } from '@/components/Modal'
import { SelectData } from '@/components/SelectData'
import { useRequest, useDictOptions } from '@/hooks'
import { getRoles } from '@/service/roles'
import { createUser, updateUser, type UserItem } from '@/service/users'
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
import { toast } from '@/ui/Toast'

import {
  createUserSchema,
  updateUserSchema,
  type UserFormValues,
} from '../types'

type UserFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 提交成功回调，父级用于刷新列表 */
  onSuccess: () => void
  /** 待编辑用户；null 为新增模式 */
  user: UserItem | null
}

const defaultValues: UserFormValues = {
  nickname: '',
  email: '',
  password: '',
  gender: 2,
  roleId: null,
  status: 0,
}

export default function UserFormDialog({
  open,
  onOpenChange,
  onSuccess,
  user,
}: UserFormDialogProps) {
  const isEdit = !!user
  const form = useForm<UserFormValues>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
    defaultValues,
  })
  const { runAsync: createAsync, loading: createLoading } = useRequest(
    createUser,
    { immediate: false }
  )
  const { runAsync: updateAsync, loading: updateLoading } = useRequest(
    updateUser,
    { immediate: false }
  )
  const loading = createLoading || updateLoading

  // 性别/状态选项从字典读取，避免在表单中写死
  const { options: genderOptions } = useDictOptions('sys_user_sex')
  const { options: statusOptions } = useDictOptions('sys_normal_disable')

  // 角色下拉数据：分页接口，取第一页（pageSize 100 为接口上限）
  const {
    data: roleData,
    run: loadRoles,
    loading: roleLoading,
  } = useRequest(getRoles, { immediate: false })
  const roleList = roleData?.list ?? []

  useEffect(() => {
    if (open) loadRoles({ page: 1, pageSize: 100 })
  }, [open, loadRoles])

  // 每次打开按模式重置表单，避免残留上次输入
  useEffect(() => {
    if (open) {
      form.reset(
        user
          ? {
              nickname: user.nickname,
              email: user.email,
              password: '',
              gender: user.gender,
              roleId: user.roleId,
              status: user.status,
            }
          : defaultValues
      )
    }
  }, [open, user, form])

  async function onSubmit(values: UserFormValues) {
    try {
      if (isEdit) {
        // 编辑不允许修改密码；角色必填，校验已保证非空；后端 DTO 校验 id/roleId 必须为数字
        await updateAsync({
          id: Number(user.id),
          nickname: values.nickname,
          email: values.email,
          gender: values.gender,
          roleId: values.roleId == null ? undefined : Number(values.roleId),
          status: values.status,
        })
        toast.success('保存成功')
      } else {
        await createAsync({
          nickname: values.nickname,
          email: values.email,
          password: values.password,
          gender: values.gender,
          roleId: values.roleId == null ? undefined : Number(values.roleId),
          status: values.status,
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
      title={isEdit ? '编辑用户' : '新增用户'}
      onCancel={() => onOpenChange(false)}
      confirmLoading={loading}
      okText={loading ? (isEdit ? '保存中...' : '创建中...') : '确认'}
      okButtonProps={{ type: 'submit', form: 'user-form' }}
      className='sm:max-w-md'
    >
      {!isEdit && (
        <DialogDescription>由管理员创建，无需邮箱验证</DialogDescription>
      )}
      <Form
        {...form}
        schema={isEdit ? updateUserSchema : createUserSchema}
      >
        <form
          id='user-form'
          className='flex flex-col gap-4'
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name='nickname'
            render={({ field }) => (
              <FormItem>
                <FormLabel>昵称</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder='请输入昵称'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>邮箱</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder='请输入邮箱'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {!isEdit && (
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密码</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='password'
                      placeholder='请输入密码'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name='roleId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>角色</FormLabel>
                <SelectData
                  options={roleList.map((role) => ({
                    value: role.id,
                    label: role.name,
                  }))}
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  placeholder='请选择角色'
                  disabled={roleLoading}
                  className='w-full'
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='gender'
            render={({ field }) => (
              <FormItem>
                <FormLabel showRequired={false}>性别</FormLabel>
                <SelectData
                  options={genderOptions}
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
        </form>
      </Form>
    </Modal>
  )
}
