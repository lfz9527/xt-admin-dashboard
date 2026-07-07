# React 开发模板

基于 React 19 + TypeScript 5.9 + Vite 8 的现代前端开发模板，集成路由、状态管理、HTTP 客户端及完善的工程化配置。

## 技术栈

| 类别       | 技术                         | 版本    |
| ---------- | ---------------------------- | ------- |
| 框架       | React                        | ^19.2.4 |
| 语言       | TypeScript                   | ~5.9.3  |
| 构建       | Vite (rolldown)              | ^8.0.1  |
| 路由       | React Router                 | ^7.14   |
| 状态管理   | Zustand                      | ^5.0    |
| CSS        | Tailwind CSS                 | ^4.3    |
| 测试       | Vitest + Testing Library     | ^4.1 / ^16.3 |
| 代码质量   | ESLint + Prettier + Stylelint | -       |
| 包管理     | pnpm                         | -       |

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器 (http://localhost:9529)
pnpm dev

# 生产构建
pnpm build

# 预览生产构建
pnpm preview
```

## 命令

| 命令                              | 说明                             |
| --------------------------------- | -------------------------------- |
| `pnpm dev`                        | 启动开发服务器，自动打开浏览器   |
| `pnpm build`                      | tsc 类型检查 + vite 构建         |
| `pnpm preview`                    | 预览生产构建                     |
| `pnpm test`                       | 运行所有测试                     |
| `pnpm test:watch`                 | 监听模式运行测试                 |
| `pnpm lint`                       | ESLint 检查                      |
| `pnpm lint:fix`                   | ESLint 自动修复                  |
| `pnpm lint-stylelint`             | Stylelint 检查样式文件           |
| `pnpm lint-stylelint:fix`         | Stylelint 自动修复样式文件       |
| `pnpm format`                     | Prettier 格式化                  |
| `pnpm commit`                     | commitizen 交互式提交            |
| `pnpm init-dep <name> <version>`  | 按模板初始化可选依赖             |
| `pnpm clean`                      | 删除 node_modules 和 lock 文件   |

## 测试

使用 Vitest 4 + jsdom + Testing Library，测试文件位于 `test/` 目录。

```bash
pnpm test                # 运行全部测试
pnpm test:watch          # 监听模式
pnpm vitest run -t "name" # 按名称筛选运行单个测试
```

- `describe` / `it` / `expect` / `vi` 全局可用，无需 import
- setup 文件自动注入 `@testing-library/jest-dom/vitest`，提供 `toBeInTheDocument()` 等 DOM 匹配器
- 异步时序测试使用 `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync()` 模式

## 目录结构

```
src/
├── main.tsx              # 应用入口
├── assets/               # 静态资源 (icon/)
├── components/           # 通用组件
│   ├── ErrorBoundary/    # 错误边界 (含 RouteErrorBoundary)
│   ├── LazyImport/       # 懒加载 + Suspense 包装
│   ├── Loading/          # SVG 加载动画
│   ├── Access/           # 条件渲染
│   └── AutoTooltip/      # 文本溢出提示
├── constants/            # 全局常量 (IS_PROD, IS_DEV 等)
├── features/             # 功能模块
├── hooks/                # 通用 hooks (19 个)
├── pages/                # 页面组件 (home, login, 404)
├── router/               # 路由配置 (routes, guards, utils)
├── service/              # HTTP 服务层
│   ├── http/             #   核心客户端 + 适配器 + 拦截器
│   ├── request.ts        #   预置实例（带业务拦截器）
│   └── index.ts          #   业务 API
├── store/                # Zustand stores
├── styles/               # 样式文件 (tailwind.css, index.css)
├── test/                 # 测试 setup
├── types/                # 类型定义 (env.d.ts, global.d.ts)
└── utils/                # 工具函数 (cn, uid 等)
```

## TypeScript 配置

- 新版 JSX 转换（`react-jsx`），**无需显式 `import React`**
- `verbatimModuleSyntax: true` — 类型导入必须使用 `import type`
- `erasableSyntaxOnly: true` — 禁止 `enum`、`namespace` 等运行时语法
- 路径别名：`@/` → `src/`

## 环境变量

| 变量                   | 说明                    | 默认值  |
| ---------------------- | ----------------------- | ------- |
| `VITE_BUILD_SOURCEMAP` | 是否生成 sourcemap      | `true`  |
| `VITE_BUILD_COMPRESS`  | 压缩方式 (`gzip`/`brotli`) | `gzip`  |
| `VITE_BUILD_ANALYZE`   | 是否开启构建分析        | `false` |

构建产物输出至 `dist/{mode}_{version}/`，生产构建自动移除 `console` 和 `debugger`。

## 代码规范

| 工具      | 配置文件              | 关键配置                       |
| --------- | --------------------- | -------------------------- |
| ESLint    | `eslint.config.js`    | flat config，TypeScript + React Hooks 规则，允许 `any` |
| Prettier  | `.prettierrc`         | 无分号、单引号、尾逗号 es5、JSX 属性每行一个 |
| Stylelint | `stylelint.config.js` | Tailwind CSS 规则 + `idiomatic-order` 属性排序 |

- `husky` + `lint-staged`: pre-commit 自动执行 ESLint 修复和 Prettier 格式化
- `husky` + `commitlint`: commit-msg 校验提交信息格式

## Hooks

| Hook               | 用途                          |
| ------------------ | ----------------------------- |
| `useBoolean`       | 布尔状态管理                  |
| `useCounter`       | 计数器状态管理                |
| `useCountdown`     | 倒计时 (setInterval 驱动)     |
| `useRafInterval`   | rAF 定时器，后台标签页无开销  |
| `useDebounceFn`    | 防抖函数                      |
| `useDebounceValue` | 防抖值                        |
| `useThrottledFn`   | 节流函数                      |
| `useDocumentTitle` | 同步浏览器标题                |
| `useErrorBoundary` | 错误边界触发                  |
| `useEventListener` | 事件监听                      |
| `useInterval`      | setInterval 封装              |
| `useTimeout`       | setTimeout 封装               |
| `useIsMobile`      | 移动端检测                    |
| `useLatest`        | 最新值引用（闭包陷阱解决方案）|
| `useScrollLock`    | 滚动锁定                      |
| `useUnmount`       | 组件卸载回调                  |
| `useRequest`       | 全功能异步请求管理            |
| `useStorage`       | localStorage/sessionStorage   |
| `useComposedRef`   | 多 ref 合并                   |

## 组件

| 组件                 | 用途                                             |
| -------------------- | ------------------------------------------------ |
| `ErrorBoundary`      | class 组件，捕获渲染错误，支持 `resetKeys` 自动恢复 |
| `RouteErrorBoundary` | 路由级错误边界，pathname 变化自动恢复            |
| `LazyImport`/`Lazy()`| Suspense + Loading fallback 包装                 |
| `Loading`            | SVG 加载动画（通过 unplugin-icons 导入本地 SVG） |
| `Flex`               | 弹性布局辅助，支持 vertical/align/justify/wrap/gap/center |
| `Access`             | 条件渲染，`disable` 时显示 `fallback`            |
| `AutoTooltip`        | 文本溢出时自动显示 Tooltip（单行/多行）          |

## 自定义图标

从 `src/assets/icon/` 加载 SVG 文件，通过 unplugin-icons 编译为 React 组件：

```tsx
import LoadingSvg from '~icons/local-icons/loading'
// fill 自动映射为 currentColor，默认尺寸 24x24
```

## Tailwind CSS

Tailwind CSS 4 通过 Vite 插件（`@tailwindcss/vite`）零配置启动，样式入口 `src/styles/tailwind.css`：

```css
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
}
```

## HTTP 客户端

基于适配器模式 + 拦截器链的 HTTP 客户端，默认使用 `FetchAdapter`。

### 创建实例

```ts
import { HttpClient } from '@/service/http'

const http = HttpClient.create({
  baseURL: '/api',
  timeout: 5000,
  retry: { count: 2, delay: 1000 }, // 重试 2 次，指数退避
})
```

### 基本请求

```ts
// GET
const users = await http.get<User[]>('/users', { params: { page: 1 } })

// POST
await http.post('/user', { name: 'lfz', age: 18 })

// PUT / PATCH / DELETE
await http.put('/user/1', { name: 'new' })
await http.patch('/user/1', { age: 19 })
await http.delete('/user/1')
```

### 请求配置

```ts
http.get('/data', {
  params: { id: 1 },
  headers: { 'X-Token': 'xx' },
  timeout: 3000,
  signal: abortController.signal,    // 取消请求
  responseType: 'blob',              // json | text | blob | arrayBuffer
  retry: { count: 3, condition: (err) => err.status! >= 500 },
})
```

### 拦截器

```ts
// 请求拦截 — 注入 token
http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

// 响应拦截 — 解包业务返回
http.interceptors.response.use((res) => {
  const { code, data, message } = res.data as { code: number; data: unknown; message: string }
  if (code !== 0) throw Object.assign(new Error(message), { status: code })
  return { ...res, data }
})

// 错误拦截 — 统一处理
http.interceptors.error.use(async (err) => {
  if (err.status === 401) redirectToLogin()
  throw err
})
```

### 重试

```ts
const http = HttpClient.create({
  retry: {
    count: 3,          // 最大重试次数
    delay: 500,        // 初始延迟 (ms)，每次翻倍：500 → 1000 → 2000
    condition: (err) => err.isTimeout || err.isNetworkError,
  },
})
```

### 子实例 (fork)

从已有实例派生，继承配置并可局部覆盖：

```ts
const authHttp = http.fork({ baseURL: '/auth', timeout: 3000 })
const fileHttp = http.fork({ baseURL: '/file', responseType: 'blob' })
```

### 取消请求

```ts
const controller = new AbortController()

http.get('/long-polling', { signal: controller.signal })
  .catch((err) => {
    if (err.isAborted) console.log('请求已取消')
  })

controller.abort()
```

### 封装业务 API

```ts
import { http } from '@/service/request'

type User = { id: number; name: string }

export function getUser(id: number, signal?: AbortSignal) {
  return http.get<User>('/user', { params: { id }, signal })
}

export function createUser(data: Partial<User>) {
  return http.post<User>('/user', data)
}
```

## 状态管理

Zustand 5，store 位于 `src/store/`，采用三层中间件模式：`persist`（sessionStorage 持久化）→ `devtools`（Redux DevTools）→ `logger`（开发环境自动打印状态变更）。

## Git 提交规范

使用 commitizen + commitlint，`pnpm commit` 交互式选择类型：

```
feat | fix | ui | style | refactor | docs | test | chore
add | del | revert | release | deploy | init | util
```

分支命名：`<userSlug>/<type>/<snake_keywords>`（如 `lfz/feat/user_login`）
