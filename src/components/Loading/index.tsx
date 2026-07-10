import { cn } from '@/utils/common'
import styles from './index.module.css'

type Props = Global.ElAttrs<HTMLDivElement> & {
  size?: number | string
}

function sizeToStyle(size: number | string) {
  const numeric = typeof size === 'number' ? size : parseFloat(size as string)
  const sizePx = typeof size === 'number' ? `${size}px` : size
  const strokePx = `${(numeric / 12).toFixed(2)}px`
  return {
    '--uib-size': sizePx,
    '--uib-stroke': strokePx,
  } as React.CSSProperties
}

export default function Loading({ className, size = 24, ...props }: Props) {
  return (
    <div
      className={cn('flex-center text-primary relative', className)}
      style={{ ...sizeToStyle(size), ...props.style }}
      {...props}
    >
      <div className={styles.spinner}>
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className={styles.line}
          />
        ))}
      </div>
    </div>
  )
}
