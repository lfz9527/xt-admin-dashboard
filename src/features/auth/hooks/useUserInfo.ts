import { useRequest } from '@/hooks'
import { getUserInfo, type UserInfo } from '@/service/users'
import useAuthor from '@/store/useAuthor'

/** 当前登录用户信息：挂载即拉取，成功后写入认证 store（含角色编码）；401 由请求拦截器统一登出 */
export function useUserInfo() {
  const setUser = useAuthor((state) => state.setUser)
  const setRoleKey = useAuthor((state) => state.setRoleKey)

  return useRequest(getUserInfo, {
    onSuccess: (data) => {
      setUser(data)
      setRoleKey(data.role?.roleKey ?? null)
    },
  })
}

export type { UserInfo }
