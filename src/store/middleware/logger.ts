import { type StateCreator, type StoreMutatorIdentifier } from 'zustand'
import { IS_PROD } from '@/constants'

type Logger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string
) => StateCreator<T, Mps, Mcs>

type LoggerImpl = <T>(
  f: StateCreator<T, [], []>,
  name?: string
) => StateCreator<T, [], []>

// 提取 set 函数的参数类型，避免 @ts-ignore
type SetArgs = Parameters<Parameters<StateCreator<unknown, [], []>>[0]>

function Log(name: string, get: () => any) {
  if (IS_PROD) return

  const prefix = name ? `[${name}]` : '[store]'
  console.group(`%c${prefix} store updated`, 'color: #7f77dd; font-weight: 500')
  console.log('next state:', get())
  console.groupEnd()
}

const loggerImpl: LoggerImpl = (f, name) => (set, get, store) => {
  // @ts-ignore
  const loggedSet: typeof set = (...args: SetArgs) => {
    set(...(args as Parameters<typeof set>))
    Log(name ?? '', get)
  }
  return f(loggedSet, get, store)
}
export const logger = loggerImpl as unknown as Logger
