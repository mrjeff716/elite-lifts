import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import { Passport } from 'passport'
import { Strategy } from 'passport-google-oauth20'

process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-bytes-long'
const { verifyGoogleUser, googleCallback } = await import('./controllers/googleAuth.js')
const { default: User } = await import('./models/User.js')
const { default: isAuth } = await import('./middleware/isAuth.js')
const { getUser, postLogout, postSignup, postLogin } = await import('./controllers/authControllers.js')
const { frontendOrigin, authCookieName } = await import('./config/auth.js')

test('Google callback, state, new/returning users, app cookie, refresh and logout', async () => {
  const original = { findOne: User.findOne, create: User.create, findById: User.findById }
  const users = []
  User.findOne = async query => users.find(u => Object.entries(query).every(([key, value]) => u[key] === value))
  User.create = async data => {
    const user = { ...data, _id: `google-user-${users.length}` }
    users.push(user)
    return user
  }
  User.findById = id => ({ select: () => users.find(u => u._id === id) })
  const passport = new Passport()
  const strategy = new Strategy({ clientID: 'test-client', clientSecret: 'test-secret',
    callbackURL: 'http://localhost:3000/google/callback', state: true }, verifyGoogleUser)
  // Exercise real Passport state validation and callbacks; no Google network or database writes.
  let profile = { id: 'google-1', displayName: 'Google User', emails: [{ value: 'google@example.com' }] }
  strategy._oauth2.getOAuthAccessToken = (code, params, done) => done(null, 'test-access', 'test-refresh', {})
  strategy.userProfile = (token, done) => done(null, profile)
  passport.use(strategy)
  const app = express()
  app.use(express.json(), cookieParser(), session({ secret: process.env.JWT_SECRET,
    resave: false, saveUninitialized: false }), passport.initialize())
  app.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
  app.get('/google/callback', googleCallback(passport))
  app.get('/user', isAuth, getUser)
  app.post('/logout', postLogout)
  app.use((err, req, res, next) => res.status(err.statusCode || 500).json({ message: err.message }))
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  async function login(overrideState) {
    const start = await fetch(base + '/google', { redirect: 'manual' })
    const target = new URL(start.headers.get('location'))
    assert.equal(target.searchParams.get('redirect_uri'), 'http://localhost:3000/google/callback')
    assert.ok(target.searchParams.get('state'))
    const state = overrideState || target.searchParams.get('state')
    const Cookie = start.headers.get('set-cookie').split(';')[0]
    return fetch(`${base}/google/callback?code=test-code&state=${state}`, { headers: { Cookie }, redirect: 'manual' })
  }
  try {
    const first = await login()
    assert.equal(first.status, 302)
    assert.equal(first.headers.get('location'), frontendOrigin + '/')
    const cookie = first.headers.get('set-cookie')
    assert.match(cookie, new RegExp(authCookieName))
    assert.match(cookie, /HttpOnly/)
    assert.match(cookie, /SameSite=Lax/)
    const headers = { Cookie: cookie.split(';')[0] }
    assert.equal(users.length, 1)
    assert.equal(users[0].authProvider, 'google')
    assert.equal(users[0].password, undefined)
    for (let i = 0; i < 2; i++) {
      const current = await fetch(base + '/user', { headers })
      assert.equal(current.status, 200)
      assert.equal((await current.json()).user._id, users[0]._id)
    }
    await login()
    assert.equal(users.length, 1)
    const invalid = await login('invalid-state')
    assert.match(invalid.headers.get('location'), /google_cancelled/)
    assert.equal(invalid.headers.get('set-cookie'), null)
    const cancelled = await fetch(base + '/google/callback?error=access_denied', { redirect: 'manual' })
    assert.match(cancelled.headers.get('location'), /google_cancelled/)
    profile = { id: 'missing-email', displayName: 'No Email' }
    assert.match((await login()).headers.get('location'), /google_email_missing/)
    users.push({ _id: 'local-user', email: 'local@example.com', password: 'hash' })
    profile = { id: 'duplicate-email', emails: [{ value: 'local@example.com' }] }
    assert.match((await login()).headers.get('location'), /account_exists/)
    User.findOne = async () => { throw new Error('database unavailable') }
    assert.match((await login()).headers.get('location'), /google_failed/)
    const logout = await fetch(base + '/logout', { method: 'POST', headers })
    assert.equal(logout.status, 200)
    assert.match(logout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/)
    assert.equal((await fetch(base + '/user')).status, 401)
  } finally {
    Object.assign(User, original)
    await new Promise(resolve => server.close(resolve))
  }
})

test('password signup logs in, rejects mismatches, and Google-only accounts get a helpful login error', async () => {
  const find = User.findOne
  const save = User.prototype.save
  User.findOne = async () => null
  User.prototype.save = async function () { return this }
  const app = express()
  app.use(express.json())
  app.post('/signup', postSignup)
  app.post('/login', postLogin)
  app.use((err, req, res, next) => res.status(err.statusCode || 500).json({ message: err.message }))
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  const send = (path, body) => fetch(base + path, { method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  try {
    const body = { name: 'Local User', email: 'local@example.com', password: 'test-password', confirmPassword: 'test-password' }
    assert.equal((await send('/signup', { ...body, confirmPassword: 'different' })).status, 422)
    const signup = await send('/signup', body)
    assert.equal(signup.status, 201)
    assert.match(signup.headers.get('set-cookie'), /HttpOnly/)
    assert.equal((await signup.json()).user.password, undefined)
    User.findOne = async () => ({ email: 'google@example.com', googleId: 'google-user' })
    const login = await send('/login', body)
    assert.equal(login.status, 401)
    assert.match((await login.json()).message, /sign in with Google/)
  } finally {
    User.findOne = find
    User.prototype.save = save
    await new Promise(resolve => server.close(resolve))
  }
})
