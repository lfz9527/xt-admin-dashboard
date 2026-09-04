import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/utils/common'

interface UploadThingAvatarProps {
  value?: string
  onChange?: (url: string) => void
  onUpload?: (file: File) => Promise<string>
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fallback?: string
  className?: string
  disabled?: boolean
}

const SIZE_CLASSES = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-40 h-40',
}

const ICON_SIZES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-10 h-10',
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z' />
      <circle
        cx='12'
        cy='13'
        r='3'
      />
    </svg>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' />
      <circle
        cx='12'
        cy='7'
        r='4'
      />
    </svg>
  )
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      viewBox='0 0 24 24'
      fill='none'
    >
      <circle
        className='opacity-25'
        cx='12'
        cy='12'
        r='10'
        stroke='currentColor'
        strokeWidth='4'
      />
      <path
        className='opacity-75'
        fill='currentColor'
        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
      />
    </svg>
  )
}

export function UploadThingAvatar({
  value,
  onChange,
  onUpload,
  size = 'lg',
  fallback,
  className,
  disabled = false,
}: UploadThingAvatarProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 预览地址是 blob: 对象 URL，用完必须 revoke，否则 File 数据一直滞留内存
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }

      setError(null)
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(file)
      })

      if (onUpload) {
        try {
          setIsUploading(true)
          const url = await onUpload(file)
          onChange?.(url)
          // 上传成功后组件改用远程 value 展示，本地预览即可释放
          setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev)
            return null
          })
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Upload failed')
        } finally {
          setIsUploading(false)
        }
      }

      e.target.value = ''
    },
    [onChange, onUpload]
  )

  // 上传失败时保留预览（此时已随上面 setPreviewUrl 更新），无需额外处理
  const displayUrl = previewUrl || value

  return (
    <div
      data-slot='uploadthing-avatar'
      className={cn('relative inline-block', className)}
    >
      <div
        className={cn(
          'bg-muted border-border relative overflow-hidden rounded-full border-2',
          'transition-all duration-200',
          !disabled && 'hover:border-primary/50 cursor-pointer',
          disabled && 'cursor-not-allowed opacity-50',
          SIZE_CLASSES[size]
        )}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt='Avatar'
            className='h-full w-full object-cover'
          />
        ) : (
          <div className='bg-muted flex h-full w-full items-center justify-center'>
            {fallback ? (
              <span className='text-muted-foreground text-2xl font-medium'>
                {fallback}
              </span>
            ) : (
              <UserIcon
                className={cn('text-muted-foreground', ICON_SIZES[size])}
              />
            )}
          </div>
        )}

        {isUploading && (
          <div className='bg-background/80 absolute inset-0 flex items-center justify-center'>
            <LoadingSpinner className={ICON_SIZES[size]} />
          </div>
        )}

        {!disabled && !isUploading && (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center bg-black/50',
              'opacity-0 transition-opacity hover:opacity-100'
            )}
          >
            <CameraIcon className={cn('text-white', ICON_SIZES[size])} />
          </div>
        )}

        <input
          type='file'
          accept='image/*'
          onChange={handleFileChange}
          disabled={disabled || isUploading}
          className='absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed'
          aria-label='Upload avatar'
        />
      </div>

      {error && (
        <p className='text-destructive mt-2 text-center text-xs'>{error}</p>
      )}
    </div>
  )
}
