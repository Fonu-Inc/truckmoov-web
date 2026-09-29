import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthSession, AuthUser } from '../auth'

type AuthStoreState = {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  setSession: (session: AuthSession) => void
  logout: () => void
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: (session) =>
        set({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          // POST /auth/refresh answers { accessToken, refreshToken, expiresIn } with no user —
          // keep the one from sign-in, or every refresh would sign the app out on next load.
          user: session.user ?? get().user,
        }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: 'truckmoov_auth' },
  ),
)
