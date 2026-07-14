import { useOutlet, useLocation } from 'react-router'
import { useState, useEffect, Activity } from 'react'

export function KeepAliveOutlet() {
  const outlet = useOutlet()
  const location = useLocation()

  const [pages, setPages] = useState<Record<string, React.ReactNode>>({})

  useEffect(() => {
    setPages((prev) => {
      if (prev[location.pathname]) {
        return prev
      }

      return {
        ...prev,
        [location.pathname]: outlet,
      }
    })
  }, [location.pathname, outlet])

  return (
    <>
      {Object.entries(pages).map(([path, element]) => (
        <Activity
          key={path}
          mode={path === location.pathname ? 'visible' : 'hidden'}
        >
          {element}
        </Activity>
      ))}
    </>
  )
}
