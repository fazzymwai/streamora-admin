import { Suspense } from 'react'
import MovieForm from '../../../views/MovieForm'

// MovieForm reads useSearchParams, which static export requires to sit under
// a Suspense boundary.
export default function NewMoviePage() {
  return (
    <Suspense>
      <MovieForm />
    </Suspense>
  )
}
