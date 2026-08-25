import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { useRequest } from '@/hooks'
import { getRoles } from '@/service/roles'
import { createUser, updateUser, type UserItem } from '@/service/users'
import { Button } from '@/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/Dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/Form'
import { Input } from '@/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/Select'
import { Spinner } from '@/ui/Spinner'
import { toast } from '@/ui/Toast'

import { GENDER_OPTIONS } from '../constant'
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
        // 编辑不允许修改密码；角色必填，校验已保证非空
        await updateAsync({
          id: user.id,
          nickname: values.nickname,
          email: values.email,
          gender: values.gender,
          roleId: values.roleId ?? undefined,
          status: values.status,
        })
        toast.success('保存成功')
      } else {
        await createAsync({
          nickname: values.nickname,
          email: values.email,
          password: values.password,
          gender: values.gender,
          roleId: values.roleId ?? undefined,
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
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑用户' : '新增用户'}</DialogTitle>
          {!isEdit && (
            <DialogDescription>由管理员创建，无需邮箱验证</DialogDescription>
          )}
        </DialogHeader>
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
                  <Select
                    value={field.value == null ? '' : field.value}
                    onValueChange={(value) =>
                      field.onChange(value === '' ? null : value)
                    }
                  >
                    <SelectTrigger
                      className='w-full'
                      disabled={roleLoading}
                    >
                      <SelectValue>
                        {field.value == null
                          ? '请选择角色'
                          : (roleList.find((role) => role.id === field.value)
                              ?.name ?? user?.role?.name)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {roleList.map((role) => (
                        <SelectItem
                          key={role.id}
                          value={role.id}
                        >
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select
                    value={String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue>
                        {
                          GENDER_OPTIONS.find(
                            (option) => option.value === field.value
                          )?.label
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={String(option.value)}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select
                    value={String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue>
                        {field.value === 0 ? '启用' : '停用'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='0'>启用</SelectItem>
                      <SelectItem value='1'>停用</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type='submit'
            form='user-form'
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner />
                {isEdit ? '保存中...' : '创建中...'}
              </>
            ) : (
              '确认'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
