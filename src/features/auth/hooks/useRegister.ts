import { useRequest } from '@/hooks'
import { register } from '@/service/auth'

/** 注册接口统一管理：runAsync 手动触发注册 */
export function useRegister() {
  return useRequest(register, { immediate: false })
}
