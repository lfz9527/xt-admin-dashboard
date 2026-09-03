import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Modal } from '@/components/Modal'

beforeEach(() => {
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      disconnect() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver
  }
})

describe('Modal', () => {
  it('open 时渲染 title、children 与默认底部「取消 / 确认」按钮', () => {
    render(
      <Modal
        open
        title='弹窗标题'
        onOk={vi.fn()}
        onCancel={vi.fn()}
      >
        <div>主体内容</div>
      </Modal>
    )

    expect(screen.getByText('弹窗标题')).toBeInTheDocument()
    expect(screen.getByText('主体内容')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '确认' })).toBeInTheDocument()
  })

  it('open=false 时不渲染弹窗内容', () => {
    render(
      <Modal
        open={false}
        title='弹窗标题'
      >
        <div>主体内容</div>
      </Modal>
    )

    expect(screen.queryByText('弹窗标题')).not.toBeInTheDocument()
    expect(screen.queryByText('主体内容')).not.toBeInTheDocument()
  })

  it('点击确认只回调 onOk，点击取消回调 onCancel', async () => {
    const user = userEvent.setup()
    const onOk = vi.fn()
    const onCancel = vi.fn()

    render(
      <Modal
        open
        onOk={onOk}
        onCancel={onCancel}
      >
        <div>主体内容</div>
      </Modal>
    )

    await user.click(screen.getByRole('button', { name: '确认' }))
    expect(onOk).toHaveBeenCalledOnce()
    expect(onCancel).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: '取消' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('okText / cancelText 自定义按钮文案', () => {
    render(
      <Modal
        open
        okText='保存'
        cancelText='返回'
      >
        <div>主体内容</div>
      </Modal>
    )

    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '返回' })).toBeInTheDocument()
  })

  it('confirmLoading 时确认按钮禁用并显示 Spinner', () => {
    render(
      <Modal
        open
        confirmLoading
      >
        <div>主体内容</div>
      </Modal>
    )

    // Spinner 自带 aria-label="Loading"，按钮可访问名为 "Loading 确认"
    const okButton = screen.getByRole('button', { name: /确认/ })
    expect(okButton).toBeDisabled()
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })

  it('footer={null} 隐藏底部，自定义 footer 正常渲染', () => {
    const { rerender } = render(
      <Modal
        open
        footer={null}
      >
        <div>主体内容</div>
      </Modal>
    )

    expect(
      screen.queryByRole('button', { name: '确认' })
    ).not.toBeInTheDocument()

    rerender(
      <Modal
        open
        footer={<button>自定义操作</button>}
      >
        <div>主体内容</div>
      </Modal>
    )

    expect(
      screen.getByRole('button', { name: '自定义操作' })
    ).toBeInTheDocument()
  })

  it('点击右上角关闭按钮回调 onCancel，closable=false 时不渲染', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const { rerender } = render(
      <Modal
        open
        onCancel={onCancel}
      >
        <div>主体内容</div>
      </Modal>
    )

    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onCancel).toHaveBeenCalledOnce()

    rerender(
      <Modal
        open
        closable={false}
        onCancel={onCancel}
      >
        <div>主体内容</div>
      </Modal>
    )
    expect(
      screen.queryByRole('button', { name: 'Close' })
    ).not.toBeInTheDocument()
  })

  it('maskClosable 默认点击蒙版关闭，false 时点击蒙版不关闭', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const { rerender } = render(
      <Modal
        open
        onCancel={onCancel}
      >
        <div>主体内容</div>
      </Modal>
    )

    await user.click(document.querySelector("[data-slot='dialog-overlay']")!)
    expect(onCancel).toHaveBeenCalledOnce()

    rerender(
      <Modal
        open
        maskClosable={false}
        onCancel={onCancel}
      >
        <div>主体内容</div>
      </Modal>
    )
    await user.click(document.querySelector("[data-slot='dialog-overlay']")!)
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('width 以 inline style 应用到弹窗内容', () => {
    render(
      <Modal
        open
        width={640}
      >
        <div>主体内容</div>
      </Modal>
    )

    expect(
      screen.getByText('主体内容').closest("[data-slot='dialog-content']")
    ).toHaveStyle({
      width: '640px',
    })
  })

  it('afterOpenChange 在打开/关闭动画结束后回调', async () => {
    const afterOpenChange = vi.fn()
    const { rerender } = render(
      <Modal
        open={false}
        afterOpenChange={afterOpenChange}
      >
        <div>主体内容</div>
      </Modal>
    )

    rerender(
      <Modal
        open
        afterOpenChange={afterOpenChange}
      >
        <div>主体内容</div>
      </Modal>
    )
    await waitFor(() => expect(afterOpenChange).toHaveBeenCalledWith(true))

    rerender(
      <Modal
        open={false}
        afterOpenChange={afterOpenChange}
      >
        <div>主体内容</div>
      </Modal>
    )
    await waitFor(() => expect(afterOpenChange).toHaveBeenCalledWith(false))
  })
})
