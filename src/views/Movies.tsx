'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { deleteDoc, doc, getDocs, orderBy, query } from 'firebase/firestore'
import ConfirmDialog from '../components/ConfirmDialog'
import { categoriesCol, moviesCol } from '../db'
import { db } from '../firebase'
import { formatDate } from '../format'
import type { Category, Movie } from '../types'

export default function Movies() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [toDelete, setToDelete] = useState<Movie | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [movieSnap, catSnap] = await Promise.all([
        getDocs(query(moviesCol, orderBy('createdAt', 'desc'))),
        getDocs(categoriesCol),
      ])
      setMovies(movieSnap.docs.map((d) => d.data()))
      setCategories(catSnap.docs.map((d) => d.data()))
      setLoading(false)
    }
    load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : String(err))
      setLoading(false)
    })
  }, [])

  const categoryNames = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  )

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) {
      return movies
    }
    return movies.filter(
      (m) =>
        m.title.toLowerCase().includes(term) ||
        (categoryNames.get(m.categoryId) ?? '').toLowerCase().includes(term),
    )
  }, [movies, search, categoryNames])

  async function confirmDelete() {
    if (!toDelete) {
      return
    }
    setBusy(true)
    try {
      await deleteDoc(doc(db, 'movies', toDelete.id))
      setMovies((prev) => prev.filter((m) => m.id !== toDelete.id))
      setToDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>Movies</h1>
        <Link className="btn primary" href="/movies/new">
          New movie
        </Link>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <input
        className="search"
        type="search"
        placeholder="Search by title or category…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Year</th>
              <th>Duration</th>
              <th>Premium</th>
              <th>Added</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="title-cell">
                    {m.thumbnailUrl ? (
                      <img className="thumb" src={m.thumbnailUrl} alt="" />
                    ) : (
                      <div className="thumb placeholder" />
                    )}
                    {m.title}
                  </div>
                </td>
                <td>{categoryNames.get(m.categoryId) ?? m.categoryId}</td>
                <td>{m.releaseYear}</td>
                <td>{m.duration} min</td>
                <td>
                  {m.isPremium ? (
                    <span className="badge premium">premium</span>
                  ) : (
                    <span className="badge">free</span>
                  )}
                </td>
                <td>{formatDate(m.createdAt)}</td>
                <td className="row-actions">
                  <Link
                    className="btn small ghost"
                    href={`/movies/edit?id=${m.id}`}
                  >
                    Edit
                  </Link>
                  <button
                    className="btn small danger-ghost"
                    onClick={() => setToDelete(m)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!loading && visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted">
                  {search ? 'No movies match the search.' : 'No movies yet.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {toDelete ? (
        <ConfirmDialog
          title={`Delete “${toDelete.title}”?`}
          message="The movie is removed from the catalog immediately. Storage files and stale favorites/downloads references are not cleaned up here — that's a Cloud Function job."
          confirmLabel="Delete"
          danger
          busy={busy}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setToDelete(null)}
        />
      ) : null}
    </div>
  )
}
