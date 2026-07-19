'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import ConfirmDialog from '../components/ConfirmDialog'
import { categoriesCol, moviesCol } from '../db'
import { db } from '../firebase'
import type { Category } from '../types'

interface PendingDelete {
  category: Category
  movieCount: number
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState<Category | null>(null)
  const [toDelete, setToDelete] = useState<PendingDelete | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getDocs(query(categoriesCol, orderBy('name')))
      .then((snap) => setCategories(snap.docs.map((d) => d.data())))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err)),
      )
  }, [])

  async function addCategory(e: FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) {
      return
    }
    setBusy(true)
    setError('')
    try {
      const ref = await addDoc(collection(db, 'categories'), { name })
      setCategories((prev) =>
        [...prev, { id: ref.id, name }].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      )
      setNewName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function saveRename() {
    if (!editing) {
      return
    }
    const name = editing.name.trim()
    if (!name) {
      return
    }
    setBusy(true)
    setError('')
    try {
      await updateDoc(doc(db, 'categories', editing.id), { name })
      setCategories((prev) =>
        prev
          .map((c) => (c.id === editing.id ? { ...c, name } : c))
          .sort((a, b) => a.name.localeCompare(b.name)),
      )
      setEditing(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function requestDelete(category: Category) {
    setError('')
    try {
      const snap = await getCountFromServer(
        query(moviesCol, where('categoryId', '==', category.id)),
      )
      setToDelete({ category, movieCount: snap.data().count })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function confirmDelete() {
    if (!toDelete) {
      return
    }
    setBusy(true)
    try {
      await deleteDoc(doc(db, 'categories', toDelete.category.id))
      setCategories((prev) =>
        prev.filter((c) => c.id !== toDelete.category.id),
      )
      setToDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page narrow">
      <h1>Categories</h1>
      {error ? <p className="error">{error}</p> : null}

      <form className="add-row" onSubmit={(e) => void addCategory(e)}>
        <input
          placeholder="New category name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="btn primary" type="submit" disabled={busy}>
          Add
        </button>
      </form>

      <div className="card table-card">
        <table>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>
                  {editing?.id === c.id ? (
                    <input
                      value={editing.name}
                      autoFocus
                      onChange={(e) =>
                        setEditing({ id: c.id, name: e.target.value })
                      }
                    />
                  ) : (
                    c.name
                  )}
                </td>
                <td className="row-actions">
                  {editing?.id === c.id ? (
                    <>
                      <button
                        className="btn small primary"
                        disabled={busy}
                        onClick={() => void saveRename()}
                      >
                        Save
                      </button>
                      <button
                        className="btn small ghost"
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn small ghost"
                        onClick={() => setEditing({ id: c.id, name: c.name })}
                      >
                        Rename
                      </button>
                      <button
                        className="btn small danger-ghost"
                        onClick={() => void requestDelete(c)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {categories.length === 0 ? (
              <tr>
                <td className="muted">No categories yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {toDelete ? (
        <ConfirmDialog
          title={`Delete “${toDelete.category.name}”?`}
          message={
            toDelete.movieCount > 0
              ? `${toDelete.movieCount} movie${toDelete.movieCount === 1 ? ' still references' : 's still reference'} this category — its row will disappear in the app and those movies will keep a dangling categoryId. Reassign them first, or delete anyway.`
              : 'No movies reference this category. It will be removed immediately.'
          }
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
