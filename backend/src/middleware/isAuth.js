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
