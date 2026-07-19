'use client'

import { useEffect, useState } from 'react'
import {
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
} from 'firebase/firestore'
import { categoriesCol, moviesCol, usersCol } from '../db'
import { formatDate } from '../format'
import type { AppUser } from '../types'

interface Counts {
  movies: number
  categories: number
  users: number
}

export default function Dashboard() {
  const [counts, setCounts] = useState<Counts | null>(null)
  const [recent, setRecent] = useState<AppUser[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [movies, categories, users, recentSnap] = await Promise.all([
        getCountFromServer(moviesCol),
        getCountFromServer(categoriesCol),
        getCountFromServer(usersCol),
        getDocs(query(usersCol, orderBy('joinedAt', 'desc'), limit(10))),
      ])
      setCounts({
        movies: movies.data().count,
        categories: categories.data().count,
        users: users.data().count,
      })
      setRecent(recentSnap.docs.map((d) => d.data()))
    }
    load().catch((err: unknown) =>
      setError(err instanceof Error ? err.message : String(err)),
    )
  }, [])

  return (
    <div className="page">
      <h1>Dashboard</h1>
      {error ? <p className="error">{error}</p> : null}
      <div className="stat-grid">
        <div className="card stat">
          <div className="stat-value">{counts ? counts.movies : '—'}</div>
          <div className="stat-label">Movies</div>
        </div>
        <div className="card stat">
          <div className="stat-value">{counts ? counts.categories : '—'}</div>
          <div className="stat-label">Categories</div>
        </div>
        <div className="card stat">
          <div className="stat-value">{counts ? counts.users : '—'}</div>
          <div className="stat-label">Users</div>
        </div>
      </div>

      <h2>Recent signups</h2>
      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((u) => (
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
              </tr>
            ))}
            {recent.length === 0 && !error ? (
              <tr>
                <td colSpan={4} className="muted">
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
