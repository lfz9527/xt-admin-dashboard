import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'

import { EncryptionManager } from '@/utils/EncryptionManager'

import { logger } from './middleware/logger'

type State = {
  token: string | number
  account: string
  encryptedPassword: string
  remember: boolean
}

type Action = {
  setToken: (token: State['token']) => void
  saveCredentials: (account: string, password: string) => Promise<void>
  clearCredentials: () => void
  getCredentials: () => Promise<
    (Pick<State, 'account' | 'remember'> & { password: string }) | null
  >
}

// 前端演示应用使用固定密钥；真实认证场景不应在客户端持久化密码。
const encryptionManager = new EncryptionManager('xt-admin-dashboard-login-key')

const useAuthor = create<State & Action>()(
  logger(
    devtools(
      persist(
        (set, get) => ({
          token: '',
          account: '',
          encryptedPassword: '',
          remember: false,
          setToken: (token: State['token']) => {
            set({ token })
          },
          saveCredentials: async (account, password) => {
            const encryptedPassword = await encryptionManager.encrypt(password)
            set({ account, encryptedPassword, remember: true })
          },
          clearCredentials: () => {
            set({ account: '', encryptedPassword: '', remember: false })
          },
          getCredentials: async () => {
            const { account, encryptedPassword, remember } = get()
            if (!account || !encryptedPassword || !remember) {
              return null
            }

            try {
              return {
                account,
                password: await encryptionManager.decrypt(encryptedPassword),
                remember,
              }
            } catch {
              set({ account: '', encryptedPassword: '', remember: false })
              return null
            }
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
