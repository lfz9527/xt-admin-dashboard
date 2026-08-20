import '@testing-library/jest-dom/vitest'

// jsdom 未实现 getAnimations，base-ui 滚动区域内部定时器会调用
if (!Element.prototype.getAnimations) {
  Element.prototype.getAnimations = () => []
}
