'use client'

import { signOut, useAuth } from '../auth/context'

export default function AccessDenied() {
  const { user } = useAuth()

  return (
    <div className="screen-center">
      <div className="card auth-card">
        <h1>Access denied</h1>
        <p className="muted">
          {user?.email ?? 'This account'} is signed in but doesn&apos;t have
          the admin role. Ask an existing admin to grant it, then sign in again
          to refresh your token.
        </p>
        <button className="btn primary" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    </div>
  )
}
