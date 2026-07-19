'use client'

import { createContext, useContext } from 'react'
import { signOut as firebaseSignOut, type User } from 'firebase/auth'
import { auth } from '../firebase'

export interface AuthState {
  user: User | null
  isAdmin: boolean
  loading: boolean
}

export const AuthContext = createContext<AuthState>({
  user: null,
  isAdmin: false,
  loading: true,
})

export function useAuth(): AuthState {
  return useContext(AuthContext)
}

export function signOut(): Promise<void> {
  return firebaseSignOut(auth)
}
