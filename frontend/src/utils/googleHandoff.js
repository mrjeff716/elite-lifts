export const mobileReturnOrigin = 'https://myelitelifts.vercel.app'
const storageKey = 'elitelifts.googleLogin'
const tokenPattern = /^[A-Za-z0-9_-]{43}$/
const errors = new Set(['google_failed', 'google_cancelled', 'google_email_missing', 'account_exists'])
const base64url = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export function parseGoogleReturn(value) {
  try {
    const url = new URL(value)
    const httpsLink = url.origin === mobileReturnOrigin && ['/open', '/open/'].includes(url.pathname)
    const schemeLink = url.protocol === 'elitelifts:' && url.hostname === 'open' && ['', '/'].includes(url.pathname)
    if ((!httpsLink && !schemeLink) || url.username || url.password || url.port) return null
    return { code: url.searchParams.get('code'), state: url.searchParams.get('state'), error: url.searchParams.get('error') }
  } catch {
    return null
  }
}

// Dependencies are explicit so the security rules can be tested without a device.
export function createGoogleHandoff({ storage, cryptoApi, exchange }) {
  const exchanges = new Map()
  const clearAttempt = state => {
    try {
      if (JSON.parse(storage.getItem(storageKey))?.state === state) storage.removeItem(storageKey)
    } catch { storage.removeItem(storageKey) }
  }
  return {
    async start() {
      const verifier = base64url(cryptoApi.getRandomValues(new Uint8Array(32)))
      const state = base64url(cryptoApi.getRandomValues(new Uint8Array(32)))
      const hash = await cryptoApi.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
      storage.setItem(storageKey, JSON.stringify({ verifier, state, expiresAt: Date.now() + 10 * 60 * 1000 }))
      return new URLSearchParams({ platform: 'mobile', code_challenge: base64url(new Uint8Array(hash)), app_state: state })
    },
    cancel: clearAttempt,
    finish(value) {
      const returned = parseGoogleReturn(value)
      if (!returned) return Promise.resolve(null)
      const { code, state, error } = returned
      if (!code && !state && !error) return Promise.resolve({ home: true })
      if (!tokenPattern.test(state || '')) return Promise.resolve(null)
      const key = `${state}:${code || error}`
      if (exchanges.has(key)) return exchanges.get(key)
      let pending
      try { pending = JSON.parse(storage.getItem(storageKey)) } catch { return Promise.resolve(null) }
      // Ignore links from other devices/login attempts, without destroying the current attempt.
      if (!pending || pending.state !== state) return Promise.resolve(null)
      if (pending.expiresAt <= Date.now()) {
        clearAttempt(state)
        return Promise.resolve({ error: 'google_handoff_failed' })
      }
      if (error) {
        clearAttempt(state)
        return Promise.resolve({ error: errors.has(error) ? error : 'google_failed' })
      }
      if (!tokenPattern.test(code || '')) return Promise.resolve(null)
      const result = (async () => {
        try {
          await exchange({ code, verifier: pending.verifier })
          return { authenticated: true }
        } catch {
          return { error: 'google_handoff_failed' }
        } finally {
          clearAttempt(state)
        }
      })()
      exchanges.set(key, result)
      if (exchanges.size > 10) exchanges.delete(exchanges.keys().next().value)
      return result
    },
  }
}
