import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { SelectData } from '@/components/SelectData'
import { useRequest } from '@/hooks'
import {
  createBookmark,
  updateBookmark,
  type BookmarkNode,
} from '@/service/bookmarks'
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
import { Spinner } from '@/ui/Spinner'
import { toast } from '@/ui/Toast'

import { bookmarkFormSchema, type BookmarkFormValues } from '../types'

type BookmarkFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 提交成功回调，父级用于刷新列表 */
  onSuccess: () => void
  /** 待编辑节点；null 为新增模式 */
  node: BookmarkNode | null
  /** 收藏树（父级下拉选项来源） */
  tree: BookmarkNode[]
  /** 新增模式的默认父级 id（0=根级） */
  defaultParentId: number
}

const defaultValues: BookmarkFormValues = {
  type: 1,
  title: '',
  url: '',
  parentId: '0',
}

/** 收集全部文件夹节点（编辑时排除自身及其子孙，后端禁止移动到自身/子孙下） */
function collectFolderOptions(
  nodes: BookmarkNode[],
  excluded: Set<number>
): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  const walk = (items: BookmarkNode[]) => {
    for (const item of items) {
      if (item.type === 1 && !excluded.has(item.id)) {
        options.push({ value: String(item.id), label: item.title })
        walk(item.children)
      }
    }
  }
  walk(nodes)
  return options
}

/** 收集节点自身及全部子孙 id */
function collectSubtreeIds(node: BookmarkNode): Set<number> {
  const ids = new Set<number>()
  const walk = (item: BookmarkNode) => {
    ids.add(item.id)
    item.children.forEach(walk)
  }
  walk(node)
  return ids
}

export default function BookmarkFormDialog({
  open,
  onOpenChange,
  onSuccess,
  node,
  tree,
  defaultParentId,
}: BookmarkFormDialogProps) {
  const isEdit = !!node
  const form = useForm<BookmarkFormValues>({
    resolver: zodResolver(bookmarkFormSchema),
    defaultValues,
  })
  const { runAsync: createAsync, loading: createLoading } = useRequest(
    createBookmark,
    { immediate: false }
  )
  const { runAsync: updateAsync, loading: updateLoading } = useRequest(
    updateBookmark,
    { immediate: false }
  )
  const loading = createLoading || updateLoading

  // 每次打开按模式重置表单，避免残留上次输入
  useEffect(() => {
    if (open) {
      form.reset(
        node
          ? {
              type: node.type,
              title: node.title,
              url: node.url,
              parentId: String(node.parentId),
            }
          : { ...defaultValues, parentId: String(defaultParentId) }
      )
    }
  }, [open, node, defaultParentId, form])

  // 编辑时父级下拉排除自身与子孙节点
  const folderOptions = useMemo(
    () =>
      collectFolderOptions(
        tree,
        node ? collectSubtreeIds(node) : new Set<number>()
      ),
    [tree, node]
  )

  async function onSubmit(values: BookmarkFormValues) {
    try {
      if (isEdit) {
        await updateAsync({
          id: Number(node.id),
          title: values.title,
          // 文件夹传空 url 会被后端拒绝，仅收藏类型提交 url
          ...(values.type === 2 ? { url: values.url } : {}),
          // 后端以 0 表示根级
          parentId: Number(values.parentId),
        })
        toast.success('保存成功')
      } else {
        await createAsync({
          type: values.type,
          title: values.title,
          ...(values.type === 2 ? { url: values.url } : {}),
          // 根级不传 parentId（后端默认 0）
          ...(values.parentId !== '0'
            ? { parentId: Number(values.parentId) }
            : {}),
        })
        toast.success('创建成功')
      }
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  // 类型切换时控制网址字段显隐；useWatch 订阅可被 React Compiler 安全记忆
  const watchType = useWatch({ control: form.control, name: 'type' })

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑书签' : '新增书签'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '类型不可修改' : '收藏需填写网址，文件夹可包含子项'}
          </DialogDescription>
        </DialogHeader>
        <Form
          {...form}
          schema={bookmarkFormSchema}
        >
          <form
            id='bookmark-form'
            // min-w-0：DialogContent 为 grid 布局，默认 min-width:auto 会让超长父级名把轨道撑破溢出弹窗
            className='flex min-w-0 flex-col gap-4'
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>类型</FormLabel>
                  <SelectData
                    options={[
                      { value: '1', label: '文件夹' },
                      { value: '2', label: '收藏' },
                    ]}
                    value={String(field.value)}
                    onChange={(value) => field.onChange(Number(value))}
                    disabled={isEdit}
                    className='w-full'
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名称</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={
                        watchType === 1 ? '如：常用网站' : '如：GitHub'
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {watchType === 2 && (
              <FormField
                control={form.control}
                name='url'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>网址</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder='如：https://github.com'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name='parentId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel showRequired={false}>父级</FormLabel>
                  <SelectData
                    options={[{ value: '0', label: '根级' }, ...folderOptions]}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder='选择父级文件夹'
                    className='w-full'
                  />
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
            form='bookmark-form'
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
