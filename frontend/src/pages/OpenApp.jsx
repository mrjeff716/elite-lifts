import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { parseGoogleReturn } from '../utils/googleHandoff'

export default function OpenApp() {
  const [appUrl] = useState(() => {
    const returned = parseGoogleReturn(window.location.href)
    const target = new URL('elitelifts://open/')
    if (returned) {
      for (const key of ['code', 'state', 'error']) {
        if (returned[key]) target.searchParams.set(key, returned[key])
      }
    }
    return target.href
  })
  useEffect(() => {
    // Remove the one-use code from the browser address/history after capturing it.
    window.history.replaceState(window.history.state, '', '/open/')
  }, [])
  return <main className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center text-text">
    <h1 className="text-2xl font-bold">Return to Elite Lifts</h1>
    <p>Tap below to finish signing in to the app where you started. If the login has expired, start again in the app.</p>
    <a href={appUrl} rel="noreferrer" className="rounded-xl bg-primary px-6 py-3 text-white">Open Elite Lifts</a>
    <Link to="/auth" className="text-muted underline">Continue on the website</Link>
  </main>
}
