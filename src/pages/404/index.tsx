import { useNavigate, useLocation } from 'react-router'

const btnPrimary =
  'cursor-pointer rounded-lg bg-[#111] px-[22px] py-[9px] text-[13px] font-medium text-white transition-opacity duration-150 hover:opacity-75 active:opacity-60 dark:bg-[#f0f0f0] dark:text-[#0c0c0e]'

const btnGhost =
  'cursor-pointer rounded-lg border border-[#d1d5db] bg-transparent px-[22px] py-[9px] text-[13px] text-[#111] transition-colors duration-150 hover:bg-[#f9fafb] active:bg-[#f3f4f6] dark:border-[#374151] dark:text-[#f0f0f0] dark:hover:bg-[#1c1c22] dark:active:bg-[#252530]'

export default function NotFound() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className='flex-center size-full flex-col bg-white px-4 py-8 text-center dark:bg-[#0c0c0e]'>
      <p className='mb-4 text-[clamp(72px,13vw,128px)] leading-none font-bold tracking-[-3px] text-[#111] tabular-nums dark:text-[#f0f0f0]'>
        404
      </p>

      <div className='mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f3f4f6] px-3 py-0.75 font-mono text-xs break-all text-[#6b7280] dark:border-[#2e2e3a] dark:bg-[#1c1c22] dark:text-[#9ca3af]'>
        <span className='size-1.5 shrink-0 rounded-full bg-[#e24b4a]' />
        {location.pathname}
      </div>

      <h1 className='mb-2 text-xl font-semibold text-[#111] dark:text-[#f0f0f0]'>
        页面走丢了
      </h1>
      <p className='mb-8 max-w-90 text-sm leading-relaxed text-[#6b7280] dark:text-[#9ca3af]'>
        你访问的路由不存在，可能已被删除、移动或链接输入有误。
      </p>

      <div className='flex flex-wrap justify-center gap-2.5'>
        <button
          className={btnPrimary}
          onClick={() => navigate('/')}
        >
          返回首页
        </button>
        <button
          className={btnGhost}
          onClick={() => navigate(-1)}
        >
          上一页
        </button>
      </div>
    </div>
  )
}
