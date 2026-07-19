'use client'

import type { ReactNode } from 'react'
import { useAuth } from '../auth/context'
import AccessDenied from '../views/AccessDenied'
import Login from '../views/Login'
import Layout from './Layout'

// Every route is admin-only: no session → login, no admin claim → denied.
// The claim check here is UX; Firestore rules are the real boundary.
export default function AdminGate({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAuth()

  if (loading) {
    return <div className="screen-center muted">Loading…</div>
  }
  if (!user) {
    return <Login />
  }
  if (!isAdmin) {
    return <AccessDenied />
  }
  return <Layout>{children}</Layout>
}
