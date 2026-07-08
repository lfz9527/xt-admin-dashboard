# Collapse

数据驱动的折叠面板组组件，基于 `ui/Collapsible` 封装。

## CollapseItem

| 字段          | 类型        | 必填 | 说明                                           |
| ------------- | ----------- | ---- | ---------------------------------------------- |
| `key`         | `string`    | 是   | 唯一标识                                       |
| `title`       | `ReactNode` | 是   | 触发器内容                                     |
| `children`    | `ReactNode` | 是   | 折叠内容                                       |
| `defaultOpen` | `boolean`   | 否   | 初始展开状态（非受控模式）                     |
| `disabled`    | `boolean`   | 否   | 禁止展开；若同时 `defaultOpen=true` 则禁止收起 |
| `className`   | `string`    | 否   | 透传给 `Collapsible` 根元素的 class            |
| `trigger`     | `ReactNode` | 否   | 自定义触发器内容，优先级高于 `title`           |

## CollapseProps

| 属性              | 类型                                   | 默认值       | 说明                        |
| ----------------- | -------------------------------------- | ------------ | --------------------------- |
| `items`           | `CollapseItem[]`                       | —            | 数据数组                    |
| `type`            | `'multiple' \| 'accordion'`            | `'multiple'` | 展开模式                    |
| `openKeys`        | `string[]`                             | —            | 受控：当前展开的 key 列表   |
| `defaultOpenKeys` | `string[]`                             | —            | 非受控：初始展开的 key 列表 |
| `onToggle`        | `(key: string, open: boolean) => void` | —            | 受控模式回调                |

## 使用示例

### 默认独立模式

```tsx
import { Collapse } from '@/components/Collapse'

const items = [
  { key: '1', title: '标题一', children: '内容一' },
  { key: '2', title: '标题二', children: '内容二', defaultOpen: true },
]

<Collapse items={items} />
```

### 手风琴模式

```tsx
<Collapse
  items={items}
  type='accordion'
/>
```

### 受控模式

```tsx
const [openKeys, setOpenKeys] = useState<string[]>([])

<Collapse
  items={items}
  openKeys={openKeys}
  onToggle={(key, open) => {
    setOpenKeys(open ? [...openKeys, key] : openKeys.filter(k => k !== key))
  }}
/>
```

### disabled 行为

```tsx
const items = [
  { key: 'a', title: '普通项', children: '内容' },
  { key: 'b', title: '禁止展开', children: '内容', disabled: true },
  { key: 'c', title: '始终展开', children: '内容', disabled: true, defaultOpen: true },
]

<Collapse items={items} />
```

### 自定义触发器

```tsx
const items = [
  {
    key: '1',
    title: '标题一',
    children: '内容一',
    className: 'group/my-collapse',
    trigger: (
      <button>
        <Icon />
        <span>标题一</span>
        <ChevronRight className='transition-transform group-data-open/my-collapse:rotate-90' />
      </button>
    ),
  },
]

<Collapse items={items} />
```