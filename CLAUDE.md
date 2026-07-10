# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概要

React 开发模板，技术栈: React 19 + TypeScript 5.9 + Vite 8 (rolldown) + React Router 7 + Zustand 5 + Tailwind CSS 4 + shadcn/ui。UI 原语基于 @base-ui/react。包管理器使用 pnpm。

## 常用命令

```bash
pnpm dev                 # 启动开发服务器 (port 9529, 自动打开浏览器)
pnpm build               # tsc 类型检查 + vite 构建
pnpm lint                # ESLint 检查
pnpm lint:fix            # ESLint 自动修复
pnpm lint-stylelint      # Stylelint 检查
pnpm lint-stylelint:fix  # Stylelint 自动修复
pnpm format              # Prettier 格式化
pnpm test                # 运行所有测试 (vitest run)
pnpm test:watch          # 监听模式运行测试
pnpm preview             # 预览生产构建
pnpm commit              # git add . + commitizen 交互式提交
pnpm globalInstall       # 安装全局工具 (如 rimraf)
pnpm clean               # 删除 node_modules 和 lock 文件
```

## 测试体系

- 测试框架: Vitest 4 + jsdom + `@testing-library/react`（v16）
- `globals: true` — `describe`/`it`/`expect`/`vi` 全局可用，无需 import
- setup 文件 (`src/test/setup.ts`) 只做一件事: 加载 `@testing-library/jest-dom/vitest`（提供 `toBeInTheDocument()` 等 DOM 匹配器）
- 测试文件统一放在根目录 `test/` 下，按 `hooks/`、`components/` 分类
- 异步时序测试大量使用 `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync()` 模式
- **运行单个测试**: `pnpm vitest run path/to/test.test.ts` 或 `pnpm vitest run -t "test name pattern"`

## 架构概览

### 入口与渲染层

`src/main.tsx` 是整个应用的入口，渲染链路:

```
createRoot → StrictMode → ErrorBoundary(GlobalCrash) → App
```

- `ErrorBoundary` 是 class 组件，包裹整个应用捕获渲染错误，显示 `GlobalCrash` 回退 UI 并支持重试
- `createRoot` 配置了 `onCaughtError`、`onUncaughtError`、`onRecoverableError` 回调用于日志

### 路由系统

路由核心文件: `src/router/`

**路由定义** (`src/router/routes.tsx`): 使用自定义的 `AppRouteObject` 类型 (拓展了 react-router 的 `RouteObject`)，支持 `meta`（标题等）和 `envs`（环境过滤）。

**路由构建** (`src/router/utils/index.ts`): `buildRouter()` 将 `AppRouteObject[]` 转换为 react-router 的 `RouteObject[]`，同时按当前 `NODE_ENV` 过滤不符合环境的路由。

**路由守卫** (`src/router/guards/BasicGuard.tsx`): 根路由的 element，通过 `useMatches()` 获取当前匹配路由的 `handle.title`，用 `useDocumentTitle` 同步浏览器标题。渲染 `<Outlet />`，无额外布局包裹。

**路由创建** (`src/router/index.ts`): `createBrowserRouter(buildRouter(routes))` 创建浏览器路由实例。

**懒加载**: 所有页面通过 `Lazy(() => import(...))` 实现代码分割，包装了 `Suspense` + `Loading` 组件作为 fallback。

### 布局与菜单系统

布局渲染链: `BaseLayout` → `MenuProvider`（sidebar 状态受控）→ `Menu`（侧边栏）+ `MenuContent`（`SidebarInset`，主内容区）→ `Main`（Header + `<Outlet />`）

**菜单数据** (`src/store/useMenu.ts`): 当前使用 mock 数据，菜单项类型 `MenuItem` 定义在 `src/components/Menu/types.ts`:

- `key`: 唯一标识，与路由 `meta.menuKey` 关联实现高亮
- `title` / `icon`（lucide 图标名字符串）/ `path`（路由跳转）/ `children`（子菜单）
- 菜单通过 `useMatches()` 获取当前路由的 `handle.menuKey` 来判断选中态，子菜单项通过 `Collapse` 组件折叠展开

**Sidebar** (`src/ui/Sidebar/`): 基于 shadcn/ui 风格的自定义实现，通过 `SidebarProvider` 的 context 管理展开/折叠状态。支持 `inset`/`floating`/`sidebar` 三种变体，`offcanvas`/`icon`/`none` 三种折叠模式，移动端自动切换为 Sheet 抽屉。键盘快捷键 `Ctrl/Cmd + B` 切换。

### 主题系统

- **Store** (`src/store/useSetting.ts`): 持久化 `theme: 'light' | 'dark'` 到 localStorage
- **Hook** (`src/hooks/useTheme.ts`): 监听 store 变化，同步 `document.documentElement` 的 `.dark` class；`toggleTheme(event)` 使用 **View Transition API** 实现从点击位置扩散/收缩的圆形动画
- **CSS** (`src/styles/theme-transition.css`): 定义 `::view-transition-old/new(root)` 的 clip-path 圆形动画，通过 CSS 自定义属性 `--theme-transition-x/y/radius` 控制动画圆心和半径

### 页面结构

路由页面位于 `src/pages/`：

- `home` — 首页
- `dashboard/` — 带 `<Outlet />` 的父路由，子页面 `overview`（概览）、`analytics`（分析）
- `system/` — 带 `<Outlet />` 的父路由，子页面 `users`（用户管理，含 `:id` 详情）、`roles`（角色管理）
- `login` — 登录页（独立于 Layout 之外）
- `404` — 404 页面 + 通配 `*` 路由

### 进度条

`@bprogress/react` 实现路由切换顶部进度条。`App` 组件包裹 `<ProgressProvider>`，`useProgress` hook（`src/hooks/useProgress.ts`）监听 `useNavigation().state`，`loading` 时调用 `start()`，`idle` 时调用 `stop(100)`（延迟完成以等待渲染）。

### UI 组件原语

`src/ui/` 下为基于 `@base-ui/react` 的无样式原语组件，使用 `useRender` + `mergeProps` 模式支持 `render` prop 来替换默认元素，统一导出供业务组件使用：

| 组件          | 来源                         | 说明                                                                                                              |
| ------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `Button`      | `@base-ui/react/button`      | `cva` 变体：default/outline/secondary/ghost/destructive/link，size: default/xs/sm/lg/icon/icon-xs/icon-sm/icon-lg |
| `Collapsible` | `@base-ui/react/collapsible` | `Collapsible` + `CollapsibleTrigger` + `CollapsibleContent`（CSS transition 动画）                                |
| `Collapse`    | `@/components/Collapse`      | 基于 Collapsible 的受控/非受控折叠面板，支持自定义 trigger、wrapper                                               |
| `Sheet`       | -                            | 侧边抽屉，移动端 Sidebar 使用                                                                                     |
| `Tooltip`     | -                            | 基于 `@floating-ui/react` 的 Tooltip，`TooltipProvider` 全局提供 delay 等配置                                     |
| `Sidebar`     | -                            | 侧边栏完整实现（见布局与菜单系统）                                                                                |

### HTTP 服务层

`src/service/` 目录结构:

```
src/service/
├── http/
│   ├── HttpClient.ts          # 核心客户端类
│   ├── InterceptorManager.ts  # 拦截器管理器
│   ├── adapters/
│   │   └── FetchAdapter.ts    # 基于 fetch 的适配器实现
│   ├── types.ts               # 类型定义
│   └── index.ts               # 统一导出 + 默认单例实例
├── request.ts                 # 预置的 http 实例，带业务拦截器
└── index.ts                   # 业务 API 封装
```

- **HttpClient** (`HttpClient.ts`): 核心类，支持适配器模式（默认 `FetchAdapter`）、拦截器链（请求/响应/错误）、重试（指数退避）、`fork()` 创建子实例
- **InterceptorManager** (`InterceptorManager.ts`): 泛型拦截器管理器，基于 `Map` 存储，支持 `use()`（注册）、`eject(id)`（移除）、`setEnabled(id, bool)`（开关）、`clear()`（清空），每个拦截器通过 `uid()` 分配唯一 ID
- **预置实例** (`request.ts`): 导出一个配置好的 `http` 实例（**注意：默认 timeout 仅 1000ms**），注册了响应拦截器来解包业务返回格式 `{ code, data, message }`（`code !== 0` 时抛出错误）
- **业务 API** (`index.ts`): 基于 `http` 实例封装的具体接口调用（`Ping`、`GetUser`，均支持 `AbortSignal` 参数）

### 组件

| 组件                    | 用途                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `ErrorBoundary`         | class 组件，捕获子组件渲染错误，支持 `resetKeys` 变化自动恢复                                     |
| `RouteErrorBoundary`    | 封装 ErrorBoundary，`resetKeys` 绑定 `pathname`，路由切换时自动恢复                               |
| `LazyImport` / `Lazy()` | `Suspense` 包装器，统一懒加载回退 UI                                                              |
| `Loading`               | SVG 加载动画（通过 unplugin-icons 导入本地 SVG）                                                  |
| `Flex`                  | 弹性布局辅助组件，`vertical`/`align`/`justify`/`wrap`/`gap`/`center` 等 props，`gap` 值 × 0.25rem |
| `Access`                | 条件渲染，`disable` 为 true 时显示 `fallback`（预留权限控制的占位组件）                           |
| `AutoEllipsis`          | 文本溢出时自动显示 Tooltip，支持单行（truncate）和多行（line-clamp），通过 ResizeObserver 监听    |

### Hooks

19 个通用 hooks 统一从 `@/hooks` 导出，包含: `useBoolean`, `useComposedRef`, `useCounter`, `useCountdown`, `useDebounceFn`, `useDebounceValue`, `useDocumentTitle`, `useErrorBoundary`, `useEventListener`, `useInterval`, `useIsMobile`, `useLatest`, `useRafInterval`, `useRequest`, `useScrollLock`, `useStorage`, `useThrottledFn`, `useTimeout`, `useUnmount`。

**核心模式 — `useLatest`**: 几乎所有 hooks 的基石。用 `useRef` 存储传入值，每帧更新 `ref.current`，从而在闭包中始终读取最新值。这使得 hooks 可以安全地省略回调依赖，避免 `exhaustive-deps` 误报。

**`useRequest`**: 全功能异步请求 hook。自动管理 `AbortController`（新请求自动取消旧请求），防卸载后 setState，支持 `immediate`/`debounceWait`/`mutate`/`refresh`/`cancel`。回调（`onSuccess`/`onError`）存储在 `useLatest` ref 中以避免重建 `runAsync`。

**`useRafInterval`**: rAF 驱动的定时器，基于 `requestAnimationFrame` + `performance.now()` 累计时间触发。相比 `useInterval`，后台标签页自动暂停无开销，切回前台基于时间差准确恢复，不会出现累计漂移。

### 状态管理

项目安装了 Zustand 5，store 文件位于 `src/store/` 下，统一从 `@/store` 导出。

**Store 列表**:

| Store        | 用途                                    | 持久化         |
| ------------ | --------------------------------------- | -------------- |
| `useAuthor`  | 用户认证信息                            | sessionStorage |
| `useMenu`    | 菜单数据 `menus` + 侧边栏 `sidebarOpen` | localStorage   |
| `useSetting` | 主题设置 `theme`                        | localStorage   |

**Store 模式**: 三层中间件包裹（以 `useAuthor` 为例）— 内层 `persist` → 中层 `devtools` → 外层自定义 `logger`（开发环境自动打印状态变更日志，生产环境 `IS_PROD` 时自动静默）。

### 通用工具

- `src/constants/index.ts`: 导出 `IS_PROD`、`IS_DEV`、`MOBILE_BREAKPOINT`（768）、`APP_NAMES`
- `src/utils/common.ts`: `cn()` — clsx 包装器用于类名合并；`getCurEnv()` — 获取当前 NODE_ENV
- `src/utils/easy-uid.ts`: `uid(length, hex)` — 生成唯一 ID（时间戳 + 随机数）
- `src/types/global.d.ts`: 全局 `Global` 命名空间，提供 `AnyObj`、`AnyFunction`、`ElAttrs` 等工具类型

### TypeScript 配置要点

- 三个 tsconfig: `tsconfig.app.json`（浏览器代码）、`tsconfig.node.json`（vite.config.ts）、`tsconfig.scripts.json`（构建脚本）
- `jsx: "react-jsx"` — 新版 JSX 转换，**无需显式 `import React`**
- `verbatimModuleSyntax: true` — **类型导入必须使用 `import type`**，不能用 `import { type X }`（除非来自值模块）
- `erasableSyntaxOnly: true` — 禁止 `enum`、`namespace` 等需运行时产出的 TS 语法
- `strict: true` + `noUnusedLocals: true` + `noUnusedParameters: true`

### ESLint 关键规则

- 使用 flat config（`eslint.config.js`），`defineConfig` + `globalIgnores` 模式
- `'no-duplicate-imports': 'error'` — 禁止重复导入
- `'@typescript-eslint/no-explicit-any': 'off'` — **允许 any**
- `'@typescript-eslint/no-unused-vars': 'off'` — 关闭（交给 tsc 的 `noUnusedLocals`/`noUnusedParameters` 处理）
- `'react-hooks/exhaustive-deps': 'off'` — 关闭（配合 `useLatest` 模式，回调无需声明所有依赖）
- `'react-hooks/refs': 'off'`、`'react-hooks/set-state-in-effect': 'off'`

### Vite 配置

配置文件模块化为 3 个文件: `vite.config.ts`（入口）→ `vite.config/config.ts`（构建配置） + `vite.config/plugin.ts`（插件组装） + `vite.config/icons.ts`（图标插件工厂）。

- **路径别名**: `@` → `src/`
- **开发代理**: `/api` → `http://localhost:3000`
- **构建输出**: `dist/{mode}_{version}/`（如 `dist/production_0.0.0/`）
- **生产构建行为**: 自动移除 `console` 和 `debugger`；chunk 大小警告阈值 500KB；小于 10KB 的资源内联为 base64
- **输出文件命名**: JS → `js/[name]-[hash].js`，CSS → `css/[name]-[hash][extname]`，图片 → `assets/`，字体 → `font/`
- **插件**: React、Tailwind CSS 4、unplugin-icons（本地 SVG → React 组件）、stylelint（自动修复）、env-parse（从 `.env` 自动生成 `src/types/env.d.ts`）、gzip 压缩（`VITE_BUILD_COMPRESS=gzip` 时）、构建分析（`VITE_BUILD_ANALYZE=true` 时）
- **环境变量**: `VITE_BUILD_SOURCEMAP`（sourcemap）、`VITE_BUILD_COMPRESS`（压缩方式 `gzip`/`brotli`）、`VITE_BUILD_ANALYZE`（构建分析）
- **vitest 配置**: 复用 `createIconsPlugin` 以解析 `~icons/local-icons/*` 导入，配置 `globals: true` + `environment: 'jsdom'`

### 自定义图标

unplugin-icons 配置了 `local-icons` 自定义集合，从 `src/assets/icon/` 加载 SVG。使用方式：

```tsx
import LoadingSvg from '~icons/local-icons/loading'
// 渲染为 React 组件，fill 自动映射为 currentColor，默认尺寸 24x24
```

### Tailwind CSS

项目已安装 Tailwind CSS 4（`tailwindcss` + `@tailwindcss/vite`），同时集成 `shadcn/tailwind.css`（shadcn/ui CSS 变量体系）和 `tw-animate-css`（动画预设）。

CSS 入口为 `src/styles/global.css`（在 `main.tsx` 中通过 `@/styles/tailwind.css` 间接导入），结构：

- `@import 'tailwindcss'` — Tailwind 4 基础
- `@import 'tw-animate-css'` — 动画工具类
- `@import 'shadcn/tailwind.css'` — shadcn/ui 基础样式
- `@theme inline { ... }` — 将 CSS 变量注册为 Tailwind token（`--sidebar-accent` → `bg-sidebar-accent` 等）
- `:root` / `.dark` — 亮/暗色主题的 CSS 变量值（基于 oklch 色彩空间）
- `@layer base { ... }` — 全局基础样式

`tailwind.css` 中定义了一个自定义 utility `@utility flex-center`（`display: flex; align-items: center; justify-content: center`），被 `Loading` 组件使用。同时配置了 `prettier-plugin-tailwindcss` 和 `stylelint-config-tailwindcss` 以保证代码风格一致性。

### 代码风格工具

- **Prettier**: `semi: false`（无分号）、`singleQuote: true` + `jsxSingleQuote: true`（单引号）、`trailingComma: "es5"`、`singleAttributePerLine: true`（JSX 属性每行一个）、`printWidth: 80`
- **Stylelint**: 继承 `stylelint-config-standard` + `stylelint-config-tailwindcss` + `stylelint-config-idiomatic-order`（CSS 属性按约定排序），`selector-class-pattern: null`（不限制类名格式）
- **Husky hooks**: `pre-commit` → `lint-staged`；`commit-msg` → `commitlint`（配置文件在 `commit-kit/commitlint.config.js`）

### Git 提交规范

- 使用 commitizen + cz-customizable，`pnpm commit` 交互式选择提交类型：
  ```
  feat | fix | ui | style | refactor | docs | test | chore
  add | del | revert | release | deploy | init | util
  ```
- Husky + lint-staged: pre-commit 自动执行 ESLint 修复和 Prettier 格式化
- Husky + commitlint: commit-msg 校验提交信息格式
- **分支命名**: `<userSlug>/<type>/<snake_keywords>`（如 `lfz/feat/user_login`）
