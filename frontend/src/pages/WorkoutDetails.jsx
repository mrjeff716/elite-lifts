import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "../api";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Dumbbell,
  Layers3,
  Sparkles,
} from "lucide-react";
import Loader from "../components/Loader";
import Navbar from "../components/Navbar";
import ReactMarkdown from "react-markdown";
import PostWorkout from "../pages/PostWorkout";

const WorkoutDetails = () => {
  const [viewMore, setViewMore] = useState({});
  const [isPostWorkoutOpen, setIsPostWorkoutOpen] = useState(false);
  const [workout, setWorkout] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiAnalysisLoading, setIsAiAnalysisLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [isAiAnalysisOpen, setIsAiAnalysisOpen] = useState(true)
  const [isDeletingWorkout, setIsDeletingWorkout] = useState(false)
  const workoutId = useParams().id;
  const navigate = useNavigate();

  useEffect(() => {
    workout &&
      workout?.aiAnalysis?.length >= 1 &&
      workout.aiAnalysis !== "User Safety: safe" &&
      setAiResponse(workout.aiAnalysis);
  }, []);

  useEffect(() => {
    async function getWorkout() {
      try {
        const res = await axios.get(
          `/api/workout/workout-details/${workoutId}`,
        );
        if (res.status !== 200) {
          toast.error("Error, please try again later.");
        }
        setIsLoading(false);
        setWorkout(res.data.workout);
        console.log(res.data.isWorkoutPostedToFeed)
        setAiResponse(res.data.workout.aiAnalysis ?? "");
      } catch (error) {
        if (error.status === 401) {
          navigate("/auth");
        }
      }
    }
    getWorkout();
  }, []);

  async function deleteWorkout() {
    try {
      const res = await axios.delete(`/api/delete-workout/${workout._id}`)
      if (res.status === 200) {
        toast.success(res.data.message)
      } else if (res.status === 401 || res.statusCode === 401) {
        return navigate('/auth', {replace: true})
      }
    } catch (error) {
      if (error.status === 401 || error.statusCode === 401) {
        return navigate('/auth', {replace: true})
      }
    } finally {
      navigate('/workout')
    }
  }

  const date = !isLoading && new Date(workout.updatedAt);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  const formatted = `${formattedDate} · ${formattedTime}`;

  function getTotalSets() {
    const setArrays = workout.exercises.map((e) => e.sets);
    let totalSets = 0;
    setArrays.forEach((sa) => {
      totalSets += sa.length;
    });
    return totalSets;
  }

  async function aiAnalysis() {
    if (isAiAnalysisLoading) return;
    setIsAiAnalysisLoading(true);
    setIsAiAnalysisOpen(true);
    try {
      const allWorkouts = await axios.get("/api/workouts");
      let workouts = [];
      if (allWorkouts.status === 200) {
        allWorkouts.data.workouts.forEach((w, wIndex) => {
          return wIndex + 1 <= 5 && workouts.push(w);
        });
      }
      const res =
        workout.aiAnalysis === undefined || workout?.aiAnalysis?.length < 1
          ? await axios.post(`/api/ai-analysis`, {
                workouts,
              })
          : {
              status: 201,
              data: {
                response: {
                  content: workout.aiAnalysis,
                },
              },
            };

      if (res.status !== 201) {
        return toast.error("Error, please try again later");
      }
      const content = res.data.response?.content;
      if (
        typeof content !== "string" ||
        !content.trim() ||
        content === "User Safety: safe"
      ) {
        toast.error("AI returned an empty analysis");
      }
      setAiResponse(content);
      const updatedWorkout = await axios.put(
        `/api/workout/workout-details/${workout._id}`,
        {
          aiAnalysis: content,
        },
      );
      if (updatedWorkout.status !== 201) {
        return toast.error("Error, please try again later");
      }
    } catch (error) {
      if (error.status === 429)
        toast.error("Too many requests, Please try again in a bit");
      else
        toast.error(error.message || "Unable to load or save the AI analysis");
    } finally {
      setIsAiAnalysisLoading(false);
    }
  }


  if (isLoading) {
    return <Loader />;
  }

  if (isPostWorkoutOpen) {
    return (
      <>
        <PostWorkout
          workout={workout}
          onCancel={() => setIsPostWorkoutOpen(false)}
        />
        <Navbar />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background px-4 pb-28 pt-6 text-text sm:px-6 sm:pt-10">
        <main className="mx-auto max-w-4xl">
          <a
            href="/workout"
            className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-muted transition hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to
            workouts
          </a>

          <section
            aria-labelledby="workout-title"
            className="relative mt-6 overflow-hidden rounded-3xl border border-border/10 bg-card p-5 sm:p-8"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
            />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Workout recap
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPostWorkoutOpen(true)}
                    className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primaryHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Post workout
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                    onClick={() => setIsDeletingWorkout(true)}
                  >
                    Delete workout
                  </button>
                  <div hidden={!isDeletingWorkout} className="fixed inset-0 z-[100]">
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-black/70 backdrop-blur-sm motion-safe:animate-backdrop-in"
                    />
                    <div className="relative grid h-full place-items-center overflow-y-auto p-4 sm:p-6">
                      <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-workout-title"
                        aria-describedby="delete-workout-description"
                        className="w-full max-w-md rounded-3xl border border-border/10 bg-card p-6 shadow-2xl shadow-black/40 motion-safe:animate-modal-in sm:p-8"
                      >
                        <div aria-hidden="true" className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                            <path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" />
                          </svg>
                        </div>
                        <h2 id="delete-workout-title" className="text-xl font-semibold tracking-tight text-text">
                          Delete this workout?
                        </h2>
                        <p id="delete-workout-description" className="mt-3 text-sm leading-6 text-muted">
                          Are you sure you want to delete this workout? This action cannot be undone.
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-3">
                          <button
                            type="button"
                            className="flex-1 rounded-xl border border-border/20 px-5 py-3 text-sm font-semibold text-text transition hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:flex-none"
                            onClick={() => setIsDeletingWorkout(false)}>
                            No
                          </button>
                          <button
                            type="button"
                            className="flex-1 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 sm:flex-none"
                            onClick={async() => {
                              await deleteWorkout()
                              setIsDeletingWorkout(false)
                            }}>
                            Yes
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <h1
                id="workout-title"
                className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl"
              >
                1 day closer from achieving your dream physique.
              </h1>
              <p className="mt-2 text-sm text-muted sm:text-base">
                {workout.workoutSplit}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-2 text-muted">
                  <CalendarDays aria-hidden="true" className="h-4 w-4" />
                  <time dateTime={workout.createdAt}>{formatted}</time>
                </span>
              </div>
              <dl className="mt-7 grid grid-cols-3 gap-2 border-t border-border/10 pt-6 sm:gap-4">
                <div className="rounded-2xl bg-background/60 p-3 sm:p-4">
                  <dt className="flex items-center gap-2 text-xs text-muted">
                    <Clock3
                      aria-hidden="true"
                      className="hidden h-4 w-4 text-primary sm:block"
                    />
                    Duration
                  </dt>
                  <dd className="mt-2 text-xl font-bold tracking-tight sm:text-3xl">
                    {workout.duration}
                  </dd>
                </div>
                <div className="rounded-2xl bg-background/60 p-3 sm:p-4">
                  <dt className="flex items-center gap-2 text-xs text-muted">
                    <Dumbbell
                      aria-hidden="true"
                      className="hidden h-4 w-4 text-primary sm:block"
                    />
                    Exercises
                  </dt>
                  <dd className="mt-2 text-xl font-bold tracking-tight sm:text-3xl">
                    {workout.exercises.length}
                  </dd>
                </div>
                <div className="rounded-2xl bg-background/60 p-3 sm:p-4">
                  <dt className="flex items-center gap-2 text-xs text-muted">
                    <Layers3
                      aria-hidden="true"
                      className="hidden h-4 w-4 text-primary sm:block"
                    />
                    Total sets
                  </dt>
                  <dd className="mt-2 text-xl font-bold tracking-tight sm:text-3xl">
                    {getTotalSets()}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <div className="mt-6 flex justify-center">
            <button
              disabled={isAiAnalysisLoading}
              hidden={workout.aiAnalysis}
              type="button"
              className="rounded-xl border border-primary/20 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
              onClick={aiAnalysis}
            >
              {isAiAnalysisLoading ? "Analyzing your workouts…" : "Request AI analysis"}
            </button>
          </div>
          <div className="my-10">
            {aiResponse && !isAiAnalysisLoading && <div className="mb-4 flex justify-end">
              <button
                type="button"
                hidden={aiResponse}
                aria-expanded={isAiAnalysisOpen}
                aria-controls="workout-ai-analysis"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-primary/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                onClick={() => setIsAiAnalysisOpen((prev) => !prev)}
              >
                <span>{isAiAnalysisOpen ? "Hide AI analysis" : "View AI analysis"}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isAiAnalysisOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>}
            <div id="workout-ai-analysis" hidden={!isAiAnalysisOpen}>
            {isAiAnalysisOpen && !isAiAnalysisLoading && <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="mb-4 text-2xl font-bold text-primary">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-2 mt-6 text-lg font-semibold text-text">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-3 leading-relaxed text-muted">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-4 list-disc space-y-2 pl-5 text-muted">
                    {children}
                  </ul>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-text">
                    {children}
                  </strong>
                ),
              }}
            >
              {aiResponse}
            </ReactMarkdown>}
            </div>
            {isAiAnalysisLoading && (
              <div
                role="status"
                aria-live="polite"
                className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-6 sm:p-8"
              >
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl motion-safe:animate-pulse" />
                <div className="relative flex items-center gap-4">
                  <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary motion-safe:animate-pulse">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-text">Analyzing your workouts</p>
                    <p className="mt-1 text-sm leading-6 text-muted">Turning your recent sessions into personalized insights.</p>
                  </div>
                </div>
                <div aria-hidden="true" className="mt-7 space-y-3 motion-safe:animate-pulse">
                  <div className="h-3 w-1/3 rounded-full bg-primary/20" />
                  <div className="h-2.5 w-full rounded-full bg-border/10" />
                  <div className="h-2.5 w-5/6 rounded-full bg-border/10" />
                  <div className="h-2.5 w-2/3 rounded-full bg-border/10" />
                </div>
                <div className="mt-6 flex items-center gap-2.5 text-xs text-muted">
                  <span aria-hidden="true" className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span key={delay} className="h-1.5 w-1.5 rounded-full bg-primary motion-safe:animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </span>
                  This may take a moment
                </div>
              </div>
            )}
          </div>
          <section aria-labelledby="exercises-title" className="mt-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2
                  id="exercises-title"
                  className="text-xl font-bold tracking-tight"
                >
                  The work you put in
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Tap an exercise to see each set.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {workout.exercises.map((ex, exIndex) => {
                const isExpanded = viewMore.exerciseIndex === exIndex;

                return (
                  <article
                    key={ex._id ?? workout.exercises.length - exIndex}
                    className="overflow-hidden rounded-2xl border border-border/10 bg-card transition-colors hover:border-primary/40"
                  >
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() =>
                        setViewMore((prev) => ({
                          exerciseIndex: isExpanded ? null : exIndex,
                        }))
                      }
                      className="flex w-full items-center gap-3 p-4 text-left outline-none transition hover:bg-white/[0.02] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:gap-4 sm:p-5"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-sm font-bold text-primary sm:h-12 sm:w-12">
                        {workout.exercises.length - exIndex}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-text sm:text-base">
                          {ex.exercise}
                        </span>
                        <span className="mt-2 block text-xs text-muted sm:hidden">
                          {ex.sets.length}{" "}
                          {ex.sets.length === 1 ? "set" : "sets"}
                        </span>
                      </span>

                      <span className="hidden text-right sm:block">
                        <span className="block text-sm font-semibold">
                          {ex.sets.length}{" "}
                          {ex.sets.length === 1 ? "set" : "sets"}
                        </span>
                      </span>

                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 shrink-0 text-muted" />
                      ) : (
                        <ChevronDown className="h-5 w-5 shrink-0 text-muted" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border/10 px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
                        <table className="w-full text-left text-xs sm:text-sm">
                          <thead className="text-[10px] uppercase tracking-widest text-muted sm:text-xs">
                            <tr>
                              <th className="py-3 font-medium">Set</th>
                              <th className="py-3 font-medium">Type</th>
                              <th className="py-3 text-right font-medium">
                                Weight
                              </th>
                              <th className="py-3 text-right font-medium">
                                Reps
                              </th>
                              <th className="py-3 text-right font-medium">
                                PR
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-border/5">
                            {ex.sets.map((set, setIndex) => (
                              <tr key={set._id ?? setIndex}>
                                <th className="py-3 font-medium text-muted">
                                  {setIndex + 1}
                                </th>
                                <td className="py-3">
                                  <span className="rounded-md bg-background px-2 py-1 text-xs text-muted">
                                    {set.setType ?? "Working"}
                                  </span>
                                </td>
                                <td className="py-3 text-right font-semibold tabular-nums">
                                  {set.weight}
                                </td>
                                <td className="py-3 text-right font-semibold tabular-nums">
                                  {set.reps}
                                </td>
                                <td className="py-3 text-right">
                                  <span
                                    className={
                                      set.isPr
                                        ? "font-semibold text-primary"
                                        : "text-muted"
                                    }
                                  >
                                    {set.isPr ? "Yes" : "No"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
          <p className="mt-6 text-center text-xs text-muted">
            One session closer to your goals.
          </p>
        </main>
      </div>
      <Navbar />
    </>
  );
};

export default WorkoutDetails;
