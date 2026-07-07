import {
  ChevronRight,
  BookOpen,
  Bot,
  Settings2,
  SquareTerminal,
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/ui/Collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/ui/Sidebar'

const items = [
  {
    title: '演示区',
    url: '#',
    icon: SquareTerminal,
    isActive: true,
    items: [
      {
        title: '历史',
        url: '#',
      },
      {
        title: '已加星标',
        url: '#',
        isActive: true,
      },
      {
        title: '设置',
        url: '#',
      },
    ],
  },
  {
    title: '模型',
    url: '#',
    icon: Bot,
    items: [
      {
        title: 'Genesis',
        url: '#',
      },
      {
        title: '探索器',
        url: '#',
      },
      {
        title: '量子',
        url: '#',
      },
    ],
  },
  {
    title: '文档',
    url: '#',
    icon: BookOpen,
    items: [
      {
        title: '简介',
        url: '#',
      },
      {
        title: '开始使用',
        url: '#',
      },
      {
        title: '教程',
        url: '#',
      },
      {
        title: '更新日志',
        url: '#',
      },
    ],
  },
  {
    title: '设置',
    url: '#',
    icon: Settings2,
    items: [
      {
        title: '常规',
        url: '#',
      },
      {
        title: '团队',
        url: '#',
      },
      {
        title: '账单',
        url: '#',
      },
      {
        title: '限制',
        url: '#',
      },
    ],
  },
]

export default function Menus() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            defaultOpen={item.isActive}
            className='group/collapsible'
            render={
              <SidebarMenuItem>
                <CollapsibleTrigger
                  render={
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className='ml-auto transition-transform duration-300 group-data-open/collapsible:rotate-90' />
                    </SidebarMenuButton>
                  }
                />
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          render={
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          }
                        />
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            }
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
