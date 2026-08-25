import { useRequest } from '@/hooks'
import { resetPassword } from '@/service/auth'

/** 重置密码接口统一管理：runAsync 手动触发 */
export function useResetPassword() {
  return useRequest(resetPassword, { immediate: false })
}
