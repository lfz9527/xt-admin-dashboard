import { useState } from 'react'
import { Button } from '@/ui/Button'
import { Checkbox } from '@/ui/Checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/Form'
import { Input } from '@/ui/Input'
import { Spinner } from '@/ui/Spinner'
import type { UseFormReturn } from 'react-hook-form'

import LoginCaptcha, { createCaptchaLayout } from './LoginCaptcha'
import { loginSchema, type LoginValues } from '../types'

type LoginFormProps = {
  form: UseFormReturn<LoginValues>
  onSubmit: (values: LoginValues) => void | Promise<void>
  onRegister: () => void
  onForgotPassword: () => void
}

export default function LoginForm({
  form,
  onSubmit,
  onRegister,
  onForgotPassword,
}: LoginFormProps) {
  const [captcha, setCaptcha] = useState(createCaptchaLayout)

  const refreshCaptcha = () => setCaptcha(createCaptchaLayout())

  const handleSubmit = (values: LoginValues) => {
    if (values.captcha !== captcha.code) {
      form.setError('captcha', { message: '验证码错误' })
      refreshCaptcha()
      return
    }
    return onSubmit(values)
  }

  return (
    <Form
      {...form}
      schema={loginSchema}
    >
      <form
        className='flex flex-col gap-5'
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormField
          control={form.control}
          name='account'
          render={({ field }) => (
            <FormItem>
              <FormLabel showRequired={false}>账号</FormLabel>
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
              <FormLabel showRequired={false}>密码</FormLabel>
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
          name='captcha'
          render={({ field }) => (
            <FormItem>
              <FormLabel showRequired={false}>验证码</FormLabel>
              <div className='flex gap-2'>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete='off'
                    placeholder='请输入验证码'
                    className='h-10'
                  />
                </FormControl>
                <LoginCaptcha
                  layout={captcha}
                  onRefresh={refreshCaptcha}
                />
              </div>
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
                showRequired={false}
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
            onClick={onRegister}
          >
            注册账号
          </Button>
          <Button
            type='button'
            variant='ghost'
            className='hover:text-foreground h-auto p-0 font-normal hover:bg-transparent'
            onClick={onForgotPassword}
          >
            忘记密码
          </Button>
        </div>
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
  )
}
