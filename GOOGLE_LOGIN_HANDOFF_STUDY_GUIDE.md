# Google login in the Android app: a code walkthrough

This guide explains the Google login handoff implemented in Elite Lifts. It includes snapshots of the relevant source code so you can study the whole flow in one place.

The code blocks labelled **Current source** are copied from the project when this guide is generated. They are study snapshots, not additional files to paste into your application. Later changes to the application will not automatically update this document. Examples with placeholder values are labelled separately.

## Contents

1. [The problem this solves](#1-the-problem-this-solves)
2. [The complete journey](#2-the-complete-journey)
3. [Sessions, cookies, codes, and state](#3-sessions-cookies-codes-and-state)
4. [Where the implementation lives](#4-where-the-implementation-lives)
5. [The app creates a secret and opens the browser](#5-the-app-creates-a-secret-and-opens-the-browser)
6. [The backend starts and validates Google login](#6-the-backend-starts-and-validates-google-login)
7. [MongoDB stores the temporary handoff](#7-mongodb-stores-the-temporary-handoff)
8. [Android knows which app should open](#8-android-knows-which-app-should-open)
9. [React receives the return link](#9-react-receives-the-return-link)
10. [The code becomes a login cookie](#10-the-code-becomes-a-login-cookie)
11. [React confirms login and opens home](#11-react-confirms-login-and-opens-home)
12. [The website fallback](#12-the-website-fallback)
13. [Routes, middleware, and the public URL](#13-routes-middleware-and-the-public-url)
14. [A concrete example](#14-a-concrete-example)
15. [What happens when something fails](#15-what-happens-when-something-fails)
16. [Why each security check exists](#16-why-each-security-check-exists)
17. [Development, deployment, and Android Studio](#17-development-deployment-and-android-studio)
18. [Tests and their limits](#18-tests-and-their-limits)
19. [Current limitations](#19-current-limitations)
20. [Study questions](#20-study-questions)

## 1. The problem this solves

There are two different browsing environments on the phone:

- **The external browser:** displays Google sign-in. The Capacitor Browser plugin opens an Android browser tab.
- **The app's WebView:** displays your bundled React application inside the installed Android app.

They have separate cookie storage. A login cookie created while the external browser is talking to your backend does not automatically become the app WebView's cookie.

An Android App Link solves a different problem: it tells Android which app may open a website URL. It does not copy cookies, authenticate the user, or tell React which screen to display.

We therefore need three operations:

1. Let the user authenticate through Google in the browser.
2. Return a temporary proof of that completed login to the originating app.
3. Let the app exchange that proof for its own login cookie and then display the home page.

Google communicates the login result to your backend. Your backend creates the handoff to your app. The browser carries a return URL; it does not carry the app's session JWT in that URL.

## 2. The complete journey

```mermaid
sequenceDiagram
    actor Person
    participant App as Android app / WebView
    participant Browser as External browser tab
    participant Google
    participant API as Express backend
    participant DB as MongoDB

    Person->>App: Tap Sign in with Google
    App->>App: Save verifier and app state
    App->>Browser: Open /google with challenge and app state
    Browser->>API: GET /google?platform=mobile&...
    API->>API: Save OAuth state, challenge, app state
    API-->>Browser: OAuth session cookie + redirect to Google
    Browser->>Google: Authenticate and consent
    Google-->>Browser: Redirect to backend callback with Google code and OAuth state
    Browser->>API: GET /google/callback with OAuth session cookie
    API->>API: Validate OAuth state and expiry
    API->>Google: Exchange Google's code and retrieve profile
    Google-->>API: Google identity
    API->>DB: Find or create user
    API->>DB: Store handoff code hash, challenge, user ID, expiry
    API-->>Browser: Redirect to /open/?code=handoff-code&state=app-state
    Browser->>App: Android App Link, or explicit fallback button
    App->>App: Check URL and matching app state
    App->>API: POST /google/mobile/exchange with code + verifier
    API->>DB: Atomically find and delete valid matching handoff
    DB-->>API: Handoff record
    API->>DB: Look up user again
    API-->>App: Set-Cookie: liftit_session=JWT; HttpOnly
    App->>API: GET /user with its own cookie
    API-->>App: User data
    App->>App: Set React user state and navigate to /
```

If your Markdown viewer does not render Mermaid, read the arrows as a timeline from top to bottom. The important boundary is the final cookie: it is delivered in a response to **the app's request**, not copied from the browser.

## 3. Sessions, cookies, codes, and state

These names describe different things. Keeping them separate makes the implementation much easier to understand.

| Name | Created by | Stored where | Purpose / lifetime |
| --- | --- | --- | --- |
| `verifier` | App | App localStorage, temporarily | Secret proving this app started the login; pending attempt expires after 10 minutes |
| `code_challenge` / `codeChallenge` | App | OAuth server session, then handoff record | SHA-256 digest of the verifier, encoded as Base64URL |
| `app_state` / `appState` | App | App localStorage and OAuth server session | Correlates the returning link with this app's pending login |
| OAuth `state` | Backend | Backend OAuth session and Google's round-trip URL | Correlates Google's callback with the browser's login attempt |
| `liftit_oauth` | Express session middleware | Browser cookie; corresponding session data in backend memory | Identifies the OAuth session; configured for 10 minutes |
| Google's authorization `code` | Google | Browser callback URL, then backend processing | Exchanged by Passport with Google; not the app handoff code |
| Handoff `code` | Backend | Return URL; only its hash in MongoDB | One-use ticket for the app; expires after 2 minutes |
| `LoginHandoff` record | Backend | MongoDB, normally `loginhandoffs` | Binds the ticket to a user and verifier challenge |
| `liftit_session` | Backend | App's HttpOnly cookie after exchange | Signed JWT used for protected API calls; expires after 1 hour |
| React `user` | AuthProvider | App JavaScript memory | UI state; does not itself authorize API requests |

### Are there two sessions?

There is a short-lived **Express OAuth session** during Google login and the eventual **JWT-based application session**. The MongoDB handoff record is a temporary exchange ticket between them.

The OAuth session is not stored in MongoDB in this implementation. `express-session` uses its default in-memory store because no custom `store` is configured. The MongoDB handoff record does not replace that OAuth session store.

The application's JWT is also not saved in a MongoDB session collection. Protected requests validate its signature and expiry. Your normal user account remains in MongoDB independently of the ticket.

### Why are there two states?

The backend checks **OAuth state** against the browser's server-side session. The app checks **app state** against its locally saved attempt. They protect different parts of the journey and are generated independently.

The query parameter named `state` in Google's callback contains OAuth state. The parameter named `state` in `/open/` contains app state. Same parameter name, different stages and values.

## 4. Where the implementation lives

| File | Responsibility |
| --- | --- |
| `frontend/src/components/GoogleAuthButton.jsx` | Starts native or website Google login |
| `frontend/src/utils/googleHandoff.js` | Generates the proof secret, validates return links, exchanges once |
| `frontend/src/utils/nativeGoogleAuth.js` | Connects the helper to real storage, crypto and Axios |
| `backend/src/controllers/googleAuth.js` | Starts OAuth, validates state, handles Google's callback |
| `backend/src/config/passport.js` | Configures the Google Passport strategy |
| `backend/src/models/LoginHandoff.js` | MongoDB ticket schema and indexes |
| `backend/src/controllers/mobileAuth.js` | Issues tickets and exchanges them for cookies |
| `backend/src/routes/authRoutes.js` | Registers the login and exchange endpoints |
| `frontend/src/components/NativeAuthListener.jsx` | Receives running-app and launch callbacks |
| `frontend/src/context/AuthContext.jsx` | Fetches the authenticated user and updates the UI |
| `frontend/src/pages/OpenApp.jsx` | Provides a browser fallback button |
| `frontend/public/.well-known/assetlinks.json` | Website-to-Android association |
| `frontend/android/app/src/main/AndroidManifest.xml` | Android-to-website association and custom scheme |
| `frontend/vercel.json` | Public API proxy, fallback routing, and return-page headers |

## 5. The app creates a secret and opens the browser

### The button

**Current source:**

[frontend/src/components/GoogleAuthButton.jsx](C:/Users/Jeffry/Desktop/liftit/frontend/src/components/GoogleAuthButton.jsx)

```jsx
import axios from '../api'
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { googleHandoff } from '../utils/nativeGoogleAuth'

export default function GoogleAuthButton({ signup = false, disabled = false }) {
  const [opening, setOpening] = useState(false)
  async function signIn() {
    if (opening) return
    setOpening(true)
    let params
    try {
      const native = Capacitor.isNativePlatform()
      params = native ? await googleHandoff.start() : new URLSearchParams({ platform: 'web' })
      const url = `${axios.defaults.baseURL.replace(/\/$/, '')}/google?${params}`
      if (native) await Browser.open({ url })
      else window.location.assign(url)
    } catch {
      if (params?.get('app_state')) googleHandoff.cancel(params.get('app_state'))
      toast.error('Could not open Google sign-in. Please try again.')
    } finally { setOpening(false) }
  }

  return (
    <button type="button" disabled={disabled || opening}
      onClick={signIn}
      className="relative flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[#747775] bg-white px-5 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f2f2f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4285f4] disabled:opacity-60"
      style={{ fontFamily: 'Arial, sans-serif' }}>
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48" className="shrink-0">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
      {signup ? 'Sign up with Google' : 'Sign in with Google'}
    </button>
  )
}
```

The authentication logic is above the JSX; the SVG paths just draw Google's logo.

- `Capacitor.isNativePlatform()` checks whether the React code is inside a native Capacitor app. Opening the website in Chrome on a phone still takes the web branch.
- Native login calls `googleHandoff.start()` and opens the resulting URL with `Browser.open()`.
- Website login uses `platform=web` and normal browser navigation.
- `opening` disables the button while it prepares/opens the browser. It does not stay true for the entire Google login.
- If opening the browser fails, the matching local attempt is cleared and a toast explains the failure.

### The reusable helper

**Current source:**

[frontend/src/utils/googleHandoff.js](C:/Users/Jeffry/Desktop/liftit/frontend/src/utils/googleHandoff.js)

```javascript
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
```

Read `start()` first; we will return to `finish()` in section 9.

`cryptoApi.getRandomValues(new Uint8Array(32))` produces 32 cryptographically random bytes, or 256 random bits. `Math.random()` is not used for authentication secrets.

`base64url()` converts bytes to text safe for a URL. It replaces `+` and `/` and removes padding `=` characters. Encoding 32 bytes this way produces 43 characters. Encoding is not encryption.

`cryptoApi.subtle.digest('SHA-256', ...)` hashes the verifier. A hash is a one-way digest: later the server hashes the submitted verifier and checks whether the result matches the saved challenge. It does not decrypt the challenge.

The relationship is:

```text
verifier  = random secret held by app
challenge = Base64URL(SHA256(verifier))
```

This follows the S256 proof-key idea used by PKCE. Here it binds **our backend-to-app handoff**; this code is not configuring an additional PKCE exchange with Google's token endpoint.

The app saves a JSON string under `elitelifts.googleLogin`. localStorage survives a normal process restart, whereas a React variable would disappear. This temporary verifier is readable by JavaScript; the eventual HttpOnly session cookie is not. If the user abandons login, localStorage does not expire by itself: the timestamp makes an old attempt unusable when checked, and a new attempt overwrites it.

### Connecting the helper to the real app

**Current source:**

[frontend/src/utils/nativeGoogleAuth.js](C:/Users/Jeffry/Desktop/liftit/frontend/src/utils/nativeGoogleAuth.js)

```javascript
import axios from '../api'
import { createGoogleHandoff } from './googleHandoff'

export const googleHandoff = createGoogleHandoff({
  storage: window.localStorage,
  cryptoApi: window.crypto,
  exchange: body => axios.post('/google/mobile/exchange', body),
})
```

`createGoogleHandoff` receives its dependencies instead of importing all of them internally. That lets tests replace storage and the network call without Android or a real server. In the app, `exchange` calls the real Axios client.

This exported instance is shared by the button and the listener. Its in-memory `exchanges` map can therefore deduplicate callbacks during the lifetime of this JavaScript runtime.

## 6. The backend starts and validates Google login

**Current source:**

[backend/src/controllers/googleAuth.js](C:/Users/Jeffry/Desktop/liftit/backend/src/controllers/googleAuth.js)

```javascript
import User from '../models/User.js'
import { frontendOrigin, setAuthCookie } from '../config/auth.js'
import { randomBytes } from 'node:crypto'
import { createLoginHandoff, isChallenge, mobileReturnUrl } from './mobileAuth.js'

export function startGoogleLogin(passport) {
  return (req, res, next) => {
    const platform = req.query.platform === 'mobile' ? 'mobile' : 'web'
    if (platform === 'mobile' && (!isChallenge(req.query.code_challenge) || !isChallenge(req.query.app_state))) {
      return res.status(400).json({ message: 'Start Google sign-in from the app again.' })
    }
    const state = randomBytes(32).toString('hex')
    req.session.googleLogin = {
      state, platform, expiresAt: Date.now() + 10 * 60 * 1000,
      ...(platform === 'mobile' ? { codeChallenge: req.query.code_challenge, appState: req.query.app_state } : {}),
    }
    res.set('Cache-Control', 'no-store')
    req.session.save(error => {
      if (error) return next(error)
      passport.authenticate('google', { scope: ['profile', 'email'], state })(req, res, next)
    })
  }
}

export async function verifyGoogleUser(accessToken, refreshToken, profile, done) {
  try {
    let user = await User.findOne({ googleId: profile.id })
    if (!user) {
      const email = profile.emails?.[0]?.value
      if (!email) return done(null, false, { message: 'google_email_missing' })
      // Linking an existing account requires its owner's authentication first.
      if (await User.findOne({ email })) {
        return done(null, false, { message: 'account_exists' })
      }
      user = await User.create({
        googleId: profile.id,
        name: profile.displayName || email.split('@')[0],
        email,
        profilePicture: profile.photos?.[0]?.value,
        authProvider: 'google',
      })
    }
    return done(null, user)
  } catch (error) {
    console.log(error)
    return done(error)
  }
}

export function validateGoogleState(req, res, next) {
  try {
    const attempt = req.session?.googleLogin
    const returnedState = req.query.state
    res.set('Cache-Control', 'no-store')
    if (
      !attempt || typeof returnedState !== "string"
      || Date.now() > attempt.expiresAt
      || returnedState !== attempt.state
    ) {
      const error = new Error('Login expired or invalid, please try again later.')
      error.status = 400
      return next(error)
    }
    res.locals.googleLogin = attempt;

    // Consume the state so it cannot be reused.
    delete req.session.googleLogin;

    req.session.save((error) => {
      if (error) return next(error);
      next();
    });
  } catch (error) {
    next(error)
  }

}

export function googleCallback(passport) {
  return (req, res, next) => {
    passport.authenticate('google', { session: false }, async (err, user, info) => {
      const attempt = res.locals.googleLogin
      const mobile = attempt?.platform === 'mobile'
      res.set('Cache-Control', 'no-store')
      res.set('Referrer-Policy', 'no-referrer')
      const failure = (code) => {
        const target = new URL(mobile ? mobileReturnUrl : `${frontendOrigin}/auth`)
        target.searchParams.set('error', code)
        if (mobile) target.searchParams.set('state', attempt.appState)
        return res.redirect(target.href)
      }
      if (err) return failure('google_failed')
      if (!user) {
        const code = ['account_exists', 'google_email_missing'].includes(info?.message)
          ? info.message : 'google_cancelled'
        return failure(code)
      }
      try {
        if (mobile) {
          const code = await createLoginHandoff(user._id, attempt.codeChallenge)
          const target = new URL(mobileReturnUrl)
          target.searchParams.set('code', code)
          target.searchParams.set('state', attempt.appState)
          return res.redirect(target.href)
        }
        setAuthCookie(res, user)
        return res.redirect(`${frontendOrigin}/`)
      } catch (error) {
        console.log(error)
        return next(error)
      }
    })(req, res, next)
  }
}
```

### `startGoogleLogin(passport)`

This is a function that returns Express middleware. Passing in `passport` allows tests to provide a controlled Passport instance.

For a mobile request, both the challenge and app state must have the expected 43-character Base64URL shape. This validates formatting; it is not proof of the secret yet. Proof happens during the final exchange.

The backend generates its own random OAuth state and saves this object in `req.session.googleLogin`:

```js
// Shape example only: angle-bracket values are placeholders.
{
  state: '<backend OAuth state>',
  platform: 'mobile',
  expiresAt: 1800000000000,
  codeChallenge: '<app verifier hash>',
  appState: '<app login identifier>'
}
```

`req.session.save(...)` completes before redirecting to Google. The callback needs that stored state when the browser returns. `passport.authenticate` starts the Google authorization flow with profile/email scopes and the generated OAuth state.

### `validateGoogleState`

This middleware runs before the Google callback controller. It rejects a missing attempt, a non-string state, an expired attempt, or a mismatched state with HTTP 400.

The optional access `req.session?.googleLogin` is deliberate: an expired/missing browser session should result in a handled error, not a property-access exception that leaves the request hanging.

After validation, it copies the attempt into `res.locals.googleLogin`. `res.locals` exists only for the current request, allowing the next middleware to use the verified platform/challenge/app state.

It then deletes the OAuth attempt and saves the session. A later replay of that completed attempt cannot pass normal state validation. This server-session operation is distinct from the atomic MongoDB consumption of the handoff ticket.

### `verifyGoogleUser`

Passport supplies the Google profile. The function looks up the user by `googleId`, creates a Google account if needed, and returns it through Passport's `done` callback.

It does not automatically attach a Google identity to an existing account merely because the email matches. That path returns `account_exists`; account linking would require a separate authenticated flow.

The Google `accessToken` and `refreshToken` parameters are not persisted or sent to the app by this function. The application needs its own authenticated user session, not access to those Google tokens in React.

### `googleCallback(passport)`

On mobile success, this controller calls `createLoginHandoff`, constructs the fixed HTTPS `/open/` URL, and puts only the handoff code and app state in its query string. It does **not** set `liftit_session` in the browser on this branch.

On website success, it continues the existing behavior: set the browser's auth cookie and redirect to the frontend home page.

Known Google failures redirect with an error identifier. For a mobile attempt the return also includes app state, so the app can associate the error with its own login attempt. Storage errors while creating a ticket go to Express's error handler rather than pretending login succeeded.

The target URL is fixed in server code. A caller cannot supply an arbitrary successful-login redirect destination.

### Why Passport says `state: false`

**Current source:**

[backend/src/config/passport.js](C:/Users/Jeffry/Desktop/liftit/backend/src/config/passport.js)

```javascript
import passport from 'passport'
import dotenv from 'dotenv'
import { Strategy as GoogleStrategy } from  'passport-google-oauth20'
import { verifyGoogleUser } from '../controllers/googleAuth.js'

dotenv.config()

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/google/callback',
  state: false,
}, verifyGoogleUser))

export default passport
```

`state: false` disables Passport's built-in automatic state store because **our `validateGoogleState` middleware performs that validation**. It does not mean state checking is unnecessary. Removing the custom middleware without replacing the validation would remove a security check.

The `{ session: false }` passed to `passport.authenticate` in the callback has another meaning: Passport does not serialize the logged-in user into its own persistent Passport session. We still use `express-session` for the temporary OAuth attempt, then our existing JWT cookie for application authentication.

## 7. MongoDB stores the temporary handoff

**Current source:**

[backend/src/models/LoginHandoff.js](C:/Users/Jeffry/Desktop/liftit/backend/src/models/LoginHandoff.js)

```javascript
import mongoose from 'mongoose'

const loginHandoffSchema = new mongoose.Schema({
  codeHash: { type: String, required: true, unique: true },
  codeChallenge: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
})

export default mongoose.model('LoginHandoff', loginHandoffSchema)
```

| Field | Why it is needed |
| --- | --- |
| `codeHash` | Locates the ticket without storing the raw URL code; has a unique index |
| `codeChallenge` | Restricts redemption to someone who knows the app's verifier |
| `userId` | Connects the ticket to the authenticated user account |
| `expiresAt` | Limits the lifetime and requests MongoDB TTL cleanup |

`ref: 'user'` describes the related Mongoose model. It does not automatically load the user. The exchange controller explicitly calls `User.findById` later.

`expires: 0` declares a TTL index for a Date field: the record becomes eligible for cleanup at `expiresAt`. It does not mean newly inserted records immediately disappear. MongoDB's cleanup happens asynchronously, and the index must exist for cleanup to occur.

**Current source for ticket creation and exchange:**

[backend/src/controllers/mobileAuth.js](C:/Users/Jeffry/Desktop/liftit/backend/src/controllers/mobileAuth.js)

```javascript
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
```

`createLoginHandoff` generates a fresh random code only after Google authentication succeeds. The server stores `hashCode(code)`, not the raw code, and returns the raw code to the callback controller for the redirect.

The challenge uses Base64URL while `codeHash` uses hexadecimal. These encodings are different by design: the challenge must match the frontend's encoding; the internal code hash only needs consistent encoding for storage and lookup.

Deleting a handoff record does not delete the user. It deletes only the temporary ticket.

## 8. Android knows which app should open

Two configurations establish the association in opposite directions.

### Your app declares which links it accepts

**Current source:**

[frontend/android/app/src/main/AndroidManifest.xml](C:/Users/Jeffry/Desktop/liftit/frontend/android/app/src/main/AndroidManifest.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation|density"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="elitelifts" />
            </intent-filter>

            <!-- Verified HTTPS App Links -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="myelitelifts.vercel.app"
                    android:pathPrefix="/open" />
            </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>

    <!-- Permissions -->

    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
```

The `android:autoVerify="true"` filter asks Android to verify the HTTPS website association. Its host is `myelitelifts.vercel.app`, and `android:pathPrefix="/open"` makes `/open` paths eligible.

The native manifest matches a prefix, while the JavaScript parser is stricter and accepts only `/open` or `/open/` for this login handler. An unrelated longer path may open the app without being treated as a login callback.

The separate `elitelifts` scheme handles the fallback button. Custom schemes do not establish domain ownership; the proof secret still prevents a different app that receives the URL from redeeming this ticket without the verifier.

`singleTask` allows the existing Android activity to receive a new intent instead of always creating another activity. Capacitor exposes relevant incoming URLs to the App plugin.

### Your website declares which signed app it trusts

**Current source:**

[frontend/public/.well-known/assetlinks.json](C:/Users/Jeffry/Desktop/liftit/frontend/public/.well-known/assetlinks.json)

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.example.app",
      "sha256_cert_fingerprints": [
        "44:C5:81:58:E4:38:17:61:1A:37:C2:4B:12:68:DD:1F:88:24:D6:40:62:F4:AD:13:0F:95:31:9F:D8:0D:9F:F2"
      ]
    }
  }
]
```

Android expects this file at:

```text
https://myelitelifts.vercel.app/.well-known/assetlinks.json
```

The leading dot in `.well-known` matters. Vite copies the public file into the build output at the same relative path, so the URL has no `/public` prefix.

The package name must match the APK's application ID. The SHA-256 fingerprint identifies the app's signing certificate; it is public metadata, not a private signing key. The current fingerprint was verified against this computer's debug certificate during implementation. Release builds need their actual release/app-signing certificate fingerprint too.

This file enables link verification. It does not authenticate users, create a session, or execute the exchange endpoint. Android/browser settings and successful verification still determine how a link opens.

## 9. React receives the return link

**Current source:**

[frontend/src/components/NativeAuthListener.jsx](C:/Users/Jeffry/Desktop/liftit/frontend/src/components/NativeAuthListener.jsx)

```jsx
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
```

There are two arrival paths:

- **Running app:** `App.addListener('appUrlOpen', receive)` receives a new URL event.
- **App launched by the link:** `App.getLaunchUrl()` returns the startup URL if there is one.

The listener is registered before checking the launch URL to reduce the chance of missing an incoming event during startup. Both paths call the same function.

`disposed` prevents an unmounted effect from navigating or updating UI after an asynchronous operation finishes. The cleanup removes the native listener. This matters with React StrictMode and component cleanup.

`navigateRef` keeps the latest navigation function available without re-registering the native subscription on every route change. Otherwise, re-reading an old launch URL on route changes could repeatedly process an old callback.

The busy overlay tells the user the app is finishing sign-in. Receiving the URL is not yet success: the exchange and `/user` request still have to complete.

### What `finish()` checks

Return to the `googleHandoff.js` code in section 5 and follow `finish()` in order:

1. Parse the URL and reject destinations outside the configured HTTPS/custom-scheme callback.
2. Treat a plain `/open/` with no authentication parameters as a request to open home, not as a login.
3. Require a correctly shaped app state.
4. Reuse an existing exchange Promise if this exact state/code is already being handled.
5. Read the pending local login and require the states to match. An unrelated callback is ignored without destroying the current attempt.
6. Reject an expired pending attempt and clear its saved values.
7. Handle known Google error identifiers without attempting an exchange.
8. Validate the handoff code shape.
9. Post the code and saved verifier to the backend.
10. Clear the matching pending attempt when the exchange finishes, whether it succeeded or failed.

The `Map` caches up to ten exchange Promises for duplicate notifications. It is a convenience within one running app process. The backend's atomic ticket consumption is the actual protection against replay, including after a process restart.

`clearAttempt` compares state before deletion, so completion of an older attempt does not delete a newer attempt's locally saved secret.

## 10. The code becomes a login cookie

The exchange runs inside the WebView through the existing Axios client:

**Current source:**

[frontend/src/api.js](C:/Users/Jeffry/Desktop/liftit/frontend/src/api.js)

```javascript
import axios from 'axios'

// All API calls share cookie credentials; React never reads the auth cookie.
export default axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  // Render Free can take about a minute to wake after inactivity.
  timeout: 90000,
})
```

`withCredentials: true` allows credentialed requests. It does not bypass cookie policies or CORS: the backend must allow the app's origin and issue cookies appropriate for the connection.

In `exchangeLoginHandoff`, the most important database call is:

```js
const handoff = await LoginHandoff.findOneAndDelete({
  codeHash: hashCode(code),
  codeChallenge: challengeFor(verifier),
  expiresAt: { $gt: new Date() },
})
```

All three requirements belong to the same query. A wrong verifier does not match and therefore does not delete the legitimate ticket. An expired ticket does not match even if TTL cleanup has not removed it yet.

`findOneAndDelete` consumes the matching record atomically. If two valid exchanges race for the same ticket, only one can remove and receive that record. A separate `findOne` followed later by `deleteOne` would introduce a gap between checking and consuming it.

After consuming the ticket, the server looks up the user again and issues the existing auth cookie:

**Current source:**

[backend/src/config/auth.js](C:/Users/Jeffry/Desktop/liftit/backend/src/config/auth.js)

```javascript
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
  maxAge: 36 * 100 * 1000,
}

export function setAuthCookie(res, user) {
  const token = jwt.sign({ email: user.email, id: user._id.toString() },
    getJwtSecret(), { expiresIn: '1h', algorithm: 'HS256' })
  res.cookie(authCookieName, token, authCookieOptions)
}
```

The JWT contains the user's ID and email and is signed using the backend's secret. Signing protects integrity; the JWT payload is not encrypted.

- `httpOnly: true`: JavaScript cannot read the cookie through `document.cookie`.
- `secure` in production: the cookie is used over HTTPS.
- `sameSite: 'none'` in production: allows the cross-site app/API use case, subject to WebView/browser policy. It is paired with Secure.
- `path: '/'`: the cookie applies across paths on its host.
- `maxAge: 36 * 100 * 1000`: this expression equals 3,600,000 milliseconds, or one hour.
- `expiresIn: '1h'`: the JWT has a matching one-hour validity period.

The comment about different frontend/API sites reflects the cookie configuration's broader use. With the current Vercel `/backend` proxy, website requests can share a public host; the native app's `https://localhost` origin is still distinct.

The exchange returns HTTP 204 with no response body. The useful result is the `Set-Cookie` header, stored by the app's WebView. React never needs a JSON response containing the JWT.

### How later requests are authenticated

**Current source:**

[backend/src/middleware/isAuth.js](C:/Users/Jeffry/Desktop/liftit/backend/src/middleware/isAuth.js)

```javascript
import jwt from 'jsonwebtoken'
import { authCookieName, getJwtSecret } from '../config/auth.js'

  const isAuth  = async(req, res, next) => {
  try {
    const token = req.cookies?.[authCookieName]
    if (!token) {
      const error = new Error('Invalid authorization')
      error.statusCode = 401
      throw error
    }
    let decodedToken;
    decodedToken = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] })

    if (!decodedToken) {
    const error = new Error('Not authenticated')
    error.statusCode = 401
    throw error;
  }

  req.userId = decodedToken.id
  next()

  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      error.statusCode = 401
    }

    if (!error.statusCode) {
      error.statusCode = 500
    }

    return next(error)
  }
}

export default isAuth
```

The middleware reads the cookie, checks the JWT signature and expiry with the allowed HS256 algorithm, and sets `req.userId` for the controller. It does not look up the handoff record; that record has already been consumed.

## 11. React confirms login and opens home

**Current source:**

[frontend/src/context/AuthContext.jsx](C:/Users/Jeffry/Desktop/liftit/frontend/src/context/AuthContext.jsx)

```jsx
import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import axios from '../api'

export const AuthContext = createContext()

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestVersion = useRef(0)
  const refreshUser = useCallback(async () => {
    const version = ++requestVersion.current
    setLoading(true)
    setError('')
    try {
      const res = await axios.get('/user')
      if (version === requestVersion.current) setUser(res.data.user)
      return res.data.user
    } catch (err) {
      if (version === requestVersion.current) {
        setUser(null)
        if (err.response?.status !== 401) setError('Unable to connect to Elite Lifts. Check that the server is running and try again.')
      }
      return null
        
    } finally {
      if (version === requestVersion.current) setLoading(false)
    }
  }, [])
  useEffect(() => { refreshUser() }, [refreshUser])
  return (<>
  <AuthContext.Provider value={{user, setUser, loading, error, refreshUser}}>
    {children}
  </AuthContext.Provider>
  </>)
}
```

After a successful exchange, the native listener calls `refreshUser()`. The GET `/user` request must carry the new cookie and return a user before the listener navigates to `/`.

This is useful verification: a 204 exchange alone cannot tell React that the WebView successfully retained the cookie. If the follow-up request fails, the app shows a retry error rather than presenting a signed-in home screen without a usable session.

`requestVersion` addresses overlapping user requests. Consider:

```text
Request 1: initial app check starts while logged out
Exchange:  login cookie is installed
Request 2: new /user check starts and returns the signed-in user
Request 1: old check returns late with 401
```

Without a version check, the late result could overwrite the new user with `null`. Each refresh gets a version number; only the latest refresh is allowed to change auth state/loading state.

The previous one-second polling loop in `App.jsx` was removed because it could perform a full-page redirect during the handoff. The initial AuthProvider check and explicit post-exchange refresh now handle these stages.

The authenticated protected-route branch now renders `<Outlet />`; that is React Router's placeholder for the child page. The signed-out branch renders `<Navigate to="/auth" replace />`.

### Mounting the listener

**Current source:**

[frontend/src/main.jsx](C:/Users/Jeffry/Desktop/liftit/frontend/src/main.jsx)

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router'
import { Toaster } from "react-hot-toast"
import { AuthProvider } from './context/AuthContext.jsx'
import NativeAuthListener from './components/NativeAuthListener.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <AuthProvider><NativeAuthListener /><App /></AuthProvider>
    <Toaster />
    </BrowserRouter>
  </StrictMode>,
)
```

The listener is inside both `BrowserRouter` and `AuthProvider`, so it can navigate and use `refreshUser`. It is not attached only to the auth page; it stays mounted while the app changes routes.

## 12. The website fallback

**Current source:**

[frontend/src/pages/OpenApp.jsx](C:/Users/Jeffry/Desktop/liftit/frontend/src/pages/OpenApp.jsx)

```jsx
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
```

Sometimes the browser remains on the HTTPS return page instead of switching directly to the app. This page preserves the code/state in its button's custom-scheme URL and provides an explicit user action to open the installed app.

The link is computed before `history.replaceState` removes the query string from the displayed address/current history entry. Removing it from that entry does not retroactively erase server logs or the earlier HTTP request. The ticket's short lifetime, proof requirement and single use remain essential.

The page does not redeem the code itself. It does not have the app's verifier. The website-login link starts/continues an independent web flow; it does not transfer the native session into the browser.

## 13. Routes, middleware, and the public URL

### Express endpoints

The relevant current route registrations are:

```js
router.get('/google', startGoogleLogin(passport))
router.get('/google/callback', validateGoogleState, googleCallback(passport))
router.post('/google/mobile/exchange', exchangeLoginHandoff)
router.get('/user', isAuth, getUser)
```

The callback middleware order matters: validate state first, process the Google result second. The exchange route does not use `isAuth` because it creates the first authenticated app session. The code-plus-verifier proof authorizes that operation instead.

### The temporary OAuth session

This is the existing session configuration in `backend/src/server.js`:

```js
app.use(session({
  name: 'liftit_oauth',
  secret: process.env.COOKIE_KEY || getJwtSecret(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000
  }
}))
```

This block is reformatted for readability but uses the current configuration values. With no `store` option, session data is in backend memory. The cookie identifies the session; it does not contain the entire `googleLogin` object.

The server also parses JSON and cookies, allows credentialed CORS for the configured origins including `https://localhost`, checks origins on writes, and sets `trust proxy` in production. CORS controls browser access to responses; it is not a substitute for the exchange proof.

### Vercel's public API prefix

**Current source:**

[frontend/vercel.json](C:/Users/Jeffry/Desktop/liftit/frontend/vercel.json)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "headers": [
    {
      "source": "/open/:path*",
      "headers": [
        { "key": "Referrer-Policy", "value": "no-referrer" },
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/backend/:path*",
      "destination": "https://elite-lifts.onrender.com/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

The app uses a base URL such as `https://myelitelifts.vercel.app/backend`. Vercel forwards `/backend/google/mobile/exchange` to the backend's `/google/mobile/exchange` route. The prefix exists on the public proxy, not in the Express router.

The `/open` response headers request no caching and no referrer forwarding. The catch-all rewrite supports React routes such as `/open`; the asset-links JSON must still be served as its actual static JSON file.

There are two deliberately different callback URLs:

```text
Google authorized callback:
https://myelitelifts.vercel.app/backend/google/callback

Backend-to-app return:
https://myelitelifts.vercel.app/open/
```

Keep Google's configured callback on the backend route. That is where Google's code is validated/exchanged. `/open/` receives your backend's handoff code afterwards.

The public login-start and Google callback hosts must agree so the browser sends its OAuth-session cookie to the callback. Starting on Vercel and returning to a different Render host can lose that cookie.

## 14. A concrete example

The symbolic values below explain data movement; they are not valid authentication values to paste into requests.

1. The app saves `verifier = V` and `appState = A`.
2. It sends `challenge = Base64URL(SHA256(V))` and `app_state = A` to `/google`.
3. The backend creates OAuth state `O` and saves `{ O, A, challenge, platform, expiresAt }` in the browser's OAuth session.
4. Google returns its own authorization code `G` and state `O` to the backend.
5. The backend checks `O`, exchanges `G` with Google, and identifies user `U`.
6. The backend creates handoff code `H` and stores `{ SHA256(H), challenge, U, expiresAt }` in MongoDB.
7. The browser navigates to `/open/?code=H&state=A` and Android passes it to the app.
8. The app checks `A`, then sends `{ code: H, verifier: V }` in a POST body.
9. The backend finds/deletes the ticket matching `SHA256(H)` and `Base64URL(SHA256(V))`, provided it has not expired.
10. The backend issues JWT `J` as an HttpOnly cookie in the response to the app.
11. The app requests `/user` with cookie `J`, receives user `U`, and shows home.

Notice that `G`, `H`, and `J` are three different credentials. `O` and `A` are two different state values. `V` is never put in the return URL.

## 15. What happens when something fails

| Situation | Current behavior |
| --- | --- |
| Native login start lacks a valid challenge/app state | Backend returns 400 before starting Google login |
| Browser OAuth session is missing/expired or state is wrong | Validation returns 400; no session is issued |
| Google login is cancelled with a valid saved attempt | Redirects back with `google_cancelled` and the matching app state |
| Email is missing or belongs to an existing unlinked account | Returns the corresponding existing Google error |
| App receives an unrelated host/path | Ignores the callback |
| App receives another attempt's state | Ignores it and preserves the current pending attempt |
| App's saved attempt has expired | Clears it and shows the handoff retry error |
| Same URL arrives twice | Shares the exchange Promise in this process |
| Correct code, wrong verifier | Backend returns 401 without consuming the matching legitimate ticket |
| Ticket expired or already consumed | Backend returns 401; start Google login again |
| User no longer exists | Backend returns 401 and issues no cookie |
| Exchange response is lost after consumption | Retry may fail because the code is already used; start a new login |
| Cookie is not available to `/user` | App does not accept the exchange as a completed usable login |
| Bare `/open/` link is opened | Opens home; does not create authentication |

## 16. Why each security check exists

- **Random verifier:** a copied return link alone is insufficient to claim the session.
- **Random OAuth state:** ties Google's callback to the browser's initiated login attempt.
- **Random app state:** stops the app accepting an unrelated pending-login callback.
- **Fixed callback destinations:** restricts where the handoff is returned and what URLs the app processes.
- **Short code lifetime:** limits how long a lost or abandoned ticket remains usable.
- **Hashed code storage:** avoids keeping the raw return code in the database.
- **Atomic deletion:** prevents successful reuse of the same ticket.
- **HttpOnly cookie:** avoids returning the JWT to application JavaScript for storage.
- **HTTPS and Secure production cookies:** protect the transport and production cookie use.
- **Origin checks and CORS:** support intended browser/WebView callers alongside the authentication proof.

These checks have specific boundaries. Hashing is not encryption; Base64URL is not secrecy; HttpOnly does not make arbitrary script injection harmless. Keep the temporary verifier out of logs and never replace the exchange with a JWT embedded in a URL.

## 17. Development, deployment, and Android Studio

### Which code runs where?

| Component | Where it runs | What must be updated |
| --- | --- | --- |
| Express controllers/model/routes | Hosted backend for the current debug build | Deploy backend changes |
| `assetlinks.json` and `/open` fallback | Hosted Vercel website | Deploy frontend website changes |
| React listener/helper and Capacitor plugins | Installed Android APK | Rebuild/sync/install locally |

The same hosted backend can serve your Android Studio debug build. Debug mode does not mean the API is automatically running locally.

Your current Capacitor configuration is:

[frontend/capacitor.config.json](C:/Users/Jeffry/Desktop/liftit/frontend/capacitor.config.json)

```json
{
  "appId": "com.example.app",
  "appName": "Elite Lifts | Free fitness Tracker app",
  "webDir": "dist"
}
```

`webDir: 'dist'` means the native project receives the built frontend assets from `dist`. Editing `frontend/src` alone does not replace the assets already installed in the emulator.

From the project root, after frontend changes:

```powershell
cd frontend
npm run build
npx cap sync android
```

Then run/reinstall from Android Studio. Building without opening Android Studio is also possible from the Android project:

```powershell
cd android
.\gradlew.bat assembleDebug
```

That creates `frontend/android/app/build/outputs/apk/debug/app-debug.apk`; it does not itself install the APK or finish Google sign-in.

Both `@capacitor/app` and `@capacitor/browser` are dependencies, and Capacitor sync registers their native Android projects. After cloning on another machine, install the frontend dependencies before building/syncing.

### Hosted configuration used by this flow

```text
Frontend VITE_API_URL=https://myelitelifts.vercel.app/backend
Backend FRONTEND_ORIGIN=https://myelitelifts.vercel.app
Backend GOOGLE_CALLBACK_URL=https://myelitelifts.vercel.app/backend/google/callback
Backend NODE_ENV=production
```

These are configuration examples for this deployment, not secret values. Google client secrets, JWT secrets, and database credentials stay on the backend and are not copied into this guide.

Vite embeds frontend environment values when building. Changing a hosting environment variable does not rewrite an APK already installed on your emulator; rebuild and sync to pick up frontend configuration changes.

For a local backend, the emulator's `localhost` refers to the emulator, not your PC. Native OAuth also needs reachable callback addresses and compatible HTTPS/cookie configuration. The existing HTTP browser-development setup is not automatically a complete native OAuth setup.

### App Links verification

The hosted JSON must return actual JSON with HTTP 200 and no redirect. The current debug certificate fingerprint can coexist with the production signing fingerprint in the same array. For a Google Play build, use the certificate that signs the installed app, which may differ from your upload key.

With a connected Android 12+ device/emulator and `adb` available:

```powershell
adb shell pm verify-app-links --re-verify com.example.app
# Give Android time to perform verification, then inspect:
adb shell pm get-app-links com.example.app
adb shell am start -W -a android.intent.action.VIEW -c android.intent.category.BROWSABLE -d "https://myelitelifts.vercel.app/open/"
```

The final command tests opening only. A full test must begin with the Google button inside the app, because that creates the verifier and pending app state.

## 18. Tests and their limits

The implementation included backend tests for invalid/missing state, mobile callback destinations, wrong verifier, wrong origin, expired tickets, deleted accounts, cancellation, concurrent redemption and subsequent authenticated requests.

Frontend tests cover callback destination validation, challenge generation, saved-state recovery after recreating the helper, duplicate notifications, mismatched state, expiry and failures.

From the project root:

```powershell
cd backend
npm test
cd ../frontend
npm test
npm run build
```

At implementation time, the backend tests, frontend tests, production web build, Capacitor Android sync and debug APK build passed. The backend tests mock Google responses and database operations; the concurrency test uses a mock of the atomic consume operation. Signup email delivery is intercepted in the test so it does not send real welcome emails.

Those checks do not prove deployment configuration, live MongoDB indexes, device App Links verification, or a real Google consent round trip. A recreated JavaScript helper is also not a full Android process-kill test.

Manual device checks still matter: finish sign-in, confirm the user on home, open a protected page, restart the app within the session lifetime, log out, cancel a login, and test a fresh launch from a return link.

## 19. Current limitations

1. **OAuth session storage is still in memory.** A backend restart can interrupt Google login before the handoff is created. Multiple backend instances need a shared OAuth session store before scaling. Persisting handoff tickets in MongoDB does not solve that separate requirement.
2. **There is no refresh-token flow for the app session.** The app JWT expires after one hour. The handoff is not used to silently renew it.
3. **A consumed code is not recoverable.** If the user lookup/network fails after consumption, a new login may be required. This preserves single-use behavior.
4. **Starting on the ordinary mobile website stays a website login.** It does not create the native app's verifier and is not converted into a native login merely by detecting a phone.
5. **Local storage is temporary proof storage, not a secure token vault.** Abandoned values can remain stored until replaced/checked. Their expiry and the backend's expiry make them unusable later; the JWT is never stored there by this handoff.
6. **Browser/App Links behavior still depends on device configuration.** The fallback button provides another path, but the app must be installed. The Android setup does not establish iOS Universal Links.
7. **Logout clears the cookie rather than deleting a MongoDB session row.** There is no per-session JWT revocation store in this implementation; an independently copied valid JWT is not revoked just by clearing the original cookie.

## 20. Study questions

Try answering these without looking above, then compare with the answers.

1. Why does opening `/open/` not automatically log the app in?
2. What is saved in MongoDB, and what is not?
3. Why send the hash of the verifier when starting login?
4. Why are OAuth state and app state different?
5. Why use `findOneAndDelete` with all conditions together?
6. Why does the listener call `/user` after receiving HTTP 204?
7. What is the difference between `state: false` and `session: false` in this project?
8. Which changes require a hosted deployment and which require an APK rebuild?

### Answers

1. The URL opens an app; it does not copy browser cookies. A valid code, matching app state, and verifier are needed for exchange.
2. MongoDB stores the ticket's code hash, challenge, user ID and expiry, plus normal user data separately. The OAuth session is in backend memory; the JWT session is in the HttpOnly cookie.
3. The hash binds the ticket to a secret without sending that secret through the browser's login-start/return URLs. The actual verifier is submitted directly during exchange.
4. The backend validates Google's browser round trip with OAuth state; the app validates its own return link with app state.
5. It checks and consumes a valid ticket atomically, so only one redemption succeeds and wrong proofs do not consume a matching legitimate ticket.
6. It confirms the cookie was retained and works for authenticated requests before showing signed-in UI.
7. `state: false` disables Passport's automatic state store because custom middleware checks state. `session: false` prevents Passport from persisting the logged-in user in a Passport session. Neither removes the temporary Express OAuth session used here.
8. The backend endpoint/model changes and hosted association/fallback files must be deployed. The native frontend and plugin changes must be built, synced and installed into the APK used by the emulator.

## Further reading

These references explain the underlying mechanisms; the project code above determines this application's exact behavior.

- [Capacitor App API: incoming links and launch URLs](https://capacitorjs.com/docs/apis/app)
- [Capacitor Browser API](https://capacitorjs.com/docs/apis/browser)
- [Capacitor deep-link guide](https://capacitorjs.com/docs/guides/deep-links)
- [Android website association and assetlinks.json](https://developer.android.com/training/app-links/configure-assetlinks)
- [RFC 7636: proof keys and the S256 challenge](https://www.rfc-editor.org/rfc/rfc7636)
- [RFC 8252: OAuth for native applications](https://www.rfc-editor.org/rfc/rfc8252.html)

Read the code in this order when revisiting the feature: button → helper `start()` → backend start/state/callback → ticket model/controller → native listener → helper `finish()` → exchange → auth cookie → AuthProvider.
