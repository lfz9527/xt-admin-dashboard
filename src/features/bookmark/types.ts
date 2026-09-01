import { z } from 'zod'

/** 新增/编辑收藏表单值（parentId 为下拉字符串，'0' 表示根级） */
export const bookmarkFormSchema = z
  .object({
    /** 节点类型：1=文件夹 2=收藏 */
    type: z.union([z.literal(1), z.literal(2)]),
    /** 名称，最长 255 字符 */
    title: z.string().min(1, '请输入名称').max(255, '名称最长 255 字符'),
    /** 网址，最长 2048 字符（type=2 时必填） */
    url: z.string().max(2048, '网址最长 2048 字符'),
    /** 父节点 id，'0' 表示根级 */
    parentId: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.type === 2 && !values.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: '收藏必须填写网址',
      })
    }
  })

export type BookmarkFormValues = z.infer<typeof bookmarkFormSchema>
