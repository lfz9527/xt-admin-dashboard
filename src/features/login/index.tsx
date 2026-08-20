import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  useForm,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from 'react-hook-form'
import { z } from 'zod'

import useAuthor from '@/store/useAuthor'
import Logo from '@/components/Logo'
import { Button } from '@/ui/Button'
import { Checkbox } from '@/ui/Checkbox'
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

const loginSchema = z.object({
  account: z.string().min(1, '请输入账号'),
  password: z.string().min(1, '请输入密码'),
  remember: z.boolean(),
})

const registerSchema = z
  .object({
    email: z.string().email('请输入有效的邮箱'),
    username: z.string().min(1, '请输入用户名'),
    code: z.string().min(1, '请输入验证码'),
    password: z.string().min(1, '请输入密码'),
    confirmPassword: z.string().min(1, '请确认密码'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: '两次输入的密码不一致',
  })

const forgotPasswordSchema = z
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

type LoginValues = z.infer<typeof loginSchema>
type RegisterValues = z.infer<typeof registerSchema>
type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
type Mode = 'login' | 'register' | 'forgot-password'

function createMockToken() {
  return `mock-token-${Date.now()}`
}

export default function LoginFeature() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const setToken = useAuthor((state) => state.setToken)
  const saveCredentials = useAuthor((state) => state.saveCredentials)
  const clearCredentials = useAuthor((state) => state.clearCredentials)
  const getCredentials = useAuthor((state) => state.getCredentials)
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { account: '', password: '', remember: false },
  })
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      code: '',
      password: '',
      confirmPassword: '',
    },
  })
  const forgotPasswordForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '', code: '', password: '', confirmPassword: '' },
  })

  const loadCredentials = useCallback(async () => {
    const credentials = await getCredentials()
    if (credentials) loginForm.reset(credentials)
  }, [getCredentials, loginForm])

  useEffect(() => {
    loadCredentials()
  }, [loadCredentials])

  const onLoginSubmit = async (values: LoginValues) => {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setToken(createMockToken())
    if (values.remember) await saveCredentials(values.account, values.password)
    else clearCredentials()
    toast.success('登录成功')
    navigate('/', { replace: true })
  }

  const onRegisterSubmit = async (_values: RegisterValues) => {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    toast.success('注册成功')
    setMode('login')
  }

  const onForgotPasswordSubmit = async (_values: ForgotPasswordValues) => {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    toast.success('密码重置成功')
    setMode('login')
  }

  const renderField = <T extends FieldValues>(
    form: UseFormReturn<T>,
    name: Path<T>,
    label: string,
    placeholder: string,
    autoComplete: string
  ) => (
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
  )

  const isRegister = mode === 'register'
  const registerFields = [
    ['email', '邮箱', '请输入邮箱', 'email'],
    ['username', '用户名', '请输入用户名', 'username'],
    ['code', '验证码', '请输入验证码', 'one-time-code'],
    ['password', '密码', '请输入密码', 'new-password'],
    ['confirmPassword', '确认密码', '请确认密码', 'new-password'],
  ] as const
  const forgotPasswordFields = [
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
            <CardTitle className='text-xl'>
              {mode === 'login'
                ? '登录管理后台'
                : isRegister
                  ? '注册管理后台'
                  : '忘记密码'}
            </CardTitle>
            <CardDescription>
              {mode === 'login'
                ? '欢迎你的到来，请使用账号登录'
                : isRegister
                  ? '创建你的管理后台账号'
                  : '重置你的管理后台密码'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className='px-6 sm:px-8'>
          {mode === 'login' ? (
            <Form {...loginForm}>
              <form
                className='flex flex-col gap-5'
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
              >
                <FormField
                  control={loginForm.control}
                  name='account'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>账号</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoComplete='username'
                          placeholder='请输入账号'
                          className='h-10'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>密码</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type='password'
                          autoComplete='current-password'
                          placeholder='请输入密码'
                          className='h-10'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name='remember'
                  render={({ field }) => (
                    <FormItem
                      orientation='horizontal'
                      className='items-center'
                    >
                      <Checkbox
                        id={field.name}
                        checked={field.value}
                        name={field.name}
                        onBlur={field.onBlur}
                        onCheckedChange={field.onChange}
                        ref={field.ref}
                      />
                      <FormLabel
                        htmlFor={field.name}
                        className='text-muted-foreground font-normal'
                      >
                        记住账号密码
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <div className='text-muted-foreground flex justify-between text-sm'>
                  <Button
                    type='button'
                    variant='ghost'
                    className='hover:text-foreground h-auto p-0 font-normal hover:bg-transparent'
                    onClick={() => setMode('register')}
                  >
                    注册账号
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    className='hover:text-foreground h-auto p-0 font-normal hover:bg-transparent'
                    onClick={() => setMode('forgot-password')}
                  >
                    忘记密码
                  </Button>
                </div>
                <Button
                  type='submit'
                  className='h-10 w-full'
                  disabled={loginForm.formState.isSubmitting}
                >
                  {loginForm.formState.isSubmitting ? (
                    <>
                      <Spinner />
                      登录中...
                    </>
                  ) : (
                    '登录'
                  )}
                </Button>
              </form>
            </Form>
          ) : mode === 'register' ? (
            <Form {...registerForm}>
              <form
                className='flex flex-col gap-5'
                onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
              >
                {registerFields.map(
                  ([name, label, placeholder, autoComplete]) =>
                    renderField(
                      registerForm,
                      name,
                      label,
                      placeholder,
                      autoComplete
                    )
                )}
                <Button
                  type='submit'
                  className='h-10 w-full'
                  disabled={registerForm.formState.isSubmitting}
                >
                  {registerForm.formState.isSubmitting ? (
                    <>
                      <Spinner />
                      注册中...
                    </>
                  ) : (
                    '注册'
                  )}
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  className='text-muted-foreground text-center text-sm underline-offset-4 hover:bg-transparent hover:underline'
                  onClick={() => setMode('login')}
                >
                  返回登录
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...forgotPasswordForm}>
              <form
                className='flex flex-col gap-5'
                onSubmit={forgotPasswordForm.handleSubmit(
                  onForgotPasswordSubmit
                )}
              >
                {forgotPasswordFields.map(
                  ([name, label, placeholder, autoComplete]) =>
                    renderField(
                      forgotPasswordForm,
                      name,
                      label,
                      placeholder,
                      autoComplete
                    )
                )}
                <Button
                  type='submit'
                  className='h-10 w-full'
                  disabled={forgotPasswordForm.formState.isSubmitting}
                >
                  {forgotPasswordForm.formState.isSubmitting ? (
                    <>
                      <Spinner />
                      重置中...
                    </>
                  ) : (
                    '重置密码'
                  )}
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  className='text-muted-foreground text-center text-sm underline-offset-4 hover:bg-transparent hover:underline'
                  onClick={() => setMode('login')}
                >
                  返回登录
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
