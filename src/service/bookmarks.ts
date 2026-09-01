import { http } from './request'

/** 收藏节点类型：1=文件夹 2=收藏 */
export type BookmarkType = 1 | 2

/** 收藏树节点 */
export type BookmarkNode = {
  /** 节点 ID */
  id: number
  /** 父节点 ID，0=根级 */
  parentId: number
  /** 节点类型：1=文件夹 2=收藏 */
  type: BookmarkType
  /** 名称 */
  title: string
  /** 网址（type=2 时有效） */
  url: string
  /** 图标 base64 数据（可能为空字符串） */
  favicon: string
  /** 同层排序，越小越靠前 */
  sort: number
  /** 子节点数组（叶子为空数组） */
  children: BookmarkNode[]
}

export type CreateBookmarkParams = {
  /** 节点类型：1=文件夹 2=收藏 */
  type: BookmarkType
  /** 名称，最长 255 字符 */
  title: string
  /** 父节点 ID，默认 0（根级）；必须是自己的文件夹 */
  parentId?: number
  /** 网址，最长 2048 字符；type=2（收藏）时必填 */
  url?: string
  /** 同层排序，默认 0 */
  sort?: number
}

export type UpdateBookmarkParams = {
  /** 节点 ID（必须属于当前用户） */
  id: number
  /** 名称，最长 255 字符 */
  title?: string
  /** 网址，最长 2048 字符；传空字符串会被拒绝 */
  url?: string
  /** 新父节点 ID；必须是文件夹且不能是自身或其子孙节点 */
  parentId?: number
  /** 同层排序 */
  sort?: number
}

/** 获取当前用户全部收藏树（需鉴权） */
export function getBookmarkTree(signal?: AbortSignal) {
  return http.get<BookmarkNode[]>('/bookmarks/tree', { signal })
}

/** 新增收藏（需鉴权） */
export function createBookmark(
  data: CreateBookmarkParams,
  signal?: AbortSignal
) {
  return http.post<BookmarkNode>('/bookmarks', data, { signal })
}

/** 编辑收藏（需鉴权；网关限制，POST 路径实现；只更新传入字段） */
export function updateBookmark(
  data: UpdateBookmarkParams,
  signal?: AbortSignal
) {
  return http.post<BookmarkNode>('/bookmarks/update', data, { signal })
}

/** 删除收藏（需鉴权；软删除；删除文件夹时其全部子孙节点一并软删除） */
export function deleteBookmark(id: number, signal?: AbortSignal) {
  return http.post<null>('/bookmarks/delete', { id }, { signal })
}
