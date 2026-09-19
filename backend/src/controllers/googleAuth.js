import User from '../models/User.js'
import { frontendOrigin, setAuthCookie } from '../config/auth.js'

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
    return done(error)
  }
}

export function googleCallback(passport) {
  return (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      const failure = (code) => res.redirect(`${frontendOrigin}/auth?error=${code}`)
      if (err) return failure('google_failed')
      if (!user) {
        const code = ['account_exists', 'google_email_missing'].includes(info?.message)
          ? info.message : 'google_cancelled'
        return failure(code)
      }
      try {
        setAuthCookie(res, user)
        return res.redirect(`${frontendOrigin}/`)
      } catch (error) {
        return next(error)
      }
    })(req, res, next)
  }
}
