import React from "react";
import { Route, Routes, Navigate, Outlet } from "react-router";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from './context/AuthContext'
import HomePage from "./pages/HomePage";
import ExercisePage from "./pages/ExercisePage";
import ExerciseDetailsPage from "./pages/ExerciseDetailsPage";
import Auth from "./pages/Auth";
import WorkoutPage from "./pages/WorkoutPage";
import StartWorkout from "./pages/StartWorkout";
import FinishWorkout from "./pages/FinishWorkout";
import Loader from './components/Loader'
import WorkoutDetails from "./pages/WorkoutDetails";
import Settings from './pages/Settings'
import FeedPage from './pages/FeedPage'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from "./pages/ResetPassword";

const App = () => {
  const { user, setUser, loading, error, refreshUser } = useContext(AuthContext)
  const [workout, setWorkout] = useState(
    getWorkoutFromStorage() || {
      user: user,
      workoutSplit: "My split",
      workoutName: "My workout",
      duration: '',
      exercises: [],
      notes: "",
      createdAt: '',
      completed: false,
    },
  );

  useEffect(() => {
    localStorage.setItem("workout", JSON.stringify(workout));
  }, [workout]);

  function getWorkoutFromStorage() {
    const workout = JSON.parse(localStorage.getItem("workout")) || {
      user: user,
      workoutSplit: "My split",
      workoutName: "My workout",
      duration: '',
      exercises: [],
      notes: "",
      createdAt: '',
      completed: false,
    };

    return workout;
  }

  return (
    <div>
      <Routes>
        {/*<Route path="/" element={}></Route>*/}
        <Route path="/" element={<HomePage user={user} />}></Route>
        <Route
          path="/exercises"
          element={<ExercisePage  />}
        ></Route>
        <Route
          path="/exercises/:exerciseId"
          element={<ExerciseDetailsPage />}
        ></Route>
        <Route
          path="/auth"
          element={user ? <Navigate to="/" replace /> : <Auth setUser={setUser} />}
        ></Route>
        <Route path="/forgot-password" element={<ForgotPassword />}></Route>
        <Route path="/reset-password/:token" element={<ResetPassword />}></Route>
        <Route element={loading ? <Loader /> : error ? (
          <div role="alert" className="min-h-screen flex flex-col items-center justify-center gap-4 text-text px-6 text-center">
            <p>{error}</p><button onClick={refreshUser} className="rounded-xl bg-primary px-6 py-3 text-white">Try again</button>
          </div>
        ) : user ? <Outlet /> : <Navigate to="/auth" replace />}>
        <Route path="/workout" element={<WorkoutPage workout={workout} setWorkout={setWorkout} user={user} setUser={setUser} />}></Route>
        <Route
          path="/start-workout/:_id"
          element={
            <StartWorkout
              
              user={user}
              workout={workout}
              setWorkout={setWorkout}
            />
          }
        ></Route>
        <Route
          path="/workout/workout-details/:id"
          element={
            <WorkoutDetails
              
              user={user}
              workout={workout}
              setWorkout={setWorkout}
            />
          }
        ></Route>
        <Route
          path="/finish-workout/:workoutId"
          element={
            <FinishWorkout
              user={user}
              workout={workout}
              setWorkout={setWorkout}
            />
          }
        ></Route>
        <Route path='/feed' element={<FeedPage user={user} />}></Route>
        <Route
          path="/settings"
          element={
            <Settings
              user={user}
              setUser={setUser}
            />
          }
        ></Route>
        </Route>
      </Routes>
    </div>
  );
};

export default App;
