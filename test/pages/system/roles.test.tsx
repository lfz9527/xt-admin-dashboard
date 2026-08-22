import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Roles from '@/pages/system/roles'
import { describe, expect, it } from 'vitest'

describe('Roles page', () => {
  it('渲染角色表格与 mock 数据', () => {
    render(<Roles />)
    expect(screen.getByText('角色名称')).toBeInTheDocument()
    expect(screen.getByText('角色编码')).toBeInTheDocument()
    expect(screen.getByText('角色1')).toBeInTheDocument()
  })

  it('翻页后展示下一页数据', async () => {
    const user = userEvent.setup()
    render(<Roles />)
    await user.click(screen.getByLabelText('Go to next page'))
    expect(screen.getByText('角色11')).toBeInTheDocument()
  })
})
