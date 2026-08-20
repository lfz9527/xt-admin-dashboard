import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

const schema = z.object({
  name: z.string().min(1, '请输入姓名'),
})

type Values = z.infer<typeof schema>

function TestForm({ onSubmit }: { onSubmit: (values: Values) => void }) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>姓名</FormLabel>
              <FormControl>
                <input {...field} />
              </FormControl>
              <FormDescription>请输入您的真实姓名</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <button type='submit'>提交</button>
      </form>
    </Form>
  )
}

describe('Form', () => {
  it('submits values validated by zod', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<TestForm onSubmit={onSubmit} />)

    const input = screen.getByLabelText('姓名')
    expect(input).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining('description')
    )

    await user.type(input, '张三')
    await user.click(screen.getByRole('button', { name: '提交' }))

    expect(onSubmit).toHaveBeenCalledWith({ name: '张三' }, expect.anything())
  })

  it('shows zod errors and invalid accessibility state', async () => {
    const user = userEvent.setup()
    render(<TestForm onSubmit={vi.fn()} />)

    const input = screen.getByLabelText('姓名')
    await user.click(screen.getByRole('button', { name: '提交' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('请输入姓名')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input.getAttribute('aria-describedby')).toContain('message')
  })
})
