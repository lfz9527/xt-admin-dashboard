import { type ReactNode, isValidElement, type ReactElement } from 'react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/ui/DropdownMenu'
import { Button } from '@/ui/Button'

export interface DropdownItem {
  /** 类型，默认 item */
  type?: 'item' | 'separator' | 'label'
  /** 显示文本 */
  label?: string
  /** 图标（左侧） */
  icon?: ReactNode
  /** 尾部图标（右侧，与 shortcut 互斥，shortcut 优先） */
  trailingIcon?: ReactNode
  /** 快捷键提示 */
  shortcut?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 变体 */
  variant?: 'default' | 'destructive'
  /** 点击回调 */
  onClick?: () => void
  /** 子菜单项 */
  children?: DropdownItem[]
}

export interface DropdownProps {
  /** 触发器，传入 React 元素可复用已有组件（如 Button），传入纯内容则渲染为默认按钮 */
  trigger: ReactNode
  /** 菜单项 */
  items: DropdownItem[]
  /** 对齐方式 */
  align?: 'start' | 'center' | 'end'
  /** 弹出方向 */
  side?: 'top' | 'bottom' | 'left' | 'right'
  /** 弹出偏移 */
  sideOffset?: number
  /** 受控：是否打开 */
  open?: boolean
  /** 受控：打开状态变化回调 */
  onOpenChange?: (open: boolean) => void
  /** 触发模式，默认 click */
  triggerMode?: 'click' | 'hover'
}

function renderItem(item: DropdownItem, index: number) {
  if (item.type === 'separator') {
    return <DropdownMenuSeparator key={index} />
  }

  if (item.type === 'label') {
    return <DropdownMenuLabel key={index}>{item.label}</DropdownMenuLabel>
  }

  // submenu
  if (item.children?.length) {
    return (
      <DropdownMenuSub key={index}>
        <DropdownMenuSubTrigger>{item.label}</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {item.children.map(renderSubItem)}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    )
  }

  return (
    <DropdownMenuItem
      key={index}
      disabled={item.disabled}
      variant={item.variant}
      onClick={item.onClick}
    >
      {item.icon}
      {item.label}
      {item.shortcut && (
        <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
      )}
      {!item.shortcut && item.trailingIcon && (
        <span className='ml-auto'>{item.trailingIcon}</span>
      )}
    </DropdownMenuItem>
  )
}

/** 子菜单项不支持嵌套子菜单，只有 label/separator/item */
function renderSubItem(item: DropdownItem, index: number) {
  if (item.type === 'separator') {
    return <DropdownMenuSeparator key={index} />
  }

  if (item.type === 'label') {
    return <DropdownMenuLabel key={index}>{item.label}</DropdownMenuLabel>
  }

  return (
    <DropdownMenuItem
      key={index}
      disabled={item.disabled}
      variant={item.variant}
      onClick={item.onClick}
    >
      {item.icon}
      {item.label}
      {item.shortcut && (
        <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
      )}
      {!item.shortcut && item.trailingIcon && (
        <span className='ml-auto'>{item.trailingIcon}</span>
      )}
    </DropdownMenuItem>
  )
}

export function Dropdown({
  trigger,
  items,
  align = 'start',
  side = 'bottom',
  sideOffset = 4,
  open,
  onOpenChange,
  triggerMode = 'click',
}: DropdownProps) {
  // 检测 trigger 类型：ReactElement 用 render 替换 MenuTrigger 的默认 button，避免嵌套
  const isElement = isValidElement(trigger)
  const elType = isElement ? (trigger as ReactElement).type : null
  const isNativeBtn = elType === 'button'
  const isButtonComp = elType === Button

  return (
    <DropdownMenu
      open={open}
      onOpenChange={onOpenChange}
    >
      {isElement ? (
        <DropdownMenuTrigger
          openOnHover={triggerMode === 'hover'}
          render={trigger}
          nativeButton={isNativeBtn || isButtonComp}
        />
      ) : (
        <DropdownMenuTrigger openOnHover={triggerMode === 'hover'}>
          {trigger}
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        className='w-40'
      >
        <DropdownMenuGroup>{items.map(renderItem)}</DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
