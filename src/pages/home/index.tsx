import { Drawer } from '@/components/Drawer'
import { Button } from '@/ui/Button'
import { useBoolean } from '@/hooks'

export default function Index() {
  const { value, toggle } = useBoolean(true)
  return (
    <>
      Home
      <Button
        className='w-fit'
        onClick={toggle}
      >
        Open Drawer
      </Button>
      <Drawer
        open={value}
        onOpenChange={toggle}
        maskClosable={false}
        title='用户详情'
        footer={<Button onClick={toggle}>保存</Button>}
      >
        <p>抽屉内容</p>
      </Drawer>
    </>
  )
}
