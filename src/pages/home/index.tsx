import { uid } from '@/utils/easy-uid'
import { useNavTab } from '@/layout/NavTab'

const DEMO_TABS = ['概览', '用户管理', '角色管理', '系统设置']

export default function Index() {
  const { addTab, activeTabId } = useNavTab()

  return (
    <div className='flex flex-col gap-4 p-(--main-content-padding)'>
      <div className='flex items-center gap-2'>
        {DEMO_TABS.map((title) => (
          <button
            key={title}
            className='bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer rounded-md px-4 py-2 text-sm'
            onClick={() => addTab({ id: uid(8), title })}
          >
            打开 {title}
          </button>
        ))}
      </div>

      <p className='text-muted-foreground text-sm'>
        当前激活标签页: {activeTabId ?? '无'}
      </p>
    </div>
  )
}
