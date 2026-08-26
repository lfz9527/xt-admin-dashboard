import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import defaultAvatar from '@/assets/icon/default-avatar.svg'
import ForgotPasswordForm from '@/features/auth/components/ForgotPasswordForm'
import { useResetPassword, useSendResetCode } from '@/features/auth/hooks'
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from '@/features/auth/types'
import { GENDER_OPTIONS } from '@/features/user/constant'
import { useRequest } from '@/hooks'
import { authLogout } from '@/service/request'
import { updateProfile } from '@/service/users'
import useAuthor from '@/store/useAuthor'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/Avatar'
import { Button } from '@/ui/Button'
import {
  Dialog,
  DialogContent,
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

/** 编辑资料：仅允许修改昵称与性别 */
const editProfileSchema = z.object({
  nickname: z.string().trim().min(1, '请输入昵称').max(30, '昵称最长 30 字符'),
  gender: z.number(),
})

type EditProfileValues = z.infer<typeof editProfileSchema>

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className='flex gap-4 py-2'>
      <span className='text-muted-foreground w-24 shrink-0'>{label}</span>
      <span>{value ?? '-'}</span>
    </div>
  )
}

type UserCenterDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** 个人中心弹窗：展示当前登录用户信息，数据来自认证 store（挂载时已拉取） */
export default function UserCenterDialog({
  open,
  onOpenChange,
}: UserCenterDialogProps) {
  const user = useAuthor((state) => state.user)
  const setUser = useAuthor((state) => state.setUser)
  const [view, setView] = useState<'info' | 'edit' | 'password'>('info')
  const { runAsync: runSendResetCode } = useSendResetCode()
  const { runAsync: runResetPassword } = useResetPassword()
  const { runAsync: runUpdateProfile, loading: updateLoading } = useRequest(
    updateProfile,
    { immediate: false }
  )
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
      code: '',
      password: '',
      confirmPassword: '',
    },
  })
  const editForm = useForm<EditProfileValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: { nickname: '', gender: 2 },
  })

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    // 关闭弹窗时重置回信息视图
    if (!next) setView('info')
  }

  const openEdit = () => {
    // 打开编辑视图时预填当前昵称与性别
    editForm.reset({
      nickname: user?.nickname ?? '',
      gender: user?.gender ?? 2,
    })
    setView('edit')
  }

  const openChangePassword = () => {
    // 打开修改密码视图时预填当前登录邮箱
    form.reset({
      email: user?.email ?? '',
      code: '',
      password: '',
      confirmPassword: '',
    })
    setView('password')
  }

  const onSendCode = async (email: string) => {
    try {
      const result = await runSendResetCode({ email })
      toast.success(result.message)
      return true
    } catch (err) {
      toast.error((err as Error).message)
      return false
    }
  }

  const onEditSubmit = async (values: EditProfileValues) => {
    if (!user) return
    try {
      // 仅提交昵称与性别，其余字段后端忽略
      const updated = await runUpdateProfile({
        nickname: values.nickname,
        gender: values.gender,
      })
      // 后端返回更新后的用户对象，写入认证 store 供信息视图展示
      setUser(updated)
      toast.success('保存成功')
      setView('info')
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const onSubmit = async (values: ForgotPasswordValues) => {
    try {
      // 修改密码成功后后端强制所有已登录设备下线，需重新登录
      await runResetPassword({
        email: values.email,
        emailCode: values.code,
        password: values.password,
      })
      toast.success('密码修改成功，请重新登录')
      authLogout()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className='sm:max-w-sm'>
        {view === 'info' ? (
          <>
            <DialogHeader>
              <DialogTitle>个人中心</DialogTitle>
            </DialogHeader>
            <div className='flex flex-col items-center gap-1 py-1'>
              <Avatar
                size='lg'
                className='size-12'
              >
                <AvatarImage
                  src={user?.avatar || defaultAvatar}
                  alt={user?.nickname}
                />
                <AvatarFallback>{user?.nickname?.[0] ?? 'U'}</AvatarFallback>
              </Avatar>
            </div>
            <div className='divide-border divide-y'>
              <Field
                label='昵称'
                value={user?.nickname}
              />
              <Field
                label='邮箱'
                value={user?.email}
              />
              <Field
                label='性别'
                value={
                  user &&
                  GENDER_OPTIONS.find((option) => option.value === user.gender)
                    ?.label
                }
              />
              <Field
                label='角色'
                value={user?.role?.name ?? '无角色'}
              />
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={openEdit}
              >
                编辑
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={openChangePassword}
              >
                修改密码
              </Button>
              <Button
                type='button'
                onClick={() => onOpenChange(false)}
              >
                知道了
              </Button>
            </DialogFooter>
          </>
        ) : view === 'edit' ? (
          <>
            <DialogHeader>
              <DialogTitle>编辑资料</DialogTitle>
            </DialogHeader>
            <Form
              {...editForm}
              schema={editProfileSchema}
            >
              <form
                id='profile-form'
                className='flex flex-col gap-4'
                onSubmit={editForm.handleSubmit(onEditSubmit)}
              >
                <FormField
                  control={editForm.control}
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
                  control={editForm.control}
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
              </form>
            </Form>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setView('info')}
              >
                返回
              </Button>
              <Button
                type='submit'
                form='profile-form'
                disabled={updateLoading}
              >
                {updateLoading ? (
                  <>
                    <Spinner />
                    保存中...
                  </>
                ) : (
                  '保存'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>修改密码</DialogTitle>
            </DialogHeader>
            <ForgotPasswordForm
              form={form}
              onSubmit={onSubmit}
              onBackToLogin={() => setView('info')}
              onSendCode={onSendCode}
              backText='返回'
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
