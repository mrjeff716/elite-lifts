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
