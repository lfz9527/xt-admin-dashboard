import type { Control, FieldPath, FieldValues } from 'react-hook-form'

import { SelectData } from '@/components/SelectData'
import { useDictOptions } from '@/hooks/useDictOptions'
import { FormField, FormItem, FormLabel, FormMessage } from '@/ui/Form'

type DictSelectFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  dictKey: string
  label: React.ReactNode
  disabled?: boolean
  className?: string
}

function DictSelectField<TFieldValues extends FieldValues>({
  control,
  name,
  dictKey,
  label,
  disabled,
  className = 'w-full',
}: DictSelectFieldProps<TFieldValues>) {
  const { options } = useDictOptions(dictKey)

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel showRequired={false}>{label}</FormLabel>
          <SelectData
            options={options}
            value={field.value == null ? null : String(field.value)}
            onChange={(value) =>
              field.onChange(value == null ? value : Number(value))
            }
            disabled={disabled}
            className={className}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export { DictSelectField }
export type { DictSelectFieldProps }
