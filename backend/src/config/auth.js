import 'dotenv/config'
import jwt from 'jsonwebtoken'

// Browser Origin headers never include a path or trailing slash.
export const frontendOrigin = new URL(process.env.FRONTEND_ORIGIN || 'http://localhost:5173').origin
export const authCookieName = 'liftit_session'

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('Set JWT_SECRET to a random secret of at least 32 bytes in backend/.env')
  }
  return secret
}

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  // The hosted API and frontend are on different sites.
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
  maxAge: 0.1 * 60 * 1000,
}

export function setAuthCookie(res, user) {
  const token = jwt.sign({ email: user.email, id: user._id.toString() },
    getJwtSecret(), { expiresIn: '0.5h', algorithm: 'HS256' })
  res.cookie(authCookieName, token, authCookieOptions)
}
