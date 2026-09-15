import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import toast from "react-hot-toast";
import axios from "../api";

const FinishWorkout = ({ workout, setWorkout, user }) => {
  const workoutId = useParams().workoutId;

  const navigate = useNavigate();

  console.log(workout);

  useEffect(() => {
    const completedAt = new Date();
    const startedAt = new Date(workout.createdAt);
    const differenceInMilliseconds = completedAt - startedAt;

    const seconds = Math.floor(differenceInMilliseconds / 1000);
    const totalSeconds = (seconds % 60).toString();
    const minutes = Math.floor(differenceInMilliseconds / 60000);
    const totalMinutes = (minutes % 60).toString();
    const totalHours = Math.floor(
      differenceInMilliseconds / 3600000,
    ).toString();

    setWorkout((prevWorkout) => {
      return {
        ...prevWorkout,
        duration: ` ${totalHours}:${totalMinutes}:${totalSeconds}`,
        completed: true,
      };
    });
  }, []);

  async function handleSubmit(e) {
    try {
      const workoutExercises = workout.exercises.map((ex) => {
        return {
          ...ex,
          sets: ex.sets.map((set) => {
            return {
              ...set,
              weight: `${set.weight} ${user.weightUnit}`,
            };
          }),
        };
      });
      e.preventDefault();
      const res = await axios.post(
        `/api/finish-workout/${workoutId}`,
        {
          userId: workout.user._id,
          workoutSplit: workout.workoutSplit,
          workoutName: workout.workoutName,
          duration: workout.duration,
          exercises: workoutExercises,
          notes: workout.notes,
          completed: true,
        },
        {
          headers: {
            Accept: "application/json",
          },
        },
      );
      console.log(res);
      if (res.status === 201) {
        setWorkout((prev) => {
          return {
            ...prev,
            workoutName: "My workout",
            workoutSplit: "",
            notes: "",
            duration: "",
            createdAt: "",
            completed: false,
            exercises: [],
          };
        });
        toast.success("Workout Saved Successfully");
        navigate("/workout");
      }
    } catch (error) {
      if (error.status === 400) {
        toast.error("Please fill in the required form");
      }
      console.error(error);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-text sm:px-6">
      <main className="mx-auto w-full max-w-2xl">
        <header className="mb-7">
          <p className="text-sm font-medium text-primary">Finish workout</p>
          <h1 className="mt-1 text-3xl font-bold">Session details</h1>
          <p className="mt-2 text-sm text-muted">
            Add the final details before saving your workout.
          </p>
        </header>

        <form
          className="rounded-2xl border border-border/10 bg-card p-5 shadow-lg shadow-black/10 sm:p-7"
          onSubmit={async (e) => await handleSubmit(e)}
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="workoutTitle"
                className="mb-2 block text-sm font-semibold text-text"
              >
                Workout title
              </label>
              <input
                onChange={(e) => {
                  setWorkout((prev) => {
                    return {
                      ...prev,
                      workoutName: e.target.value,
                    };
                  });
                }}
                placeholder={`${workout.user.name + "'s"} workout #${workout.user.workouts.length + 1}`}
                defaultValue={workout.workoutName}
                id="workoutTitle"
                name="workoutTitle"
                type="text"
                className="w-full rounded-xl border border-border/10 bg-background px-4 py-3 text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="workoutSplit"
                  className="mb-2 block text-sm font-semibold text-text"
                >
                  Workout split
                </label>
                <input
                  id="workoutSplit"
                  name="workoutSplit"
                  type="text"
                  placeholder="Push, pull, legs..."
                  defaultValue={workout.workoutSplit}
                  onChange={(e) => {
                    setWorkout((prev) => {
                      return {
                        ...prev,
                        workoutSplit: e.target.value,
                      };
                    });
                  }}
                  className="w-full rounded-xl border border-border/10 bg-background px-4 py-3 text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label
                  htmlFor="duration"
                  className="mb-2 block text-sm font-semibold text-text"
                >
                  Duration
                </label>
                <input
                  id="duration"
                  name="duration"
                  type="text"
                  placeholder="00:45:00"
                  value={workout.duration}
                  className="w-full rounded-xl border border-border/10 bg-background px-4 py-3 text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="notes"
                className="mb-2 block text-sm font-semibold text-text"
              >
                Notes (Optional)
              </label>
              <textarea
                onChange={(e) => {
                  setWorkout((prev) => {
                    return {
                      ...prev,
                      notes: e.target.value,
                    };
                  });
                }}
                defaultValue={workout.notes}
                id="notes"
                name="notes"
                rows="5"
                placeholder="How did the workout feel?"
                className="w-full resize-none rounded-xl border border-border/10 bg-background px-4 py-3 text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            className="mt-7 w-full rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primaryHover focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-card"
          >
            Save workout
          </button>
        </form>
      </main>
    </div>
  );
};

export default FinishWorkout;
