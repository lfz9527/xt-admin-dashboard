import { http } from './request'

/** 字典类型项（id 为后端 bigint 字段，运行时可能返回字符串） */
export type DictTypeItem = {
  /** 字典类型 ID */
  id: string
  /** 字典名称（展示名） */
  name: string
  /** 字典编码（全局唯一，如 sys_user_sex；创建后可修改） */
  dictKey: string
  /** 状态：0=正常（启用）1=停用 */
  status: number
  /** 显示顺序（升序排列） */
  sort: number
  /** 备注 */
  remark: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

export type DictTypeListParams = {
  /** 页码，最小 1 */
  page: number
  /** 每页条数，1-100 */
  pageSize: number
  /** 按字典编码模糊筛选 */
  dictKey?: string
  /** 按字典名称模糊筛选 */
  name?: string
  /** 按状态筛选：0=正常 1=停用 */
  status?: number
}

export type DictTypeListResult = {
  list: DictTypeItem[]
  /** 总条数 */
  total: number
  /** 总页数 */
  totalPages: number
}

export type CreateDictTypeParams = {
  /** 字典名称，1-30 字符 */
  name: string
  /** 字典编码，1-50 字符，全局唯一 */
  dictKey: string
  /** 状态：0=正常 1=停用，默认 0 */
  status?: number
  /** 显示顺序，默认 0 */
  sort?: number
  /** 备注，≤255 字符 */
  remark?: string
}

export type UpdateDictTypeParams = {
  /** 字典类型 ID（后端 DTO 校验为数字，列表返回的字符串 id 需转换） */
  id: number
  /** 字典名称，1-30 字符 */
  name: string
  /** 字典编码，可修改，1-50 字符，全局唯一 */
  dictKey?: string
  /** 状态：0=正常 1=停用，缺省保持原值 */
  status?: number
  /** 显示顺序，缺省保持原值 */
  sort?: number
  /** 备注，≤255 字符，缺省保持原值 */
  remark?: string
}

export type UpdateDictTypeStatusParams = {
  /** 字典类型 ID */
  id: number
  /** 状态：0=启用 1=停用 */
  status: number
}

/** 字典项所属类型简要信息（类型被删后为 null） */
export type DictItemTypeInfo = {
  id: number
  name: string
  dictKey: string
}

/** 字典项（id 为后端 bigint 字段，运行时可能返回字符串） */
export type DictItem = {
  /** 字典项 ID */
  id: string
  /** 所属字典类型 ID */
  dictTypeId: number
  /** 父字典项 ID（0=根级） */
  parentId: number
  /** 所属类型简要信息（类型被删后为 null） */
  type: DictItemTypeInfo | null
  /** 字典标签（展示文本） */
  label: string
  /** 字典键值（存储值，同类型下唯一） */
  value: string
  /** 状态：0=正常（启用）1=停用 */
  status: number
  /** 显示顺序（升序排列） */
  sort: number
  /** 备注 */
  remark: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

export type DictItemListParams = {
  /** 页码，最小 1 */
  page: number
  /** 每页条数，1-100 */
  pageSize: number
  /** 按所属类型精确筛选 */
  dictTypeId?: number
  /** 按字典标签模糊筛选 */
  label?: string
  /** 按字典键值模糊筛选 */
  value?: string
  /** 按状态筛选：0=正常 1=停用 */
  status?: number
}

export type DictItemListResult = {
  list: DictItem[]
  /** 总条数 */
  total: number
  /** 总页数 */
  totalPages: number
}

export type CreateDictItemParams = {
  /** 所属字典类型 ID（须存在） */
  dictTypeId: number
  /** 父字典项 ID（0=根级，缺省挂根级） */
  parentId?: number
  /** 字典标签，1-50 字符 */
  label: string
  /** 字典键值，1-100 字符，同类型下唯一 */
  value: string
  /** 状态：0=正常 1=停用，默认 0 */
  status?: number
  /** 显示顺序，默认 0 */
  sort?: number
  /** 备注，≤255 字符 */
  remark?: string
}

export type UpdateDictItemParams = {
  /** 字典项 ID */
  id: number
  /** 所属类型，缺省保持原类型 */
  dictTypeId?: number
  /** 父字典项 ID，缺省保持原父项（0=移到根级） */
  parentId?: number
  /** 字典标签，1-50 字符 */
  label: string
  /** 字典键值，可修改，目标类型下唯一 */
  value: string
  /** 状态：0=正常 1=停用，缺省保持原值 */
  status?: number
  /** 显示顺序，缺省保持原值 */
  sort?: number
  /** 备注，≤255 字符，缺省保持原值 */
  remark?: string
}

export type UpdateDictItemStatusParams = {
  /** 字典项 ID */
  id: number
  /** 状态：0=启用 1=停用 */
  status: number
}

// ── 字典类型 ─────────────────────────────────────────────

/** 字典类型分页列表（需鉴权） */
export function getDictTypes(params: DictTypeListParams, signal?: AbortSignal) {
  return http.get<DictTypeListResult>('/dict-types', { params, signal })
}

/** 新增字典类型（需鉴权） */
export function createDictType(
  data: CreateDictTypeParams,
  signal?: AbortSignal
) {
  return http.post<DictTypeItem>('/dict-types', data, { signal })
}

/** 编辑字典类型（需鉴权；网关限制，POST 路径实现） */
export function updateDictType(
  data: UpdateDictTypeParams,
  signal?: AbortSignal
) {
  return http.post<DictTypeItem>('/dict-types/update', data, { signal })
}

/** 启用/停用字典类型（需鉴权；网关限制，POST 路径实现） */
export function updateDictTypeStatus(
  data: UpdateDictTypeStatusParams,
  signal?: AbortSignal
) {
  return http.post<DictTypeItem>('/dict-types/status', data, { signal })
}

/** 删除字典类型（需鉴权；物理删除，其下全部字典项一并删除；网关限制，POST 路径实现） */
export function deleteDictType(id: number, signal?: AbortSignal) {
  return http.post<null>('/dict-types/delete', { id }, { signal })
}

// ── 字典项 ───────────────────────────────────────────────

/** 字典项分页列表（需鉴权，扁平结构，层级展示用树形数据） */
export function getDictItems(params: DictItemListParams, signal?: AbortSignal) {
  return http.get<DictItemListResult>('/dict-items', { params, signal })
}

/** 新增字典项（需鉴权） */
export function createDictItem(
  data: CreateDictItemParams,
  signal?: AbortSignal
) {
  return http.post<DictItem>('/dict-items', data, { signal })
}

/** 编辑字典项（需鉴权；网关限制，POST 路径实现） */
export function updateDictItem(
  data: UpdateDictItemParams,
  signal?: AbortSignal
) {
  return http.post<DictItem>('/dict-items/update', data, { signal })
}

/** 启用/停用字典项（需鉴权；网关限制，POST 路径实现） */
export function updateDictItemStatus(
  data: UpdateDictItemStatusParams,
  signal?: AbortSignal
) {
  return http.post<DictItem>('/dict-items/status', data, { signal })
}

/** 删除字典项（需鉴权；物理删除，级联删除其全部子孙节点；网关限制，POST 路径实现） */
export function deleteDictItem(id: number, signal?: AbortSignal) {
  return http.post<null>('/dict-items/delete', { id }, { signal })
}

// ── 下拉选项读取（任意登录用户可调用）───────────────────────

/** 启用字典类型简要信息（GET /dicts 返回） */
export type EnabledDict = {
  /** 字典类型 ID */
  id: number
  /** 字典名称（展示名） */
  name: string
  /** 字典编码（读取下拉选项时用作路径参数） */
  dictKey: string
}

/** 下拉选项节点（GET /dicts/:dictKey/items 返回的树形结构，叶子 children 为 []） */
export type DictOptionNode = {
  /** 字典项 ID */
  id: number
  /** 展示文本（下拉显示用） */
  label: string
  /** 存储值（提交表单用） */
  value: string
  /** 子选项数组（递归嵌套；叶子为 []） */
  children: DictOptionNode[]
}

/**
 * 全部启用字典（需鉴权；任意登录用户可调用，仅返回启用 status=0 的类型）。
 * 返回按 sort 升序、id 升序排列；拿到 dictKey 后再调 getDictOptions 获取选项。
 */
export function getEnabledDicts(signal?: AbortSignal) {
  return http.get<EnabledDict[]>('/dicts', { signal })
}

/**
 * 按编码读取下拉选项（需鉴权；任意登录用户可调用）。
 * 仅返回启用项，停用节点连同其子树整体隐藏。
 */
export function getDictOptions(dictKey: string, signal?: AbortSignal) {
  return http.get<DictOptionNode[]>(
    `/dicts/${encodeURIComponent(dictKey)}/items`,
    { signal }
  )
}

// ── 前端管理数据收集 ─────────────────────────────────────

/** 单页最大条数（后端 pageSize 上限） */
const PAGE_SIZE_MAX = 100

/**
 * 拉取全部字典类型（翻页收集，用于左侧列表）。
 * 返回结构适配 useRequest（{ data }），故返回包装对象。
 */
export async function listAllDictTypes(signal?: AbortSignal) {
  const all: DictTypeItem[] = []
  let page = 1
  for (;;) {
    const result = await getDictTypes({ page, pageSize: PAGE_SIZE_MAX }, signal)
    all.push(...result.data.list)
    if (page >= result.data.totalPages) break
    page += 1
  }
  return { data: all }
}

/**
 * 拉取某类型全部字典项（翻页收集，用于构建管理树）。
 * 返回结构适配 useRequest（{ data }），故返回包装对象。
 */
export async function listAllDictItems(
  dictTypeId: number,
  signal?: AbortSignal
) {
  const all: DictItem[] = []
  let page = 1
  for (;;) {
    const result = await getDictItems(
      { page, pageSize: PAGE_SIZE_MAX, dictTypeId },
      signal
    )
    all.push(...result.data.list)
    if (page >= result.data.totalPages) break
    page += 1
  }
  return { data: all }
}
