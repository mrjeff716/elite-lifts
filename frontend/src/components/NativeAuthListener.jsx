import { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { AuthContext } from '../context/AuthContext'
import { googleHandoff } from '../utils/nativeGoogleAuth'
import { parseGoogleReturn } from '../utils/googleHandoff'

export default function NativeAuthListener() {
  const { refreshUser } = useContext(AuthContext)
  const navigate = useNavigate()
  const navigateRef = useRef(navigate)
  const [busy, setBusy] = useState(false)
  useEffect(() => { navigateRef.current = navigate }, [navigate])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let disposed = false
    let listener
    async function receive({ url }) {
      if (disposed || !parseGoogleReturn(url)) return
      setBusy(true)
      try {
        const result = await googleHandoff.finish(url)
        if (disposed || !result) return
        if (result.error) return navigateRef.current(`/auth?error=${result.error}`, { replace: true })
        if (result.authenticated) {
          const user = await refreshUser()
          if (disposed) return
          if (!user) return navigateRef.current('/auth?error=google_handoff_failed', { replace: true })
        }
        navigateRef.current('/', { replace: true })
      } catch {
        if (!disposed) navigateRef.current('/auth?error=google_handoff_failed', { replace: true })
      } finally {
        if (!disposed) setBusy(false)
      }
    }
    async function subscribe() {
      listener = await App.addListener('appUrlOpen', receive)
      if (disposed) { await listener.remove(); return }
      const launch = await App.getLaunchUrl()
      if (launch) await receive(launch)
    }
    subscribe().catch(() => {
      if (!disposed) navigateRef.current('/auth?error=google_handoff_failed', { replace: true })
    })
    return () => { disposed = true; void listener?.remove() }
  }, [refreshUser])

  return busy ? <div role="status" aria-live="polite" className="fixed inset-0 z-50 flex items-center justify-center bg-background text-text">Finishing Google sign-in…</div> : null
}
