import bcrypt from 'bcrypt'
import User from '../models/User.js'
import { validationResult } from 'express-validator'
import { authCookieName, authCookieOptions, setAuthCookie } from '../config/auth.js'
import sendEmail from '../config/sendEmail.js'
import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config()

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
    const safeName = String(name ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));
    await sendEmail(email, 'Elite Lifts Account Creation',
      `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Elite Lifts</title>
        </head>
        <body style="margin:0;padding:0;background-color:#0b1120;font-family:Arial,Helvetica,sans-serif;">
          <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
            Your account is ready. Let’s make your next workout count.
          </div>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
            style="background-color:#0b1120;">
            <tr>
              <td align="center" style="padding:40px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                  style="max-width:560px;">

                  <tr>
                    <td style="padding:0 0 24px;color:#60a5fa;font-size:18px;font-weight:700;letter-spacing:3px;">
                      ELITE LIFTS
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:36px 28px;background-color:#111c30;border:1px solid #263449;border-top:4px solid #3b82f6;border-radius:16px;">
                      <p style="margin:0 0 16px;color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:2px;">
                        YOUR FIRST REP STARTS HERE
                      </p>

                      <h1 style="margin:0 0 20px;color:#f8fafc;font-size:30px;line-height:1.25;">
                        Welcome, ${safeName}!
                      </h1>

                      <p style="margin:0 0 28px;color:#cbd5e1;font-size:16px;line-height:1.7;">
                        Your Elite Lifts account is ready. Whether you’re chasing
                        a personal best or building a consistent routine, you now
                        have a place to track every step.
                      </p>

                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                        style="background-color:#17243a;border-radius:12px;">
                        <tr>
                          <td style="padding:22px;">
                            <p style="margin:0 0 14px;color:#f8fafc;font-size:16px;font-weight:700;">
                              Make your next workout count.
                            </p>
                            <p style="margin:0 0 10px;color:#cbd5e1;font-size:14px;line-height:1.6;">
                              <strong style="color:#93c5fd;">Log your workouts</strong><br>
                              Keep your exercises, sets, and reps in one place.
                            </p>
                            <p style="margin:0 0 10px;color:#cbd5e1;font-size:14px;line-height:1.6;">
                              <strong style="color:#93c5fd;">See your progress</strong><br>
                              Look back at your sessions and see how far you’ve come.
                            </p>
                            <p style="margin:0;color:#cbd5e1;font-size:14px;line-height:1.6;">
                              <strong style="color:#93c5fd;">Build consistency</strong><br>
                              Show up, put in the work, and keep moving forward.
                            </p>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" cellspacing="0" cellpadding="0"
                        style="margin-top:28px;">
                        <tr>
                          <td align="center" bgcolor="#2563eb" style="border-radius:8px;">
                            <a href="https://myelitelifts.vercel.app/"
                              style="display:inline-block;padding:16px 28px;border:1px solid #2563eb;border-radius:8px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;">
                              Open Elite Lifts &rarr;
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:28px 0 0;color:#94a3b8;font-size:14px;line-height:1.7;">
                        See you at your next session,<br>
                        <strong style="color:#e2e8f0;">The Elite Lifts Team</strong>
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td align="center" style="padding:24px 12px;color:#94a3b8;font-size:12px;line-height:1.7;">
                      You received this email because this address was used to create
                      an Elite Lifts account.<br>
                      If you didn’t create an account, you can ignore this email.
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        `)

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
      //http://localhost:5173/reset-password/${token}?userId=${user._id}
      sendEmail(email, 'Elite Lifts Account Password Reset', `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background-color:#0b1120;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    Reset your Elite Lifts password and get back to your training.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
    style="background-color:#0b1120;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
          style="max-width:560px;">

          <tr>
            <td style="padding-bottom:24px;color:#60a5fa;font-size:18px;font-weight:700;letter-spacing:3px;">
              ELITE LIFTS
            </td>
          </tr>

          <tr>
            <td style="padding:36px 28px;background-color:#111c30;border:1px solid #263449;border-top:4px solid #3b82f6;border-radius:16px;">
              <p style="margin:0 0 16px;color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:2px;">
                PASSWORD RESET
              </p>

              <h1 style="margin:0 0 20px;color:#f8fafc;font-size:30px;line-height:1.25;">
                Let’s get you back in.
              </h1>

              <p style="margin:0 0 28px;color:#cbd5e1;font-size:16px;line-height:1.7;">
                We received a request to reset your Elite Lifts password.
                Click the button below to choose a new one.
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" bgcolor="#2563eb" style="border-radius:8px;">
                    <a href="https://myelitelifts.vercel.app/reset-password/${encodeURIComponent(token)}?userId=${encodeURIComponent(user._id.toString())}"
                      style="display:inline-block;padding:16px 28px;border:1px solid #2563eb;border-radius:8px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;">
                      Reset my password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;padding:18px;background-color:#17243a;border-radius:10px;color:#cbd5e1;font-size:14px;line-height:1.7;">
                Didn’t request this? You can ignore this email.
                Your password will stay unchanged.
              </p>

              <p style="margin:24px 0 8px;color:#94a3b8;font-size:12px;line-height:1.7;">
                If the button doesn’t work, copy and paste this link into your browser:
              </p>

              <p style="margin:0;color:#93c5fd;font-size:12px;line-height:1.7;word-break:break-all;">
                https://myelitelifts.vercel.app/reset-password/${encodeURIComponent(token)}?userId=${encodeURIComponent(user._id.toString())}
              </p>

              <p style="margin:28px 0 0;color:#94a3b8;font-size:14px;line-height:1.7;">
                The Elite Lifts Team
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:24px 12px;color:#94a3b8;font-size:12px;line-height:1.7;">
              Keep this link private. It lets you reset your password.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`)
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
    console.log({ newPassword, userId, token })
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
    res.status(201).json({ message: 'Password reset successfully' })
  } catch (err) {
    next(err);
  }
}