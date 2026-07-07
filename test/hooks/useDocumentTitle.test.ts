import { renderHook } from '@testing-library/react'
import { useDocumentTitle } from '@/hooks'

describe('useDocumentTitle', () => {
  const originalTitle = document.title

  afterEach(() => {
    document.title = originalTitle
  })

  it('should set document title', () => {
    renderHook(() => useDocumentTitle('Test Title'))
    expect(document.title).toBe('Test Title')
  })

  it('should update title when prop changes', () => {
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: 'First' },
    })
    expect(document.title).toBe('First')
    rerender({ title: 'Second' })
    expect(document.title).toBe('Second')
  })

  it('should restore title on unmount when preserveTitleOnUnmount is false', () => {
    document.title = 'Before'
    const { unmount } = renderHook(() =>
      useDocumentTitle('Temporary', { preserveTitleOnUnmount: false })
    )
    expect(document.title).toBe('Temporary')
    unmount()
    expect(document.title).toBe('Before')
  })
})
