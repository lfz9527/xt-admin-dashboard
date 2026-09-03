import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SelectData } from '@/components/SelectData'

beforeEach(() => {
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      disconnect() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver
  }
})

const options = [
  { value: '1', label: '选项一' },
  { value: '2', label: '选项二', disabled: true },
  { value: '3', label: '选项三' },
]

describe('SelectData', () => {
  it('渲染 options 并通过点击完成选择', async () => {
    const user = userEvent.setup()
    render(<SelectData options={options} />)

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: '选项一' }))

    expect(screen.getByRole('combobox')).toHaveTextContent('选项一')
  })

  it('选择时以 AntD 签名回调 onChange(value, option)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <SelectData
        options={options}
        value={null}
        onChange={onChange}
      />
    )

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: '选项三' }))

    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('3', options[2])
  })

  it('未选择时显示默认 placeholder「请选择」', () => {
    render(<SelectData options={options} />)

    expect(screen.getByText('请选择')).toBeInTheDocument()
  })

  it('options 为空时显示默认 notFoundContent「暂无数据」', async () => {
    const user = userEvent.setup()
    render(<SelectData options={[]} />)

    await user.click(screen.getByRole('combobox'))

    expect(await screen.findByText('暂无数据')).toBeInTheDocument()
  })

  it('disabled 时触发器禁用、无法展开下拉', async () => {
    const user = userEvent.setup()
    render(
      <SelectData
        options={options}
        disabled
      />
    )

    expect(screen.getByRole('combobox')).toBeDisabled()
    await user.click(screen.getByRole('combobox'))

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('外部 options 更新后列表同步更新', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<SelectData options={options} />)

    rerender(<SelectData options={[{ value: 'a', label: '新选项A' }]} />)

    await user.click(screen.getByRole('combobox'))

    expect(
      await screen.findByRole('option', { name: '新选项A' })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('option', { name: '选项一' })
    ).not.toBeInTheDocument()
  })

  it('长 label 在触发值与下拉项中省略展示', async () => {
    const user = userEvent.setup()
    render(
      <SelectData options={[{ value: 'x', label: '很长很长的文件夹名称' }]} />
    )

    const trigger = screen.getByRole('combobox')
    expect(trigger.querySelector('[data-slot=select-value]')).toHaveClass(
      'min-w-0',
      'truncate'
    )

    await user.click(trigger)
    const option = await screen.findByRole('option', {
      name: '很长很长的文件夹名称',
    })

    expect(option).toHaveClass('[&>div]:truncate')
  })

  it('trigger 与 item 均绑定 title 为 label', async () => {
    const user = userEvent.setup()
    render(<SelectData options={options} />)

    const trigger = screen.getByRole('combobox')
    await user.click(trigger)

    const option = await screen.findByRole('option', { name: '选项一' })
    expect(option).toHaveAttribute('title', '选项一')

    await user.click(option)
    expect(screen.getByRole('combobox')).toHaveAttribute('title', '选项一')
  })
})
