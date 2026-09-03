import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Confirm } from '@/components/Confirm'

beforeEach(() => {
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      disconnect() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver
  }
})

describe('Confirm', () => {
  it('open 时渲染 title、description 与默认「取消 / 确认」按钮', () => {
    render(
      <Confirm
        open
        title='删除用户'
        description='确认删除该用户？该操作不可恢复。'
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    )

    expect(screen.getByText('删除用户')).toBeInTheDocument()
    expect(
      screen.getByText('确认删除该用户？该操作不可恢复。')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '确认' })).toBeInTheDocument()
  })

  it('open=false 时不渲染内容', () => {
    render(
      <Confirm
        open={false}
        title='删除用户'
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.queryByText('删除用户')).not.toBeInTheDocument()
  })

  it('description 不传时不渲染描述节点', () => {
    render(
      <Confirm
        open
        title='删除用户'
        onOpenChange={vi.fn()}
      />
    )

    expect(
      document.querySelector("[data-slot='alert-dialog-description']")
    ).not.toBeInTheDocument()
  })

  it('点击确认只回调 onConfirm，点击取消回调 onOpenChange(false)', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <Confirm
        open
        title='删除用户'
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    )

    await user.click(screen.getByRole('button', { name: '确认' }))
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onOpenChange).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: '取消' }))
    // Base UI onOpenChange 签名为 (open, eventDetails)
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })

  it('ESC 关闭回调 onOpenChange(false)', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <Confirm
        open
        title='删除用户'
        onOpenChange={onOpenChange}
      />
    )

    await user.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })

  it('confirmText / cancelText 自定义按钮文案', () => {
    render(
      <Confirm
        open
        title='删除用户'
        onOpenChange={vi.fn()}
        confirmText='确认删除'
        cancelText='返回'
      />
    )

    expect(screen.getByRole('button', { name: '确认删除' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '返回' })).toBeInTheDocument()
  })

  it('destructive 时确认按钮应用 destructive 变体', () => {
    const { rerender } = render(
      <Confirm
        open
        title='删除用户'
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: '确认' })).not.toHaveClass(
      'text-destructive'
    )

    rerender(
      <Confirm
        open
        destructive
        title='删除用户'
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: '确认' })).toHaveClass(
      'text-destructive'
    )
  })

  it('confirmLoading 时确认按钮禁用并显示 Spinner', () => {
    render(
      <Confirm
        open
        title='删除用户'
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        confirmLoading
      />
    )

    // Spinner 自带 aria-label="Loading"，按钮可访问名为 "Loading 确认"
    const okButton = screen.getByRole('button', { name: /确认/ })
    expect(okButton).toBeDisabled()
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })

  it('confirmButtonProps / cancelButtonProps 透传且覆盖内置属性', () => {
    render(
      <Confirm
        open
        destructive
        title='删除用户'
        onOpenChange={vi.fn()}
        confirmButtonProps={{ variant: 'outline' }}
        cancelButtonProps={{ className: 'custom-cancel' }}
      />
    )

    // 显式 variant 覆盖 destructive 内置值
    const okButton = screen.getByRole('button', { name: '确认' })
    expect(okButton).toHaveClass('bg-background')
    expect(okButton).not.toHaveClass('text-destructive')

    expect(screen.getByRole('button', { name: '取消' })).toHaveClass(
      'custom-cancel'
    )
  })
})
