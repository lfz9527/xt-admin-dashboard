import { Input } from '@/ui/Input'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/Form'
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'

type AuthFieldProps<T extends FieldValues> = {
  form: UseFormReturn<T>
  name: Path<T>
  label: string
  placeholder: string
  autoComplete: string
}

export default function AuthField<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  autoComplete,
}: AuthFieldProps<T>) {
  return (
    <FormField
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
}
