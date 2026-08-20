import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'

import Logo from '@/components/Logo'
import { Button } from '@/ui/Button'
import { Input } from '@/ui/Input'
import { Spinner } from '@/ui/Spinner'
import { toast } from '@/ui/Toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/Card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/Form'

const schema = z
  .object({
    email: z.string().email('请输入有效的邮箱'),
    code: z.string().min(1, '请输入验证码'),
    password: z.string().min(1, '请输入新密码'),
    confirmPassword: z.string().min(1, '请确认密码'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: '两次输入的密码不一致',
  })

type Values = z.infer<typeof schema>

export default function ForgotPasswordFeature() {
  const navigate = useNavigate()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', code: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (_values: Values) => {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    toast.success('密码重置成功')
    navigate('/login', { replace: true })
  }

  const fields = [
    ['email', '邮箱', '请输入邮箱', 'email'],
    ['code', '验证码', '请输入验证码', 'one-time-code'],
    ['password', '新密码', '请输入新密码', 'new-password'],
    ['confirmPassword', '确认密码', '请确认密码', 'new-password'],
  ] as const

  return (
    <main className='bg-muted/30 flex min-h-dvh items-center justify-center px-4 py-6 sm:py-8'>
      <Card className='w-full max-w-md gap-5 rounded-2xl py-6 shadow-xl shadow-black/5 sm:py-8'>
        <CardHeader className='items-center px-6 text-center sm:px-8'>
          <Logo />
          <div className='mt-3 space-y-1'>
            <CardTitle className='text-xl'>忘记密码</CardTitle>
            <CardDescription>重置你的管理后台密码</CardDescription>
          </div>
        </CardHeader>
        <CardContent className='px-6 sm:px-8'>
          <Form {...form}>
            <form
              className='flex flex-col gap-5'
              onSubmit={form.handleSubmit(onSubmit)}
            >
              {fields.map(([name, label, placeholder, autoComplete]) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type={name.includes('password') ? 'password' : 'text'}
                          autoComplete={autoComplete}
                          placeholder={placeholder}
                          className='h-10'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <Button
                type='submit'
                className='h-10 w-full'
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Spinner />
                    重置中...
                  </>
                ) : (
                  '重置密码'
                )}
              </Button>
              <Link
                to='/login'
                className='text-muted-foreground text-center text-sm underline-offset-4 hover:underline'
              >
                返回登录
              </Link>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  )
}
