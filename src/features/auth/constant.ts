export const MODE = {
  LOGIN: 'login',
  REGISTER: 'register',
  FORGOT_PASSWORD: 'forgot-password',
} as const

export type Mode = (typeof MODE)[keyof typeof MODE]
