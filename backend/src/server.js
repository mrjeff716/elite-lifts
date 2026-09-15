import express from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'

import userRoutes from './routes/userRoutes.js'
import authRoutes from './routes/authRoutes.js'
import connectDB from './config/db.js'
//import rateLimiter from './middleware/rateLimiter.js'
import path from 'path'

import cors from 'cors'
import cookieParser from 'cookie-parser'
import { frontendOrigin, getJwtSecret } from './config/auth.js'
import checkOrigin from './middleware/checkOrigin.js'
import { fileURLToPath } from 'url'
import session from 'express-session'
import passport from './config/passport.js'

const app = express()
const PORT = process.env.PORT || 3000
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

// Render terminates HTTPS at its reverse proxy; secure OAuth cookies need this.
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1)

app.use(bodyParser.json())

getJwtSecret() // Fail at startup instead of accepting an insecure signing secret.
app.use(cors({ origin: frontendOrigin || 'https://myelitelifts.vercel.app/', credentials: true }))
app.use(cookieParser())
app.use(checkOrigin)
app.use(session({
  name: 'liftit_oauth',
  secret: process.env.COOKIE_KEY || getJwtSecret(),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 10 * 60 * 1000 }
}))

app.use(passport.initialize());

  app.use(
  "/images",
  express.static(path.join(__dirname, "public/images"))
);

//app.use(rateLimiter)
app.use('/', authRoutes)
app.use('/api', userRoutes)

app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500
  const message = err.message
  const data = err.data
  console.log(err)
  res.status(status).json({status, message, data})
})

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "../frontend/dist")))

//   app.get(/.*/, (req, res, next) => {
//     res.sendFile(path.join(__dirname, "../frontend/dist/index.html"))
//   })
// }

connectDB().then(() => {
  app.listen(PORT)
}).catch(err => console.log(err))
