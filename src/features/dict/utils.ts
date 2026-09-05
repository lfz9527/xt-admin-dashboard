import type { DictItem } from '@/service/dict'
import {
  collectTreeSubtreeIds,
  countTreeSubtree,
  findTreeNode as findTreeNodeInTree,
  walkTree,
} from '@/utils/tree'

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

/** 在字典项树中按 id 查找节点。 */
export function findTreeNode(
  nodes: DictItemTreeNode[],
  id: number
): DictItemTreeNode | null {
  return findTreeNodeInTree(nodes, id)
}

/** 统计字典项子树节点数（含自身）。 */
export function countItemSubtree(node: DictItemTreeNode): number {
  return countTreeSubtree(node)
}

/** 收集字典项节点自身及全部子孙 id。 */
export function collectItemSubtreeIds(node: DictItemTreeNode): Set<number> {
  return collectTreeSubtreeIds(node, (item) => Number(item.id))
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
  walkTree(tree, (node, { depth }) => {
    // 命中排除集合：跳过该节点及其整个子树（不允许选为父级）。
    if (excluded.has(Number(node.id))) return false
    // 用不换行空格模拟层级缩进。
    options.push({
      value: String(node.id),
      label: `${'\u00a0\u00a0'.repeat(depth)}${node.label}`,
    })
  })
  return options
}
