import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
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
const schema = z.object({
  account: z.string().min(1, '请输入账号'),
  password: z.string().min(1, '请输入密码'),
  remember: z.boolean(),
})

type Values = z.infer<typeof schema>

function createMockToken() {
  return `mock-token-${Date.now()}`
}

export default function LoginFeature() {
  const navigate = useNavigate()
  const setToken = useAuthor((state) => state.setToken)
  const saveCredentials = useAuthor((state) => state.saveCredentials)
  const clearCredentials = useAuthor((state) => state.clearCredentials)
  const getCredentials = useAuthor((state) => state.getCredentials)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { account: '', password: '', remember: false },
  })

  const loadCredentials = useCallback(async () => {
    const credentials = await getCredentials()
    if (credentials) {
      form.reset(credentials)
    }
  }, [form, getCredentials])

  useEffect(() => {
    loadCredentials()
  }, [loadCredentials])

  const onSubmit = async (values: Values) => {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setToken(createMockToken())
    if (values.remember) {
      await saveCredentials(values.account, values.password)
    } else {
      clearCredentials()
    }
    toast.success('登录成功')
    navigate('/', { replace: true })
  }

  return (
    <main className='bg-muted/30 flex min-h-dvh items-center justify-center px-4 py-6 sm:py-8'>
      <Card className='w-full max-w-md gap-5 rounded-2xl py-6 shadow-xl shadow-black/5 sm:py-8'>
        <CardHeader className='items-center px-6 text-center sm:px-8'>
          <Logo />
          <div className='mt-3 space-y-1'>
            <CardTitle className='text-xl'>登录管理后台</CardTitle>
            <CardDescription>欢迎你的到来，请使用账号登录</CardDescription>
          </div>
        </CardHeader>
        <CardContent className='px-6 sm:px-8'>
          <Form {...form}>
            <form
              className='flex flex-col gap-5'
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
              <Button
                type='submit'
                className='h-10 w-full'
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
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
        </CardContent>
      </Card>
    </main>
  )
}
