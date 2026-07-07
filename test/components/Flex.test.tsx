import { render, screen } from '@testing-library/react'
import Flex from '@/components/Flex'

function getContainer(ui: React.ReactElement) {
  const { container } = render(ui)
  return container.firstElementChild as HTMLElement
}

describe('Flex', () => {
  it('默认渲染 flex 容器且宽度 100%', () => {
    const el = getContainer(
      <Flex>
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('flex')
    expect(el.className).toContain('w-full')
  })

  it('vertical 添加 flex-col', () => {
    const el = getContainer(
      <Flex vertical>
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('flex-col')
  })

  it('align 映射到 items-*', () => {
    const el = getContainer(
      <Flex align='center'>
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('items-center')
  })

  it('justify 映射到 justify-*', () => {
    const el = getContainer(
      <Flex justify='between'>
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('justify-between')
  })

  it('wrap 映射到 flex-wrap', () => {
    const el = getContainer(
      <Flex wrap='wrap'>
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('flex-wrap')
  })

  it('gap 映射到 inline style gap 属性', () => {
    const el = getContainer(
      <Flex gap={4}>
        <span>a</span>
      </Flex>
    )
    expect(el.style.gap).toBe('1rem')
  })

  it('center 快捷设置 items-center justify-center', () => {
    const el = getContainer(
      <Flex center>
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('items-center')
    expect(el.className).toContain('justify-center')
  })

  it('center 覆盖 align 和 justify 的值', () => {
    const el = getContainer(
      <Flex
        center
        align='start'
        justify='between'
      >
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('items-center')
    expect(el.className).toContain('justify-center')
    expect(el.className).not.toContain('items-start')
    expect(el.className).not.toContain('justify-between')
  })

  it('flex={1} 给直接子元素添加 [&>*]:flex-1', () => {
    const el = getContainer(
      <Flex flex={1}>
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('[&>*]:flex-1')
  })

  it('flex="auto" 给直接子元素添加 [&>*]:flex-auto', () => {
    const el = getContainer(
      <Flex flex='auto'>
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('[&>*]:flex-auto')
  })

  it('flex="none" 给直接子元素添加 [&>*]:flex-none', () => {
    const el = getContainer(
      <Flex flex='none'>
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('[&>*]:flex-none')
  })

  it('flex="initial" 给直接子元素添加 [&>*]:flex-initial', () => {
    const el = getContainer(
      <Flex flex='initial'>
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('[&>*]:flex-initial')
  })

  it('className 合并到容器', () => {
    const el = getContainer(
      <Flex className='custom'>
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('custom')
    expect(el.className).toContain('flex')
  })

  it('style 传递给容器', () => {
    const el = getContainer(
      <Flex style={{ padding: 8 }}>
        <span>a</span>
      </Flex>
    )
    expect(el.style.padding).toBe('8px')
  })

  it('渲染子元素', () => {
    render(
      <Flex>
        <span>hello</span>
      </Flex>
    )
    expect(screen.getByText('hello')).toBeInTheDocument()
  })
})
