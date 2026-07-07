declare namespace Global {
  type AnyObj<V = any> = Record<string, V>
  type AnyFunction<R = any> = (...args: any[]) => R

  type ElAttrs<T = any> = {
    className?: string
    style?: React.CSSProperties
    onClick?: React.MouseEventHandler<T>
  }

  // 没有参数,但是有返回值
  type NotArgReturnFunc<R = any> = () => R
  // 一个参数,但是没返回值
  type OneArgVoidFunction<T = string> = (arg: T) => void
}
