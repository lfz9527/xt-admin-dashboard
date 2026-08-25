import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { useRequest } from '@/hooks'
import { createRole, updateRole, type RoleItem } from '@/service/roles'
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
        // roleKey 创建后不可修改，更新不传该字段
        await updateAsync({
          id: role.id,
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
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑角色' : '新增角色'}</DialogTitle>
          <DialogDescription>角色编码创建后不可修改</DialogDescription>
        </DialogHeader>
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
            form='role-form'
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
