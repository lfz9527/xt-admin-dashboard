import { useEffect, type ReactNode } from 'react'
import { useParams } from 'react-router'

import { GENDER_OPTIONS } from '@/features/user/constant'
import { useRequest } from '@/hooks'
import { getUser } from '@/service/users'
import { Avatar, AvatarFallback } from '@/ui/Avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/Card'
import { Spinner } from '@/ui/Spinner'

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

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
    if (id) run(Number(id))
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
      <CardHeader className='flex-row items-center gap-3'>
        <Avatar
          size='lg'
          className='size-12'
        >
          <AvatarFallback>{data.nickname.charAt(0)}</AvatarFallback>
        </Avatar>
        <CardTitle>用户详情</CardTitle>
      </CardHeader>
      <CardContent>
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
            GENDER_OPTIONS.find((option) => option.value === data.gender)?.label
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
        <Field
          label='最近登录'
          value={
            data.lastLoginTime ? formatDateTime(data.lastLoginTime) : '从未登录'
          }
        />
        {/* 后端暂未返回该字段时不展示 */}
        {data.lastLoginIp != null && (
          <Field
            label='登录 IP'
            value={data.lastLoginIp}
          />
        )}
        <Field
          label='注册时间'
          value={formatDateTime(data.createdAt)}
        />
        <Field
          label='更新时间'
          value={formatDateTime(data.updatedAt)}
        />
      </CardContent>
    </Card>
  )
}
