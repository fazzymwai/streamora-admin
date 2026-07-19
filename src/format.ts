import type { Timestamp } from 'firebase/firestore'

export function formatDate(ts: Timestamp | null | undefined): string {
  if (!ts) return '—'
  return ts.toDate().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
