import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { Moon, Sun } from 'lucide-react'

import Logo from '@/components/Logo'
import { useTheme } from '@/hooks'
import useAuthor from '@/store/useAuthor'
import { Button } from '@/ui/Button'
import { toast } from '@/ui/Toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/Card'

import { MODE, type Mode } from '@/features/auth/constant'
import ForgotPasswordForm from '@/features/auth/components/ForgotPasswordForm'
import LoginForm from '@/features/auth/components/LoginForm'
import RegisterForm from '@/features/auth/components/RegisterForm'
import {
  useCaptcha,
  useLogin,
  useRegister,
  useSendRegisterCode,
} from '@/features/auth/hooks'
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  type ForgotPasswordValues,
  type LoginValues,
  type RegisterValues,
} from '@/features/auth/types'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>(MODE.LOGIN)
  const { theme, toggleTheme } = useTheme()
  const setToken = useAuthor((state) => state.setToken)
  const setUser = useAuthor((state) => state.setUser)
  const saveCredentials = useAuthor((state) => state.saveCredentials)
  const clearCredentials = useAuthor((state) => state.clearCredentials)
  const getCredentials = useAuthor((state) => state.getCredentials)
  const { data: captchaData, refresh: refreshCaptcha } = useCaptcha()
  const { runAsync: runLogin } = useLogin()
  const { runAsync: runRegister } = useRegister()
  const { runAsync: runSendCode } = useSendRegisterCode()
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { account: '', password: '', remember: false, captcha: '' },
  })
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      nickname: '',
      emailCode: '',
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
    if (!captchaData) {
      toast.error('验证码获取失败，请刷新后重试')
      return
    }
    try {
      const result = await runLogin({
        email: values.account,
        password: values.password,
        captchaId: captchaData.captchaId,
        captchaCode: values.captcha,
      })
      setToken(result.access_token)
      setUser(result.user)
      if (values.remember)
        await saveCredentials(values.account, values.password)
      else clearCredentials()
      toast.success('登录成功')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const onRegisterSubmit = async (values: RegisterValues) => {
    try {
      await runRegister({
        email: values.email,
        nickname: values.nickname,
        password: values.password,
        emailCode: values.emailCode,
      })
      toast.success('注册成功，请登录')
      setMode(MODE.LOGIN)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const onSendCode = async (email: string) => {
    try {
      const result = await runSendCode({ email })
      toast.success(result.message)
      return true
    } catch (err) {
      toast.error((err as Error).message)
      return false
    }
  }

  const onForgotPasswordSubmit = async (_values: ForgotPasswordValues) => {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    toast.success('密码重置成功，请登录')
    setMode(MODE.LOGIN)
  }

  const isRegister = mode === MODE.REGISTER

  return (
    <main className='bg-muted/30 relative flex min-h-dvh items-center justify-center px-4 py-6 sm:py-8'>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label='切换主题'
        className='absolute top-4 right-4'
        onClick={(event) => toggleTheme(event)}
      >
        {theme === 'dark' ? <Sun /> : <Moon />}
      </Button>
      <Card className='w-full max-w-md gap-5 rounded-2xl py-6 shadow-xl shadow-black/5 sm:py-8'>
        <CardHeader className='items-center px-6 text-center sm:px-8'>
          <Logo />
          <div className='mt-3 space-y-1'>
            <CardTitle className='text-xl'>
              {mode === MODE.LOGIN
                ? '登录管理后台'
                : isRegister
                  ? '注册管理后台'
                  : '忘记密码'}
            </CardTitle>
            <CardDescription>
              {mode === MODE.LOGIN
                ? '欢迎你的到来，请使用邮箱登录'
                : isRegister
                  ? '创建你的管理后台账号'
                  : '重置你的管理后台密码'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className='px-6 sm:px-8'>
          {mode === MODE.LOGIN ? (
            <LoginForm
              form={loginForm}
              onSubmit={onLoginSubmit}
              onRegister={() => setMode(MODE.REGISTER)}
              onForgotPassword={() => setMode(MODE.FORGOT_PASSWORD)}
              captchaImage={captchaData?.image ?? ''}
              onRefreshCaptcha={refreshCaptcha}
            />
          ) : isRegister ? (
            <RegisterForm
              form={registerForm}
              onSubmit={onRegisterSubmit}
              onBackToLogin={() => setMode(MODE.LOGIN)}
              onSendCode={onSendCode}
            />
          ) : (
            <ForgotPasswordForm
              form={forgotPasswordForm}
              onSubmit={onForgotPasswordSubmit}
              onBackToLogin={() => setMode(MODE.LOGIN)}
            />
          )}
        </CardContent>
      </Card>
    </main>
  )
}
