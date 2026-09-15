import { frontendOrigin } from '../config/auth.js'

// Cookies are automatic: reject writes from other sites, including login CSRF.
export default function checkOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  if (req.get('Origin') !== frontendOrigin || 'https://www.myelitelifts.vercel.app') {
    return res.status(403).json({ message: 'Request origin is not allowed' })
  }
  next()
}
