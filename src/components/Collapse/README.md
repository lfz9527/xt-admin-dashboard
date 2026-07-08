# Collapse

数据驱动的折叠面板组件，基于 `ui/Collapsible` 封装。每个 `Collapse` 渲染一个面板，遍历由外部控制。

## CollapseProps

| 属性           | 类型                           | 默认值     | 说明                                           |
| -------------- | ------------------------------ | ---------- | ---------------------------------------------- |
| `title`        | `ReactNode`                    | —          | 触发器内容                                     |
| `children`     | `ReactNode`                    | —          | 折叠内容                                       |
| `defaultOpen`  | `boolean`                      | `false`    | 初始展开状态（非受控模式）                     |
| `disabled`     | `boolean`                      | `false`    | 禁止展开；若同时 `defaultOpen=true` 则禁止收起 |
| `className`    | `string`                       | —          | 透传给 `Collapsible` 根元素的 class            |
| `trigger`      | `ReactNode`                    | —          | 完全自定义触发器（需为 ReactElement），置后覆盖默认 title 和箭头 |
| `triggerCls`   | `string`                       | —          | 默认触发器的 class                             |
| `wrapper`      | `ReactElement`                 | `<div />`  | 替换 `Collapsible` 根元素的包裹节点            |
| `open`         | `boolean`                      | —          | 受控：展开状态                                 |
| `onOpenChange` | `(open: boolean) => void`      | —          | 受控：状态变更回调                             |
| `keepMounted`  | `boolean`                      | `true`     | 收起时保持内容挂载到 DOM                       |
| `arrow`        | `ReactNode`                    | —          | 自定义箭头图标（默认 `ChevronRight`）          |
| `arrowCls`     | `string`                       | —          | 箭头的 class                                   |

## 使用示例

### 默认用法

```tsx
import { Collapse } from '@/components/Collapse'

<Collapse title='标题一'>内容一</Collapse>
```

### 自定义触发器

```tsx
<Collapse
  title='标题一'
  className='group/my-collapse'
  trigger={
    <button>
      标题一
      <ChevronRight className='transition-transform group-data-open/my-collapse:rotate-90' />
    </button>
  }
>
  内容一
</Collapse>
```

### 受控模式

```tsx
const [open, setOpen] = useState(false)

<Collapse
  title='标题一'
  open={open}
  onOpenChange={setOpen}
>
  内容一
</Collapse>
```

### 自定义包裹元素

```tsx
<Collapse
  title='标题一'
  wrapper={<SidebarMenuItem />}
>
  内容一
</Collapse>
```

### disabled 行为

```tsx
// 禁止展开
<Collapse title='标题' disabled>内容</Collapse>

// 始终展开（禁止收起）
<Collapse title='标题' disabled defaultOpen>内容</Collapse>
```

### 列表遍历（外部控制）

```tsx
const items = [
  { key: '1', title: '标题一', children: '内容一' },
  { key: '2', title: '标题二', children: '内容二', defaultOpen: true },
]

{items.map(({ key, ...item }) => (
  <Collapse key={key} {...item} />
))}
```
