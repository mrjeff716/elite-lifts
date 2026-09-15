import passport from 'passport'
import dotenv from 'dotenv'
import { Strategy as GoogleStrategy } from  'passport-google-oauth20'
import { verifyGoogleUser } from '../controllers/googleAuth.js'

dotenv.config()

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/google/callback',
  state: true,
}, verifyGoogleUser))

export default passport
