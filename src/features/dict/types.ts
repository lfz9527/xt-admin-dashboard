import { z } from 'zod'

/** 字典类型表单值（sort 为字符串输入，经 coerce 转数字） */
export const dictTypeFormSchema = z.object({
  /** 字典名称，1-30 字符 */
  name: z.string().min(1, '请输入字典名称').max(30, '字典名称最长 30 字符'),
  /** 字典编码，1-50 字符，全局唯一 */
  dictKey: z.string().min(1, '请输入字典编码').max(50, '字典编码最长 50 字符'),
  /** 状态：0=正常 1=停用 */
  status: z.number(),
  /** 显示顺序，最小 0（Input 输入在 onChange 处理为数字，保证 schema 输入/输出类型一致） */
  sort: z.number().int().min(0, '排序最小 0'),
  /** 备注，≤255 字符 */
  remark: z.string().max(255, '备注最长 255 字符'),
})

export type DictTypeFormValues = z.infer<typeof dictTypeFormSchema>

/** 字典项表单值（parentId 为下拉字符串，'0' 表示根级） */
export const dictItemFormSchema = z.object({
  /** 父字典项 id，'0' 表示根级 */
  parentId: z.string(),
  /** 字典标签，1-50 字符 */
  label: z.string().min(1, '请输入字典标签').max(50, '字典标签最长 50 字符'),
  /** 字典键值，1-100 字符，同类型下唯一 */
  value: z.string().min(1, '请输入字典键值').max(100, '字典键值最长 100 字符'),
  /** 状态：0=正常 1=停用 */
  status: z.number(),
  /** 显示顺序，最小 0（Input 输入在 onChange 处理为数字，保证 schema 输入/输出类型一致） */
  sort: z.number().int().min(0, '排序最小 0'),
  /** 备注，≤255 字符 */
  remark: z.string().max(255, '备注最长 255 字符'),
})

export type DictItemFormValues = z.infer<typeof dictItemFormSchema>
