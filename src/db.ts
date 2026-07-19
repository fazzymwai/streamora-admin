import {
  collection,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'
import type { AppUser, Category, Movie } from './types'

function converterFor<T extends { id: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore: (value) => {
      const data = { ...(value as T) } as Record<string, unknown>
      delete data.id
      return data
    },
    fromFirestore: (snap: QueryDocumentSnapshot) =>
      ({ id: snap.id, ...snap.data() }) as T,
  }
}

export const moviesCol = collection(db, 'movies').withConverter(
  converterFor<Movie>(),
)
export const categoriesCol = collection(db, 'categories').withConverter(
  converterFor<Category>(),
)
export const usersCol = collection(db, 'users').withConverter(
  converterFor<AppUser>(),
)
