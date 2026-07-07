import { useAuthor } from '@/store'
import { useState } from 'react'

import AutoTooltip from '@/components/AutoTooltip'

import {
  useIsMobile,
  useDebounceValue,
  useEventListener,
  useTimeout,
  useStorage,
  useCountdown,
  useThrottleFn,
} from '@/hooks'

import { GetUser } from '@/service'

export default function Login() {
  const isMobile = useIsMobile()
  const { token, setToken } = useAuthor()
  const [lines, setLines] = useState(1)
  const [count, { start, stop, reset }] = useCountdown({ countStart: 60 })

  const { value, setValue, remove } = useStorage({
    key: 'ttt',
    initialValue: '',
    storage: 'local',
  })

  const [innerWidth, setInnerWidth] = useDebounceValue(0)
  useEventListener('resize', () => {
    setInnerWidth(window.innerWidth)
  })

  const ThrottleRun = useThrottleFn(
    (args) => {
      console.log('args', args)
    },
    { wait: 2000 }
  )

  useTimeout(() => {
    console.log('测试useTimeout')
  })
  const handleClick = () => {
    setToken(token + Date.now().toString())
  }

  const handleTestApi = async () => {
    const { data } = await GetUser({ id: 12 })
    console.log(111, data)
  }

  return (
    <div style={{ padding: 20 }}>
      <button onClick={handleTestApi}>测试接口请求封装</button>
      <div
        style={{
          paddingBlock: 10,
        }}
      />
      {isMobile ? '移动端' : '非移动端'}
      <p>window.innerWidth:{innerWidth}</p>
      <button onClick={start}>开始倒计时</button>
      <button onClick={stop}>停止倒计时</button>
      <button onClick={reset}>重置倒计时</button>

      <p>倒计时:{count}</p>
      <button onClick={() => setValue(Date.now().toString())}>
        更新缓存数据
      </button>
      <button onClick={() => remove()}>移除缓存数据</button>
      <p>缓存数据:{value}</p>
      <div>
        <div
          style={{
            display: 'flex',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button onClick={handleClick}>Click me</button>
          <button onClick={() => setLines(lines + 1)}>add Lines</button>
          <button
            onClick={() => {
              console.log(1)
              ThrottleRun(Date.now())
            }}
          >
            防抖
          </button>
        </div>
      </div>
      <AutoTooltip
        text={token}
        lines={lines}
      />
    </div>
  )
}
