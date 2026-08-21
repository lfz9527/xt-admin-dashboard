import '@testing-library/jest-dom/vitest'

// jsdom 未实现 getAnimations，base-ui 滚动区域内部定时器会调用
if (!Element.prototype.getAnimations) {
  Element.prototype.getAnimations = () => []
}

// jsdom 未实现 matchMedia，useSetting 初始化读取系统主题时会调用
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}
