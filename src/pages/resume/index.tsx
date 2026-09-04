import { FileText } from 'lucide-react'

export default function Resume() {
  return (
    <div className='flex-center bg-background size-full flex-col gap-3 text-center'>
      <FileText className='text-muted-foreground size-12' />
      <h1 className='text-xl font-semibold'>我的简历</h1>
      <p className='text-muted-foreground max-w-90 text-sm leading-relaxed'>
        简历内容待补充，可在此展示个人履历信息。
      </p>
    </div>
  )
}
