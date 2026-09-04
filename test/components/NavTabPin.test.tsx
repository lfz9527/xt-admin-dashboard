import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router'
import { NavTab, NavTabProvider, useNavTab, type Tab } from '@/layout/NavTab'

const originalResizeObserver = window.ResizeObserver

beforeEach(() => {
  window.ResizeObserver = class {
    observe() {}
    disconnect() {}
    unobserve() {}
  } as unknown as typeof ResizeObserver
})

afterEach(() => {
  window.ResizeObserver = originalResizeObserver
})

/** 渲染 Provider 状态探针：显示标签顺序与 pinned 标记，供 context 层操作 */
function renderStateHarness(defaultTabs: Tab[], defaultActiveTabId: string) {
  function Harness() {
    const {
      tabs,
      removeTab,
      removeTabs,
      refreshTab,
      refreshCounts,
      togglePin,
    } = useNavTab()
    return (
      <div>
        <span data-testid='order'>
          {tabs.map((t) => `${t.id}${t.pinned ? '*' : ''}`).join(',')}
        </span>
        <span data-testid='refresh-b'>{refreshCounts['b'] ?? 0}</span>
        <button onClick={() => togglePin('b')}>Toggle Pin B</button>
        <button onClick={() => togglePin('c')}>Toggle Pin C</button>
        <button onClick={() => removeTab('b')}>Remove B</button>
        <button onClick={() => removeTabs(['b', 'c'])}>Remove B+C</button>
        <button onClick={() => refreshTab('b')}>Refresh B</button>
      </div>
    )
  }

  render(
    <MemoryRouter>
      <NavTabProvider
        defaultTabs={defaultTabs}
        defaultActiveTabId={defaultActiveTabId}
      >
        <Harness />
      </NavTabProvider>
    </MemoryRouter>
  )
}

describe('togglePin 固定/取消固定（context 层）', () => {
  const defaultTabs: Tab[] = [
    { id: 'a', title: 'Tab A' },
    { id: 'b', title: 'Tab B' },
    { id: 'c', title: 'Tab C' },
  ]

  it('固定移动标签至第一位，后固定者排更左；取消固定位置保持不变', () => {
    renderStateHarness(defaultTabs, 'a')
    expect(screen.getByTestId('order').textContent).toBe('a,b,c')

    fireEvent.click(screen.getByText('Toggle Pin B'))
    expect(screen.getByTestId('order').textContent).toBe('b*,a,c')

    // 再固定 C：C 移到最左，原固定 B 右移一位
    fireEvent.click(screen.getByText('Toggle Pin C'))
    expect(screen.getByTestId('order').textContent).toBe('c*,b*,a')

    // 取消固定 C：仅解除 pinned，位置保持在第一位不动
    fireEvent.click(screen.getByText('Toggle Pin C'))
    expect(screen.getByTestId('order').textContent).toBe('c,b*,a')

    // 取消固定 B：位置保持在第二位不动
    fireEvent.click(screen.getByText('Toggle Pin B'))
    expect(screen.getByTestId('order').textContent).toBe('c,b,a')
  })

  it('pinned 标签 removeTab 无法关闭', () => {
    renderStateHarness(defaultTabs, 'a')

    fireEvent.click(screen.getByText('Toggle Pin B'))
    fireEvent.click(screen.getByText('Remove B'))

    expect(screen.getByTestId('order').textContent).toBe('b*,a,c')
  })

  it('批量关闭包含 pinned 标签时保留且不清其刷新计数', () => {
    renderStateHarness(defaultTabs, 'a')

    fireEvent.click(screen.getByText('Refresh B'))
    expect(screen.getByTestId('refresh-b').textContent).toBe('1')

    fireEvent.click(screen.getByText('Toggle Pin B'))
    fireEvent.click(screen.getByText('Remove B+C'))

    // B 固定保留并前置，C 被关闭；B 的刷新计数未被连带清理
    expect(screen.getByTestId('order').textContent).toBe('b*,a')
    expect(screen.getByTestId('refresh-b').textContent).toBe('1')
  })
})

describe('NavTab 固定（UI 层）', () => {
  function renderTabs(defaultTabs: Tab[], defaultActiveTabId: string) {
    function Page() {
      const { tabs } = useNavTab()
      return (
        <div>
          <NavTab />
          <span data-testid='count'>{tabs.length}</span>
        </div>
      )
    }

    render(
      <MemoryRouter>
        <NavTabProvider
          defaultTabs={defaultTabs}
          defaultActiveTabId={defaultActiveTabId}
        >
          <Page />
        </NavTabProvider>
      </MemoryRouter>
    )
  }

  /** 按 DOM 顺序返回标签 id（textContent 即标题） */
  function tabOrder(): string[] {
    return Array.from(
      document.querySelectorAll('[data-slot="nav-tab-item"]')
    ).map((el) => el.textContent?.trim() ?? '')
  }

  function itemOf(title: string): Element {
    return screen
      .getByText(title)
      .closest('[data-slot="nav-tab-item"]') as Element
  }

  it('右键固定后标签移至第一位，X 图标变为 Pin 图标', () => {
    renderTabs(
      [
        { id: 'a', title: 'Tab A' },
        { id: 'b', title: 'Tab B' },
        { id: 'c', title: 'Tab C' },
      ],
      'a'
    )

    expect(
      itemOf('Tab B').querySelector('[data-slot="nav-tab-close"]')
    ).not.toBeNull()
    expect(
      itemOf('Tab B').querySelector('[data-slot="nav-tab-pin"]')
    ).toBeNull()

    fireEvent.contextMenu(itemOf('Tab B'))
    fireEvent.click(screen.getByRole('menuitem', { name: '固定' }))

    expect(tabOrder()).toEqual(['Tab B', 'Tab A', 'Tab C'])
    const tabB = itemOf('Tab B')
    expect(tabB.querySelector('[data-slot="nav-tab-pin"]')).not.toBeNull()
    expect(tabB.querySelector('[data-slot="nav-tab-close"]')).toBeNull()
    // 其余标签仍为可关闭态
    expect(
      itemOf('Tab A').querySelector('[data-slot="nav-tab-close"]')
    ).not.toBeNull()
    expect(
      itemOf('Tab C').querySelector('[data-slot="nav-tab-close"]')
    ).not.toBeNull()
  })

  it('pinned 标签右键菜单的固定与关闭项均禁用', () => {
    renderTabs(
      [
        { id: 'a', title: 'Tab A' },
        { id: 'b', title: 'Tab B' },
        { id: 'c', title: 'Tab C' },
      ],
      'a'
    )

    fireEvent.contextMenu(itemOf('Tab B'))
    fireEvent.click(screen.getByRole('menuitem', { name: '固定' }))

    fireEvent.contextMenu(itemOf('Tab B'))
    expect(screen.getByRole('menuitem', { name: '固定' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
    expect(screen.getByRole('menuitem', { name: '关闭' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })

  it('点击 Pin 图标取消固定：恢复 X 图标、允许关闭且位置不变', () => {
    renderTabs(
      [
        { id: 'a', title: 'Tab A' },
        { id: 'b', title: 'Tab B' },
        { id: 'c', title: 'Tab C' },
      ],
      'a'
    )

    fireEvent.contextMenu(itemOf('Tab B'))
    fireEvent.click(screen.getByRole('menuitem', { name: '固定' }))
    expect(tabOrder()).toEqual(['Tab B', 'Tab A', 'Tab C'])

    fireEvent.click(itemOf('Tab B').querySelector('[data-slot="nav-tab-pin"]')!)

    // 位置保持在第一位不变，X 图标恢复，右键关闭恢复可用
    expect(tabOrder()).toEqual(['Tab B', 'Tab A', 'Tab C'])
    const tabB = itemOf('Tab B')
    expect(tabB.querySelector('[data-slot="nav-tab-pin"]')).toBeNull()
    expect(tabB.querySelector('[data-slot="nav-tab-close"]')).not.toBeNull()

    fireEvent.contextMenu(itemOf('Tab B'))
    expect(screen.getByRole('menuitem', { name: '关闭' })).not.toHaveAttribute(
      'aria-disabled'
    )
  })

  it('关闭右侧标签页时 pinned 标签保留', () => {
    renderTabs(
      [
        { id: 'a', title: 'Tab A' },
        { id: 'b', title: 'Tab B' },
        { id: 'c', title: 'Tab C' },
      ],
      'a'
    )

    // 固定 B：B 移到第一位，右侧为 A、C
    fireEvent.contextMenu(itemOf('Tab B'))
    fireEvent.click(screen.getByRole('menuitem', { name: '固定' }))

    fireEvent.contextMenu(itemOf('Tab B'))
    fireEvent.click(screen.getByRole('menuitem', { name: '关闭右侧标签页' }))

    // B 固定保留；激活的 A 被关闭后激活转移到左侧最近的 B
    expect(tabOrder()).toEqual(['Tab B'])
    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('关闭全部标签页仅保留固定标签并激活之', () => {
    renderTabs(
      [
        { id: 'a', title: 'Tab A' },
        { id: 'b', title: 'Tab B' },
        { id: 'c', title: 'Tab C' },
      ],
      'a'
    )

    // 固定 C：C 移最左，顺序为 C、A、B
    fireEvent.contextMenu(itemOf('Tab C'))
    fireEvent.click(screen.getByRole('menuitem', { name: '固定' }))

    fireEvent.contextMenu(itemOf('Tab A'))
    fireEvent.click(screen.getByRole('menuitem', { name: '关闭全部标签页' }))

    // 激活的 A 非固定被关闭；固定标签 C 保留并成为激活标签
    expect(tabOrder()).toEqual(['Tab C'])
    expect(screen.getByTestId('count').textContent).toBe('1')
    expect(itemOf('Tab C').getAttribute('data-active')).toBe('true')
  })

  it('激活标签被关闭时激活剩余第一个（最左固定）标签', () => {
    renderTabs(
      [
        { id: 'a', title: 'Tab A' },
        { id: 'b', title: 'Tab B' },
        { id: 'c', title: 'Tab C' },
      ],
      'c'
    )

    // 依次固定 B、A：顺序变为 A、B、C
    fireEvent.contextMenu(itemOf('Tab B'))
    fireEvent.click(screen.getByRole('menuitem', { name: '固定' }))
    fireEvent.contextMenu(itemOf('Tab A'))
    fireEvent.click(screen.getByRole('menuitem', { name: '固定' }))
    expect(tabOrder()).toEqual(['Tab A', 'Tab B', 'Tab C'])

    // 激活的 C 非固定被关闭，激活转移到剩余第一个固定 A
    fireEvent.contextMenu(itemOf('Tab C'))
    fireEvent.click(screen.getByRole('menuitem', { name: '关闭全部标签页' }))

    expect(tabOrder()).toEqual(['Tab A', 'Tab B'])
    expect(itemOf('Tab A').getAttribute('data-active')).toBe('true')
  })

  it('左侧标签全固定或为空时「关闭左侧标签页」禁用，存在可关闭标签时可用', () => {
    renderTabs(
      [
        { id: 'a', title: 'Tab A', pinned: true },
        { id: 'b', title: 'Tab B' },
        { id: 'c', title: 'Tab C' },
      ],
      'b'
    )

    // 右键 Tab B：左侧只有固定 Tab A，关闭左侧禁用
    fireEvent.contextMenu(itemOf('Tab B'))
    expect(
      screen.getByRole('menuitem', { name: '关闭左侧标签页' })
    ).toHaveAttribute('aria-disabled', 'true')

    // 右键 Tab C：左侧含普通 Tab B，关闭左侧可用
    fireEvent.contextMenu(itemOf('Tab C'))
    expect(
      screen.getByRole('menuitem', { name: '关闭左侧标签页' })
    ).not.toHaveAttribute('aria-disabled')
  })

  it('右侧标签全固定或为空时「关闭右侧标签页」禁用，存在可关闭标签时可用', () => {
    renderTabs(
      [
        { id: 'a', title: 'Tab A' },
        { id: 'b', title: 'Tab B' },
        { id: 'c', title: 'Tab C', pinned: true },
      ],
      'b'
    )

    // 右键 Tab B：右侧只有固定 Tab C，关闭右侧禁用
    fireEvent.contextMenu(itemOf('Tab B'))
    expect(
      screen.getByRole('menuitem', { name: '关闭右侧标签页' })
    ).toHaveAttribute('aria-disabled', 'true')

    // 右键 Tab A：右侧含普通 Tab B，关闭右侧可用
    fireEvent.contextMenu(itemOf('Tab A'))
    expect(
      screen.getByRole('menuitem', { name: '关闭右侧标签页' })
    ).not.toHaveAttribute('aria-disabled')

    // 右键 Tab C（最后一个，右侧为空）：关闭右侧禁用
    fireEvent.contextMenu(itemOf('Tab C'))
    expect(
      screen.getByRole('menuitem', { name: '关闭右侧标签页' })
    ).toHaveAttribute('aria-disabled', 'true')
  })

  it('全部标签都固定时关闭全部菜单项禁用', () => {
    renderTabs(
      [
        { id: 'a', title: 'Tab A', pinned: true },
        { id: 'b', title: 'Tab B' },
      ],
      'a'
    )

    // 再固定 B：所有标签均已固定
    fireEvent.contextMenu(itemOf('Tab B'))
    fireEvent.click(screen.getByRole('menuitem', { name: '固定' }))

    fireEvent.contextMenu(itemOf('Tab A'))
    expect(
      screen.getByRole('menuitem', { name: '关闭全部标签页' })
    ).toHaveAttribute('aria-disabled', 'true')
  })

  it('唯一标签也可固定出现 Pin 图标，点击 Pin 可取消固定', () => {
    renderTabs([{ id: 'a', title: 'Tab A' }], 'a')

    // 唯一标签无 X 图标，右键固定入口可用
    expect(
      itemOf('Tab A').querySelector('[data-slot="nav-tab-close"]')
    ).toBeNull()
    fireEvent.contextMenu(itemOf('Tab A'))
    fireEvent.click(screen.getByRole('menuitem', { name: '固定' }))

    expect(
      itemOf('Tab A').querySelector('[data-slot="nav-tab-pin"]')
    ).not.toBeNull()

    fireEvent.click(itemOf('Tab A').querySelector('[data-slot="nav-tab-pin"]')!)

    expect(
      itemOf('Tab A').querySelector('[data-slot="nav-tab-pin"]')
    ).toBeNull()
    expect(tabOrder()).toEqual(['Tab A'])
  })

  it('closable=false 标签右键菜单固定项禁用', () => {
    renderTabs(
      [
        { id: 'a', title: 'Home', closable: false },
        { id: 'b', title: 'Page' },
      ],
      'a'
    )

    fireEvent.contextMenu(itemOf('Home'))
    expect(screen.getByRole('menuitem', { name: '固定' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })
})
