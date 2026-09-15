import express from 'express'
import { postSignup, postLogin, getUser, postLogout, deleteAccount, resetPassword, postNewPassword } from '../controllers/authControllers.js'
import { check, body } from 'express-validator'
import isAuth from  '../middleware/isAuth.js'
import passport from 'passport'
import { googleCallback } from '../controllers/googleAuth.js'

const router = express.Router()

router.get('/google', passport.authenticate('google',
  {scope: ['profile', 'email']}
))

router.get('/google/callback', googleCallback(passport))
router.get('/auth/user', isAuth, getUser)

router.post('/signup', [
  body('name').isLength({min:3}),
  check('email').isEmail().withMessage('Please insert a valid email'),
  check('password').isLength({min:5})
], postSignup)

router.post('/login', [
  check('email').isEmail().withMessage('Please insert a valid email'),
  check('password').isLength({min:5})
], postLogin)

router.get('/user', isAuth, getUser)

router.post('/logout', postLogout)

router.delete('/delete-user/:id', isAuth, deleteAccount)

router.post('/reset-password', [
  check('email').isEmail().withMessage('Please insert a valid email')
], resetPassword)

router.post('/reset-password/:token', [
  check('newPassword').isLength({min: 5}).withMessage('Password is not long enough'),
  check('confirmNewPassword').isLength({min: 5}).withMessage('Password is not long enough')
], postNewPassword)


export default router
