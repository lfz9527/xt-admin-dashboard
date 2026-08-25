import { useMemo } from 'react'
import { Navigate, Outlet, useMatches } from 'react-router'
import { createRoleChecker, hasRoutePermission } from '@/router/permissions'
import type { RouteMeta } from '@/router/types'
import useAuthor from '@/store/useAuthor'

/** 入口级权限守卫：匹配链上任一级路由声明角色无权限即重定向 404 */
export default function PermissionGuard() {
  const roleKey = useAuthor((state) => state.roleKey)
  const matches = useMatches()

  const denied = useMemo(
    () =>
      matches.some(
        (match) =>
          !hasRoutePermission(
            match.handle as RouteMeta | undefined,
            createRoleChecker(roleKey)
          )
      ),
    [matches, roleKey]
  )

  if (denied)
    return (
      <Navigate
        to='/404'
        replace
      />
    )
  return <Outlet />
}
