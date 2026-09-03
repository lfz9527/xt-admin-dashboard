import type { DictItem } from '@/service/dict'
import {
  buildDictItemTree,
  buildParentOptions,
  collectItemSubtreeIds,
  countItemSubtree,
  findTreeNode,
} from '@/features/dict/utils'

function makeItem(overrides: Partial<DictItem>): DictItem {
  return {
    id: '1',
    dictTypeId: 1,
    parentId: 0,
    type: { id: 1, name: '用户性别', dictKey: 'sys_user_sex' },
    label: '男',
    value: '0',
    status: 0,
    sort: 0,
    remark: '',
    createdAt: '2026-09-04T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
    ...overrides,
  }
}

describe('buildDictItemTree', () => {
  it('按 parentId 构建父子层级，同级按 sort/id 升序', () => {
    const items = [
      makeItem({ id: '1', parentId: 0, sort: 0, label: '根A' }),
      makeItem({ id: '2', parentId: 0, sort: 1, label: '根B' }),
      makeItem({ id: '3', parentId: 1, sort: 0, label: '子A1' }),
      makeItem({ id: '4', parentId: 1, sort: 1, label: '子A2' }),
      makeItem({ id: '5', parentId: 3, sort: 0, label: '孙A1a' }),
    ]

    const tree = buildDictItemTree(items)

    expect(tree.map((n) => n.label)).toEqual(['根A', '根B'])
    expect(tree[0].children.map((n) => n.label)).toEqual(['子A1', '子A2'])
    expect(tree[0].children[0].children.map((n) => n.label)).toEqual(['孙A1a'])
    expect(tree[0].children[0].children[0].children).toEqual([])
  })

  it('父项缺失的孤儿节点兜底挂到根级，不丢失数据', () => {
    const items = [
      makeItem({ id: '1', parentId: 0, label: '根' }),
      makeItem({ id: '2', parentId: 999, label: '孤儿' }),
    ]

    const tree = buildDictItemTree(items)

    expect(tree.map((n) => n.label)).toEqual(['根', '孤儿'])
  })

  it('相同 sort 时按 id 升序排列', () => {
    const items = [
      makeItem({ id: '3', parentId: 0, sort: 0, label: 'C' }),
      makeItem({ id: '1', parentId: 0, sort: 0, label: 'A' }),
      makeItem({ id: '2', parentId: 0, sort: 0, label: 'B' }),
    ]

    const tree = buildDictItemTree(items)

    expect(tree.map((n) => n.label)).toEqual(['A', 'B', 'C'])
  })
})

describe('findTreeNode / countItemSubtree / collectItemSubtreeIds', () => {
  const tree = buildDictItemTree([
    makeItem({ id: '1', parentId: 0, sort: 0, label: '根' }),
    makeItem({ id: '2', parentId: 1, sort: 0, label: '子' }),
    makeItem({ id: '3', parentId: 2, sort: 0, label: '孙' }),
    makeItem({ id: '4', parentId: 0, sort: 1, label: '根2' }),
  ])

  it('findTreeNode 能按 id 找到节点', () => {
    expect(findTreeNode(tree, 3)?.label).toBe('孙')
    expect(findTreeNode(tree, 99)).toBeNull()
  })

  it('countItemSubtree 统计自身及全部子孙', () => {
    const root = findTreeNode(tree, 1)!
    expect(countItemSubtree(root)).toBe(3)
    expect(countItemSubtree(findTreeNode(tree, 2)!)).toBe(2)
  })

  it('collectItemSubtreeIds 收集自身及子孙 id', () => {
    const ids = collectItemSubtreeIds(findTreeNode(tree, 1)!)
    expect([...ids].sort()).toEqual([1, 2, 3])
  })
})

describe('buildParentOptions', () => {
  const tree = buildDictItemTree([
    makeItem({ id: '1', parentId: 0, sort: 0, label: '省' }),
    makeItem({ id: '2', parentId: 1, sort: 0, label: '市' }),
    makeItem({ id: '3', parentId: 2, sort: 0, label: '区' }),
  ])

  it('按层级缩进生成选项（整棵树）', () => {
    const options = buildParentOptions(tree, new Set())
    expect(options.map((o) => o.value)).toEqual(['1', '2', '3'])
    // 二级、三级节点带不换行空格缩进
    expect(options[1].label).toBe('\u00a0\u00a0市')
    expect(options[2].label).toBe('\u00a0\u00a0\u00a0\u00a0区')
  })

  it('排除自身及子孙（不含其后代），层内不再递归被排除分支', () => {
    const options = buildParentOptions(tree, new Set([1]))
    // 排除 1 及其整棵子树后，只剩根级选项（由调用方补「根级」）
    expect(options).toEqual([])
  })

  it('仅排除指定节点并保留其余兄弟节点', () => {
    const options = buildParentOptions(tree, new Set([3]))
    expect(options.map((o) => o.value)).toEqual(['1', '2'])
  })
})
