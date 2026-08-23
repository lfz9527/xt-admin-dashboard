import { cn } from '@/utils/common'
import {
  CheckCircle2Icon,
  InfoIcon,
  XCircleIcon,
  CircleAlert,
} from 'lucide-react'
import { Toaster as Sonner, toast as sonnerToast } from 'sonner'
import Loading from '@/components/Loading'

const IconCls = 'size-4 shrink-0'

/**
 * sonner 封装（antd message 风格）：
 * - 顶部居中、无边框卡片、纯文本条 + 彩色小图标，自动消失
 * - 调用方式仿 antd：toast.success('内容') / toast.error() / toast.info()
 *
 * 挂载：在应用根部渲染 <Toaster /> 一次
 */
function Toaster() {
  return (
    <Sonner
      position='top-center'
      offset={72}
      expand={true}
      duration={2000}
      icons={{
        success: (
          <CheckCircle2Icon className={cn(IconCls, 'text-emerald-500')} />
        ),
        info: <InfoIcon className={cn(IconCls, 'text-sky-500')} />,
        warning: (
          <CircleAlert
            color='#fbb936'
            className={cn(IconCls)}
          />
        ),
        error: <XCircleIcon className={cn(IconCls, 'text-red-500')} />,
        loading: (
          <Loading
            className={cn(IconCls)}
            size={16}
          />
        ),
      }}
    />
  )
}

/** 仿 antd message 的轻量调用对象 */
export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast.info(message),
  loading: (message: string) => sonnerToast.loading(message),
  warning: (message: string) => sonnerToast.warning(message),
}

export { Toaster }
