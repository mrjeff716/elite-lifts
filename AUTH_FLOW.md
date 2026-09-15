# Authentication flow

Both email/password and Google login use the same HttpOnly `liftit_session` cookie. React never reads the JWT. Axios sends the cookie to the backend, where `isAuth` validates it before protected API requests.

## Google signup and login

1. Either Google button navigates to the backend's `/google` route.
2. Passport redirects to Google with a random state value. A short-lived `liftit_oauth` session preserves that value to validate the callback.
3. Google returns to `/google/callback`. Passport validates state and exchanges the authorization code for the user's profile.
4. The backend finds the account by Google ID, or creates a Google account with its name, email, and optional profile picture. No password is stored for a Google-only account.
5. The callback issues the same one-hour app cookie as password login and redirects to the configured frontend origin.
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

## Verification

- Run `npm test` in `backend`: password login, signup, cookie flags and expiry, protected requests, origin protection, real Passport state handling, mocked Google code exchange, new/returning Google users, missing email, account conflicts, cancellation, callback failures, and logout.
- Run `npm run build` in `frontend`.
- Browser checks covered both button layouts, navigation to Google's real sign-in page, cancellation returning to a visible error, and signed-out protected-page redirects.
- MongoDB connection was verified. Automated authentication tests mock database writes and Google's token/profile responses; they do not create real accounts.
- Final manual check: finish Google consent with your account, open workouts/settings, refresh, and log out. A real Google credential exchange and account creation were not performed during this review.
