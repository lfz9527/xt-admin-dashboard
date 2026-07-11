import { Drawer } from '@/components/Drawer'
import { Dropdown } from '@/components/Dropdown'
import { Button } from '@/ui/Button'
import { useBoolean } from '@/hooks'

import {
  PencilIcon,
  TrashIcon,
  CopyIcon,
  LogOutIcon,
  UserIcon,
} from 'lucide-react'

export default function Index() {
  const { value, toggle } = useBoolean(false)
  return (
    <>
      Home
      <div className='flex items-center gap-2'>
        <Button
          className='w-fit'
          onClick={toggle}
        >
          Open Drawer
        </Button>
        <Dropdown
          trigger={<Button>操作</Button>}
          items={[
            {
              label: '编辑',
              icon: <PencilIcon />,
              shortcut: 'Ctrl+E',
              onClick: () => {},
            },
            {
              label: '删除',
              icon: <TrashIcon />,
              variant: 'destructive',
              onClick: () => {},
            },
            { type: 'separator' },
            { label: '复制', trailingIcon: <CopyIcon />, onClick: () => {} },
            { label: '退出', trailingIcon: <LogOutIcon />, onClick: () => {} },
            { type: 'separator' },
            { type: 'label', label: '更多操作' },
            { label: '导出', disabled: true },
            {
              label: '账户',
              icon: <UserIcon />,
              children: [
                { label: '个人信息', onClick: () => {} },
                { label: '安全设置', onClick: () => {} },
                { type: 'separator' },
                {
                  label: '退出登录',
                  variant: 'destructive',
                  onClick: () => {},
                },
              ],
            },
          ]}
        />
        <Dropdown
          trigger={<Button variant='outline'>悬浮触发</Button>}
          triggerMode='hover'
          items={[
            { label: '新建文件', onClick: () => {} },
            { label: '新建文件夹', onClick: () => {} },
            { type: 'separator' },
            { label: '导入', onClick: () => {} },
            { label: '导出', onClick: () => {} },
          ]}
        />
      </div>
      <Drawer
        open={value}
        onOpenChange={toggle}
        title='用户详情'
        footer={<Button onClick={toggle}>保存</Button>}
      >
        <p>抽屉内容</p>
      </Drawer>
    </>
  )
}
