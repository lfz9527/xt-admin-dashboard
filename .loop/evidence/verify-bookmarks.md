# Verify Evidence — 书签管理（loop-20260901-bookmarks）

## 验收标准核对

| 验收标准                                             | 结果 | 证据                                                                                                                                       |
| ---------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 侧边栏「系统管理」下出现「书签管理」菜单，路由可访问 | ✅   | routes.tsx 新增 /system/bookmarks（menuKey=system-bookmarks, permission=admin）；routeToMenus 自动生成菜单；test/router 4 文件 23 用例通过 |
| 收藏树按层级缩进展示，文件夹可展开/收起              | ✅   | 页面用 ui/Sidebar + Collapsible 渲染类文件树，默认全部展开                                                                                 |
| 新增：文件夹/收藏类型、收藏必填网址、父级下拉        | ✅   | BookmarkFormDialog（zod schema superRefine 校验）；测试「新增收藏未填网址：校验拦截且不提交」                                              |
| 编辑：回填节点、可改名称/网址/父级                   | ✅   | 测试「编辑收藏：回填行数据提交 updateBookmark 并刷新列表」                                                                                 |
| 删除：确认弹窗，文件夹提示连带子孙                   | ✅   | DeleteBookmarkDialog；测试「删除文件夹：确认弹窗提示连带子项」                                                                             |
| 测试 / lint / compile 通过                           | ✅   | 见下                                                                                                                                       |

## 验证结果

- `vitest run test/pages/system/bookmarks.test.tsx`：**8/8 通过**（列表渲染、收起、新增文件夹、新增收藏、URL 必填校验、编辑、删除成功、删除失败）
- `vitest run test/router/`：**23/23 通过**（menu 6、permissions 9、PermissionGuard 2、routes 6）
- `pnpm lint`：通过（0 error / 0 warning，修复了 useWatch React Compiler 告警）
- `pnpm compile`：通过（修复了 refresh 未使用告警）

## 过程中修复的问题（记录失败，未覆盖）

1. 页面 useEffect 依赖 `tree ?? []` 每次渲染生成新引用 → 无限渲染循环导致 vitest worker 崩溃/挂起；改为依赖 `tree` 本身并加空值判断。
2. 页面漏导入 `SidebarMenuSub` → ReferenceError。
3. 测试默认展开断言用同步 getByText 早于展开渲染周期 → 改用 findByText 等待。
4. 测试中 getByText('文件夹') 匹配到 Select trigger 与已渲染的 option item 两处 → 改用 getAllByRole('combobox')[0] 定位类型 Select。

## 遗留说明

- favicon / sort 为可选字段，第一版表单不提供（列表展示已有 favicon，编辑不传字段由服务端保留原值），符合计划中范围裁剪。
- 未执行 pnpm build 与全量测试（按 AGENTS.md 约定仅跑相关测试）。

## 追加：mock 数据阶段（用户要求先看效果）

- 页面数据源改为本地写死 mockTree（三层嵌套：开发资源/新闻资讯/哔哩哔哩），不再请求接口。
- 新增/编辑/删除全部本地生效：BookmarkFormDialog 提交表单值（onSuccess: (values) => void），页面用纯函数 nextId（树中最大 id+1）生成新节点 id；删除走本地 removeNode。
- service/bookmarks.ts 保留不动，联调时还原页面数据源与 Dialog 接口调用即可。
- 验证：8/8 测试通过（mock 渲染/收起/新增/校验/编辑/删除）、pnpm lint ✅、pnpm compile ✅。

## 追加：移除 mock，恢复真实接口

- 按用户要求移除 mock 数据：页面恢复 useRequest(getBookmarkTree) 拉取收藏树（loading/error/空态分支），新增/编辑/删除恢复调用 createBookmark/updateBookmark/deleteBookmark，成功后 run() 刷新列表。
- 保留此前的关键修复：useEffect 依赖 tree（避免无限渲染循环）、useWatch（React Compiler 兼容）、SidebarMenuSub 导入。
- 验证：8/8 测试通过（接口 mock 断言）、pnpm lint ✅、pnpm compile ✅。

## 追加：弃用 ui/Sidebar，自研文件树

- 按用户要求移除 ui/Sidebar 组件族，页面自研树结构：递归 TreeNode（div + 条件渲染展开/收起），子级缩进并带左侧竖线（border-l），文件夹行点击=选中+展开/收起，收藏行为 <a> 外链（点击打开+选中），行内 hover 编辑/删除按钮独立于行主体（避免嵌套交互元素）。
- 左侧面板宽 w-64（256px，与原来一致），保留 loading/error/空态与右侧详情面板。
- 测试：编辑用例补等待展开完成（GitHub 按钮渲染后再点击）；8/8 通过、pnpm lint ✅、pnpm compile ✅。
