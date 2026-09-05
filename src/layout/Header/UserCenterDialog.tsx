import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Modal } from '@/components/Modal'
import defaultAvatar from '@/assets/icon/default-avatar.svg'
import ForgotPasswordForm from '@/features/auth/components/ForgotPasswordForm'
import { useResetPassword, useSendResetCode } from '@/features/auth/hooks'
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from '@/features/auth/types'
import { useRequest, useDictOptions } from '@/hooks'
import { authLogout } from '@/features/auth/session'
import { updateProfile, uploadAvatar } from '@/service/users'
import useAuthor from '@/store/useAuthor'
import { Button } from '@/ui/Button'
import { UploadThingAvatar } from '@/ui/UploadthingAvatar'
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
  // 性别选项与回显文案从字典读取，避免写死
  const { options: genderOptions, labelOf: genderLabelOf } =
    useDictOptions('sys_user_sex')
  const { runAsync: runSendResetCode } = useSendResetCode()
  const { runAsync: runResetPassword } = useResetPassword()
  const { runAsync: runUpdateProfile, loading: updateLoading } = useRequest(
    updateProfile,
    { immediate: false }
  )
  const { runAsync: runUploadAvatar } = useRequest(uploadAvatar, {
    immediate: false,
  })
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

  const handleOpenChangeComplete = (next: boolean) => {
    // 关闭动画结束后再复位视图，避免关闭过程中编辑/修改密码表单闪回信息视图
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

  const onUploadAvatar = async (file: File) => {
    // 上传成功后后端返回更新后的用户对象（含新头像地址），写入认证 store
    const updated = await runUploadAvatar(file)
    setUser(updated)
    toast.success('头像上传成功')
    return updated.avatar
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
    <Modal
      open={open}
      title={
        view === 'info' ? '个人中心' : view === 'edit' ? '编辑资料' : '修改密码'
      }
      onCancel={() => onOpenChange(false)}
      afterOpenChange={handleOpenChangeComplete}
      footer={
        view === 'info' ? (
          <>
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
          </>
        ) : view === 'edit' ? (
          <>
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
          </>
        ) : null
      }
      className='sm:max-w-sm'
    >
      {view === 'info' ? (
        <>
          <div className='flex flex-col items-center gap-1 py-1'>
            <UploadThingAvatar
              value={user?.avatar || defaultAvatar}
              onUpload={onUploadAvatar}
              size='sm'
              fallback={user?.nickname?.[0]}
            />
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
              value={user && genderLabelOf(user.gender)}
            />
            <Field
              label='角色'
              value={user?.role?.name ?? '无角色'}
            />
          </div>
        </>
      ) : view === 'edit' ? (
        <>
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
                        <SelectValue>{genderLabelOf(field.value)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {genderOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
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
        </>
      ) : (
        <ForgotPasswordForm
          form={form}
          onSubmit={onSubmit}
          onBackToLogin={() => setView('info')}
          onSendCode={onSendCode}
          backText='返回'
        />
      )}
    </Modal>
  )
}
