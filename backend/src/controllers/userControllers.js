import Exercise from "../models/Exercise.js";
import User from "../models/User.js";
import Feed from '../models/Feed.js'
import WorkoutSession from "../models/workoutSession.js"
import mongoose from 'mongoose'
import { validationResult } from 'express-validator'
import prompt from '../config/prompt.js'
import dotenv from 'dotenv'

dotenv.config()

export const getAllExercises = async (req, res, next) => {
  try {
    const primaryMuscles = req.params.primaryMuscles
    const exercises = await Exercise.find({ "primaryMuscles.0": primaryMuscles })
    //const exercises = allExercises.filter(exercise => exercise.primaryMuscles[0] === primaryMuscles)
    res.status(200).json(exercises)
  } catch (error) {
    next(error)
  }
}

export const getExercise = async (req, res, next) => {
  try {
    const exerciseId = req.params.exerciseId
    const exercise = await Exercise.find({ exerciseId: exerciseId })
    res.status(200).json(exercise)
  } catch (error) {
    next(error)
  }
}

export const startWorkout = async (req, res, next) => {
  try {
    const { user, workoutSplit, workoutName, exercises, notes, completed } = req.body

    const userId = new mongoose.Types.ObjectId(user._id)

    const workout = await new WorkoutSession({
      userId: userId,
      workoutSplit: workoutSplit,
      workoutName: workoutName,
      exercises: exercises,
      notes: notes,
      completed: completed
    })
    await workout.save()

    const dbUser = await User.findById(req.userId)
    dbUser.workouts.push(workout._id)
    await dbUser.save()
    res.status(201).json({ workout, message: 'workout added' })
  } catch (error) {
    next(error)
  }
}

export const getWorkouts = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
    const dbWorkouts = await WorkoutSession.find({
      userId: req.userId,
      completed: true,
    }).sort({ createdAt: -1 })
    const workouts = dbWorkouts.filter(workout =>
      user.workouts.some(id =>
        id.toString() === workout._id.toString()
      )
    )
    console.log(workouts)
    res.status(200).json({ workouts })
  } catch (error) {
    next(error)
  }
}

export const getWorkout = async (req, res, next) => {
  try {
    const { id } = req.params
    const workoutSession = await WorkoutSession.findById(id)
    res.status(200).json({ workout: workoutSession, message: 'Workout session found!' })
    console.log(workoutSession)
  } catch (error) {
    next(error)
  }
}

export const finishWorkout = async (req, res, next) => {
  try {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      const error = new Error('Please fill in the required form')
      error.statusCode = 400
      error.data = errors.array()
      throw error
    }

    const { userId, workoutSplit, workoutName, duration, exercises, notes, completed } = req.body
    const { workoutId } = req.params
    const workoutSession = await WorkoutSession.findById(workoutId)
    workoutSession.userId = userId
    workoutSession.workoutSplit = workoutSplit
    workoutSession.workoutName = workoutName
    workoutSession.duration = duration
    workoutSession.exercises = exercises
    workoutSession.notes = notes
    workoutSession.completed = completed
    await workoutSession.save()
    res.status(201).json({ workout: workoutSession, message: 'Workout Saved Successfully' })
  } catch (error) {
    next(error)
  }
}

export const editWorkout = async (req, res, next) => {
  try {
    const { aiAnalysis } = req.body
    const { id } = req.params
    const workout = await WorkoutSession.findById(id)
    workout.aiAnalysis = aiAnalysis
    await workout.save()
    res.status(201).json({ message: 'Workout saved successfully', workout })
  } catch (error) {
    next(error)
  }
}

export const checkWorkoutStatus = async (req, res, next) => {
  try {
    const workoutSession = await WorkoutSession.findOne({
      userId: req.userId,
      completed: false
    })
    console.log(workoutSession)
    if (workoutSession) {
      res.status(200).json({ workoutSession: workoutSession, workoutCompleted: false, message: "this workout has just been started or hasn't been completed yet." })
    }
    else res.status(200).json({ workoutSession: workoutSession, workoutCompleted: true, message: "this workout has just been started or hasn't been completed yet." })
  } catch (error) {
    next(error)
  }
}

export const updateUser = async (req, res, next) => {
  try {
    const { id, email, name, workouts, weightUnit, workoutsPerWeek } = req.body
    let dbUser = await User.findById(id)
    dbUser.email = email
    dbUser.name = name
    dbUser.password = dbUser.password
    dbUser.workouts = workouts
    dbUser.weightUnit = weightUnit
    dbUser.workoutsPerWeek = workoutsPerWeek
    dbUser.save()
    console.log('User saved successfully')
    res.status(201).json({ user: dbUser, message: 'Updated user successfully' })
  } catch (error) {
    next(error)
  }
}

export const deleteWorkout = async (req, res, next) => {
  try {
    const { id } = req.params
    await WorkoutSession.findByIdAndDelete(id)
    console.log('Workout session deleted')
    const user = await User.findById(req.userId)
    user.workouts = user.workouts.filter(w => w.toString() !== id.toString())
    await user.save()
    console.log('Workout from user deleted')
    console.log('Workout Deleted Successfully')
    res.status(200).json({ message: 'Workout Deleted Successfully' })
  } catch (error) {
    next(error)
  }
}

export const workoutsMonth = async (req, res, next) => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const workouts = await WorkoutSession.find({
      userId: req.userId,
      completed: true,
      createdAt: { $gte: oneMonthAgo },
    }).sort({ createdAt: -1 });
    res.status(200).json({ workouts })
  } catch (error) {
    next(error)
  }
}

export const workoutsWeek = async (req, res, next) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const workouts = await WorkoutSession.find({
      userId: req.userId,
      completed: true,
      createdAt: { $gte: oneWeekAgo },
    }).sort({ createdAt: -1 });
    res.status(200).json({ workouts })
  } catch (error) {
    next(error)
  }
}

export const aiAnalysis = async (req, res, next) => {
  try {
    const { workouts } = req.body
    console.log('request sent')
    let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "openrouter/free",
        "messages": [
          {
            "role": "user",
            "content": prompt(workouts)
          }
        ],
        "reasoning": { "enabled": true }
      })
    });


    // Extract the assistant message with reasoning_details and save it to the response variable
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.error?.message || "Provider returned error");
    }
    if (!response.ok) {
      const error = new Error(
        result.error?.message || "AI analysis request failed"
      );
      error.status = response.status;
      throw error;
    }

    const message = result.choices?.[0]?.message;

    if (!message?.content) {
      const error = new Error("AI returned an empty analysis");
      error.status = 502;
      throw error;
    }
    res.status(201).json({ response: message })
  } catch (error) {
    next(error)
  }

}

export const postWorkoutToFeed = async (req, res, next) => {
  try {
    const { title, description, includeExercises, ...workout } = req.body

    const totals = workout.workout.exercises.reduce((groups, exercise) => {
      const muscle = exercise?.primaryMuscle?.toLowerCase() === 'abs' ? 'abdominals' : exercise?.primaryMuscle?.toLowerCase();
      groups[muscle] = (groups[muscle] || 0) + exercise.sets.length;
      return groups;
    }, {});

    console.log(totals)

    const mostFocused = Object.entries(totals).reduce(
      (max, [muscleGroup, sets]) =>
        !max || sets > max.sets ? { muscleGroup, sets } : max,
      null
    );
    console.log(mostFocused)

    const user = await User.findById(req.userId)
    const newPost = await new Feed({
      title,
      description,
      exercises: includeExercises ? workout.workout.exercises : [],
      userId: workout.workout.userId,
      userName: user.name,
      mostFocusedMuscle: mostFocused.muscleGroup,
    })
    await newPost.save()
    res.status(201).json({ message: 'Workout posted SuccessFully', newPost })
  } catch (error) {
    next(error)
  }
}

export const getPosts = async (req, res, next) => {
  try {
    const posts = await Feed.find().sort({ createdAt: -1 })
    console.log(posts)
    res.status(200).json({ posts, message: 'Feed found successfully' })
  } catch (error) {
    next(error)
  }
}