// GlobalCrash.tsx
import { useState, type ErrorInfo } from 'react'

interface GlobalCrashProps {
  error: Error
  errorInfo?: ErrorInfo | null
  reset?: () => void
}

const WarningIcon = () => (
  <svg
    width='22'
    height='22'
    viewBox='0 0 22 22'
    fill='none'
  >
    <path
      d='M11 3L20 19H2L11 3Z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinejoin='round'
    />
    <line
      x1='11'
      y1='9'
      x2='11'
      y2='13.5'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
    />
    <circle
      cx='11'
      cy='16'
      r='0.8'
      fill='currentColor'
    />
  </svg>
)

const btnClass =
  'h-[34px] cursor-pointer rounded-lg border border-[rgb(31,30,29,0.3)] bg-transparent px-4 text-[13px] text-[rgb(20,20,19)] transition hover:bg-[rgb(245,244,237)] active:scale-95'

const GlobalCrash = ({ error, errorInfo, reset }: GlobalCrashProps) => {
  const [showDetail, setShowDetail] = useState(false)

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className='flex-center min-h-dvh bg-[#f5f4ed] p-4'>
      <div className='w-full max-w-[680px] rounded-[10px] border border-[rgb(31,30,29,0.15)] bg-white px-8 py-10 text-center'>
        <div className='flex-center mx-auto mb-5 size-12 rounded-full bg-[rgb(247,236,236)] text-[rgb(127,44,40)]'>
          <WarningIcon />
        </div>

        <p className='mb-2 text-lg font-medium text-[rgb(20,20,19)]'>
          页面发生了错误
        </p>
        <p className='mb-6 text-sm leading-relaxed text-[rgb(61,61,58)]'>
          应用遇到了未预期的问题，请尝试刷新页面。
          如果问题持续出现，请联系技术支持。
        </p>

        <div className='mb-6 rounded-lg bg-[rgb(245,244,237)] px-4 py-3 text-left'>
          <p className='mb-1 text-[11px] font-medium tracking-wider text-[rgb(115,114,108)] uppercase'>
            错误信息
          </p>
          <p className='text-xs break-all text-[rgb(127,44,40)]'>
            {error.message}
          </p>
        </div>

        <div className='flex justify-center gap-2'>
          <button
            onClick={reset ?? handleRefresh}
            className={btnClass}
          >
            {reset ? '重试' : '刷新页面'}
          </button>
          <button
            onClick={() => setShowDetail((v) => !v)}
            className={btnClass}
          >
            {showDetail ? '收起详情' : '查看详情'}
          </button>
        </div>

        {showDetail && (
          <div className='mt-5 max-h-[200px] overflow-y-auto rounded-lg bg-[rgb(245,244,237)] px-4 py-3 text-left'>
            <pre className='text-[11px] leading-relaxed whitespace-pre-wrap text-[rgb(61,61,58)]'>
              {error.stack}
              {errorInfo?.componentStack}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default GlobalCrash
