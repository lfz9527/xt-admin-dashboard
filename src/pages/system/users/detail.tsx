import { useEffect, type ReactNode } from 'react'
import { useParams } from 'react-router'

import defaultAvatar from '@/assets/icon/default-avatar.svg'
import { GENDER_OPTIONS } from '@/features/user/constant'
import { useRequest } from '@/hooks'
import { getUser } from '@/service/users'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/Avatar'
import { Card, CardContent, CardHeader } from '@/ui/Card'
import { Separator } from '@/ui/Separator'
import { Spinner } from '@/ui/Spinner'
import { formatDateTime } from '@/utils/date'

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className='flex gap-4 py-2'>
      <span className='text-muted-foreground w-24 shrink-0'>{label}</span>
      <span>{value ?? '-'}</span>
    </div>
  )
}

export default function UserDetail() {
  const { id } = useParams()
  const { data, loading, error, run } = useRequest(getUser, {
    immediate: false,
  })

  useEffect(() => {
    if (id) run(id)
  }, [id, run])

  if (loading) {
    return (
      <div className='flex justify-center py-16'>
        <Spinner className='size-6' />
      </div>
    )
  }
  if (error || !data) {
    return (
      <div className='flex justify-center py-16'>
        <span className='text-destructive text-sm'>
          {error?.message ?? '未找到该用户'}
        </span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <Avatar
          size='lg'
          className='size-12'
        >
          <AvatarImage
            src={data.avatar || defaultAvatar}
            alt={data.nickname}
          />
          <AvatarFallback>{data.nickname.charAt(0)}</AvatarFallback>
        </Avatar>
      </CardHeader>
      <CardContent className='flex flex-col'>
        <div>
          <p className='text-muted-foreground mb-2 text-sm font-medium'>
            基本信息
          </p>
          <div className='grid grid-cols-1 gap-x-8 sm:grid-cols-2'>
            <Field
              label='昵称'
              value={data.nickname}
            />
            <Field
              label='邮箱'
              value={data.email}
            />
            <Field
              label='性别'
              value={
                GENDER_OPTIONS.find((option) => option.value === data.gender)
                  ?.label
              }
            />
            {/* 后端约定：0=正常（启用）1=停用 */}
            <Field
              label='状态'
              value={data.status === 0 ? '启用' : '停用'}
            />
            <Field
              label='角色'
              value={data.role?.name ?? '无角色'}
            />
          </div>
        </div>
        <Separator className='my-4' />
        <div>
          <p className='text-muted-foreground mb-2 text-sm font-medium'>
            账号信息
          </p>
          <div className='grid grid-cols-1 gap-x-8 sm:grid-cols-2'>
            <Field
              label='最近登录'
              value={
                data.lastLoginTime
                  ? formatDateTime(data.lastLoginTime)
                  : '从未登录'
              }
            />
            {/* 后端暂未返回该字段时不展示 */}
            {data.lastLoginIp != null && (
              <Field
                label='登录 IP'
                value={data.lastLoginIp}
              />
            )}
          </div>
        </div>
        <Separator className='my-4' />
        <div>
          <p className='text-muted-foreground mb-2 text-sm font-medium'>
            系统信息
          </p>
          <div className='grid grid-cols-1 gap-x-8 sm:grid-cols-2'>
            <Field
              label='注册时间'
              value={formatDateTime(data.createdAt)}
            />
            <Field
              label='更新时间'
              value={formatDateTime(data.updatedAt)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
