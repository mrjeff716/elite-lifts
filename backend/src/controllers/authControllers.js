import bcrypt from 'bcrypt'
import User from '../models/User.js'
import { validationResult } from 'express-validator'
import { authCookieName, authCookieOptions, setAuthCookie } from '../config/auth.js'
import { Resend } from 'resend'
import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config()

const resend = new Resend(process.env.RESEND_API_KEY)

export const postSignup = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body

    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      const error = new Error('Validation failed')
      error.statusCode = 422
      error.data = errors.array()
      throw error
    }

    if (password !== confirmPassword) {
      return res.status(422).json({ message: 'Passwords do not match' })
    }
    const matchingUser = await User.findOne({ email: email })
    if (matchingUser) {
      const error = new Error('Error, this email is already used')
      error.statusCode = 401
      throw error
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await new User({ name, email, password: hashedPassword })
    await user.save()
    setAuthCookie(res, user)
    const { password: passwordHash, ...publicUser } = user.toObject()
    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: 'thisisjeffry77@gmail.com',
      subject: 'Elite Lifts Account Creation',
      html: `<h1>Subject: Welcome to Liftit 💪
            Hey {{name}},
            Welcome to Liftit! You’re ready to log your workouts, track your progress, and make every session count.
            Start by logging your first workout—your progress starts here.
            <a href="http://localhost:5173/workout">[Start your first workout]</a>
            See you at your next session,
            The Liftit Team</h1>`,
    });

    if (error) {
      const error = new Error(`Couldn't send the email, please try again later`)
      throw error
    }

    console.log({ data });
    res.status(201).json({ message: 'User created successfully', user: publicUser })
    console.log('Signed up successfully')
  } catch (error) {
    console.log(error)
    next(error)
  }

}


export const postLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      const error = new Error('Validation failed')
      error.statusCode = 422
      error.data = errors.array()
      throw error
    }

    const user = await User.findOne({ email: email })

    if (!user) {
      const error = new Error('Error: User can not be found.')
      error.statusCode = 401
      throw error
    }

    if (!user.password) {
      return res.status(401).json({ message: 'This account uses Google. Please sign in with Google.' })
    }
    const isEqual = await bcrypt.compare(password, user.password)

    if (!isEqual) {
      const error = new Error('Wrong email or password, please try again.')
      error.statusCode = 401
      throw error
    }

    setAuthCookie(res, user)
    const { password: passwordHash, ...publicUser } = user.toObject()
    res.status(200).json({ message: 'User verified', user: publicUser })
    console.log('Logged in successfully')

  } catch (error) {
    next(error)
  }
}

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('-password')
    if (!user) return res.status(401).json({ message: 'Not authenticated' })
    res.json({ user })
  } catch (error) {
    next(error)
  }
}


export const postLogout = (req, res) => {
  const { maxAge, ...cookieOptions } = authCookieOptions
  res.clearCookie(authCookieName, cookieOptions)
  return res.status(200).json({ message: 'Logged out successfully' })
}

export const deleteAccount = async (req, res, next) => {
  try {
    const { maxAge, ...cookieOptions } = authCookieOptions
    const { id } = req.params
    res.clearCookie(authCookieName, cookieOptions)
    const user = await User.findByIdAndDelete(id)
    res.status(200).json({ message: 'Account deleted successfully.' })
  } catch (error) {
    next(error)
  }

}

export const resetPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    const validationErrors = validationResult(req)
    console.log('Validation Errors:', validationErrors)
    if (!validationErrors.isEmpty()) {
      const error = new Error(validationErrors.errors[0].msg)
      error.message = validationErrors.errors[0].msg
      console.log(error)
      error.statusCode = 422
      throw error
    }
    crypto.randomBytes(32, async (err, buffer) => {
      if (err) {
        console.log(err)
        throw err
      }
      const token = buffer.toString('hex')
      const user = await User.findOne({ email: email })
      if (!user) {
        const error = new Error('User not found')
        error.statusCode = 404
        throw error
      }
      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 3600000
      user.save()
      resend.emails.send({
        to: email,
        from: 'onBoarding@resend.dev',
        subject: 'Password reset',
        html: `
          <h1>You requested a password reset</h1>
          <h3>Forgot your password? It happens. Click below to choose a new one and get back to tracking your progress</h3>
          <p>Click this <a href="http://localhost:5173/reset-password/${token}?userId=${user._id}">link</a> to set a new password
          <p>If you didn’t request a password reset, you can ignore this email. Your password will stay the same.</p>
          `
      })
      res.status(200).json({ message: 'An email has been sent to reset your account', user })
    })
  } catch (err) {
    return next(err);
  }
}

export const postNewPassword = async (req, res, next) => {
  try {
    const { newPassword, confirmNewPassword } = req.body
    const { userId } = req.query
    const { token } = req.params
    if (newPassword !== confirmNewPassword) {
      const error = new Error('Passwords do Not match')
      error.status = 429
      throw error
    }
    console.log({newPassword, userId, token})
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
      _id: userId
    })

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    user.password = hashedPassword
    user.resetToken = null
    user.resetTokenExpiration = undefined
    await user.save()
    res.status(201).json({message: 'Password reset successfully'})
  } catch (err) {
    next(err);
  }
}