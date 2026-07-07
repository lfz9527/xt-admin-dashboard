import { http } from './request'

type PingParams = {
  pong: boolean
  time: string
}
export function Ping(signal?: AbortSignal) {
  return http.request<PingParams>('/api/ping', {
    method: 'POST',
    signal,
  })
}
export function GetUser(params: { id: number }, signal?: AbortSignal) {
  return http.request('/api/user', { params, signal })
}
