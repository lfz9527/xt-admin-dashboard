import { useRequest } from '@/hooks'
import { login, type LoginParams, type LoginResult } from '@/service/auth'

/** 登录接口统一管理：runAsync 手动触发登录 */
export function useLogin() {
  return useRequest(login, { immediate: false })
}

export type { LoginParams, LoginResult }
