import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'

import Logo from '@/components/Logo'
import useAuthor from '@/store/useAuthor'
import { toast } from '@/ui/Toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/Card'

import ForgotPasswordForm from './ForgotPasswordForm'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  type ForgotPasswordValues,
  type LoginValues,
  type Mode,
  type RegisterValues,
} from './types'

function createMockToken() {
  return `mock-token-${Date.now()}`
}

export default function LoginFeature() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('register')
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

  const isRegister = mode === 'register'

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
            <LoginForm
              form={loginForm}
              onSubmit={onLoginSubmit}
              onRegister={() => setMode('register')}
              onForgotPassword={() => setMode('forgot-password')}
            />
          ) : isRegister ? (
            <RegisterForm
              form={registerForm}
              onSubmit={onRegisterSubmit}
              onBackToLogin={() => setMode('login')}
            />
          ) : (
            <ForgotPasswordForm
              form={forgotPasswordForm}
              onSubmit={onForgotPasswordSubmit}
              onBackToLogin={() => setMode('login')}
            />
          )}
        </CardContent>
      </Card>
    </main>
  )
}
