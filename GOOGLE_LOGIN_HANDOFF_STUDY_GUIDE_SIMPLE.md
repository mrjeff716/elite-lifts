# Google login handoff — simple guide

This is the short companion to [the detailed guide](C:/Users/Jeffry/Desktop/liftit/GOOGLE_LOGIN_HANDOFF_STUDY_GUIDE.md). The snippets show the important parts of the project's code, with some formatting shortened for readability. They are excerpts, not complete replacement files.

## Why we needed this

Google login happens in the phone's browser. Your React app runs inside a separate Android WebView.

**The browser's login cookie does not automatically transfer to the app.** We built a secure way for the app to receive its own cookie after Google login succeeds.

```text
App → Browser → Google → Backend
                           ↓
                  Temporary return code
                           ↓
                          App
                           ↓
              Exchange code + app secret
                           ↓
                 App gets login cookie
                           ↓
                       Home page
```

## The flow in 6 steps

### 1. The app saves a temporary secret

When you tap Google login, the app creates:

- A **verifier**: a random secret kept inside the app.
- An **app state**: a random identifier for this login attempt.

It sends the backend a hash of the verifier, called the **challenge**. It opens the login URL with Capacitor's Browser plugin.

From [googleHandoff.js](C:/Users/Jeffry/Desktop/liftit/frontend/src/utils/googleHandoff.js), inside `start()`:

```js
const verifier = base64url(cryptoApi.getRandomValues(new Uint8Array(32)))
const state = base64url(cryptoApi.getRandomValues(new Uint8Array(32)))
const hash = await cryptoApi.subtle.digest('SHA-256', new TextEncoder().encode(verifier))

storage.setItem(storageKey, JSON.stringify({
  verifier,
  state,
  expiresAt: Date.now() + 10 * 60 * 1000,
}))

return new URLSearchParams({
  platform: 'mobile',
  code_challenge: base64url(new Uint8Array(hash)),
  app_state: state,
})
```

`getRandomValues` creates secure random bytes. `base64url` converts them to URL-friendly text. `SHA-256` hashes the secret; it does not encrypt it. The pending attempt is saved in localStorage so it survives an app restart, with a ten-minute expiry checked by the helper.

Then [GoogleAuthButton.jsx](C:/Users/Jeffry/Desktop/liftit/frontend/src/components/GoogleAuthButton.jsx) chooses the native or website flow:

```js
const native = Capacitor.isNativePlatform()
params = native ? await googleHandoff.start() : new URLSearchParams({ platform: 'web' })
const url = `${axios.defaults.baseURL.replace(/\/$/, '')}/google?${params}`
if (native) await Browser.open({ url })
else window.location.assign(url)
```

The secret stays in the app. The browser receives only its hash and the login identifier.

### 2. Google returns to the backend

The backend saves a separate **OAuth state** before sending the browser to Google. In [googleAuth.js](C:/Users/Jeffry/Desktop/liftit/backend/src/controllers/googleAuth.js), `startGoogleLogin` saves the attempt after validating the mobile parameters:

```js
const state = randomBytes(32).toString('hex')
req.session.googleLogin = {
  state, platform, expiresAt: Date.now() + 10 * 60 * 1000,
  ...(platform === 'mobile' ? {
    codeChallenge: req.query.code_challenge,
    appState: req.query.app_state,
  } : {}),
}

req.session.save(error => {
  if (error) return next(error)
  passport.authenticate('google', { scope: ['profile', 'email'], state })(req, res, next)
})
```

`req.session.save` finishes saving before the browser leaves for Google. The `...` expression adds the challenge and app state only for mobile login.

When Google returns, this route checks the saved state before processing the Google profile:

```js
router.get('/google/callback',
  validateGoogleState,
  googleCallback(passport)
)
```

OAuth state protects the Google-to-backend round trip. App state connects the later return link to the app's own login attempt.

The main check inside `validateGoogleState` is:

```js
const attempt = req.session?.googleLogin
const returnedState = req.query.state
if (
  !attempt || typeof returnedState !== "string"
  || Date.now() > attempt.expiresAt
  || returnedState !== attempt.state
) {
  const error = new Error('Login expired or invalid, please try again later.')
  error.status = 400
  return next(error)
}
```

If valid, the middleware passes the attempt to the callback using `res.locals.googleLogin`, deletes it from the session, and saves. Passport then exchanges Google's authorization code and finds or creates the user.

### 3. The backend creates a temporary ticket

After finding or creating the user, [mobileAuth.js](C:/Users/Jeffry/Desktop/liftit/backend/src/controllers/mobileAuth.js) generates a random handoff code and saves this record in MongoDB:

```js
export async function createLoginHandoff(userId, codeChallenge) {
  const code = randomBytes(32).toString('base64url')
  await LoginHandoff.create({
    codeHash: hashCode(code), codeChallenge, userId,
    expiresAt: new Date(Date.now() + 2 * 60 * 1000),
  })
  return code
}
```

**The ticket lasts two minutes and can be used once.** It is not the ongoing login session.

### 4. The return URL opens the app

The backend redirects the browser to a URL like:

```text
https://myelitelifts.vercel.app/open/?code=...&state=...
```

This is the mobile-success branch of `googleCallback`:

```js
if (mobile) {
  const code = await createLoginHandoff(user._id, attempt.codeChallenge)
  const target = new URL(mobileReturnUrl)
  target.searchParams.set('code', code)
  target.searchParams.set('state', attempt.appState)
  return res.redirect(target.href)
}
```

`mobileReturnUrl` is the fixed HTTPS `/open/` address. The return code is our own ticket, not Google's authorization code and not a session JWT.

Android uses the manifest and the hosted `.well-known/assetlinks.json` to verify that your app can handle this website's links.

The app listens for the URL using `appUrlOpen`. It also checks `getLaunchUrl()` if the link launched the app from scratch. If the browser stays on the website, the `/open` page provides an **Open Elite Lifts** button.

From [NativeAuthListener.jsx](C:/Users/Jeffry/Desktop/liftit/frontend/src/components/NativeAuthListener.jsx):

```js
async function subscribe() {
  listener = await App.addListener('appUrlOpen', receive)
  if (disposed) { await listener.remove(); return }
  const launch = await App.getLaunchUrl()
  if (launch) await receive(launch)
}
```

Both paths call `receive`. `disposed` prevents an effect that has already been cleaned up from continuing to handle events.

Opening the app is not login success yet. The code still needs to be exchanged.

### 5. The app exchanges the ticket for its own cookie

In `googleHandoff.js`, `finish()` first checks the callback URL and code format, and checks the saved attempt. These are the state and expiry checks:

```js
if (!pending || pending.state !== state) return Promise.resolve(null)
if (pending.expiresAt <= Date.now()) {
  clearAttempt(state)
  return Promise.resolve({ error: 'google_handoff_failed' })
}
```

An unrelated callback is ignored; an expired attempt is cleared. The helper then calls `exchange({ code, verifier: pending.verifier })`.

[nativeGoogleAuth.js](C:/Users/Jeffry/Desktop/liftit/frontend/src/utils/nativeGoogleAuth.js) connects that helper to the real app:

```js
export const googleHandoff = createGoogleHandoff({
  storage: window.localStorage,
  cryptoApi: window.crypto,
  exchange: body => axios.post('/google/mobile/exchange', body),
})
```

The backend checks the code, the secret's hash, and the expiry together:

```js
const handoff = await LoginHandoff.findOneAndDelete({
  codeHash: hashCode(code),
  codeChallenge: challengeFor(verifier),
  expiresAt: { $gt: new Date() },
})
```

Finding and deleting happen as one atomic operation. Only one valid exchange can succeed. A copied return link alone is insufficient because it does not contain the app's secret.

After verifying the user still exists, the backend sets the cookie:

```js
setAuthCookie(res, user)
res.status(204).end()
```

This response goes to the app's WebView, so **the app receives its own login cookie**.

Here is the function that creates that cookie, from [auth.js](C:/Users/Jeffry/Desktop/liftit/backend/src/config/auth.js):

```js
export function setAuthCookie(res, user) {
  const token = jwt.sign({ email: user.email, id: user._id.toString() },
    getJwtSecret(), { expiresIn: '1h', algorithm: 'HS256' })
  res.cookie(authCookieName, token, authCookieOptions)
}
```

`authCookieName` is `liftit_session`. The options make it HttpOnly, Secure in production, and valid for one hour. Signing the JWT lets the backend detect tampering; it does not encrypt its contents. The existing Axios client uses `withCredentials: true` to make credentialed requests.

### 6. The app confirms login and shows home

The app requests `/user` using the new cookie. When that succeeds, React updates its user state and navigates home.

This is the successful-return handling inside `NativeAuthListener.jsx`:

```js
if (result.authenticated) {
  const user = await refreshUser()
  if (disposed) return
  if (!user) return navigateRef.current('/auth?error=google_handoff_failed', { replace: true })
}
navigateRef.current('/', { replace: true })
```

`navigateRef.current` holds the React Router navigation function. The listener checks `/user` before accepting the exchange as a usable login. The code also handles error results before reaching this branch.

The temporary secret is cleared after the exchange. Failed or expired exchanges require starting login again.

## What is stored where?

| Item | Location | Purpose |
| --- | --- | --- |
| Temporary verifier and app state | App localStorage | Prove and identify the originating login attempt |
| Google OAuth session | Backend memory, identified by the browser's `liftit_oauth` cookie | Validate Google's callback; configured for 10 minutes |
| Handoff ticket | MongoDB `loginhandoffs` collection | One-use exchange; expires after 2 minutes |
| App session JWT | App's HttpOnly `liftit_session` cookie | Authenticate API requests for 1 hour |

**The app's ongoing session is not saved in MongoDB by this implementation.** MongoDB stores the temporary ticket and your normal user account. Once the ticket is consumed, later requests use the JWT cookie.

Unused tickets are removed by MongoDB's TTL cleanup. The backend also checks expiry itself, because cleanup is not immediate. An HttpOnly cookie cannot be read by JavaScript; the WebView sends it with credentialed API requests.

## Testing in Android Studio

1. Deploy the backend handoff changes.
2. Deploy the website's `.well-known/assetlinks.json` and `/open` page.
3. Build and sync the native frontend, then run the app from Android Studio:

```powershell
cd frontend
npm run build
npx cap sync android
```

Start Google login **inside the installed app**. Your current debug build uses the hosted backend. Uploading only `assetlinks.json` enables verification, but does not deploy the login exchange.

Keep Google's configured redirect URI pointed at the backend:

```text
https://myelitelifts.vercel.app/backend/google/callback
```

The backend redirects to `/open/` afterwards. The current certificate fingerprint supports your debug build; production builds need their signing fingerprint added too.

## Remember these three points

1. **App Links open the app.** They do not transfer a login session.
2. **The handoff code plus the app's secret creates the session.** The code is short-lived and single-use.
3. **The cookie keeps later requests authenticated.** The handoff ticket is no longer needed after login.
