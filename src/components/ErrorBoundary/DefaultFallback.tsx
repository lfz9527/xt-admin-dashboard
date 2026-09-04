import { type FallbackProps } from './types'
import { IS_PROD } from '@/constants'

const DefaultFallback = ({ error, reset }: FallbackProps) => (
  <div className='rounded-lg border border-[#e24b4a] p-6'>
    <p className='font-medium text-[#A32D2D]'>Something went wrong</p>
    {/* 错误 message 可能携带内部实现细节，仅非生产环境展示 */}
    {!IS_PROD && <pre className='text-xs text-[#791F1F]'>{error.message}</pre>}
    <button onClick={reset}>Try again</button>
  </div>
)
export default DefaultFallback
