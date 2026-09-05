import useAuthor from '@/store/useAuthor'

/** 提供给请求层的认证 token 读取函数。 */
export function getAuthToken() {
  return useAuthor.getState().token
}

/** 清理当前认证状态并跳转登录页。 */
export function authLogout() {
  useAuthor.getState().setToken('')
  useAuthor.getState().setUser(null)
  useAuthor.getState().setRoleKey(null)
  // 动态导入：顶层静态导入会与 router/routes/页面组件形成加载期循环依赖
  import('@/router').then(({ default: router }) => {
    router.navigate('/login', { replace: true })
  })
}
