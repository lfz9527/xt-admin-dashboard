import { z } from 'zod'

export const createRoleSchema = z.object({
  name: z.string().min(1, '请输入角色名称').max(30, '角色名称最长 30 字符'),
  roleKey: z.string().min(1, '请输入角色编码').max(50, '角色编码最长 50 字符'),
  status: z.number(),
  remark: z.string().max(255, '备注最长 255 字符'),
})

export type CreateRoleValues = z.infer<typeof createRoleSchema>
