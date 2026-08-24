import { z } from 'zod'

const userBaseSchema = z.object({
  nickname: z.string().min(1, '请输入昵称').max(30, '昵称最长 30 字符'),
  email: z
    .string()
    .min(1, '请输入邮箱')
    .email('邮箱格式不正确')
    .max(100, '邮箱最长 100 字符'),
  /** 性别：0=男 1=女 2=未知 */
  gender: z.number(),
  /** 状态：0=正常 1=停用 */
  status: z.number(),
  /** 角色 ID，新增/编辑均必填 */
  roleId: z
    .number()
    .nullable()
    .refine((value) => value !== null, '请选择角色'),
})

export const createUserSchema = userBaseSchema.extend({
  password: z.string().min(6, '密码最少 6 位').max(255, '密码最长 255 字符'),
})

/**
 * 编辑模式：不提供密码字段（不允许编辑密码），表单不渲染、提交不带 password。
 * 保留 password 仅为与 createUserSchema 输入结构一致，避免 zodResolver 联合类型推断不兼容。
 */
export const updateUserSchema = userBaseSchema.extend({
  password: z
    .string()
    .max(255, '密码最长 255 字符')
    .refine((value) => value === '' || value.length >= 6, '密码最少 6 位'),
})

/** 新增/编辑共用的表单值类型（roleId 为空表示未选择；必填/可空由各自 schema 校验） */
export type UserFormValues = z.input<typeof createUserSchema>
