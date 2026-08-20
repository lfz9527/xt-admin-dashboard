import {
  cloneElement,
  createContext,
  useContext,
  useId,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react'
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'

import { Field, FieldDescription, FieldError, FieldLabel } from '@/ui/Field'
import { cn } from '@/utils/common'

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
  id: string
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null)

function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({ name, ...props }: ControllerProps<TFieldValues, TName>) {
  const id = useId()

  return (
    <FormFieldContext.Provider value={{ name, id }}>
      <Controller
        name={name}
        {...props}
      />
    </FormFieldContext.Provider>
  )
}

function useFormField() {
  const field = useContext(FormFieldContext)
  const { getFieldState } = useFormContext()
  const formState = useFormState({ name: field?.name })

  if (!field) {
    throw new Error('useFormField must be used within a FormField')
  }

  const fieldState = getFieldState(field.name, formState)

  return {
    ...field,
    ...fieldState,
    formItemId: `${field.id}-form-item`,
    formDescriptionId: `${field.id}-form-item-description`,
    formMessageId: `${field.id}-form-item-message`,
  }
}

function FormItem({ className, ...props }: ComponentProps<typeof Field>) {
  const { error } = useFormField()

  return (
    <Field
      data-invalid={!!error}
      data-slot='form-item'
      className={cn('relative', className)}
      {...props}
    />
  )
}

function FormLabel({ className, ...props }: ComponentProps<typeof FieldLabel>) {
  const { error, formItemId } = useFormField()

  return (
    <FieldLabel
      data-slot='form-label'
      data-invalid={!!error}
      htmlFor={formItemId}
      className={cn(error && 'text-destructive', className)}
      {...props}
    />
  )
}

function FormControl({
  children,
}: {
  children: ReactElement<Record<string, unknown>>
}) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
  const describedBy = error
    ? `${formDescriptionId} ${formMessageId}`
    : formDescriptionId

  return cloneElement(children, {
    id: formItemId,
    'aria-describedby': describedBy,
    'aria-invalid': !!error,
    'data-slot': 'form-control',
  })
}

function FormDescription({
  className,
  ...props
}: ComponentProps<typeof FieldDescription>) {
  const { formDescriptionId } = useFormField()

  return (
    <FieldDescription
      data-slot='form-description'
      id={formDescriptionId}
      className={className}
      {...props}
    />
  )
}

function FormMessage({
  className,
  children,
  ...props
}: ComponentProps<typeof FieldError> & { children?: ReactNode }) {
  const { error, formMessageId } = useFormField()
  const body = children ?? error?.message

  if (!body) {
    return null
  }

  return (
    <FieldError
      data-slot='form-message'
      id={formMessageId}
      role='alert'
      className={className}
      {...props}
    >
      {body}
    </FieldError>
  )
}

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
}
