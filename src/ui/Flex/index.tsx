import type { CSSProperties, ReactNode } from 'react'

type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
type Justify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
type Wrap = 'wrap' | 'nowrap' | 'wrap-reverse'
type FlexValue = 1 | 'auto' | 'none' | 'initial'

type FlexProps = {
  vertical?: boolean
  align?: Align
  justify?: Justify
  wrap?: Wrap
  gap?: number
  flex?: FlexValue
  center?: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

const alignMap: Record<Align, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
}

const justifyMap: Record<Justify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
}

const wrapMap: Record<Wrap, string> = {
  wrap: 'flex-wrap',
  nowrap: 'flex-nowrap',
  'wrap-reverse': 'flex-wrap-reverse',
}

const flexChildMap: Record<string, string> = {
  '1': '[&>*]:flex-1',
  auto: '[&>*]:flex-auto',
  none: '[&>*]:flex-none',
  initial: '[&>*]:flex-initial',
}

function Flex({
  vertical,
  align,
  justify,
  wrap,
  gap,
  flex,
  center,
  className,
  style,
  children,
}: FlexProps) {
  const classes: string[] = ['flex', 'w-full']

  if (vertical) classes.push('flex-col')

  if (center) {
    classes.push('items-center', 'justify-center')
  } else {
    if (align) classes.push(alignMap[align])
    if (justify) classes.push(justifyMap[justify])
  }

  if (wrap) classes.push(wrapMap[wrap])
  if (flex !== undefined) classes.push(flexChildMap[String(flex)])
  if (className) classes.push(className)

  const mergedStyle: CSSProperties = {
    ...style,
    ...(gap !== undefined ? { gap: `${gap * 0.25}rem` } : {}),
  }

  return (
    <div
      className={classes.join(' ')}
      style={mergedStyle}
    >
      {children}
    </div>
  )
}

export default Flex
