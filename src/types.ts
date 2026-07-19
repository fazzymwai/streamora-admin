import type { Timestamp } from 'firebase/firestore'

export const VIDEO_QUALITIES = ['480p', '720p', '1080p'] as const
export type VideoQuality = (typeof VIDEO_QUALITIES)[number]

// Shapes must match the mobile app's Firestore data model (root README).

export interface Movie {
  id: string
  title: string
  description: string
  categoryId: string
  releaseYear: number
  /** Minutes, as a number. */
  duration: number
  thumbnailUrl: string
  /** Quality → full URL or Storage object path; absent keys mean unavailable. */
  videoUrls: Partial<Record<VideoQuality, string>>
  /** Single mp4 URL; without it, offline download is unavailable. */
  downloadUrl?: string
  trailerUrl?: string
  isPremium: boolean
  /** serverTimestamp() on create, never rewritten — Trending orders by it. */
  createdAt: Timestamp | null
}

export interface Category {
  id: string
  name: string
}

export interface AppUser {
  id: string
  name: string
  email: string
  subscriptionStatus: 'free' | 'premium'
  profilePic?: string
  joinedAt: Timestamp | null
}
