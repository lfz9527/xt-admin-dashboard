import { useRequest } from '@/hooks'
import { logout } from '@/service/auth'

/** 退出登录接口统一管理：runAsync 手动触发登出 */
export function useLogout() {
  return useRequest(logout, { immediate: false })
}
