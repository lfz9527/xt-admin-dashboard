type LoginCaptchaProps = {
  image: string
  onRefresh: () => void
}

export default function LoginCaptcha({ image, onRefresh }: LoginCaptchaProps) {
  return (
    <button
      type='button'
      title='点击刷新验证码'
      onClick={onRefresh}
      className='border-border flex h-10 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border'
    >
      {image ? (
        <img
          src={image}
          alt='图形验证码'
          className='h-full w-full object-cover'
        />
      ) : (
        <span className='text-muted-foreground text-xs'>加载中</span>
      )}
    </button>
  )
}
