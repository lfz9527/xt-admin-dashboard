import { useRequest } from '@/hooks'
import { getCaptcha } from '@/service/auth'

/** 验证码接口统一管理：挂载时自动获取，refresh 重新获取 */
export function useCaptcha() {
  return useRequest(getCaptcha, { immediate: true })
}
