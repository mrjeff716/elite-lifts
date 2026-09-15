import express from 'express'
import {
  getAllExercises,
  getExercise,
  startWorkout,
  checkWorkoutStatus,
  finishWorkout,
  getWorkouts,
  getWorkout,
  updateUser,
  deleteWorkout,
  workoutsMonth,
  workoutsWeek,
  aiAnalysis,
  editWorkout,
  postWorkoutToFeed,
  getPosts
} from '../controllers/userControllers.js'
import isAuth from '../middleware/isAuth.js'
import { check, body } from 'express-validator'

const router = express.Router()

router.get('/home/workouts-month', isAuth, workoutsMonth)

router.get('/home/workouts-week', isAuth, workoutsWeek)

router.get('/workout-status', isAuth, checkWorkoutStatus)

router.post('/start-workout', isAuth, startWorkout)

router.get('/workout/workout-details/:id', getWorkout)

router.put('/workout/workout-details/:id', editWorkout)

router.get('/workouts', isAuth, getWorkouts)

router.post('/finish-workout/:workoutId', [
  check('workoutName').isLength({ min: 1 }),
  check('workoutSplit').isLength({ min: 1 })
], isAuth, finishWorkout)

router.post('/ai-analysis', isAuth, aiAnalysis)

router.get('/exercise/:exerciseId', isAuth, getExercise)

router.get('/posts', isAuth, getPosts)

router.get('/:primaryMuscles', isAuth, getAllExercises)

router.post('/settings', isAuth, updateUser)

router.delete('/delete-workout/:id', isAuth, deleteWorkout)

router.post('/post-workout', [
  check('title').isLength({min: 2}),
  check('description').isLength({min:2})
], isAuth, postWorkoutToFeed)



export default router