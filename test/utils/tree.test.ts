import {
  collectTreeSubtreeIds,
  countTreeSubtree,
  findTreeNode,
  walkTree,
} from '@/utils/tree'
import { describe, expect, it } from 'vitest'

type TestNode = {
  id: string
  name: string
  children: TestNode[]
}

const tree: TestNode[] = [
  {
    id: '1',
    name: '根',
    children: [
      {
        id: '2',
        name: '子',
        children: [{ id: '3', name: '孙', children: [] }],
      },
    ],
  },
]

describe('tree utilities', () => {
  it('支持字符串/数字 id 查找并统计已加载子树', () => {
    const node = findTreeNode(tree, 3)

    expect(node?.name).toBe('孙')
    expect(countTreeSubtree(tree[0])).toBe(3)
  })

  it('支持自定义 id 转换并收集子树节点', () => {
    expect([
      ...collectTreeSubtreeIds(tree[0], (node) => Number(node.id)),
    ]).toEqual([1, 2, 3])
  })

  it('遍历时返回 false 可以跳过整个子树', () => {
    const visited: string[] = []

    walkTree(tree, (node) => {
      visited.push(node.name)
      return node.id !== '2'
    })

    expect(visited).toEqual(['根', '子'])
  })
})
