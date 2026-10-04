# Authentication flow

Both email/password and Google login use the same HttpOnly `liftit_session` cookie. React never reads the JWT. Axios sends the cookie to the backend, where `isAuth` validates it before protected API requests.

## Google signup and login

1. Either Google button navigates to the backend's `/google` route.
2. Passport redirects to Google with a random state value. A short-lived `liftit_oauth` session preserves that value to validate the callback.
3. Google returns to `/google/callback`. `validateGoogleState` validates and consumes the saved state before Passport exchanges Google's authorization code for the user's profile.
4. The backend finds the account by Google ID, or creates a Google account with its name, email, and optional profile picture. No password is stored for a Google-only account.
5. For website login, the callback issues the same one-hour cookie as password login and redirects to the configured frontend origin. For native login it creates the one-use handoff described below.
6. `AuthProvider` fetches `/user` on page load, including refresh. Protected pages wait for that check, redirect signed-out visitors, and display a retry message on connection failure.

Google signup and login share an endpoint: first login creates an account, subsequent logins reuse it. An existing account with the same email is not automatically linked; use its existing login method. Linking accounts would require a separate authenticated flow.

Password signup now signs the user in immediately. POST `/logout` clears the app cookie and the frontend clears its user state. Password login for a Google-only account shows a helpful message instead of passing an absent password to bcrypt.

## Local configuration

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Google authorized redirect URI: `http://localhost:3000/google/callback`
- Google authorized JavaScript origin: `http://localhost:5173`
- Backend environment: `CLIENT_ID`, `CLIENT_SECRET`, `MONGO_URI`, and `JWT_SECRET` (at least 32 bytes). `COOKIE_KEY` is optional and falls back to `JWT_SECRET` for OAuth state sessions.
- Optional overrides: backend `GOOGLE_CALLBACK_URL` and `FRONTEND_ORIGIN`; frontend `VITE_API_URL`.

Use the same hostname consistently; `localhost` and `127.0.0.1` have different cookies. Restart the backend after changing its environment. Google Console must list the exact configured callback URL.

The current OAuth state session store is in memory, suitable for local development. A restart during Google login requires starting login again. A multi-instance deployment needs a shared session store and correct HTTPS/proxy cookie settings.

## Android Google login: every step

The browser and the Android WebView have separate cookie jars. Opening the app after Google login cannot copy the browser cookie. Instead, the app makes its own authenticated exchange and receives its own HttpOnly cookie.

1. **Start inside the installed app.** `GoogleAuthButton.jsx` detects Capacitor. `googleHandoff.js` generates two independent random values: a 32-byte verifier (the app's temporary secret) and a 32-byte app state (the identifier for this login attempt). It stores these in the app's localStorage with a ten-minute expiry, so Android can stop/restart the app while the browser is open. These values are not the session JWT.
2. **Send proof, not the secret.** The app computes `base64url(SHA256(verifier))`, called the code challenge. It opens `/google?platform=mobile&code_challenge=...&app_state=...` using Capacitor Browser, which uses an Android browser tab outside the WebView. The verifier stays in the app. This is an S256 proof-key binding for our own handoff, separate from Google's authorization code.
3. **Protect the Google round trip.** `startGoogleLogin` validates the mobile parameters and stores the challenge/app state in the server's short-lived OAuth session. It generates a separate random OAuth state and sends the user to Google. The browser receives the `liftit_oauth` cookie. A website login continues to use `platform=web` without a handoff.
4. **Verify Google and find the account.** Google returns to the configured backend callback. `validateGoogleState` checks the session, state and ten-minute expiry, then consumes that state. Passport exchanges Google's authorization code, and `verifyGoogleUser` finds/creates the user. Missing sessions now produce an error instead of hanging the request.
5. **Create a one-use ticket.** For mobile login, the callback creates a random 32-byte handoff code. MongoDB stores only its SHA-256 hash, the challenge, the user ID and a two-minute expiry in the `LoginHandoff` collection. The callback does not set the app-session cookie in the browser. It redirects to `https://myelitelifts.vercel.app/open/?code=...&state=...`. No JWT, password or Google token goes in that URL.
6. **Return to Android.** The existing manifest matches the HTTPS `/open` link. Android can open the installed app when its association is verified and supported links are enabled. If the browser stays on the website, the new `/open` page offers an explicit `elitelifts://open/` link. The fallback carries the same one-use code and state, removes them from the address bar, and sets no-referrer/no-store response headers. It cannot authenticate a different app installation because that installation lacks the verifier.
7. **Handle either app lifecycle.** `NativeAuthListener.jsx` listens for `appUrlOpen` when the app is running and reads `getLaunchUrl()` when it starts. Only the exact HTTPS callback origin/path or the configured custom-scheme callback is accepted. The helper requires the callback's app state to match its pending login; unrelated/stale links cannot consume the current attempt. Duplicate notifications share one exchange request.
8. **Exchange inside the WebView.** The app posts `{ code, verifier }` to `/google/mobile/exchange` using its existing credentialed Axios client. The backend hashes the code, computes the verifier's challenge, checks expiry and atomically deletes the matching MongoDB record. A wrong verifier does not consume the code; concurrent correct requests allow only one success. Expiry is checked in the query because MongoDB TTL deletion is not immediate.
9. **Create the app session.** The backend looks up the user again, then sends the existing one-hour HttpOnly `liftit_session` cookie in the exchange response. That response reaches the app's WebView, so its cookie jar receives the cookie. Future Axios requests send it automatically. JavaScript never reads the JWT.
10. **Show the signed-in home page.** The listener calls `refreshUser()` and only navigates to `/` after `/user` confirms the session. The pending verifier/state are removed after exchange. Cancellation and failed/expired exchanges return to the auth page with a retry message. If an exchange response is lost after the server consumed the code, start a fresh Google login rather than retrying that code.

The old one-second `/user` polling and full-page redirects were removed because they could interrupt the handoff. AuthProvider performs the initial check and the explicit post-exchange refresh; older in-flight checks cannot overwrite a newer result. The authenticated route branch now renders `Outlet` so protected pages can display after login.

## Deployment and Android Studio

Deploy the backend and frontend changes together before testing the new native flow. Uploading only `assetlinks.json` does not deploy the exchange endpoint or the app callback handler. No changes have been committed or pushed automatically.

The local production configuration currently uses:

```text
Frontend VITE_API_URL=https://myelitelifts.vercel.app/backend
Backend FRONTEND_ORIGIN=https://myelitelifts.vercel.app
Backend GOOGLE_CALLBACK_URL=https://myelitelifts.vercel.app/backend/google/callback
Backend NODE_ENV=production
```

Keep the Google authorized redirect URI set to the backend callback above, not `/open/`. Google returns to the backend; the backend then redirects to `/open/`. Confirm these values in the hosting dashboards too: local environment files do not configure Vercel/Render automatically. Keep the login-start URL and callback on the same public host so the browser sends its OAuth session cookie.

The JSON is now in `frontend/public/.well-known/assetlinks.json` and the production build copies it to `dist/.well-known/assetlinks.json`. After deploying, verify that `https://myelitelifts.vercel.app/.well-known/assetlinks.json` returns the JSON with HTTP 200 and no redirect (not your app's HTML).

Its current fingerprint matches this computer's Android debug certificate, and its package name matches `com.example.app`. For a release/Play build, add the actual release/Play app-signing certificate SHA-256 to the same array. The same hosted file can list both fingerprints; don't replace the debug fingerprint if you still test debug builds.

The new Capacitor App and Browser dependencies are installed. After changing frontend code, from `frontend` run:

```powershell
npm run build
npx cap sync android
```

Then rebuild/install the app with Android Studio. Build, sync, and `gradlew.bat assembleDebug` have already succeeded for this implementation. The debug APK is at `frontend/android/app/build/outputs/apk/debug/app-debug.apk`. Production build mode uses the hosted API above. For Android testing with a local backend, remember that emulator `localhost` is the emulator, not your PC; use a reachable HTTPS backend with the appropriate callback/origin/cookie settings. The existing HTTP `npm run dev` configuration is for local browser testing, not a ready-made native OAuth environment.

On a connected Android 12+ device/emulator, after deployment and installation, run these using `adb` from your Android SDK:

```powershell
adb shell pm verify-app-links --re-verify com.example.app
# Wait for verification to finish, then inspect:
adb shell pm get-app-links com.example.app
adb shell am start -W -a android.intent.action.VIEW -c android.intent.category.BROWSABLE -d "https://myelitelifts.vercel.app/open/"
```

The last command checks link opening only. It deliberately has no login code and cannot sign you in. To test the full flow, start Google login from the installed app, complete consent, verify that the home page shows the user, open a protected page, restart the app, and log out. Also test cancellation and returning after a two-minute handoff expiry. Check a cold launch by allowing Android to stop the app while Google is open, then finishing sign-in.

Starting login in an ordinary phone browser still logs into the website. The app-created secret is what allows native login to safely return a session to the originating installation.

The handoff records are in MongoDB and work across backend instances. The pre-existing Google OAuth session store is still in-memory: a server restart interrupts an in-progress Google login, and multiple backend instances require a shared session store before scaling.

## Verification

- Run `npm test` in `backend`: password login, signup, cookie flags and expiry, protected requests, origin protection, production Google state middleware, mocked Google code exchange, new/returning Google users, missing email, account conflicts, cancellation, callback failures, logout, and mobile handoff expiry/proof/replay/concurrency checks. Tests mock database operations and Google responses. Signup email delivery is intercepted; no real welcome emails are sent.
- Run `npm test` in `frontend`: callback URL validation, proof generation, cold-start storage recovery, duplicate callback deduplication, wrong/missing state, expiry, cancellation and exchange failures.
- Run `npm run build` in `frontend`.
- The handoff implementation's backend/frontend tests, production frontend build, Android plugin sync, and Android debug APK build passed. Database concurrency is exercised with an atomic-operation mock, not a live MongoDB race test.
- Final manual check: complete Google login on an Android device/emulator after deploying. A real Google credential exchange and Android end-to-end login were not performed during this implementation.
