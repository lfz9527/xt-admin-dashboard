import { http } from './request'

/** 图形验证码 */
export type CaptchaResult = {
  /** 验证码标识，登录时原样传回 */
  captchaId: string
  /** 验证码图片（SVG base64），直接用于 <img src> */
  image: string
}

export type AuthUser = {
  id: number
  nickname: string
  email: string
  avatar: string
  /** 性别：0=男 1=女 2=未知 */
  gender: number
  /** 账号状态：0=正常 1=停用 */
  status: number
  lastLoginTime: string | null
}

export type LoginParams = {
  email: string
  password: string
  captchaId: string
  captchaCode: string
}

export type LoginResult = {
  access_token: string
  user: AuthUser
}

/** 获取图形验证码（无需鉴权） */
export function getCaptcha(signal?: AbortSignal) {
  return http.get<CaptchaResult>('/auth/captcha', { signal })
}

/** 登录（无需鉴权） */
export function login(data: LoginParams, signal?: AbortSignal) {
  return http.post<LoginResult>('/auth/login', data, { signal })
}

/** 登出（需鉴权） */
export function logout(signal?: AbortSignal) {
  return http.post<{ message: string }>('/auth/logout', undefined, { signal })
}
