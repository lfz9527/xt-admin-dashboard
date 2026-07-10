import { useProgress as useBpProgress } from '@bprogress/react'

import { useRef, useEffect } from 'react'
import { useNavigation } from 'react-router'

export function useProgress() {
  const show = useRef(false)
  const { state } = useNavigation()
  const { start, stop, setOptions } = useBpProgress()

  useEffect(() => {
    setOptions({
      showSpinner: false,
    })
  }, [])

  useEffect(() => {
    if (state === 'loading') {
      show.current = true
      start()
    }
    if (state === 'idle' && show.current) {
      show.current = false
      stop(100)
    }
  }, [state])
}
