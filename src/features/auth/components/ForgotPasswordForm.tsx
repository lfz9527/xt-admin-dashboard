import VerificationCodeButton from '@/components/VerificationCodeButton'
import { Button } from '@/ui/Button'
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

import AuthField from './AuthField'
import { forgotPasswordSchema, type ForgotPasswordValues } from '../types'

type ForgotPasswordFormProps = {
  form: UseFormReturn<ForgotPasswordValues>
  onSubmit: (values: ForgotPasswordValues) => void | Promise<void>
  onBackToLogin: () => void
  onSendCode: (email: string) => Promise<boolean>
}

export default function ForgotPasswordForm({
  form,
  onSubmit,
  onBackToLogin,
  onSendCode,
}: ForgotPasswordFormProps) {
  return (
    <Form
      {...form}
      schema={forgotPasswordSchema}
    >
      <form
        className='flex flex-col gap-5'
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <AuthField
          form={form}
          name='email'
          label='邮箱'
          placeholder='请输入邮箱'
          autoComplete='email'
        />
        <FormField
          control={form.control}
          name='code'
          render={({ field }) => (
            <FormItem>
              <FormLabel>验证码</FormLabel>
              <div className='flex gap-2'>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete='one-time-code'
                    placeholder='请输入验证码'
                    className='h-10'
                  />
                </FormControl>
                <VerificationCodeButton
                  variant='outline'
                  className='h-10'
                  onSend={() => onSendCode(form.getValues('email'))}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <AuthField
          form={form}
          name='password'
          label='新密码'
          placeholder='请输入新密码'
          autoComplete='new-password'
        />
        <AuthField
          form={form}
          name='confirmPassword'
          label='确认密码'
          placeholder='请确认密码'
          autoComplete='new-password'
        />
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
        <Button
          type='button'
          variant='ghost'
          className='text-muted-foreground text-center text-sm underline-offset-4 hover:bg-transparent hover:underline'
          onClick={onBackToLogin}
        >
          返回登录
        </Button>
      </form>
    </Form>
  )
}
