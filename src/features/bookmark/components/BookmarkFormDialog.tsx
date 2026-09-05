import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { FormDialog } from '@/components/FormDialog'
import { SelectData } from '@/components/SelectData'
import { useFormDialog } from '@/hooks'
import {
  createBookmark,
  updateBookmark,
  type CreateBookmarkParams,
  type UpdateBookmarkParams,
  type BookmarkNode,
} from '@/service/bookmarks'
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
  const form = useForm<BookmarkFormValues>({
    resolver: zodResolver(bookmarkFormSchema),
    defaultValues,
  })
  const formDefaultValues = useMemo(
    () => ({ ...defaultValues, parentId: String(defaultParentId) }),
    [defaultParentId]
  )
  const { isEdit, loading, submit } = useFormDialog<
    BookmarkFormValues,
    BookmarkNode,
    CreateBookmarkParams,
    UpdateBookmarkParams
  >({
    form,
    open,
    entity: node,
    defaultValues: formDefaultValues,
    getEditValues: (currentNode) => ({
      type: currentNode.type,
      title: currentNode.title,
      url: currentNode.url,
      parentId: String(currentNode.parentId),
    }),
    create: createBookmark,
    update: updateBookmark,
    getCreateParams: (values) => ({
      type: values.type,
      title: values.title,
      ...(values.type === 2 ? { url: values.url } : {}),
      ...(values.parentId !== '0' ? { parentId: Number(values.parentId) } : {}),
    }),
    getUpdateParams: (currentNode, values) => ({
      id: Number(currentNode.id),
      title: values.title,
      ...(values.type === 2 ? { url: values.url } : {}),
      parentId: Number(values.parentId),
    }),
    onOpenChange,
    onSuccess,
  })

  // 编辑时父级下拉排除自身与子孙节点
  const folderOptions = useMemo(
    () =>
      collectFolderOptions(
        tree,
        node ? collectSubtreeIds(node) : new Set<number>()
      ),
    [tree, node]
  )

  // 类型切换时控制网址字段显隐；useWatch 订阅可被 React Compiler 安全记忆
  const watchType = useWatch({ control: form.control, name: 'type' })

  return (
    <FormDialog
      open={open}
      title={isEdit ? '编辑书签' : '新增书签'}
      onOpenChange={onOpenChange}
      formId='bookmark-form'
      loading={loading}
      loadingText={isEdit ? '保存中...' : '创建中...'}
      className='sm:max-w-md'
    >
      <DialogDescription>
        {isEdit ? '类型不可修改' : '收藏需填写网址，文件夹可包含子项'}
      </DialogDescription>
      <Form
        {...form}
        schema={bookmarkFormSchema}
      >
        <form
          id='bookmark-form'
          // min-w-0：DialogContent 为 grid 布局，默认 min-width:auto 会让超长父级名把轨道撑破溢出弹窗
          className='flex min-w-0 flex-col gap-4'
          onSubmit={form.handleSubmit(submit)}
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
    </FormDialog>
  )
}
