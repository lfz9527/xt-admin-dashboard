import { http } from './request'

/** 角色项 */
export type RoleItem = {
  id: number
  /** 角色名称 */
  name: string
  /** 角色编码（唯一，创建后不可修改） */
  roleKey: string
  /** 状态：0=正常 1=停用 */
  status: number
  /** 显示顺序（升序排列） */
  sort: number
  /** 备注 */
  remark: string
  createdAt: string
  updatedAt: string
}

export type RoleListParams = {
  /** 页码，最小 1 */
  page: number
  /** 每页条数，1-100 */
  pageSize: number
  /** 按角色名称模糊筛选 */
  name?: string
  /** 按状态筛选：0=正常 1=停用 */
  status?: number
}

export type RoleListResult = {
  list: RoleItem[]
  /** 总条数 */
  total: number
}

export type CreateRoleParams = {
  /** 角色名称，1-30 字符 */
  name: string
  /** 角色编码，1-50 字符，唯一（含已删除角色） */
  roleKey: string
  status?: number
  sort?: number
  remark?: string
}

export type UpdateRoleParams = {
  id: number
  /** 角色名称，1-30 字符 */
  name: string
  status?: number
  sort?: number
  remark?: string
}

/** 角色分页列表（需鉴权） */
export function getRoles(params: RoleListParams, signal?: AbortSignal) {
  return http.get<RoleListResult>('/roles', { params, signal })
}

/** 角色详情（需鉴权） */
export function getRole(id: number, signal?: AbortSignal) {
  return http.get<RoleItem>(`/roles/${id}`, { signal })
}

/** 创建角色（需鉴权） */
export function createRole(data: CreateRoleParams, signal?: AbortSignal) {
  return http.post<RoleItem>('/roles', data, { signal })
}

/** 更新角色（需鉴权；网关限制，POST 路径实现） */
export function updateRole(data: UpdateRoleParams, signal?: AbortSignal) {
  return http.post<RoleItem>('/roles/update', data, { signal })
}

/** 删除角色（需鉴权；软删除；网关限制，POST 路径实现） */
export function deleteRole(id: number, signal?: AbortSignal) {
  return http.post<null>('/roles/delete', { id }, { signal })
}
