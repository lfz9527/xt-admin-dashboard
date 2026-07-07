import { logger } from './middleware/logger'
import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'

type State = {
  token: string | number
}

type Action = {
  setToken: (token: State['token']) => void
}

const useAuthor = create<State & Action>()(
  logger(
    devtools(
      persist(
        (set) => ({
          token: '',
          setToken: (token: State['token']) => {
            set({ token })
          },
        }),
        {
          name: 'app-author',
          storage: createJSONStorage(() => sessionStorage),
        }
      )
    ),
    'useAuthor'
  )
)

export default useAuthor
