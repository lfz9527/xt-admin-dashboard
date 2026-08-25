import { useRequest } from '@/hooks'
import { sendResetCode } from '@/service/auth'

/** 发送重置验证码接口统一管理：runAsync 手动触发 */
export function useSendResetCode() {
  return useRequest(sendResetCode, { immediate: false })
}
