import { cn } from '@/utils/common'
import LoadingSvg from '~icons/local-icons/loading'

type Props = Global.ElAttrs<HTMLDivElement> & {
  size?: number | string
}

export default function Loading({ className, size = 24, ...props }: Props) {
  return (
    <div
      role='status'
      className={cn('flex-center relative', className)}
      {...props}
    >
      <LoadingSvg
        width={size}
        height={size}
      />
    </div>
  )
}
