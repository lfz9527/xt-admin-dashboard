# AGENTS.md

## 项目概览

- React 19 + TypeScript + Vite 的后台管理仪表盘。
- 应用入口：`src/main.tsx`；路由与页面：`src/router/`、`src/pages/`。
- 主要目录：
  - `src/components/`：业务/复合组件
  - `src/ui/`：基础 UI 组件
  - `src/layout/`：布局、菜单与导航 Tab
  - `src/hooks/`：通用 React hooks
  - `src/store/`：Zustand 状态
  - `src/service/`：HTTP 客户端与请求层
  - `src/features/`：按业务领域划分的模块（如 `auth/`），模块内组织私有 `components/`、`hooks/`、`types.ts`、`constant.ts`
  - `src/styles/`：全局、Tailwind 与主题样式
  - `test/`：Vitest 测试
  - `vite.config/`：Vite 配置与插件

## 常用命令

使用 pnpm：

- `pnpm dev`：启动开发服务器
- `pnpm build`：TypeScript 构建检查并执行 Vite 生产构建
- `pnpm lint`：运行 ESLint
- `pnpm lint:fix`：自动修复 ESLint 问题
- `pnpm lint-stylelint`：检查 CSS/SCSS/Less
- `pnpm test`：运行全部 Vitest 测试
- `pnpm test -- test/components/NavTab.test.tsx`：运行单个测试文件
- `pnpm format`：使用 Prettier 格式化项目

## 编辑约定

- TypeScript/TSX 使用现有 ESLint 与 Prettier 约定；不要为未使用变量、`any` 等项目已放宽的规则额外引入风格限制。
- `@/*` 映射到 `src/*`，跨目录导入优先使用该别名；同目录或相邻模块保持项目现有相对路径风格。
- 新增页面需要同步考虑 `src/router/routes.tsx`；全局状态放入 `src/store/`，请求逻辑放入 `src/service/`，避免在 UI 组件中重复实现基础设施逻辑。
- 样式优先沿用 Tailwind 与现有 CSS 变量/主题体系；修改布局或导航时检查对应组件测试与响应式表现。
- 错误边界与全局错误处理集中在 `src/components/ErrorBoundary/`，不要绕过既有错误处理直接添加全局兜底。
- 修改行为后优先补充或更新 `test/` 中对应的 Vitest/Testing Library 测试，并至少运行相关测试、`pnpm lint` 与 `pnpm build`。

## 注意事项

- `dist/`、`node_modules/` 和 `public/` 已被 ESLint 忽略，不要把生成物或依赖目录纳入源码修改。
- 项目使用 React Router、Zustand、Tailwind CSS v4 与 Vite 插件配置；涉及这些基础设施的改动应先阅读其现有实现和配置文件。
- 表单依赖 `react-hook-form`、`zod` 和 `@hookform/resolvers`；通用表单桥接组件位于 `src/ui/Form/`，字段布局优先复用 `src/ui/Field/`。
- 页面路由集中在 `src/router/routes.tsx`，页面通常通过 `Lazy(() => import(...))` 懒加载；新增或改动页面时同步检查路由元信息和对应测试。
- HTTP 请求封装在 `src/service/`，状态管理使用 `src/store/` 的 Zustand；不要在页面组件中重复实现请求客户端或全局状态基础设施。
- `src/service/` 下的接口函数**不得直接调用**，必须搭配 `src/hooks/useRequest` 使用；如有特殊情况必须直接调用，需添加注释说明原因或先询问用户。
- UI 组件使用 Tailwind CSS v4 语义化主题变量（如 `bg-background`、`text-muted-foreground`、`border-border`、`text-destructive`），通过 `cn` 合并 className，并保持现有 `data-slot`、`data-invalid` 和 ARIA 状态约定。
- 当需求需要使用 `src/ui/` 或 `src/components/` 下的组件时，必须先检查是否存在可复用组件；存在时优先复用，未找到时应先询问用户是否新增组件，不得直接决定实现方式。
- 代码归属遵循「只被一个业务模块使用的代码放在对应 `src/features/<module>`；被两个及以上业务模块稳定复用后，再提升到全局目录（`src/components/`、`src/hooks/` 等）」。
- 当前登录页是表单演示，未连接真实认证接口；不要将演示提交状态误作真实 token 或认证成功。
- 运行单个测试使用 `pnpm exec vitest run test/<path>.test.tsx`；修改行为后至少运行相关测试、`pnpm lint` 和 `pnpm build`。
