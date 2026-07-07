type AccessProps = {
  disable?: boolean
  fallback?: React.ReactNode
  children?: React.ReactNode
}

function Access({ children, disable, fallback }: AccessProps) {
  return <>{disable ? fallback : children}</>
}
export default Access
