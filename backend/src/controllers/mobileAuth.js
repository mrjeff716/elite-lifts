import { createHash, randomBytes } from 'node:crypto'
import LoginHandoff from '../models/LoginHandoff.js'
import User from '../models/User.js'
import { setAuthCookie } from '../config/auth.js'

// This must match the verified host/path in AndroidManifest.xml.
export const mobileReturnUrl = 'https://myelitelifts.vercel.app/open/'
export const isChallenge = value => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value)
export const hashCode = code => createHash('sha256').update(code).digest('hex')
export const challengeFor = verifier => createHash('sha256').update(verifier).digest('base64url')

export async function createLoginHandoff(userId, codeChallenge) {
  const code = randomBytes(32).toString('base64url')
  await LoginHandoff.create({
    codeHash: hashCode(code), codeChallenge, userId,
    expiresAt: new Date(Date.now() + 2 * 60 * 1000),
  })
  return code
}

export async function exchangeLoginHandoff(req, res, next) {
  res.set('Cache-Control', 'no-store')
  const { code, verifier } = req.body || {}
  if (!isChallenge(code) || typeof verifier !== 'string' || !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) {
    return res.status(400).json({ message: 'Invalid login handoff. Please sign in again.' })
  }
  try {
    // Atomic consumption: only one matching exchange can succeed. Checking expiry
    // here is essential because MongoDB's TTL cleanup runs asynchronously.
    const handoff = await LoginHandoff.findOneAndDelete({
      codeHash: hashCode(code), codeChallenge: challengeFor(verifier),
      expiresAt: { $gt: new Date() },
    })
    if (!handoff) return res.status(401).json({ message: 'Login expired or invalid. Please sign in again.' })
    const user = await User.findById(handoff.userId)
    if (!user) return res.status(401).json({ message: 'Account no longer available.' })
    // This response goes to the app's WebView, so its own cookie jar receives the session.
    setAuthCookie(res, user)
    return res.status(204).end()
  } catch (error) {
    next(error)
  }
}
