import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, ArrowUpRight, Dumbbell, Play, Target } from 'lucide-react'
import axios from '../api'
import Loader from '../components/Loader'

const formatValue = (value) => value ? value.replace(/_/g, ' ') : 'Not specified'
const imageUrl = (path) => new URL(path, axios.defaults.baseURL).href

const ExerciseDetails = () => {
  const [exercise, setExercise] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [failedImages, setFailedImages] = useState([])
  const { exerciseId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setErrorMessage('')
    setExercise(null)
    setActiveImage(0)
    setFailedImages([])
    async function getExercise() {
      try {
        const res = await axios.get(`/api/exercise/${exerciseId}`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        })
        setExercise(res.data[0])
      } catch (error) {
        if (controller.signal.aborted) return
        if (error.response?.status === 401) {
          navigate('/auth', { replace: true })
          return
        }
        setErrorMessage('Unable to load this exercise. Please try again.')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    getExercise()
    return () => controller.abort()
  }, [exerciseId, navigate])

  if (isLoading) return <Loader />

  const backLink = (
    <Link to="/exercises" className="inline-flex items-center gap-2 rounded-lg py-2 text-sm font-medium text-muted transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <ArrowLeft size={18} aria-hidden="true" /> Back to exercises
    </Link>
  )

  if (errorMessage || !exercise) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        {backLink}
        <div role="alert" className="mt-6 rounded-2xl border border-border/10 bg-card p-8 text-text">
          <h1 className="text-xl font-semibold">Exercise unavailable</h1>
          <p className="mt-2 text-muted">{errorMessage || 'This exercise could not be found.'}</p>
        </div>
      </main>
    )
  }

  const images = (exercise.imageUrls || []).filter(Boolean)
  const instructions = exercise.instructions || []
  const details = [
    ['Equipment', exercise.equipment],
    ['Category', exercise.category],
    ['Level', exercise.level],
    ['Mechanic', exercise.mechanic],
    ['Force', exercise.force],
  ]
  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.name} exercise tutorial`)}`

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-16 pt-6 text-text sm:px-8 sm:pt-8">
      {backLink}
      <header className="mb-7 mt-6 sm:mb-9">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Exercise guide</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{exercise.name}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          {[exercise.level, exercise.category].filter(Boolean).map((value, index) => (
            <span key={`${value}-${index}`} className="rounded-full border border-border/10 bg-card px-3 py-1 text-xs font-medium capitalize text-gray-300">{formatValue(value)}</span>
          ))}
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-8">
        <section aria-label="Exercise demonstration" className="min-w-0 overflow-hidden rounded-2xl border border-border/10 bg-card">
          <div className="flex aspect-square max-h-[560px] w-full items-center justify-center bg-white sm:aspect-[4/3]">
            {images[activeImage] && !failedImages.includes(activeImage) ? (
              <img
                key={images[activeImage]}
                src={imageUrl(images[activeImage])}
                alt={`${exercise.name}, demonstration ${activeImage + 1}`}
                onError={() => setFailedImages((previous) => [...previous, activeImage])}
                className="block h-full w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 p-6 text-gray-500">
                <Dumbbell size={36} aria-hidden="true" />
                <p className="text-sm">Image unavailable</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5">
            <p className="text-sm text-muted">Exercise demonstration</p>
            {images.length > 1 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Choose demonstration image">
                {images.map((path, index) => (
                  <button
                    key={`${path}-${index}`}
                    type="button"
                    aria-label={`Show demonstration ${index + 1}`}
                    aria-pressed={activeImage === index}
                    onClick={() => setActiveImage(index)}
                    className={`min-h-11 min-w-11 rounded-lg px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card ${activeImage === index ? 'bg-primary text-white' : 'bg-background text-muted hover:text-text'}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-border/10 bg-card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Dumbbell size={20} className="text-primary" aria-hidden="true" /> At a glance</h2>
            <dl className="mt-4 divide-y divide-border/10">
              {details.map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-right font-medium capitalize">{formatValue(value)}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="rounded-2xl border border-border/10 bg-card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Target size={20} className="text-primary" aria-hidden="true" /> Muscles worked</h2>
            {[
              ['Primary', exercise.primaryMuscles, 'bg-primary/15 text-blue-300'],
              ['Secondary', exercise.secondaryMuscles, 'bg-background text-gray-300'],
            ].map(([label, muscles, colors]) => (
              <div key={label} className="mt-4">
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">{label}</h3>
                <div className="flex flex-wrap gap-2">
                  {muscles?.length ? muscles.map((muscle) => (
                    <span key={muscle} className={`rounded-lg px-3 py-1.5 text-sm capitalize ${colors}`}>{formatValue(muscle)}</span>
                  )) : <p className="text-sm text-muted">None listed</p>}
                </div>
              </div>
            ))}
          </section>
          <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primaryHover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <Play size={17} aria-hidden="true" /> Find a video tutorial <ArrowUpRight size={17} aria-hidden="true" />
            <span className="sr-only">on YouTube (opens in a new tab)</span>
          </a>
        </aside>
      </div>

      <section className="mt-8 rounded-2xl border border-border/10 bg-card p-5 sm:p-8" aria-labelledby="instructions-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="instructions-heading" className="text-xl font-semibold">How to perform</h2>
          {instructions.length > 0 && <span className="text-sm text-muted">{instructions.length} steps</span>}
        </div>
        {instructions.length ? (
          <ol className="mt-6 space-y-6">
            {instructions.map((instruction, index) => (
              <li key={index} className="flex gap-4 sm:gap-5">
                <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-blue-300">{index + 1}</span>
                <p className="max-w-3xl pt-0.5 text-base leading-7 text-gray-300">{instruction}</p>
              </li>
            ))}
          </ol>
        ) : <p className="mt-4 text-sm text-muted">No instructions have been added for this exercise.</p>}
      </section>
    </main>
  )
}

export default ExerciseDetails
