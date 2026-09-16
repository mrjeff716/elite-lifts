import axios from "../api";
import Navbar from "../components/Navbar";
import { useNavigate } from 'react-router'
import { useEffect, useState, useRef } from 'react'
import Loader from '../components/Loader'
import Workout from '../components/Workout'
import { toast } from 'react-hot-toast'

export default function WorkoutPage({workout, user, setWorkout}) {
  const [isWorkoutCompleted, setIsWorkoutCompleted] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [workoutId, setWorkoutId] = useState('')
  const [workouts, setWorkouts] = useState([])
  const navigate = useNavigate()
  const workoutPage = useRef()

  useEffect(() => {
    if (workoutPage.current !== null) {
      workoutPage.current.scrollIntoView()
    }
  }, [])

  useEffect(() => {  //safety useEffect
    setWorkout((prevWorkout) => {
      return {...prevWorkout, user: user, workoutName: 'My workout', workoutSplit: 'My Split'}
    })
  }, [])

  useEffect(() => {
    async function checkIfWorkoutHasStarted() {
      try {
        const res = await axios.get('/api/workout-status', {
          headers: {
            'Accept': 'application/json',
          }
        })
        if (res.data.workoutCompleted == false) {
          setIsWorkoutCompleted(false)
          setWorkoutId(res.data.workoutSession._id)
        }
        if (res.data.workoutCompleted == true) {
          setIsWorkoutCompleted(true)
        }
      } catch (error) {
        if (error.response?.status ===  401 || error.response?.statusCode === 401) {
          navigate('/auth')
        }
      }
    }
    checkIfWorkoutHasStarted()
  }, [navigate])


  useEffect(() => {
    async function getWorkouts() {
      try {
        const res = await axios.get('/api/workouts', {
          headers: {

            'Accept': 'application/json',
          }
        })
        if (res.status === 200) {
          setWorkouts(res.data.workouts)
        }
      } catch (error) {
      } finally {
        setIsLoading(false)
      }
    }
    getWorkouts()
  }, [])

  async function startWorkout() {
    try {
      const res = await axios.post('/api/start-workout', {
        user: workout.user,
        workoutSplit: workout.workoutSplit || 'My split',
        workoutName: workout.workoutName,
        duration: workout.duration,
        exercises: workout.exercises,
        createdAt: new Date().toISOString(),
        notes: workout.notes,
        completed: workout.completed
      }, {
        headers: {
          'Accept': 'application/json',
        }
      })
      
      setWorkoutId(res.data.workout._id.toString())
      setWorkout(prevWorkout => {
        return {...prevWorkout, createdAt: res.data.workout.createdAt}
      })

      navigate(`/start-workout/${res.data.workout._id}`)
      
      if (res.status !== 201) {
      }
    } catch (error) {
    }
  }


  async function deleteWorkout() {
    try {
      const res = await axios.delete(`/api/delete-workout/${workoutId}`, {
        headers: {
          'Accept': 'application/json',
        }
      })

      navigate(`/workout`)
      
      if (res.status !== 200) {
      }
      res.status === 200 && toast.success(res.data.message)
    } catch (error) {
    } finally {
      setWorkout({
      user: user,
      workoutSplit: "My split",
      workoutName: "My workout",
      duration: '',
      exercises: [],
      notes: "",
      createdAt: '',
      completed: false,
    })
    setIsWorkoutCompleted(true)
    }
  }


  function LoadWorkouts() {
    return workouts.map(w => {
      return <Workout workout={w} />
    })
  }

  return (
    <div className="scroll-mt-10" ref={workoutPage}>
      <Navbar />
    <div className="min-h-screen bg-background text-text px-4 py-6 md:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Hero */}
        <section className="bg-card border border-border/10 rounded-3xl p-6 md:p-8">
          <p className="text-primary font-medium text-sm">
            Time to train
          </p>

          <h1 className="text-3xl md:text-4xl font-bold mt-2">
            Make today stronger than yesterday.
          </h1>

          <p className="text-muted mt-3 max-w-xl">
            Start your workout, track your exercises, and keep building your
            progress one session at a time.
          </p>

          
          <div className="mt-6 flex flex-wrap gap-3">
          <button className="bg-primary hover:bg-primaryHover text-white font-semibold px-6 py-3 rounded-xl transition"
          onClick={async() => {
            if (isWorkoutCompleted) {
              await startWorkout()
            } else if (isWorkoutCompleted === false) {
              return workoutId && navigate(`/start-workout/${workoutId}`)
            }
          }}>
            {isWorkoutCompleted ? 'Start Workout' : 'Continue Workout'}
          </button>
          <button
            type="button"
            hidden={isWorkoutCompleted}
            className="rounded-xl border border-red-400/30 bg-red-500/10 px-6 py-3 font-semibold text-red-400 transition hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            onClick={() => {
              if (confirm('Are you sure you want to delete this workout')) {{
                deleteWorkout()
              }}
            }}
          >
            Discard Workout
          </button>
          </div>

          
        </section>

        {/* Workout History */}
        <section className="mt-8">

          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">
                Your Workouts
              </h2>

              <p className="text-muted text-sm mt-1">
                Your recent training sessions
              </p>
            </div>
          </div>

          

          <div className="space-y-4">
          {<LoadWorkouts />}
          </div>

        </section>

      </div>
    </div>
    <div className="mt-32"></div>
    </div>
  );
}
