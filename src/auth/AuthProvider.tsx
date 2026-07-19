'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { onIdTokenChanged } from 'firebase/auth'
import { auth } from '../firebase'
import { AuthContext, type AuthState } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    loading: true,
  })

  useEffect(
    () =>
      onIdTokenChanged(auth, (user) => {
        if (!user) {
          setState({ user: null, isAdmin: false, loading: false })
          return
        }
        void user.getIdTokenResult().then((token) => {
          setState({ user, isAdmin: token.claims.admin === true, loading: false })
        })
      }),
    [],
  )

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}
