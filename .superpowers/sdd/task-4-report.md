# Task 4 Report

## Status
Completed.

## Commit
`1e25c9206e13ef8dff3dcd3a4ff956b8e427eb71`

## Summary
- Removed `mockMenus` and `menus` state from `useMenu`; only `sidebarOpen` and its actions remain persisted under `app-menu`.
- Changed `Menus` to derive sidebar data from `routes` via `routeToMenus(routes)` while retaining the existing Tree rendering and route-match highlighting.
- Hardened route metadata access in `routeToMenus` for layout routes without `meta`.
- Added focused coverage for route-derived hierarchy, hidden detail routes, and the sidebar-only store shape.
- Did not modify Task 5 Header/Breadcrumb files.

## Actual test results
- `pnpm exec vitest run test/components/Menu.test.tsx test/components/useMenuBreadcrumb.test.ts --reporter=dot`: PASS, 2 files / 13 tests.
- `pnpm exec tsc --noEmit`: PASS.

## Concerns
- The requested `pnpm test -- test/components/Menu.test.tsx` command runs the repository's configured broad test set and currently reports unrelated pre-existing failures; the isolated Vitest command above passes.
- Existing untracked planning/spec files were left untouched and are not included in the commit.

## Review Fix Verification
- Removed Header's `useMenu((s) => s.menus)` dependency; Header now derives the same route menu tree as `Menus` with the explicit `allowAllPermissions` checker.
- Exported the shared `allowAllPermissions` checker from `src/router/menu.ts`, preserving allow-all behavior without adding a backend dependency.
- Added a rendered Header integration test proving breadcrumb data is available from route-derived menus while the menu store has no `menus` field.
- `pnpm exec vitest run test/components/Menu.test.tsx test/components/useMenuBreadcrumb.test.ts`: PASS, 2 files / 14 tests.
- `pnpm exec tsc --noEmit`: PASS.
- `pnpm build`: BLOCKED by unrelated pre-existing errors in `src/ui/Sidebar/context.tsx` (unused `useEffect`) and `test/router/routes.test.tsx` (`RouteObject.meta` typing); no Task 4 `menus` type errors remain.
