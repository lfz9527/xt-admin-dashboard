import { http } from './request'

/** 用户绑定的角色信息 */
export type UserRole = {
  id: number
  /** 角色名称 */
  name: string
  /** 角色编码（唯一，创建后不可修改） */
  roleKey: string
}

/** 用户项 */
export type UserItem = {
  id: number
  /** 昵称 */
  nickname: string
  /** 邮箱 */
  email: string
  /** 头像地址 */
  avatar: string
  /** 性别：0=男 1=女 2=未知 */
  gender: number
  /** 账号状态：0=正常 1=停用 */
  status: number
  /** 最近登录时间 */
  lastLoginTime: string | null
  /** 最近登录 IP（后端未返回时为 undefined，不展示） */
  lastLoginIp?: string | null
  /** 角色 ID，未分配角色为 null */
  roleId: number | null
  /** 角色信息，未分配角色为 null */
  role: UserRole | null
  /** 注册时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

export type UserListParams = {
  /** 页码，最小 1 */
  page: number
  /** 每页条数，1-100 */
  pageSize: number
  /** 按昵称或邮箱模糊筛选 */
  keyword?: string
  /** 按状态筛选：0=正常 1=停用 */
  status?: number
}

export type UserListResult = {
  list: UserItem[]
  /** 总条数 */
  total: number
}

export type CreateUserParams = {
  /** 昵称，最长 30 字符 */
  nickname: string
  /** 邮箱，须为邮箱格式，最长 100 字符 */
  email: string
  /** 初始密码，6-255 字符 */
  password: string
  /** 性别：0=男 1=女 2=未知 */
  gender?: number
  /** 备注，最长 255 字符 */
  remark?: string
  /** 角色 ID，不传则无角色 */
  roleId?: number
  /** 账号状态：0=正常 1=停用，默认 0 */
  status?: number
}

export type UpdateUserParams = {
  /** 用户 ID */
  id: number
  /** 昵称，最长 30 字符 */
  nickname?: string
  /** 邮箱，最长 100 字符 */
  email?: string
  /** 重置密码，6-255 字符 */
  password?: string
  /** 性别：0=男 1=女 2=未知 */
  gender?: number
  /** 备注，最长 255 字符 */
  remark?: string
  /** 角色 ID，不传保留原值 */
  roleId?: number
  /** 账号状态：0=正常 1=停用，不传保留原值 */
  status?: number
}

/** 用户分页列表（需鉴权） */
export function getUsers(params: UserListParams, signal?: AbortSignal) {
  return http.get<UserListResult>('/users', { params, signal })
}

/** 查询用户（需鉴权） */
export function getUser(id: number, signal?: AbortSignal) {
  return http.get<UserItem>(`/users/${id}`, { signal })
}

/** 新增用户（需鉴权；管理员创建，不需要验证码） */
export function createUser(data: CreateUserParams, signal?: AbortSignal) {
  return http.post<UserItem>('/users', data, { signal })
}

/** 更新用户（需鉴权；网关限制，POST 路径实现） */
export function updateUser(data: UpdateUserParams, signal?: AbortSignal) {
  return http.post<UserItem>('/users/update', data, { signal })
}

/** 删除用户（需鉴权；软删除；网关限制，POST 路径实现） */
export function deleteUser(id: number, signal?: AbortSignal) {
  return http.post<null>('/users/delete', { id }, { signal })
}

/** 当前登录用户完整信息（含角色），结构同用户列表项 */
export type UserInfo = UserItem

/** 获取当前登录用户信息（需鉴权） */
export function getUserInfo(signal?: AbortSignal) {
  return http.get<UserInfo>('/users/me', { signal })
}
