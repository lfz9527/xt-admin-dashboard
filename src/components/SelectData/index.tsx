import { useState, type ReactNode } from 'react'

import { cn } from '@/utils/common'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/Select'

export type SelectDataOption = {
  value: string
  label: ReactNode
  disabled?: boolean
}

export type SelectDataProps = {
  /** 选项数据，由外部传入（AntD 风格 { value, label, disabled? }） */
  options?: SelectDataOption[]
  value?: string | null
  defaultValue?: string | null
  /** AntD 同款签名：回调携带选中值与对应选项 */
  onChange?: (value: string | null, option?: SelectDataOption) => void
  placeholder?: ReactNode
  /** options 为空时下拉中显示的内容 */
  notFoundContent?: ReactNode
  disabled?: boolean
  /** 触发按钮额外样式，可覆盖默认 w-50（如指定其他宽度） */
  className?: string
}

/**
 * 基于 `src/ui/Select` 封装的展示型下拉组件，API 参考 Ant Design Select。
 * 数据由外部 `options` 传入，组件内不涉及任何数据请求。
 */
export function SelectData({
  options = [],
  value,
  defaultValue,
  onChange,
  placeholder = '请选择',
  notFoundContent = '暂无数据',
  disabled,
  className,
}: SelectDataProps) {
  // 内部镜像当前值，保证非受控模式下 trigger 的 title 也能跟随选择更新
  const [innerValue, setInnerValue] = useState<string | null>(
    defaultValue ?? null
  )
  const currentValue = value !== undefined ? value : innerValue

  // title 为原生字符串属性，仅 string label 可绑定
  const toTitle = (label: ReactNode): string | undefined =>
    typeof label === 'string' ? label : undefined

  const selectedOption = options.find((option) => option.value === currentValue)

  return (
    <Select
      value={currentValue}
      onValueChange={(next) => {
        setInnerValue(next)
        onChange?.(
          next,
          options.find((option) => option.value === next)
        )
      }}
      disabled={disabled}
    >
      <div data-slot='select-data'>
        <SelectTrigger
          className={cn('w-50', className)}
          title={toTitle(selectedOption?.label)}
        >
          <SelectValue className='min-w-0 truncate'>
            {(current) =>
              options.find((option) => option.value === current)?.label ??
              placeholder
            }
          </SelectValue>
        </SelectTrigger>
      </div>
      <SelectContent>
        {options.length === 0 ? (
          <div className='text-muted-foreground px-1.5 py-1 text-center text-sm'>
            {notFoundContent}
          </div>
        ) : (
          options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              title={toTitle(option.label)}
              className='[&>div]:min-w-0 [&>div]:shrink [&>div]:truncate'
            >
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
