# HTML Loading 注入设计

## 目标

在 `index.html` 的 `<div id="root">` 中自动注入 loading 动画（SVG spinner），确保 React 应用 JS 加载完成前用户看到 loading 而非白屏。React 挂载后 `createRoot().render()` 会替换 `#root` 的全部内容，无需额外清理。

## 方案

新建独立 Vite 插件 `vite.config/plugin-html-inject.ts`，通过 `transformIndexHtml` hook 在 dev/build 时自动将 loading SVG 内容注入到 `#root` 内部。

### 改动范围

| 操作 | 文件                                | 说明                                                        |
| ---- | ----------------------------------- | ----------------------------------------------------------- |
| 新增 | `vite.config/plugin-html-inject.ts` | 插件文件，读取 SVG 并用 `transformIndexHtml` 替换空 `#root` |
| 修改 | `vite.config/plugin.ts`             | 引入并注册 `htmlInjectPlugin`                               |
| 不变 | `index.html`                        | 保持 `<div id="root"></div>`                                |

### 插件逻辑

```ts
// vite.config/plugin-html-inject.ts
export function htmlInjectPlugin(): Plugin {
  return {
    name: 'html-inject',
    transformIndexHtml(html) {
      const svgContent = readFileSync(
        resolve(__dirname, '../src/assets/icon/loading.svg'),
        'utf-8'
      )
      return html.replace(
        '<div id="root"></div>',
        `<div id="root">
          <style>
            #root {
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
            }
          </style>
          ${svgContent}
        </div>`
      )
    },
  }
}
```

### 注入内容

- 内联 `<style>`：将 `#root` 设为 flex-center 居中，高度 `100vh`
- 内联 `<svg>`：项目已有的 loading spinner 图标（`src/assets/icon/loading.svg`）

### 不涉及

- 主题色适配 — loading 阶段与主题无关
- 额外依赖 — 零引入
