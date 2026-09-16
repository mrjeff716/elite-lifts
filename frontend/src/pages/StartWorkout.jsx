import { ArrowDown, ArrowUp, Trash, TrashIcon } from "lucide-react";
import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import ExercisePage from "./ExercisePage";
import { useNavigate, useParams } from "react-router";
import { imageUrls } from "../utils/utils.js";
import axios from "../api";
import { toast } from "react-hot-toast";

const StartWorkout = ({ user, workout, setWorkout }) => {
  const [viewMore, setViewMore] = useState({});
  const [areSetTypesOpen, setAreSetTypesOpen] = useState({});
  const [duration, setDuration] = useState(getDurationFromStorage() || {});
  const [chosenExercise, setChosenExercise] = useState({
    exerciseIndex: undefined,
    setIndex: undefined,
    exercise: "Add exercise",
    isExercisePageOpen: false,
  });

  const workoutId = useParams()._id;
  const navigate = useNavigate();


  useEffect(() => {
    setInterval(() => {
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

      setDuration({
        hours: totalHours,
        minutes: totalMinutes,
        seconds: totalSeconds,
      });
    }, 250);
  }, []);

  useEffect(() => {
    localStorage.setItem("duration", JSON.stringify(duration));
  }, [duration]);

  function getDurationFromStorage() {
    const duration = JSON.parse(localStorage.getItem("duration")) || {};
    return duration;
  }

  const setTypes = [
    {
      type: "Warm-up",
      color: "yellow-500",
    },
    {
      type: "Failure",
      color: "red-500",
    },
    {
      type: "Defintion",
      color: "green-500",
    },
    {
      type: "Super-Set",
      color: "blue-500",
    },
    {
      type: "Drop-Set",
      color: "orange-500",
    },
    {
      type: "Pyramid-Set",
      color: "orange-800",
    },
  ];

  const setColor = (s) => {
    if (s.setType[0] === "W") {
      return "text-yellow-500";
    } else if (s.setType[0] === "F") {
      return "text-red-500";
    } else if (s.setType[0] === "D") {
      return "text-green-500";
    } else if (s.setType[0] === "S") {
      return "text-blue-950";
    } else if (s.setType[0] === "D") {
      return "text-orange-500";
    } else if (s.setType[0] === "P") {
      return "text-orange-800";
    }
  };

  function modifyExercises(exerciseIndex, setIndex, property, value) {
    return setWorkout((prevWorkout) => {
      return {
        ...prevWorkout,
        exercises: prevWorkout.exercises.map((ex, exIndex) => {
          if (exIndex !== exerciseIndex) {
            return { ...ex };
          }

          return {
            ...ex,
            sets: ex.sets.map((set, sIndex) => {
              if (setIndex !== sIndex) {
                return { ...set };
              }

              return {
                ...set,
                [property]: property === "isPr" ? value : Number(value),
              };
            }),
          };
        }),
      };
    });
  }

  function deleteSet(exerciseIndex) {
    setWorkout((previousWorkout) => {
      return {
        ...previousWorkout,
        exercises: previousWorkout.exercises.map((exercise, index) =>
          index === exerciseIndex
            ? {
                ...exercise,
                sets: exercise.sets.filter((exerciseSet, sIndex) => {
                  return sIndex < exercise.sets.length - 1 && exerciseSet;
                }),
                /*...exercise.sets,
                {
                  setType: "WarmUp",
                  weight: 0,
                  reps: 0,
                },*/
              }
            : exercise,
        ),
      };
    });
  }

  function deleteExercise(exerciseIndex) {
    setWorkout((previousWorkout) => {
      return {
        ...previousWorkout,
        exercises: previousWorkout.exercises.filter((exercise, index) => {
          return index !== exerciseIndex;
        }),
      };
    });
  }

  function getTotalSets() {
    const setArrays = workout.exercises.map((e) => e.sets);
    let totalSets = 0;
    setArrays.forEach((sa) => {
      totalSets += sa.length;
    });
    return totalSets;
  }

  const isExerciseValid = workout.exercises.every((ex) => {
    if (!ex.exercise?.trim() || ex.exercise === "Choose an Exercise") {
      return false;
    } else {
      return true;
    }
  });

  const arePrimaryMusclesValid = workout.exercises.every((ex) =>
    imageUrls.some((muscle) => muscle.name.toLowerCase() === ex.primaryMuscle),
  );

  const isSetValid = workout.exercises.every(ex => {
    return ex.sets.every(set => set.setType === 'Insert Set Type' ? false : true)
  })



  if (chosenExercise.isExercisePageOpen) {
    return (
      <ExercisePage
        exerciseIndex={chosenExercise.exerciseIndex}
        setIndex={chosenExercise.setIndex}
        isExercisePageOpen={chosenExercise.isExercisePageOpen}
        setChosenExercise={setChosenExercise}
        workout={workout}
        setWorkout={setWorkout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-text">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Workout in progress
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Log your session
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Track every set, adjust your weights, and keep the momentum going.
          </p>
        </section>

        <section className="grid grid-cols-3 overflow-hidden rounded-2xl border border-border/10 bg-card shadow-lg shadow-black/10">
          <div className="flex flex-col items-center px-3 py-5 sm:py-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted sm:text-sm">
              Duration
            </p>
            <p className="mt-1 text-xl font-bold text-primary sm:text-2xl">
              {duration.hours}:{duration.minutes}:{duration.seconds}
            </p>
          </div>
          <div className="flex flex-col items-center border-x border-border/10 px-3 py-5 sm:py-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted sm:text-sm">
              Exercises
            </p>
            <p className="mt-1 text-xl font-bold text-primary sm:text-2xl">
              {workout.exercises.length}
            </p>
          </div>
          <div className="flex flex-col items-center px-3 py-5 sm:py-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted sm:text-sm">
              Sets
            </p>
            <p className="mt-1 text-xl font-bold text-primary sm:text-2xl">
              {getTotalSets()}
            </p>
          </div>
        </section>

        <section className="mt-8 space-y-5">
          {workout.exercises.map((e, exerciseIndex) => {
            return (
              <article className="overflow-visible rounded-2xl border border-border/10 bg-card shadow-lg shadow-black/10 transition hover:border-primary/30">
                <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                      Exercise {workout.exercises.length - exerciseIndex}
                    </p>
                    <div className="text-xl font-bold text-text sm:text-2xl">
                      <div className="flex flex-col gap-3">
                        <span
                          className="cursor-pointer text-sm transition hover:text-primary sm:text-xl"
                          onClick={() =>
                            setChosenExercise({
                              exerciseIndex,
                              isExercisePageOpen: true,
                            })
                          }
                        >
                          {e.exercise || "Choose an exercise"}
                        </span>
                        <div className="grid min-w-0 grid-cols-2 gap-2">
                        <input
                          aria-label="Custom exercise name"
                          defaultValue={e.exercise && ""} 
                          placeholder="Add your own exercise"
                          className="min-w-0 w-full rounded-xl border border-border/20 bg-background/70 px-3 py-2.5 text-sm font-medium text-text outline-none placeholder:text-muted/70 hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/15"
                          onChange={(e) => {
                            setWorkout((prev) => {
                              return {
                                ...prev,
                                exercises: prev.exercises.map((ex, eIndex) => {
                                  if (eIndex === exerciseIndex) {
                                    return {
                                      ...ex,
                                      exercise: e.target.value,
                                      primaryMuscle: ex.primaryMuscle && "",
                                    };
                                  } else {
                                    return { ...ex };
                                  }
                                }),
                              };
                            });
                          }}
                        />
                        <select
                          aria-label="Primary muscle"
                          required
                          value={e.primaryMuscle || ""}
                          onChange={(event) => {
                            const primaryMuscle = event.target.value;
                            setWorkout((prev) => ({
                              ...prev,
                              exercises: prev.exercises.map((ex, index) =>
                                index === exerciseIndex ? { ...ex, primaryMuscle } : ex,
                              ),
                            }));
                          }}
                          className="min-w-0 w-full rounded-xl border border-border/20 bg-background px-3 py-2.5 text-sm font-medium text-text outline-none hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/15"
                        >
                          <option value="" disabled>Primary muscle</option>
                          {imageUrls.map((muscle) => (
                            <option key={muscle.name} value={muscle.name.toLowerCase()}>
                              {muscle.name}
                            </option>
                          ))}
                        </select>
                        </div>
                        { !e.primaryMuscle && (
                          <p className="text-xs font-normal text-muted">Choose a primary muscle for your custom exercise.</p>
                        )}
                      </div>
                    </div>

                    <p className="mt-1 text-sm text-muted">
                      {e.sets.length} Set(s)
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <TrashIcon
                      className="size-10 bg-red-500/60 p-3 rounded-xl cursor-pointer hover:opacity-80 transition"
                      onClick={() => {
                        deleteExercise(exerciseIndex);
                      }}
                    />
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/10 bg-background text-muted transition hover:border-primary/40 hover:text-primary">
                      <div>
                        {viewMore.exerciseIndex === exerciseIndex && (
                          <ArrowUp
                            className="size-5 cursor-pointer"
                            onClick={() => setViewMore(false)}
                          />
                        )}
                        {viewMore.exerciseIndex !== exerciseIndex && (
                          <ArrowDown
                            className="size-5 cursor-pointer"
                            onClick={() =>
                              setViewMore({ exerciseIndex: exerciseIndex })
                            }
                          />
                        )}
                      </div>
                    </div>
                    {/*!viewMore ? (
                  <ArrowDown
                    className="size-6 cursor-pointer"
                    onClick={() => setViewMore({exerciseIndex: exerciseIndex})}
                  />
                ) : (
                  <ArrowUp
                    className="size-6 cursor-pointer"
                    onClick={() => setViewMore(false)}
                  />
                )*/}
                  </div>
                </div>
                {viewMore.exerciseIndex === exerciseIndex && (
                  <div className="border-t border-border/10 px-4 pb-5 pt-2 sm:px-6 sm:pb-6">
                    <div className="hidden grid-cols-[1fr_7rem_7rem_3rem] gap-4 border-b border-border/10 px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted sm:grid">
                      <span>Set type</span>
                      <span className="text-center">Weight</span>
                      <span className="text-center">Reps</span>
                      <span className="text-center" title="Personal record">PR</span>
                    </div>
                    <div className="divide-y divide-border/10">
                      {e.sets.map((s, setIndex) => {
                        return (
                          <div key={s._id ?? setIndex} className="grid grid-cols-[1fr_4.5rem_4.5rem] items-center gap-3 px-1 py-4 sm:grid-cols-[1fr_7rem_7rem_3rem] sm:gap-4 sm:px-3">
                            <div className="min-w-0">
                              <p className="mb-1 text-xs font-medium text-muted sm:hidden">
                                Set type
                              </p>
                              <div className="relative">
                                <button
                                  onClick={() => {
                                    setAreSetTypesOpen({
                                      exerciseIndex,
                                      setIndex,
                                    });
                                    //setSetType({ setType: "" });
                                  }}
                                  className={`max-w-full cursor-pointer truncate rounded-lg border border-border/10 bg-background px-3 py-2 text-left text-sm transition hover:border-primary/40 ${setColor(s)}`}
                                >
                                  <span className="font-extrabold">
                                    {s.setType !== "Insert Set Type" &&
                                      s.setType[0]}
                                  </span>
                                  <span className="text-text">
                                    {"-" + s.setType || "Failure"}
                                  </span>
                                </button>
                                {areSetTypesOpen.setIndex === setIndex &&
                                  areSetTypesOpen.exerciseIndex ===
                                    exerciseIndex && (
                                    <div className="absolute left-0 top-full z-20 mt-2 grid w-64 grid-cols-2 gap-2 rounded-xl border border-border/10 bg-card p-3 text-text shadow-2xl shadow-black/40 sm:w-80">
                                      {setTypes.map((t) => {
                                        return (
                                          <div
                                            onClick={() => {
                                              //setSetType({ ...setType, setType: t.type });
                                              setWorkout(() => {
                                                workout.exercises[
                                                  exerciseIndex
                                                ].sets[setIndex].setType =
                                                  t.type;
                                                return { ...workout };
                                              });
                                              setAreSetTypesOpen(false);
                                            }}
                                            className="cursor-pointer rounded-lg border border-border/10 bg-background p-3 text-sm transition hover:border-primary/40 hover:bg-primary/10"
                                          >
                                            <span
                                              className={`text-${t.color} font-bold`}
                                            >
                                              {t.type[0]}
                                            </span>{" "}
                                            {t.type}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                              </div>
                            </div>
                            <label className="flex flex-col items-center">
                              <span className="mb-1 text-xs font-medium text-muted sm:hidden">
                                Weight
                              </span>
                              <input
                                type="number"
                                className="w-full rounded-lg border border-border/10 bg-background px-2 py-2 text-center font-semibold text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                defaultValue={s.weight ? s.weight : 0}
                                onChange={(e) => {
                                  return modifyExercises(
                                    exerciseIndex,
                                    setIndex,
                                    "weight",
                                    e.target.value,
                                  );
                                }}
                              />
                            </label>
                            <label className="flex flex-col items-center">
                              <span className="mb-1 text-xs font-medium text-muted sm:hidden">
                                Reps
                              </span>
                              <input
                                type="number"
                                className="w-full rounded-lg border border-border/10 bg-background px-2 py-2 text-center font-semibold text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                onChange={(e) => {
                                  if (e.target.value < 0 ) return toast.error('Please insert a valid rep count')
                                  return modifyExercises(
                                    exerciseIndex,
                                    setIndex,
                                    "reps",
                                    e.target.value,
                                  );
                                }}
                                defaultValue={s.reps ? s.reps : 0}
                              />
                            </label>
                            <label className="col-span-3 flex min-h-11 cursor-pointer items-center gap-2 text-sm text-muted sm:col-span-1 sm:justify-center">
                              <input
                                type="checkbox"
                                checked={s.isPr === true}
                                onChange={(event) => modifyExercises(exerciseIndex, setIndex, "isPr", event.target.checked)}
                                aria-label={`Personal record for ${e.exercise}, set ${setIndex + 1}`}
                                className="size-5 cursor-pointer accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                              />
                              <span className="sm:hidden">Personal record (PR)</span>
                            </label>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      className="mt-4 w-full rounded-xl border border-primary/30 bg-primary/10 px-6 py-3 font-semibold text-primary transition hover:bg-primary hover:text-white"
                      onClick={() => {
                        //setSetAdded({ exerciseIndex: exerciseIndex });
                        setWorkout((previousWorkout) => ({
                          ...previousWorkout,
                          exercises: previousWorkout.exercises.map(
                            (exercise, index) =>
                              index === exerciseIndex
                                ? {
                                    ...exercise,
                                    sets: [
                                      ...exercise.sets,
                                      {
                                        setType: "WarmUp",
                                        weight: 0,
                                        reps: 0,
                                        isPr: false
                                      },
                                    ],
                                  }
                                : exercise,
                          ),
                        }));
                      }}
                    >
                      + Add set
                    </button>
                    <button
                      className="mt-4 w-full rounded-xl border border-primary/30 bg-red-500/20 px-6 py-3 font-semibold transition hover:bg-red-700/90 hover:text-white
                      flex items-center justify-center gap-2"
                      onClick={() => {
                        deleteSet(exerciseIndex);
                      }}
                    >
                      <Trash className="size-4" /> Delete set
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </section>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            className="w-full rounded-xl border border-border/10 bg-card px-6 py-3.5 font-semibold text-text transition hover:border-primary/40 hover:bg-primary/10"
            onClick={() => {
              setWorkout((prevWorkout) => {
                return {
                  ...prevWorkout,
                  exercises: [
                    {
                      exercise: chosenExercise.exercise && "Choose an Exercise",
                      sets: [
                        {
                          setType: "Insert Set Type",
                          weight: 40,
                          reps: 12,
                          isPr: false,
                        },
                      ],
                    },
                    ...prevWorkout.exercises,
                  ],
                };
              });
            }}
          >
            + Add exercise
          </button>

          <button className="rounded-xl bg-primary px-6 py-3.5 font-semibold text-center text-white shadow-lg shadow-primary/20 transition hover:bg-primaryHover hover:shadow-primary/30" onClick={() => {
            if (!isExerciseValid) {
            return toast.error('Please Insert a Valid Exercise')
          }
          if (!isSetValid) {
            return toast.error('Please Insert a Valid Set Type')
          }
          if (!arePrimaryMusclesValid) {
            return toast.error('Please choose a primary muscle for each exercise')
          }
          navigate(`/finish-workout/${workoutId}`);
          }}>
              Finish workout
          </button>
        </div>

        <div className="h-24"></div>
      </main>
    </div>
  );
};

export default StartWorkout;
