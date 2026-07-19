'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import MediaUrlField from '../components/MediaUrlField'
import { categoriesCol } from '../db'
import { db } from '../firebase'
import {
  VIDEO_QUALITIES,
  type Category,
  type Movie,
  type VideoQuality,
} from '../types'

interface FormState {
  title: string
  description: string
  categoryId: string
  releaseYear: string
  duration: string
  thumbnailUrl: string
  videoUrls: Record<VideoQuality, string>
  downloadUrl: string
  trailerUrl: string
  isPremium: boolean
}

const emptyForm: FormState = {
  title: '',
  description: '',
  categoryId: '',
  releaseYear: '',
  duration: '',
  thumbnailUrl: '',
  videoUrls: { '480p': '', '720p': '', '1080p': '' },
  downloadUrl: '',
  trailerUrl: '',
  isPremium: false,
}

export default function MovieForm() {
  const id = useSearchParams().get('id') ?? undefined
  const isNew = id === undefined
  const router = useRouter()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getDocs(query(categoriesCol, orderBy('name')))
      .then((snap) => setCategories(snap.docs.map((d) => d.data())))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err)),
      )
  }, [])

  useEffect(() => {
    if (id === undefined) {
      return
    }
    getDoc(doc(db, 'movies', id))
      .then((snap) => {
        if (!snap.exists()) {
          setError('Movie not found.')
          setLoading(false)
          return
        }
        const m = snap.data() as Omit<Movie, 'id'>
        setForm({
          title: m.title,
          description: m.description,
          categoryId: m.categoryId,
          releaseYear: String(m.releaseYear),
          duration: String(m.duration),
          thumbnailUrl: m.thumbnailUrl,
          videoUrls: {
            '480p': m.videoUrls['480p'] ?? '',
            '720p': m.videoUrls['720p'] ?? '',
            '1080p': m.videoUrls['1080p'] ?? '',
          },
          downloadUrl: m.downloadUrl ?? '',
          trailerUrl: m.trailerUrl ?? '',
          isPremium: m.isPremium,
        })
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      })
  }, [id])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function setVideoUrl(quality: VideoQuality, value: string) {
    setForm((f) => ({ ...f, videoUrls: { ...f.videoUrls, [quality]: value } }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const videoUrls: Partial<Record<VideoQuality, string>> = {}
      for (const quality of VIDEO_QUALITIES) {
        const url = form.videoUrls[quality].trim()
        if (url) {
          videoUrls[quality] = url
        }
      }
      const base = {
        title: form.title.trim(),
        description: form.description.trim(),
        categoryId: form.categoryId,
        releaseYear: Number(form.releaseYear),
        duration: Number(form.duration),
        thumbnailUrl: form.thumbnailUrl.trim(),
        videoUrls,
        isPremium: form.isPremium,
      }
      const downloadUrl = form.downloadUrl.trim()
      const trailerUrl = form.trailerUrl.trim()
      if (id === undefined) {
        // createdAt is written exactly once, here — the mobile app's Trending
        // row orders by it and sendNewMovieNotification fires on create.
        await addDoc(collection(db, 'movies'), {
          ...base,
          ...(downloadUrl ? { downloadUrl } : {}),
          ...(trailerUrl ? { trailerUrl } : {}),
          createdAt: serverTimestamp(),
        })
      } else {
        await updateDoc(doc(db, 'movies', id), {
          ...base,
          downloadUrl: downloadUrl || deleteField(),
          trailerUrl: trailerUrl || deleteField(),
        })
      }
      router.push('/movies')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="page muted">Loading…</div>
  }

  return (
    <div className="page narrow">
      <div className="page-head">
        <h1>{isNew ? 'New movie' : 'Edit movie'}</h1>
        <Link className="btn ghost" href="/movies">
          Back to movies
        </Link>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <form className="card stack form" onSubmit={(e) => void onSubmit(e)}>
        <label className="field">
          <span className="field-label">Title</span>
          <input
            value={form.title}
            required
            onChange={(e) => set('title', e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Description</span>
          <textarea
            value={form.description}
            required
            rows={4}
            onChange={(e) => set('description', e.target.value)}
          />
        </label>
        <div className="field-row">
          <label className="field">
            <span className="field-label">Category</span>
            <select
              value={form.categoryId}
              required
              onChange={(e) => set('categoryId', e.target.value)}
            >
              <option value="" disabled>
                Select a category…
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Release year</span>
            <input
              type="number"
              min={1900}
              max={2100}
              value={form.releaseYear}
              required
              onChange={(e) => set('releaseYear', e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Duration (minutes)</span>
            <input
              type="number"
              min={1}
              value={form.duration}
              required
              onChange={(e) => set('duration', e.target.value)}
            />
          </label>
        </div>

        <MediaUrlField
          label="Thumbnail URL"
          value={form.thumbnailUrl}
          required
          placeholder="https://…/poster.jpg"
          onChange={(v) => set('thumbnailUrl', v)}
        />
        {VIDEO_QUALITIES.map((quality) => (
          <MediaUrlField
            key={quality}
            label={`Video URL (${quality})`}
            value={form.videoUrls[quality]}
            placeholder={`https://cdn…/${quality}.m3u8 or videos/{movieId}/${quality}.m3u8`}
            hint={
              quality === '480p'
                ? 'Full CDN URL or a Storage object path — secureVideoAccess handles both. Leave blank if unavailable.'
                : undefined
            }
            onChange={(v) => setVideoUrl(quality, v)}
          />
        ))}
        <MediaUrlField
          label="Download URL (single mp4)"
          value={form.downloadUrl}
          placeholder="https://…/movie.mp4"
          hint="Optional. Without it, offline download is unavailable for this title."
          onChange={(v) => set('downloadUrl', v)}
        />
        <MediaUrlField
          label="Trailer URL"
          value={form.trailerUrl}
          placeholder="https://…/trailer.mp4"
          hint="Optional."
          onChange={(v) => set('trailerUrl', v)}
        />

        <label className="check">
          <input
            type="checkbox"
            checked={form.isPremium}
            onChange={(e) => set('isPremium', e.target.checked)}
          />
          <span>Premium title (requires a premium subscription to watch)</span>
        </label>

        <div className="form-actions">
          <button className="btn primary" type="submit" disabled={busy}>
            {isNew ? 'Create movie' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
