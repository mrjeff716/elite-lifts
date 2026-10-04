import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import { randomBytes } from 'node:crypto'

process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-bytes-long'
const { startGoogleLogin, validateGoogleState, googleCallback } = await import('./controllers/googleAuth.js')
const { exchangeLoginHandoff, createLoginHandoff, challengeFor, hashCode } = await import('./controllers/mobileAuth.js')
const { default: LoginHandoff } = await import('./models/LoginHandoff.js')
const { default: User } = await import('./models/User.js')
const { default: isAuth } = await import('./middleware/isAuth.js')
const { default: checkOrigin } = await import('./middleware/checkOrigin.js')

test('native handoff binds the app, expires, rejects replay and issues an app cookie', async () => {
  const records = new Map()
  const user = { _id: '507f1f77bcf86cd799439011', email: 'native@example.com' }
  const original = { create: LoginHandoff.create, consume: LoginHandoff.findOneAndDelete, user: User.findById }
  LoginHandoff.create = async record => { records.set(record.codeHash, record); return record }
  LoginHandoff.findOneAndDelete = async query => {
    const record = records.get(query.codeHash)
    if (!record || record.codeChallenge !== query.codeChallenge || record.expiresAt <= query.expiresAt.$gt) return null
    records.delete(query.codeHash)
    return record
  }
  User.findById = async () => user
  const passport = {
    authenticate: (name, options, done) => (req, res) => {
      if (done) return done(null, req.query.error ? false : user)
      res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?state=${options.state}`)
    },
  }
  const app = express()
  app.use(express.json(), cookieParser(), checkOrigin)
  app.use(session({ secret: process.env.JWT_SECRET, resave: false, saveUninitialized: false }))
  app.get('/google', startGoogleLogin(passport))
  app.get('/google/callback', validateGoogleState, googleCallback(passport))
  app.post('/google/mobile/exchange', exchangeLoginHandoff)
  app.get('/user', isAuth, (req, res) => res.json({ id: req.userId }))
  app.use((err, req, res, next) => res.status(err.statusCode || err.status || 500).json({ message: err.message }))
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  const verifier = randomBytes(32).toString('base64url')
  const appState = randomBytes(32).toString('base64url')
  const challenge = challengeFor(verifier)
  const exchange = (code, secret = verifier, origin = 'https://localhost') => fetch(`${base}/google/mobile/exchange`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ code, verifier: secret }),
  })
  async function begin() {
    const start = await fetch(`${base}/google?platform=mobile&code_challenge=${challenge}&app_state=${appState}`, { redirect: 'manual' })
    return { Cookie: start.headers.get('set-cookie').split(';')[0], state: new URL(start.headers.get('location')).searchParams.get('state') }
  }
  try {
    assert.equal((await fetch(`${base}/google?platform=mobile`, { redirect: 'manual' })).status, 400)
    assert.equal((await fetch(`${base}/google/callback?state=missing`, { redirect: 'manual' })).status, 400)
    const attempt = await begin()
    const callback = await fetch(`${base}/google/callback?code=google-code&state=${attempt.state}`, {
      headers: { Cookie: attempt.Cookie }, redirect: 'manual',
    })
    assert.equal(callback.status, 302)
    const target = new URL(callback.headers.get('location'))
    assert.equal(target.origin + target.pathname, 'https://myelitelifts.vercel.app/open/')
    assert.equal(target.searchParams.get('state'), appState)
    assert.doesNotMatch(callback.headers.get('set-cookie') || '', /liftit_session/)
    const code = target.searchParams.get('code')
    assert.ok(records.has(hashCode(code)))
    assert.equal(records.get(hashCode(code)).code, undefined)
    assert.equal(callback.headers.get('cache-control'), 'no-store')
    assert.equal((await fetch(`${base}/google/callback?state=${attempt.state}`, { headers: { Cookie: attempt.Cookie }, redirect: 'manual' })).status, 400)
    assert.equal((await exchange(code, randomBytes(32).toString('base64url'))).status, 401)
    assert.equal((await exchange(code, verifier, 'https://attacker.example')).status, 403)
    const responses = await Promise.all([exchange(code), exchange(code)])
    assert.deepEqual(responses.map(r => r.status).sort(), [204, 401])
    const success = responses.find(r => r.status === 204)
    const cookie = success.headers.get('set-cookie')
    assert.match(cookie, /liftit_session=.*HttpOnly/)
    if (process.env.NODE_ENV === 'production') assert.match(cookie, /Secure; SameSite=None/)
    assert.equal(success.headers.get('cache-control'), 'no-store')
    const current = await fetch(`${base}/user`, { headers: { Cookie: cookie.split(';')[0] } })
    assert.equal((await current.json()).id, user._id)
    assert.equal((await fetch(`${base}/user`)).status, 401)
    const expired = await createLoginHandoff(user._id, challenge)
    records.get(hashCode(expired)).expiresAt = new Date(Date.now() - 1)
    assert.equal((await exchange(expired)).status, 401)
    assert.equal((await exchange('malformed')).status, 400)
    const deleted = await createLoginHandoff(user._id, challenge)
    User.findById = async () => null
    assert.equal((await exchange(deleted)).status, 401)
    const cancelled = await begin()
    const cancelResponse = await fetch(`${base}/google/callback?error=access_denied&state=${cancelled.state}`, { headers: { Cookie: cancelled.Cookie }, redirect: 'manual' })
    const cancelTarget = new URL(cancelResponse.headers.get('location'))
    assert.equal(cancelTarget.searchParams.get('error'), 'google_cancelled')
    assert.equal(cancelTarget.searchParams.get('state'), appState)
    assert.equal(cancelTarget.searchParams.get('code'), null)
    await new Promise((resolve, reject) => {
      validateGoogleState({ session: { googleLogin: { state: 'old', expiresAt: Date.now() - 1 } }, query: { state: 'old' } }, { set() {} }, err => {
        try { assert.equal(err.status, 400); resolve() } catch (error) { reject(error) }
      })
    })
  } finally {
    LoginHandoff.create = original.create
    LoginHandoff.findOneAndDelete = original.consume
    User.findById = original.user
    await new Promise(resolve => server.close(resolve))
  }
})
