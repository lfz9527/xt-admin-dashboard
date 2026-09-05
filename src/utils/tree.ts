/** 树节点 ID 支持后端常见的数字或字符串形式。 */
export type TreeKeyValue = string | number

/** 具备稳定 id 和子节点集合的最小树节点结构。 */
export type TreeNodeLike<TNode = unknown> = {
  id: TreeKeyValue
  children?: readonly TNode[]
}

/** 在树中按 id 查找节点，兼容字符串/数字 id。 */
export function findTreeNode<TNode extends TreeNodeLike<TNode>>(
  nodes: readonly TNode[],
  id: TreeKeyValue
): TNode | null {
  for (const node of nodes) {
    if (String(node.id) === String(id)) return node
    const found = findTreeNode(node.children ?? [], id)
    if (found) return found
  }
  return null
}

/** 统计节点及其全部已加载子孙数量（含自身）。 */
export function countTreeSubtree<TNode extends TreeNodeLike<TNode>>(
  node: TNode
): number {
  return (
    1 +
    (node.children ?? []).reduce(
      (sum, child) => sum + countTreeSubtree(child),
      0
    )
  )
}

/** 收集节点自身及其全部已加载子孙 id。 */
export function collectTreeSubtreeIds<
  TNode extends TreeNodeLike<TNode>,
  TId extends TreeKeyValue = TNode['id'],
>(node: TNode, getId?: (node: TNode) => TId): Set<TId> {
  const ids = new Set<TId>()
  const resolveId = getId ?? ((item: TNode) => item.id as TId)
  const walk = (item: TNode) => {
    ids.add(resolveId(item))
    item.children?.forEach(walk)
  }
  walk(node)
  return ids
}

export type TreeWalkContext = {
  depth: number
}

/** 深度优先遍历树；visitor 返回 false 时跳过当前节点的整个子树。 */
export function walkTree<TNode extends TreeNodeLike<TNode>>(
  nodes: readonly TNode[],
  visitor: (node: TNode, context: TreeWalkContext) => boolean | void
) {
  const walk = (items: readonly TNode[], depth: number) => {
    for (const node of items) {
      if (visitor(node, { depth }) !== false) {
        walk(node.children ?? [], depth + 1)
      }
    }
  }
  walk(nodes, 0)
}
