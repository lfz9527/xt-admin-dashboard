import type { DictItem } from '@/service/dict'

/** 管理树节点：在字典项基础上附加 children（同级按 sort、id 升序） */
export type DictItemTreeNode = DictItem & { children: DictItemTreeNode[] }

/** 由扁平字典项构建管理树（按 parentId 分组；parentId=0 或父项缺失时挂根级） */
export function buildDictItemTree(items: DictItem[]): DictItemTreeNode[] {
  const nodes: DictItemTreeNode[] = items.map((item) => ({
    ...item,
    children: [],
  }))
  const byId = new Map<string, DictItemTreeNode>()
  nodes.forEach((node) => byId.set(String(node.id), node))

  const roots: DictItemTreeNode[] = []
  nodes.forEach((node) => {
    const parent =
      node.parentId === 0 ? undefined : byId.get(String(node.parentId))
    // 父项存在且非自身时挂到父级，否则作为根级（兜底避免孤儿节点丢失）
    if (parent && parent.id !== node.id) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortNodes = (list: DictItemTreeNode[]) => {
    list.sort((a, b) => a.sort - b.sort || Number(a.id) - Number(b.id))
    list.forEach((node) => sortNodes(node.children))
  }
  sortNodes(roots)
  return roots
}

/** 在树中按 id 查找节点 */
export function findTreeNode(
  nodes: DictItemTreeNode[],
  id: number
): DictItemTreeNode | null {
  for (const node of nodes) {
    if (Number(node.id) === id) return node
    const found = findTreeNode(node.children, id)
    if (found) return found
  }
  return null
}

/** 统计节点子树节点数（含自身） */
export function countItemSubtree(node: DictItemTreeNode): number {
  return (
    1 + node.children.reduce((sum, child) => sum + countItemSubtree(child), 0)
  )
}

/** 收集节点自身及全部子孙 id（用于编辑时排除，防止移动到自身/子孙下） */
export function collectItemSubtreeIds(node: DictItemTreeNode): Set<number> {
  const ids = new Set<number>()
  const walk = (item: DictItemTreeNode) => {
    ids.add(Number(item.id))
    item.children.forEach(walk)
  }
  walk(node)
  return ids
}

/**
 * 生成树形缩进的父级下拉选项。
 * @param tree 管理树
 * @param excluded 需排除的节点 id（编辑时排除自身及子孙，其后代一并跳过）
 */
export function buildParentOptions(
  tree: DictItemTreeNode[],
  excluded: Set<number>
): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  const walk = (nodes: DictItemTreeNode[], level: number) => {
    for (const node of nodes) {
      // 命中排除集合：跳过该节点及其整个子树（不允许选为父级）
      if (excluded.has(Number(node.id))) continue
      // 用不换行空格模拟层级缩进
      options.push({
        value: String(node.id),
        label: `${'\u00a0\u00a0'.repeat(level)}${node.label}`,
      })
      walk(node.children, level + 1)
    }
  }
  walk(tree, 0)
  return options
}
