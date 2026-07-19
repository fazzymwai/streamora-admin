import { Suspense } from 'react'
import MovieForm from '../../../views/MovieForm'

// Edit uses /movies/edit?id=… instead of a dynamic segment: static export
// can't prerender unknown movie ids, but query params work client-side.
export default function EditMoviePage() {
  return (
    <Suspense>
      <MovieForm />
    </Suspense>
  )
}
