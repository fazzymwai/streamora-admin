'use client'

import { useEffect, useState } from 'react'
import { getDocs, orderBy, query } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { usersCol } from '../db'
import { functions } from '../firebase'
import { formatDate } from '../format'
import type { AppUser } from '../types'

// Firestore rules forbid every client — admins included — from writing
// subscriptionStatus, so the toggle goes through the admin-only
// setSubscriptionStatus callable. Flip this to true once Cloud Functions are
// deployed on the project; the wiring below already works.
const SUBSCRIPTION_FUNCTION_DEPLOYED = false

const setSubscriptionStatus = httpsCallable<
  { userId: string; status: 'free' | 'premium' },
  { ok: boolean }
>(functions, 'setSubscriptionStatus')

export default function Users() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getDocs(query(usersCol, orderBy('joinedAt', 'desc')))
      .then((snap) => setUsers(snap.docs.map((d) => d.data())))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err)),
      )
  }, [])

  async function togglePremium(user: AppUser) {
    const status = user.subscriptionStatus === 'premium' ? 'free' : 'premium'
    setBusyId(user.id)
    setError('')
    try {
      await setSubscriptionStatus({ userId: user.id, status })
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, subscriptionStatus: status } : u,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page">
      <h1>Users</h1>
      {error ? <p className="error">{error}</p> : null}
      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Joined</th>
              <th>Premium</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name || '—'}</td>
                <td>{u.email}</td>
                <td>
                  <span
                    className={
                      u.subscriptionStatus === 'premium'
                        ? 'badge premium'
                        : 'badge'
                    }
                  >
                    {u.subscriptionStatus}
                  </span>
                </td>
                <td>{formatDate(u.joinedAt)}</td>
                <td>
                  <button
                    className={
                      u.subscriptionStatus === 'premium'
                        ? 'toggle on'
                        : 'toggle'
                    }
                    role="switch"
                    aria-checked={u.subscriptionStatus === 'premium'}
                    disabled={!SUBSCRIPTION_FUNCTION_DEPLOYED || busyId === u.id}
                    title={
                      SUBSCRIPTION_FUNCTION_DEPLOYED
                        ? 'Toggle premium'
                        : 'Disabled until Cloud Functions are deployed — subscription changes go through the setSubscriptionStatus callable.'
                    }
                    onClick={() => void togglePremium(u)}
                  >
                    <span className="knob" />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && !error ? (
              <tr>
                <td colSpan={5} className="muted">
                  No users yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
