import { z } from 'zod'

export const loginSchema = z.object({
  account: z.string().min(1, '请输入账号或邮箱'),
  password: z.string().min(1, '请输入密码'),
  remember: z.boolean(),
  captcha: z.string().min(1, '请输入验证码'),
})

export const registerSchema = z
  .object({
    email: z.email('请输入有效的邮箱'),
    username: z.string().min(1, '请输入用户名'),
    code: z.string().min(1, '请输入验证码'),
    password: z.string().min(1, '请输入密码'),
    confirmPassword: z.string().min(1, '请确认密码'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: '两次输入的密码不一致',
  })

export const forgotPasswordSchema = z
  .object({
    email: z.email('请输入有效的邮箱'),
    code: z.string().min(1, '请输入验证码'),
    password: z.string().min(1, '请输入新密码'),
    confirmPassword: z.string().min(1, '请确认密码'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: '两次输入的密码不一致',
  })

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
