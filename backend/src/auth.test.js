import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-bytes-long'
const { default: isAuth } = await import('./middleware/isAuth.js')
const { default: checkOrigin } = await import('./middleware/checkOrigin.js')
const { frontendOrigin, authCookieName } = await import('./config/auth.js')
const { postLogin } = await import('./controllers/authControllers.js')
const { default: User } = await import('./models/User.js')

test('login cookie, authenticated requests, expiry, and origin protection', async () => {
  const password = await bcrypt.hash('test-password', 4)
  const originalFind = User.findOne
  User.findOne = async () => ({
    email: 'test@example.com', _id: 'test-user', password,
    toObject: () => ({ _id: 'test-user', email: 'test@example.com', password }),
  })
  const app = express()
  app.use(express.json(), cookieParser(), checkOrigin)
  app.post('/login', postLogin)
  app.get('/private', isAuth, (req, res) => res.json({ id: req.userId }))
  app.post('/private', isAuth, (req, res) => res.sendStatus(204))
  app.use((err, req, res, next) => res.status(err.statusCode || 500).json({ message: err.message }))
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  try {
    const login = await fetch(base + '/login', {
      method: 'POST', headers: { Origin: frontendOrigin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'test-password' }),
    })
    assert.equal(login.status, 200)
    const body = await login.json()
    assert.equal(body.token, undefined)
    assert.equal(body.user.password, undefined)
    const cookie = login.headers.get('set-cookie')
    assert.match(cookie, /HttpOnly/)
    assert.match(cookie, process.env.NODE_ENV === 'production' ? /SameSite=None/ : /SameSite=Lax/)
    assert.match(cookie, /Max-Age=3600/)
    if (process.env.NODE_ENV === 'production') assert.match(cookie, /Secure/)
    const headers = { Cookie: cookie.split(';')[0] }
    assert.equal((await fetch(base + '/private', { headers })).status, 200)
    assert.equal((await fetch(base + '/private')).status, 401)
    for (const token of ['invalid', jwt.sign({ id: 'test-user' }, process.env.JWT_SECRET, { expiresIn: -1 })]) {
      assert.equal((await fetch(base + '/private', { headers: { Cookie: `${authCookieName}=${token}` } })).status, 401)
    }
    for (const Origin of ['https://attacker.example', undefined]) {
      assert.equal((await fetch(base + '/private', { method: 'POST', headers: { ...headers, ...(Origin ? { Origin } : {}) } })).status, 403)
    }
    assert.equal((await fetch(base + '/private', { method: 'POST', headers: { ...headers, Origin: frontendOrigin } })).status, 204)
  } finally {
    User.findOne = originalFind
    await new Promise(resolve => server.close(resolve))
  }
})
