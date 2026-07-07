# React 开发模板

基于 React 19 + TypeScript 5.9 + Vite 8 的现代前端开发模板，集成路由、状态管理、HTTP 客户端及完善的工程化配置。

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | React | ^19.2 |
| 语言 | TypeScript | ~5.9 |
| 构建 | Vite (rolldown) | ^8.0 |
| 路由 | React Router | ^7.14 |
| 状态管理 | Zustand | ^5.0 |
| CSS | Tailwind CSS | ^4.3 |
| 包管理 | pnpm | - |

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

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器，自动打开浏览器 |
| `pnpm build` | tsc 类型检查 + vite 构建 |
| `pnpm lint` | ESLint 检查 |
| `pnpm lint:fix` | ESLint 自动修复 |
| `pnpm format` | Prettier 格式化 |
| `pnpm preview` | 预览生产构建 |
| `pnpm commit` | commitizen 交互式提交 |
| `pnpm globalInstall` | 安装全局工具 (rimraf) |
| `pnpm clean` | 清理 node_modules 和 lock 文件 |

## 目录结构

```
src/
├── main.tsx              # 应用入口
├── assets/               # 静态资源
├── components/           # 通用组件
│   ├── ErrorBoundary/    # 错误边界 (class 组件, 含 RouteErrorBoundary 等)
│   ├── LazyImport/       # 懒加载 + Suspense 包装
│   ├── Loading/          # SVG 加载动画
│   ├── Access/           # 条件渲染
│   └── AutoTooltip/      # 文本溢出提示
├── hooks/                # 通用 hooks (19 个)
├── pages/                # 页面组件
├── router/               # 路由配置
│   ├── routes.tsx        # 路由定义
│   ├── guards/           # 路由守卫
│   └── utils/            # 路由工具
├── service/              # HTTP 服务层
│   ├── HttpClient.ts     # HTTP 客户端核心
│   ├── request.ts        # 预置实例
│   └── index.ts          # 业务 API
├── store/                # Zustand stores
└── types/                # 类型定义
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_BUILD_SOURCEMAP` | 是否生成 sourcemap | `true` |
| `VITE_BUILD_COMPRESS` | 压缩方式 (`gzip` / `brotli`) | `gzip` |
| `VITE_BUILD_ANALYZE` | 是否开启构建分析 | `false` |

构建产物输出至 `dist/{mode}_{version}/`。

## Hooks

| Hook | 用途 |
|------|------|
| `useBoolean` | 布尔状态管理 |
| `useCounter` | 计数器状态管理 |
| `useCountdown` | 倒计时 (setInterval 驱动) |
| `useRafInterval` | rAF 驱动的定时器，无后台节流 |
| `useDebounceFn` | 防抖函数 |
| `useDebounceValue` | 防抖值 |
| `useThrottledFn` | 节流函数 |
| `useDocumentTitle` | 同步浏览器标题 |
| `useErrorBoundary` | 错误边界触发 |
| `useEventListener` | 事件监听 |
| `useInterval` | setInterval 封装 |
| `useTimeout` | setTimeout 封装 |
| `useIsMobile` | 移动端检测 |
| `useLatest` | 最新值引用 |
| `useScrollLock` | 滚动锁定 |
| `useUnmount` | 组件卸载回调 |
| `useRequest` | 请求管理 |
| `useStorage` | localStorage/sessionStorage 封装 |
| `useComposedRef` | 多 ref 合并 |

## 组件

| 组件 | 用途 |
|------|------|
| `ErrorBoundary` | class 组件，捕获渲染错误，支持 `resetKeys` 自动恢复 |
| `RouteErrorBoundary` | 路由级错误边界，pathname 变化自动恢复 |
| `LazyImport` / `Lazy()` | Suspense + Loading fallback 包装 |
| `Loading` | SVG 加载动画 |
| `Access` | 条件渲染，`disable` 时显示 `fallback` |
| `AutoTooltip` | 文本溢出自动 Tooltip |

## Tailwind CSS

项目已集成 Tailwind CSS 4，使用 Vite 插件（`@tailwindcss/vite`）实现零配置启动。样式入口为 `src/styles/tailwind.css`，在 `main.tsx` 中导入。

如需自定义主题或添加插件，编辑 `src/styles/tailwind.css`：

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
  params: { id: 1 },           // 查询参数
  headers: { 'X-Token': 'xx' },  // 请求头
  timeout: 3000,                 // 超时 (ms)
  signal: abortController.signal, // 取消请求
  responseType: 'blob',          // 响应类型: json | text | blob | arrayBuffer
  retry: { count: 3, condition: (err) => err.status! >= 500 }, // 仅服务端错误重试
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
    condition: (err) => err.isTimeout || err.isNetworkError, // 仅超时/网络错误重试
  },
})
```

### 子实例 (fork)

从已有实例派生，继承配置并可局部覆盖，适合多服务场景：

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

// 取消
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

## Git 提交规范

使用 commitizen + commitlint，`pnpm commit` 交互式选择类型：

```
feat | fix | ui | style | refactor | docs | test | chore
add | del | revert | release | deploy | init | util
```

分支命名：`<userSlug>/<type>/<snake_keywords>`
