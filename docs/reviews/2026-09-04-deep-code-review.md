# 深度代码健康审查报告

- **审查日期**:2026-09-04
- **审查对象**:xt-admin-dashboard(React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + Zustand 后台管理仪表盘)
- **审查范围**:`src/` 193 个 TS/TSX 文件(约 1.6 万行)、`test/` 57 个测试文件(约 9 千行)、`package.json` 依赖清单、Vite/ESLint/Stylelint 构建配置、Git 提交历史与 `.loop/reviews` 变更审查记录
- **审查基线**:`pnpm compile` 通过;`pnpm lint` 通过;全量测试 413/420 通过(7 个失败为当日引入的回归,见 P1-1)
- **审查方法**:deep-code-review 技能(资产地图 → 模块依赖 → 语义聚类/重复分析 → 架构健康 → 技术债 → 安全边界)

> 方法说明:deep-code-review 技能引用的 `../code-review-rules/` 规则库在本机不存在,本次以仓库 `AGENTS.md`、工程既有约定与通用工程准则作为审查基准。无历史深度审查报告可供趋势对比;`.loop/reviews` 中的记录为单次 Loop 变更审查,已在相关条目中引用。

---

## 总体结论

项目处于**良好的健康状态**:分层方向总体清晰(`ui/`、`types/`、`constants/`、`utils/` 基础层依赖方向干净)、无 TODO/FIXME 残留、`any` 仅 3 处、编译与 lint 全绿、413 个测试稳定通过,近期提交(菜单路由统一、NavTab 重构、懒加载优化)显示持续的架构治理投入。

主要问题集中在四类:

1. **当日提交引入的测试回归**(需立即修复,P1-1);
2. **凭据持久化与前端权限信任模型的安全硬伤**(P1-2/P1-3);
3. **一条静态循环依赖与 store/service 双向耦合**(P2-1/P2-2);
4. **约 2500+ 行的可治理重复模板**(P2-9/P2-10);另有零消费组件/函数与预留依赖,按约定允许存在、仅作提醒(P3 条目)。

未发现 P0(无数据损坏、无系统性不可用)。

---

## P1 Findings(必须处理)

### P1-1 · Header 懒加载提交导致 7 个测试回归,当日引入

- **证据**:
  - `test/components/Header.test.tsx` 6 例失败,断言 `button.rounded-full` 为 null(见 `test/components/Header.test.tsx:184`、`:206`);
  - `test/components/Menu.test.tsx` 1 例失败:`renders complete detail breadcrumbs from real routes and derived menus`(见 `test/components/Menu.test.tsx:152`);
  - 运行期伴随 `No HydrateFallback element provided` 告警;
  - 提交 `741e403`(2026-09-04 16:32,Header 与 NavTab 改为 `React.lazy` 懒加载)仅同步适配了 NavTabRefresh 测试与 Menu mock(后续 `1bc6021`),**Header.test.tsx 与 Menu 面包屑用例未同步等待懒加载完成**。
- **影响**:测试基线红 7 例;懒加载改造的测试适配存在遗漏,暴露「改动后验证范围」偏窄的问题。
- **建议**:在 `Header.test.tsx` 渲染处等待 Header 异步挂载(与 NavTabRefresh 的适配方式一致);回归验证 `pnpm exec vitest run test/components/Header.test.tsx test/components/Menu.test.tsx`。
- **置信度**:高(失败机制与提交改动直接对应)。

### P1-2 · 「记住密码」为可逆持久化:硬编码密钥 + 密文同存 localStorage

- **证据**:
  - `src/store/useAuthor.ts:30` 密钥硬编码 `new EncryptionManager('xt-admin-dashboard-login-key')`(注释自认「前端演示应用使用固定密钥」);
  - `src/store/useAuthor.ts:52-55` 将明文密码 AES-GCM 加密后经 `:79` persist 落盘(存储 key `app-author`);
  - `src/pages/login/index.tsx:101-103` 勾选「记住密码」触发;
  - 401 登出(`src/service/request.ts:56-62`)与手动登出均不清理 `account/encryptedPassword`,残留随设备长期存在;
  - 加密原语本身正确(AES-GCM + 随机 IV,`test/utils/EncryptionManager.test.ts` 覆盖),问题只在密钥随 bundle 分发,持码者可解密还原明文。
- **影响**:共享设备或任意 XSS 场景可还原管理员密码明文;登出后凭据仍可解密留存。
- **建议**:移除密码落盘——仅记住账号,或改用浏览器凭据管理 API;登出链路统一清理凭据。需产品决策确认。

### P1-3 · token/user/roleKey 明文持久化且可篡改,前端权限防线可一键绕过

- **证据**:
  - `src/store/useAuthor.ts:77-80` persist 未 `partialize`,token、user、`roleKey` 全量明文入 localStorage;
  - `src/router/permissions.ts:21,28-31` 超级管理员判定硬编码 `roleKey === 'admin'` 恒放行;
  - 路由守卫(`src/router/guards/PermissionGuard.tsx:12-22`)、菜单过滤(`src/components/Menu/menus.tsx:158`)、页面禁用(`src/pages/system/roles/index.tsx:146`、`src/pages/system/users/index.tsx:176`)全部信任该客户端字符串——用户改写 localStorage 的 `roleKey` 为 `admin` 即可看到全部管理入口;
  - `roleKey` 来源为后端 `/users/me`(`src/features/auth/hooks/useUserInfo.ts:13`)。
- **影响**:若后端仅校验「登录与否」则构成真实越权面。SPA 前端判断天然不可信,关键在于**后端是否逐接口做 roleKey 级 RBAC——待核实**(后端代码在 `../nest-practices`,本次未审查)。
- **建议**:
  1. 与后端确认逐接口鉴权,并在文档明示「前端隐藏 ≠ 安全」;
  2. `roleKey` 改为不落盘、刷新后由 `/users/me` 重取。

### P1-4 · .env 与 .env.production 已入库且无 .gitignore 防线

- **证据**:
  - `git ls-files` 确认 `.env`(当前工作区 M 状态)、`.env.production` 均被跟踪;
  - `.gitignore` 无任何 `.env*` 条目,无 `.env.example` 模板;
  - `.env.production` 含真实生产 `VITE_API_BASE_URL`(http 明文内网地址,提交 `917fb4f`);未发现密码级密钥。
- **影响**:内网拓扑/网关路径随仓库分发;日后任何 `VITE_` 密钥都可能直接入库并打进 bundle。
- **建议**:`git rm --cached` 出库,补 `.gitignore` 与 `.env.example`;生产 API 改 https。

---

## P2 Findings(应规划治理)

### 架构与依赖

- **P2-1 · 全项目唯一静态循环依赖**:
  `src/router/routes.tsx:16 → src/layout/index.tsx → src/layout/baseLayout.tsx → src/components/Menu/menu.tsx → src/components/Menu/menus.tsx:16 → 回 routes.tsx`,闭环上全为值导入。当前靠 `menus.tsx` 在组件体内惰性读取 `routes` + 页面全 `React.lazy` 规避;任何把该访问提前到模块顶层的改动都会在加载期崩溃。**置信度高**。建议把菜单派生(`routeToMenus`)收敛为独立叶子模块或经 store 注入。✅ 已修复,详见文末「修复记录」。
- **P2-2 · store ↔ service 双向依赖**:
  `src/service/request.ts:3` 值依赖 `src/store/useAuthor`(token 读取),而 `src/store/useDictStore.ts:3-7` 值依赖 `src/service/dict`;叠加 `request.ts:69` 动态 `import('@/router')`(401 跳登录)。建议 token 改为注入式/回调式获取切断 service→store;useDictStore 保持 store→service 单向即可。
- **P2-3 · hooks 全量桶拖垮依赖边界**:
  `src/hooks/index.ts` 全量 `export *`,29 个文件经它导入;`src/ui/Sidebar/context.tsx:11` 仅需 `useIsMobile` 却经桶连带执行整个 store/service 初始化链(useTheme → store → useDictStore → service/dict)。建议 ui 层直引单文件、桶按需拆分。✅ 已修复,详见文末「修复记录」。
- **P2-4 · 双原语库并存(迁移尾巴)**:
  `@base-ui/react` 被 19 文件使用,`radix-ui` 仅剩 `src/ui/Sidebar/sidebar.tsx:7` 一处(`import { Slot } from 'radix-ui'`,同文件其他原语已来自 base-ui)。建议把 `Slot` 迁移到 base-ui 后移除 radix-ui 依赖。✅ 已修复,详见文末「修复记录」。
- **P2-5 · Header/UserCenterDialog 归属漂移**:
  位于共享 `src/components/` 却直连 features/auth、router(types/routes/menu/permissions×4)、service、store 多域(`src/components/Header/index.tsx:10-24`、`UserCenterDialog.tsx:8-17`),且重复了菜单三角静态导入;`src/layout/baseLayout.tsx:6` 直连 `features/auth/hooks`。建议 Header 下沉 `layout/` 或经 store/路由派生收口。✅ 已修复,详见文末「修复记录」。
- **P2-6 · 基础层向上依赖**:
  `src/ui/Toast/index.tsx:9,40` 值导入并渲染 `src/components/Loading`(唯一 ui→components 边);`src/components/Dropdown` 仅剩 `renderDropdownItem` helper 存活、组件体死代码(见 P3 清单)。

### 安全加固

- **P2-7 · 错误详情向用户与控制台透传**:
  `src/main.tsx:18-30` 生产构建仍 console.error 完整 error 对象 + componentStack;`src/components/ErrorBoundary/GlobalCrash.tsx:71,93-94`、`DefaultFallback.tsx:6` 向终端用户渲染 `error.message/stack`;列表页 `src/pages/system/users/index.tsx:257`、`roles/index.tsx:220`、`src/pages/browser/bookmarks/index.tsx:230` 直接渲染服务端错误原文。建议生产仅显示通用文案、stack 仅开发可见;`src/service/http/adapters/FetchAdapter.ts:104`、`HttpError.ts:26` 携带完整 config(含 Authorization 头),将来接入日志上报时禁止整对象上报。
- **P2-8 · 书签 URL 无协议白名单**:
  保存校验仅非空+最长 2048(`src/features/bookmark/types.ts:4-23`),渲染 `<a href={selectedNode.url} target='_blank' rel='noreferrer'>`(`src/pages/browser/bookmarks/index.tsx:284-291`)——`javascript:`/`data:` 协议可在应用上下文执行(`rel='noreferrer'` 本身到位,无反向 tabnabbing);favicon 直连后端字段作 img src(`:152-157,268-272`)。建议保存/渲染双重 `http(s)` 白名单校验。

### 重复能力(共约 2500 行,治理收益最大)

- **P2-9 · CRUD 弹窗体系同构**:
  5 个 FormDialog(DictItem 276 行 / User 262 行 / Bookmark 259 行 / DictType 230 行 / Role 191 行)共享同一「受控 Modal + RHF/zod + 打开重置 + 编辑/新增双分支提交 + loading 合并 + toast 反馈」骨架,约 500-550 行机械重复;5 个 DeleteDialog 共 332 行同构;`sys_normal_disable` 状态字段 4 处逐字重复(DictItemFormDialog.tsx:221-226 等)。建议抽取 `useFormDialog`/`FormDialog`/`DeleteConfirmDialog`(有 Modal/Confirm 成功先例,风险低)。
- **P2-10 · 列表页与树页双重复线**:
  - users(308 行)/roles(271 行)两页约 250 行同构:分页状态、乐观切换+失败回滚(`users/index.tsx:45-73` 与 `roles/index.tsx:41-70` 逐字同构)、删空页回退、批量删除工具栏;
  - dict(582 行)/bookmarks(362 行)两树页重复折叠/toggle/hover 动作按钮/loading-error-empty 三段式骨架;
  - 树算法被重复书写:bookmark 页内 `findNode/countSubtree`(`bookmarks/index.tsx:15-27`)与 dialog 内 `collectFolderOptions/collectSubtreeIds`(`BookmarkFormDialog.tsx:48-74`),对应 `src/features/dict/utils.ts` 中同款实现,约 60 行。
  - 建议先统合共享 tree 工具,再抽 `usePagedList`/`useTree` 与页面骨架。

---

## P3 Findings(存量提醒;零消费组件/函数、预留依赖与按环境调试能力允许存在,无需处理)

- **P3-1 · `useLatest` 重复导出**【死代码】`src/hooks/index.ts:2` 与 `:6` 连续两次 `export * from './useLatest'`。✅ 已修复,详见文末「修复记录」。
- **P3-2 · ui/Combobox 零消费者**【无需处理,仅提醒】`src/ui/Combobox/index.tsx`(316 行)全仓无调用点,与 Select/SelectData 三层并存。按约定零消费组件允许存在,保留为库存;若未来做「可搜索下拉」需求,建议优先启用或扩展它,避免再造第四个选择器实现。
- **P3-3 · 15 个 hook 业务零调用**【无需处理,仅提醒】`src/hooks/` 下 useStorage(130 行,与 zustand persist 双存储抽象并存)、useScrollLock、useErrorBoundary、useThrottledFn、useDebounceValue、useTimeout、useRafInterval、useComposedRef 等;useBoolean/useCounter/useInterval 仅被 useCountdown 内部使用。按约定允许存在;提醒:新增持久化需求时应优先复用 useStorage 或 zustand persist,勿再引入第三套存储抽象。
- **P3-4 · 4 个组件 0 调用点**【无需处理,仅提醒】`src/components/Tooltip`、`Drawer`、`Dropdown` 组件体(Dropdown 仅 `renderDropdownItem` helper 被 Breadcrumb 消费)、`Access`(按钮级权限实际由各页 `roleKey === 'admin'` 特判承担);`src/ui/ContextMenu`、`src/components/AutoEllipsis` 仅 NavTab 消费。按约定允许存在;提醒:`Access` 若未来启用按钮级权限需接入统一权限判断,勿继续散落 `roleKey === 'admin'` 特判(呼应 P1-3)。
- **P3-5 · 未使用的 devDependencies**【无需处理,仅提醒】`@svgr/core`、`@svgr/plugin-jsx` 全仓 0 引用,按约定允许保留(疑为 SVG 图标处理能力预留)。
- **P3-6 · xt-commit-kit 引用关系待核实**【依赖】package.json 在列但代码零引用(疑为 commitizen 配置消费)。✅ 已核实:非死依赖,为提交链路工具,保留。详见文末「修复记录」。
- **P3-7 · 头像预览内存泄漏**【安全】`src/ui/UploadthingAvatar/index.tsx:118` `createObjectURL` 后无 `revokeObjectURL`。✅ 已修复,详见文末「修复记录」。
- **P3-8 · 路径参数未编码**【安全】`src/service/dict.ts:287`、`src/service/users.ts:100` 等 URL 拼接未 `encodeURIComponent`。✅ 已修复(共 3 处),详见文末「修复记录」。
- **P3-9 · 无 CSP**【安全】`index.html` 未配置 Content-Security-Policy(全仓无 dangerouslySetInnerHTML/eval,直接注入面干净,加 CSP 属体系化收窄)。✅ 已修复,详见文末「修复记录」。
- **P3-10 · devtools 中间件未按环境显式关闭**【安全】`src/store/useAuthor.ts:34` 未按 IS_PROD 显式关闭,state(含 token)是否推送生产 Redux DevTools **待核实**。✅ 已修复(三个 store 统一关闭),详见文末「修复记录」。
- **P3-11 · eruda chunk 始终进产物**【无需处理,仅提醒】`src/main.tsx:10-14` `import('eruda')` 动态 chunk 无论开关都进构建产物(执行由 env 门控)。**按约定保留**:部分打包/部署环境需要保留移动端调试能力,由 `VITE_USE_ERUDA` 按环境控制是合理的;若在意包体,可后续考虑按环境条件编译,但当前不做处理。
- **P3-12 · 仅有的 @ts-ignore**【无需处理,保留】`src/store/middleware/logger.ts:31`(有注释说明类型提取原因,属于有意识的受控使用,保留)。

---

## 测试覆盖薄弱区域

- **`src/service` 全层 0 测试**:57 个测试文件中无任何 service/HttpClient/request/拦截器测试——401 处理、拦截器链、错误归一化是全项目最关键且最容易回归的路径,建议优先补拦截器级测试。
- **`src/ui` 30 个组件目录仅 2 个测试**(Form、Switch);AlertDialog/Dialog/DropdownMenu/Sheet/Toast/Sidebar/Select 等交互原语零覆盖,主要依赖下游间接覆盖。
- **store 缺 useMenu、useSetting 测试**(persist 逻辑);features 的 5 个 FormDialog/DeleteDialog 无直接测试(经页面用例间接覆盖)。
- **覆盖良好的区域**:hooks 工具链、router(守卫/菜单派生/路由结构)、pages 主流程、NavTab 系列(7 个测试文件,近期改动均有配套)。

## 复杂度与维护性观察

- **大文件**:dict 页 582 行、`src/ui/Sidebar/sidebar.tsx` 525 行、`src/components/DataTable/index.tsx` 500 行、`src/layout/NavTab/nav-tab.tsx` 433 行。NavTab 是最近 6 个提交的活跃区,已拆 context/sync/actions 子模块,方向正确;dict 页与 Sidebar 仍建议按 P2-9/P2-10 拆分。
- **工程治理亮点**:无 TODO/FIXME/调试残留;console 输出集中于 `main.tsx` 错误边界与开发态中间件(有 IS_PROD 门控);`utils/`、`types/`、`constants/` 依赖方向干净;features 之间无跨域引用;提交信息遵循 cz 规范且为原子提交;`src/utils/common.ts`(46 处引用)与 `@/hooks` 桶(29 处)为耦合热点,API 稳定性要求高。

## 趋势与治理路线

`.loop/reviews` 中记录的既有失败(菜单断言未含 browser/dict 菜单)已在 `1bc6021` 修复——**但同日提交又引入新的 7 例失败**,说明「改动后验证范围」仍偏窄(本次只跑了相关文件而非受影响模块的相邻测试)。测试总量与模块配套在增长,质量基线稳中有升,回归多为懒加载/异步时序类适配遗漏。

建议按序执行(前两项可在 1-2 小时内完成):

1. **修复 P1-1 测试回归**,并补齐「懒加载改动需全量跑 components 测试」的提交前检查习惯;
2. **安全三件套**:凭据去落盘/登出清理(P1-2)、与后端确认 RBAC 并收窄 roleKey 信任(P1-3)、.env 出库 + 补 .gitignore(P1-4);
3. 断 service↔store 双向环(P2-2),并把菜单派生收敛出 routes(P2-1 环);
4. 重复治理按「先树工具 → 再 FormDialog 体系 → 后列表页骨架」推进(P2-9/P2-10),每步以现有页面测试为回归护栏;
5. 零消费组件/函数(P3-2~P3-4)按约定允许存在、无需处理,仅作提醒;补齐 service 拦截器测试。

---

## 修复记录

### P2-5 · Header/UserCenterDialog 归属漂移

- **修复时间**:2026-09-04(审查当日)
- **修复方式**:按报告建议将 Header 整体下沉至 layout 层,并收口 baseLayout 的跨层直连:
  - `src/components/Header/`(index.tsx、UserCenterDialog.tsx、Skeleton.tsx)整体 `git mv` 至 `src/layout/Header/`,Header 本就是布局顶栏、仅被 `layout/main.tsx` 单点消费,归属 layout 后其对 features/auth、router(derivedMenus/types)、service(request)、store(useAuthor)的多域依赖成为层内自洽引用,共享 `src/components/` 不再被单个布局组件「借用」;
  - `src/layout/main.tsx` 导入同步改为相对路径 `./Header`、`./Header/Skeleton`;
  - `src/layout/baseLayout.tsx` 的 `useUserInfo` 导入从 `@/features/auth/hooks` 桶改为直引单文件 `@/features/auth/hooks/useUserInfo`,避免 layout 经桶连带加载整个 auth hooks 链(与 P2-3 同一收口思路);
  - 两个测试文件的 Header mock 路径同步更新:`test/components/NavTabRefresh.test.tsx:8`、`test/components/LayoutMaximize.test.tsx:7` 改为 `vi.mock('@/layout/Header')`。
- **修复证据**:
  - 全仓 grep:`components/Header` 旧路径 0 残留;`src/components/` 层不再直连 `features/auth`(此前仅 Header 一处);
  - `pnpm compile`(tsc -b)、`pnpm lint` 通过;
  - `pnpm exec vitest run` 覆盖 NavTabRefresh/LayoutMaximize/Header/Menu/useMenuBreadcrumb 5 个测试文件,38 用例中 31 通过;7 个失败均为 P1-1 既有懒加载回归(Header 6 例 + Menu 1 例,前次核查已确认先于本次改动存在),非本次引入;
  - diff 摘要:3 文件整体迁移(git mv 保留历史),`main.tsx`/`baseLayout.tsx`/2 个测试文件各 1-2 行导入修正,组件行为无变化。

### P3-1 · `useLatest` 重复导出

- **修复时间**:2026-09-04(审查当日)
- **修复方式**:删除 `src/hooks/index.ts` 中重复的导出语句(原第 6 行 `export * from './useLatest'`),保留第 2 行的首次导出。桶导出顺序不变,`useLatest` 仍经 `@/hooks` 桶正常对外导出,纯删除重复语句、无行为变化。
- **修复证据**:
  - 代码 diff(`git diff src/hooks/index.ts`):

    ```diff
    diff --git a/src/hooks/index.ts b/src/hooks/index.ts
    index 16114fa..0280ad2 100644
    --- a/src/hooks/index.ts
    +++ b/src/hooks/index.ts
    @@ -3,7 +3,6 @@ export * from './useLatest'
     export * from './useComposedRef'
     export * from './useScrollLock'
     export * from './useBoolean'
    -export * from './useLatest'
     export * from './useUnmount'
     export * from './useDebounceFn'
     export * from './useDebounceValue'
    ```

  - `pnpm compile`(tsc -b)通过;
  - `pnpm lint` 通过;
  - 删除重复 `export *` 不改变任何导出符号,29 个引用 `@/hooks` 桶的消费方解析结果不变,故未重跑全量测试。

### P2-1 · routes ↔ layout ↔ Menu 静态循环依赖

- **修复时间**:2026-09-04(审查当日,分支 `lfz/refactor/break_route_menu_cycle`)
- **修复方式**:新增叶子模块 `src/router/derivedMenus.ts` 作为「路由表 → 菜单派生数据」的单一入口,提供 `getMenus(roleKey)`(完整菜单树)与 `getFirstLeafMenu(roleKey)`(第一个可跳转叶子)两个函数;三个原先各自 `import routes + routeToMenus + createRoleChecker` 的消费方统一切换:
  - `src/components/Menu/menus.tsx`(环闭合点):删除 `import routes from '@/router/routes'`,改用 `getMenus`;
  - `src/components/Header/index.tsx`:同上改用 `getMenus`;
  - `src/layout/NavTab/nav-tab.tsx`:改用 `getFirstLeafMenu`。
    修复后 `components/Menu` 对 `router/routes` 的值依赖消失,`routes.tsx → layout → Menu → routes` 环被打断;`derivedMenus.ts` 仅被三个下游消费方引用、自身不依赖 layout/components(对 `Menu/types` 仅类型引用,编译期擦除),不参与任何环。
- **修复证据**:
  - Tarjan SCC 全量 import 图检测:修复前该环存在;修复后**运行时(值导入)循环依赖为 0**(仅剩 Breadcrumb/DataTable/service↔store 三处含 `import type` 擦除边的类型级环,与原报告 P2-2 记录一致,未扩大);
  - `pnpm compile`、`pnpm lint` 通过;
  - `test/components/Menu.test.tsx`(含面包屑全链路、菜单派生、MenuItemLink 用例)、`test/components/useMenuBreadcrumb.test.ts`、`test/components/NavTabSync.test.tsx`、`test/router/*` 共 7 个测试文件 51/52 用例通过;唯一失败用例 `叶子菜单在自身路由激活时点亮` 经 `git stash` 基线复跑确认**先于本次改动存在**(与 Header.test.tsx 的 6 例同属当日懒加载回归 P1-1 批次,非本次引入);
  - diff 摘要:3 个消费方各 -3/+1 行 import 与 `useMemo` 调用体,行为语义(按 roleKey 派生菜单)完全不变。

---

### P2-3 · ui 层经 hooks 全量桶拖垮依赖边界

- **修复时间**:2026-09-04(审查当日)
- **修复方式**:`src/ui/Sidebar/context.tsx` 的 `useIsMobile` 导入从 `@/hooks` 桶改为直引单文件 `@/hooks/useIsMobile`。修复前该桶导入连带执行整个 hooks 桶模块图(useTheme → store/useSetting → useDictStore → service/dict → request → store/useAuthor),使 ui 基础层隐式耦合 store/service;修复后 `useIsMobile.ts` 自身仅依赖 react、`@/constants`(纯常量,仅依赖 package.json)与同目录 `useEventListener`(仅依赖 react),为干净的叶子链。
- **修复证据**:
  - 全仓 grep 复核:`src/ui/` 下经 `@/hooks` 桶的导入为 0(此前唯一一处即 Sidebar/context.tsx);其余 28 个桶消费方均在 app/components/features/pages/router 层,按原样保留;
  - `pnpm compile`、`pnpm lint` 通过;
  - `pnpm exec vitest run test/components/NavTabSync.test.tsx test/components/Menu.test.tsx test/layout` 12 用例中 11 通过,唯一失败 `叶子菜单在自身路由激活时点亮` 为 P1-1 既有懒加载回归(前次核查已确认先于本次改动存在),非本次引入;
  - diff 摘要:1 文件 1 行,`@/hooks` → `@/hooks/useIsMobile`。

### P2-4 · 双原语库并存(radix-ui 迁移尾巴)

- **修复时间**:2026-09-04(审查当日,提交 `9f0e9b5`)
- **修复方式**:移除最后一处 radix-ui 引用并卸载依赖:
  - `src/ui/Sidebar/sidebar.tsx`:删除 `import { Slot } from 'radix-ui'`,`SidebarMenuButton` 从 `asChild` + `Slot.Root` 模式改为 base-ui 的 `render` + `useRender`/`mergeProps` 模式(类型改为 `useRender.ComponentProps<'button'>`),行为语义(渲染为自定义元素而非 button)不变;
  - `package.json` 移除 `radix-ui` 依赖(pnpm-lock 同步收敛);
  - `src/components/Menu/menus.tsx` 同提交内小幅适配。
- **修复证据**:
  - 全仓 grep:`src/` 无任何 `from 'radix-ui'` 引用,`package.json` 无 radix-ui 条目;
  - 消费侧无残留:`asChild` 在 src/ 下 0 命中(仅 hasChildren 变量名巧合);
  - `pnpm compile`、`pnpm lint` 通过;`pnpm exec vitest run test/components` 23 个测试文件 220/227 通过(7 个失败为 P1-1 既有懒加载回归,非本次引入);
  - diff 摘要:4 文件,`sidebar.tsx` +22/-17 核心改造,`menus.tsx` 小幅适配。

### P3-6 · xt-commit-kit 引用关系核实

- **处理时间**:2026-09-04(审查当日)
- **核实结论**:**非死依赖,保留**。`xt-commit-kit` 是「一键式 Git 提交规范配置工具」,虽不被任何源码 import,但其 CLI(`node_modules/xt-commit-kit/bin/cli.js`)生成的配置正是本仓库现役提交链路:`package.json` 中 `config.commitizen`/`config.cz-customizable` 指向 `./commit-kit/.cz-config.cjs`(该工具 CLI 的产物路径,`dist/cli.js:95,99` 硬编码写入此路径),`.husky/commit-msg` 调用 commitlint、`pnpm commit` 走 cz-customizable,均依赖这套配置。属于「工具型依赖」,与 P3-2~P3-5 同类按约定保留。
- **处理方式**:仅澄清并记录,不改代码。

### P3-10 · devtools 中间件未按环境显式关闭

- **修复时间**:2026-09-04(审查当日)
- **修复方式**:三个 zustand store(`useAuthor`、`useMenu`、`useSetting`)的 `devtools()` 包裹统一补传 `{ name, enabled: !IS_PROD }`(`IS_PROD` 来自 `src/constants/index.ts:3`,即 `import.meta.env.PROD`)。生产构建下不再连接 Redux DevTools,杜绝含 token/user 的 state 被浏览器扩展读取;开发环境行为不变。原审查中「待核实」一项就此关闭:zustand v5 默认 `enabled` 依赖运行环境推断,显式关闭后该风险不再存在。
- **修复证据**:`pnpm compile`、`pnpm lint` 通过;`pnpm exec vitest run test/store` 5 个测试文件 48 用例全部通过(含 `useAuthor.test.ts` persist 行为回归)。diff 摘要(三个 store 同型,+5/-1):
  `src/store/useAuthor.ts`:`+ import { IS_PROD } from '@/constants'`、`+ { name: 'useAuthor', enabled: !IS_PROD }`;`useSetting.ts`、`useMenu.ts` 同型。

### P3-7 · 头像预览对象 URL 内存泄漏

- **修复时间**:2026-09-04(审查当日)
- **修复方式**:`src/ui/UploadthingAvatar/index.tsx` 三处补齐 `URL.revokeObjectURL` 生命周期管理:
  1. 新增 `useEffect` 卸载清理:组件卸载时若仍有 `previewUrl` 则 revoke;
  2. 换图时先 revoke 旧 blob URL 再 `createObjectURL` 新的(原实现直接覆盖,旧 File 数据滞留内存);
  3. 上传成功后 revoke 并清空预览(组件改用远程 `value` 展示);原实现失败分支 `setPreviewUrl(null)` 会造成预览 URL 泄漏,现改为失败时保留预览(不再提前置空)。
- **修复证据**:`pnpm compile`、`pnpm lint` 通过;组件无既有测试,行为变更仅限 blob URL 释放时机,渲染输出不变。

### P3-8 · service 路径参数未编码

- **修复时间**:2026-09-04(审查当日)
- **修复方式**:service 层全部 3 处模板字符串 URL 拼接补 `encodeURIComponent`(全仓 grep 复核,无遗漏):
  - `src/service/users.ts:100` `/users/${encodeURIComponent(id)}`;
  - `src/service/roles.ts:65` `/roles/${encodeURIComponent(id)}`;
  - `src/service/dict.ts:287` `/dicts/${encodeURIComponent(dictKey)}/items`。
- **修复证据**:`pnpm compile`、`pnpm lint` 通过;`pnpm exec vitest run test/pages/system test/utils` 48+3 用例通过(users/roles/dict 页面测试 mock 接口路径不受影响);`grep -rn '\${' src/service/*.ts | grep -v encodeURIComponent` 零命中。

### P3-9 · index.html 无 CSP

- **修复时间**:2026-09-04(审查当日)
- **修复方式**:`index.html` 新增 `<meta http-equiv="Content-Security-Policy">` 基线:`default-src 'self'`、`script-src 'self' 'unsafe-inline'`(Vite dev 注入的内联模块脚本)、`style-src 'self' 'unsafe-inline'`(Tailwind 运行时内联样式)、`img-src 'self' data: blob:`(头像预览 blob URL)、`connect-src 'self' ws: http: https:`(dev HMR websocket + 生产 API,当前 .env 生产地址为 http,故保留 http/https,待 P1-4 生产切 https 后可收紧)、`object-src 'none'`、`base-uri 'self'`、`frame-ancestors 'none'`(禁被嵌入 iframe)。文件内附中文注释说明各指令取舍与后续收紧路径。
- **修复证据**:`pnpm compile`、`pnpm lint`、`pnpm lint-stylelint` 通过;`pnpm exec vitest run test/store test/pages/system` 5 个测试文件全部通过(测试不经 index.html 加载,无影响)。**提醒**:CSP 的实际拦截效果需在真实浏览器构建产物上人工验证一次(`pnpm build && pnpm preview`),确认 dev/prod 均无资源被误拦。

---

## 审查方法附录

- **循环依赖检测**:抓取全部 import 边(相对 + `@/` 别名)人工推演闭合路径,对存疑边逐一读取源码核实 `import type`(编译期擦除)与动态 `import()`。
- **重复分析**:对 FormDialog/DeleteDialog/列表页/树页四组文件逐段比对结构同构度,并统计 hook/组件全仓消费频次(0/1/多次)。
- **安全审查**:通读加密工具、HTTP 内核与拦截器、认证/权限守卫、错误边界、env 配置与渲染注入面(全仓无 dangerouslySetInnerHTML/eval)。
- **基线验证**:`pnpm compile`(tsc -b)、`pnpm lint`(ESLint)、`pnpm exec vitest run` 全量测试,均在审查当日执行。
