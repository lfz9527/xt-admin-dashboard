import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, RefreshCw, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/Form'
import { Button } from '@/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from '@/ui/Card'

const loginSchema = z.object({
  account: z.string().trim().min(3, '账号至少需要 3 个字符'),
  password: z.string().min(8, '密码至少需要 8 个字符'),
  captcha: z.string().regex(/^\d{4}$/, '请输入 4 位数字验证码'),
  remember: z.boolean(),
  agree: z.boolean().refine((value) => value, '请先同意服务协议和隐私政策'),
})

type LoginValues = z.infer<typeof loginSchema>

const createCaptcha = () => String(Math.floor(1000 + Math.random() * 9000))

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [captcha, setCaptcha] = useState(createCaptcha)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      account: '',
      password: '',
      captcha: '',
      remember: true,
      agree: false,
    },
  })

  const handleSubmit = () => {
    setSubmitted(true)
  }

  return (
    <main className='bg-muted/30 flex min-h-dvh items-center justify-center px-4 py-8'>
      <Card className='w-full max-w-md'>
        <CardHeader className='gap-3'>
          <div className='bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl'>
            <ShieldCheck
              aria-hidden='true'
              className='size-5'
            />
          </div>
          <div>
            <h1 className='cn-font-heading text-xl leading-snug font-medium'>
              欢迎回来
            </h1>
            <CardDescription className='mt-1'>
              登录管理后台，继续你的工作
            </CardDescription>
          </div>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <CardContent className='space-y-5'>
              <FormField
                control={form.control}
                name='account'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>账号</FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        autoComplete='username'
                        className='border-input bg-background aria-invalid:border-destructive aria-invalid:ring-destructive/20 focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-3'
                        placeholder='请输入账号或邮箱'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <div className='flex items-center justify-between'>
                      <FormLabel>密码</FormLabel>
                      <button
                        type='button'
                        className='text-primary text-xs hover:underline'
                        onClick={() => setSubmitted(false)}
                      >
                        忘记密码？
                      </button>
                    </div>
                    <div className='relative'>
                      <FormControl>
                        <input
                          {...field}
                          autoComplete='current-password'
                          className='border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-lg border px-3 pr-10 text-sm outline-none focus-visible:ring-3'
                          placeholder='请输入登录密码'
                          type={showPassword ? 'text' : 'password'}
                        />
                      </FormControl>
                      <button
                        type='button'
                        aria-label={showPassword ? '隐藏密码' : '显示密码'}
                        className='text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2'
                        onClick={() => setShowPassword((visible) => !visible)}
                      >
                        {showPassword ? (
                          <EyeOff className='size-4' />
                        ) : (
                          <Eye className='size-4' />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='captcha'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>验证码</FormLabel>
                    <div className='flex gap-2'>
                      <FormControl>
                        <input
                          {...field}
                          inputMode='numeric'
                          className='border-input bg-background aria-invalid:border-destructive aria-invalid:ring-destructive/20 focus-visible:border-ring focus-visible:ring-ring/50 h-9 min-w-0 flex-1 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3'
                          placeholder='请输入 4 位验证码'
                        />
                      </FormControl>
                      <div className='bg-muted text-foreground flex h-9 w-24 items-center justify-center rounded-lg font-mono tracking-[0.3em]'>
                        {captcha}
                      </div>
                      <Button
                        aria-label='刷新验证码'
                        size='icon'
                        type='button'
                        variant='outline'
                        onClick={() => setCaptcha(createCaptcha())}
                      >
                        <RefreshCw aria-hidden='true' />
                      </Button>
                    </div>
                    <FormDescription>
                      验证码仅用于演示复杂表单交互
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex items-start justify-between gap-4'>
                <FormField
                  control={form.control}
                  name='remember'
                  render={({ field }) => (
                    <label className='text-muted-foreground flex items-center gap-2 text-sm'>
                      <input
                        ref={field.ref}
                        checked={field.value}
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={(event) =>
                          field.onChange(event.target.checked)
                        }
                        type='checkbox'
                      />
                      记住我 7 天
                    </label>
                  )}
                />
                <span className='text-muted-foreground text-xs'>安全登录</span>
              </div>

              <FormField
                control={form.control}
                name='agree'
                render={({ field }) => (
                  <FormItem>
                    <label className='text-muted-foreground flex items-start gap-2 text-sm'>
                      <FormControl>
                        <input
                          checked={field.value}
                          className='mt-0.5'
                          name={field.name}
                          onBlur={field.onBlur}
                          onChange={(event) =>
                            field.onChange(event.target.checked)
                          }
                          ref={field.ref}
                          type='checkbox'
                        />
                      </FormControl>
                      <span>
                        我已阅读并同意
                        <a
                          className='text-primary mx-1 hover:underline'
                          href='/'
                        >
                          服务协议
                        </a>
                        和
                        <a
                          className='text-primary mx-1 hover:underline'
                          href='/'
                        >
                          隐私政策
                        </a>
                      </span>
                    </label>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {submitted && (
                <p
                  className='text-primary bg-primary/10 rounded-lg px-3 py-2 text-sm'
                  role='status'
                >
                  演示登录提交成功
                </p>
              )}
            </CardContent>

            <CardFooter className='flex-col gap-3'>
              <Button
                className='w-full'
                type='submit'
              >
                登录
              </Button>
              <p className='text-muted-foreground text-center text-xs'>
                本页面为表单组件演示，暂未连接真实登录接口
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </main>
  )
}
