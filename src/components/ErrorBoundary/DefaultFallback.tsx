import { type FallbackProps } from './types'

const DefaultFallback = ({ error, reset }: FallbackProps) => (
  <div className='rounded-lg border border-[#e24b4a] p-6'>
    <p className='font-medium text-[#A32D2D]'>Something went wrong</p>
    <pre className='text-xs text-[#791F1F]'>{error.message}</pre>
    <button onClick={reset}>Try again</button>
  </div>
)
export default DefaultFallback
