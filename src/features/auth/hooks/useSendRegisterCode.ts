import { useRequest } from '@/hooks'
import { sendRegisterCode } from '@/service/auth'

/** 发送注册验证码接口统一管理：runAsync 手动触发 */
export function useSendRegisterCode() {
  return useRequest(sendRegisterCode, { immediate: false })
}
