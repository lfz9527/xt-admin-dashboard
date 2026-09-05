import { useState } from 'react'

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TreeView } from '@/components/Tree'

type TestNode = {
  id: number
  title: string
  children: TestNode[]
}

const initialTree: TestNode[] = [
  {
    id: 1,
    title: '根节点',
    children: [{ id: 2, title: '子节点', children: [] }],
  },
]

function ControlledTree({
  loadData,
  lazy = false,
  onSelect,
}: {
  loadData?: (node: TestNode) => Promise<void>
  lazy?: boolean
  onSelect?: (keys: string[]) => void
}) {
  const [tree, setTree] = useState(initialTree)
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [loadedKeys, setLoadedKeys] = useState<string[]>([])

  return (
    <TreeView
      treeData={tree}
      fieldNames={{ key: 'id', title: 'title', children: 'children' }}
      expandedKeys={expandedKeys}
      selectedKeys={selectedKeys}
      loadedKeys={loadedKeys}
      onExpand={setExpandedKeys}
      onSelect={(keys) => {
        setSelectedKeys(keys)
        onSelect?.(keys)
      }}
      expandOnTitleClick
      isLeaf={(node) => (lazy ? false : node.children.length === 0)}
      loadData={
        lazy
          ? async (node) => {
              await loadData?.(node)
              setLoadedKeys((prev) => [...prev, String(node.id)])
              setTree((prev) =>
                prev.map((item) =>
                  item.id === node.id
                    ? {
                        ...item,
                        children: [
                          ...item.children,
                          { id: 2, title: '懒加载子节点', children: [] },
                        ],
                      }
                    : item
                )
              )
            }
          : undefined
      }
      titleRender={(node) => node.title}
    />
  )
}

describe('TreeView', () => {
  it('受控展开并保持箭头点击不触发选中', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ControlledTree onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: '展开' }))
    expect(screen.getByText('子节点')).toBeInTheDocument()
    expect(onSelect).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: '收起' }))
    expect(screen.queryByText('子节点')).not.toBeInTheDocument()
    expect(screen.queryByText('根节点')).toBeInTheDocument()
  })

  it('展开未加载节点前调用 loadData，成功后再展开', async () => {
    const user = userEvent.setup()
    const loadData = vi.fn(async () => undefined)
    render(
      <ControlledTree
        lazy
        loadData={loadData}
      />
    )

    await user.click(screen.getByRole('button', { name: '展开' }))

    await waitFor(() => {
      expect(loadData).toHaveBeenCalledWith(initialTree[0])
    })
    expect(await screen.findByText('懒加载子节点')).toBeInTheDocument()
  })
})
