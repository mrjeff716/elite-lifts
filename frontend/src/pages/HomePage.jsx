import Navbar from "../components/Navbar";
import PersonalRecords from "./PersonalRecords";
import { Link } from "react-router";
import { useNavigate } from "react-router";
import axios from "../api";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { ArrowUpRight, Target } from "lucide-react";

const HomePage = ({ user }) => {
  const [workoutsAll, setWorkoutsAll] = useState([]);
  const [workoutsMonth, setWorkoutsMonth] = useState([]);
  const [workoutsWeek, setWorkoutsWeek] = useState([]);
  const [isPrPageOpened, setIsPrPageOpened] = useState(false);
  const [posts, setPosts] = useState([]);
  const homePage = useRef(null);


  const navigate = useNavigate();

  useEffect(() => {
    if (homePage.current !== null) {
      homePage.current.scrollIntoView();
    }
  }, []);

  let totalSeconds = 0;

  workoutsMonth.forEach((workout) => {
    if (!workout.duration?.trim()) return;

    const [hours, minutes, seconds] = workout.duration
      .trim()
      .split(":")
      .map(Number);

    const durationSeconds = hours * 3600 + minutes * 60 + seconds;

    if (Number.isFinite(durationSeconds)) {
      totalSeconds += durationSeconds;
    }
  });

  const trainingTime = (totalSeconds / 3600).toFixed(2);
  const progress =
    user && ((workoutsWeek.length / user.workoutsPerWeek) * 100).toFixed(2);

  let prAll = [];
  workoutsAll.forEach((w) => {
    w.exercises.map((wex) => {
      wex.sets.map((set) => {
        const date = new Date(w.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        return (
          set.isPr && prAll.push({ ...set, exerciseName: wex.exercise, date })
        );
      });
    });
  });

  let prMonth = [];
  workoutsMonth.forEach((w) => {
    w.exercises.map((wex) => {
      wex.sets.map((set) => {
        const date = new Date(w.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        return (
          set.isPr && prMonth.push({ ...set, exerciseName: wex.exercise, date })
        );
      });
    });
  });

  let prWeek = [];
  workoutsWeek.forEach((w) => {
    w.exercises.map((wex) => {
      wex.sets.map((set) => {
        const date = new Date(w.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        return (
          set.isPr && prWeek.push({ ...set, exerciseName: wex.exercise, date })
        );
      });
    });
  });

  useEffect(() => {
    async function getPosts() {
      try {
        const res = await axios.get("/api/posts");
        if (res.status === 401) {
          return navigate("/auth");
        }
        if (res.status === 200) {
          setPosts(res.data.posts);
        }
      } catch (error) {
      }
    }
    getPosts();
  }, []);

  useEffect(() => {
    async function getWorkouts() {
      try {
        const res = await axios.get("/api/workouts");
        if (res.status === 401) {
          return navigate("/auth");
        }
        if (res.status === 200) {
          setWorkoutsAll(res.data.workouts);
        }
      } catch (error) {
      }
    }
    getWorkouts();
  }, []);

  useEffect(() => {
    async function getWorkouts() {
      try {
        const res = await axios.get("/api/home/workouts-month");
        if (res.status === 400) {
          return navigate("/auth");
        }
        if (res.status === 200) {
          setWorkoutsMonth(res.data.workouts);
        }
      } catch (error) {
      }
    }
    getWorkouts();
  }, []);

  useEffect(() => {
    async function getWorkouts() {
      try {
        const res = await axios.get("/api/home/workouts-week");
        /*if (res.status === 400) {
          return navigate('/auth')
        }*/
        if (res.status === 200) {
          setWorkoutsWeek(res.data.workouts);
        }
      } catch (error) {
        toast("Please sign in");
        error.status === 401 && navigate("/auth");
      }
    }
    getWorkouts();
  }, []);

  return (
    <div className="scroll-mt-10" ref={homePage}>
      {isPrPageOpened && (
        <PersonalRecords
          onClose={() => setIsPrPageOpened(false)}
          pr={{ all: prAll, month: prMonth, week: prWeek }}
        />
      )}
      <Navbar />
      <div className="min-h-screen bg-background text-text px-4 py-6 md:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <section className="flex items-center justify-between">
            <div>
              <p className="text-muted text-sm">Welcome back</p>
              <h1 className="text-3xl font-bold mt-1">Ready to train?</h1>
            </div>

            <div className="w-11 h-11 rounded-full bg-card border border-border/20 flex items-center justify-center font-bold text-primary">
              {user && user.name[0]}
            </div>
          </section>

          {/* Hero */}
          <section className="bg-gradient-to-br from-primary to-primaryHover rounded-3xl p-6 md:p-8 shadow-lg">
            <div className="max-w-xl">
              <p className="text-blue-100 text-sm font-medium">Today's focus</p>

              <h2 className="text-white text-3xl md:text-4xl font-bold mt-2">
                Push yourself a little further today.
              </h2>

              <p className="text-blue-100 mt-3 leading-relaxed">
                Keep your momentum going and log your next workout.
              </p>

              <button
                className="mt-6 bg-white text-primary font-semibold px-6 py-3 rounded-xl hover:scale-[1.02] transition"
                onClick={() => {
                  navigate("/workout");
                }}
              >
                Start Workout
              </button>
            </div>
          </section>

          {/* Stats */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Your Stats</h2>

              <span className="text-sm text-muted">This month</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-card border border-border/10 rounded-2xl p-5">
                <p className="text-muted text-sm">Workouts</p>

                <div className="flex items-end gap-2 mt-2">
                  <h3 className="text-3xl font-bold">{workoutsMonth.length}</h3>
                </div>
              </div>

              <div className="bg-card border border-border/10 rounded-2xl p-5">
                <p className="text-muted text-sm">Personal Records</p>

                <div className="flex items-end gap-2 mt-2">
                  <h3 className="text-3xl font-bold">{prMonth.length}</h3>

                  <span className="text-sm text-primary mb-1">PR(s)</span>
                </div>
              </div>

              <div className="bg-card border border-border/10 rounded-2xl p-5 col-span-2 lg:col-span-1">
                <p className="text-muted text-sm">Training Time</p>

                <div className="flex items-end gap-2 mt-2">
                  <h3 className="text-3xl font-bold">{trainingTime}</h3>

                  <span className="text-sm text-muted mb-1">hrs</span>
                </div>
              </div>
            </div>
          </section>

          {/* Progress */}
          <section className="bg-card border border-border/10 rounded-2xl p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-bold">Weekly Progress</h2>

                <p className="text-muted text-sm mt-1">
                  You completed {workoutsWeek.length} out of{" "}
                  {user ? user.workoutsPerWeek : " "} workouts.
                </p>
              </div>

              {user && user.workoutsPerWeek !== 0 ? <span className="text-primary font-semibold">{`${progress}%`}</span> : (
                <button className="group inline-flex min-h-11 items-center justify-center gap-2.5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-blue-300 shadow-sm transition-colors hover:border-primary/60 hover:bg-primary/20 hover:text-blue-200 active:bg-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                onClick={() => navigate('/settings')}>
                  <Target size={18} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />
                  Set a workout goal
                  <ArrowUpRight size={16} aria-hidden="true" className="shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
                </button>
              )}
            </div>

            <div className="w-full h-3 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </section>

          {/* Recent Activity + Friends Activity */}
          <section className="grid lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-card border border-border/10 rounded-2xl p-5 md:p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold">Recent Activity</h2>

                <Link
                  to="/workout"
                  className="text-primary text-sm font-medium"
                >
                  View all
                </Link>
              </div>

              <div className="space-y-4">
                {workoutsWeek.length === 0 ? (
                  <div className="flex flex-col items-center">
                    <p className="text-xl font-semibold">
                      You did not workout this week yet
                    </p>
                    <button
                      className="mt-6 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:scale-[1.02] transition"
                      onClick={() => {
                        navigate("/workout");
                      }}
                    >
                      Start Workout
                    </button>
                  </div>
                ) : (
                  workoutsWeek.map((w, index) => {
                    return (
                      index + 1 <= 4 && (
                        <div className="flex items-center justify-between bg-background rounded-xl p-4">
                          <div>
                            <h3 className="font-semibold">{w.workoutName}</h3>

                            <p className="text-muted text-sm mt-1">
                              {w.workoutSplit}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm">{w.duration}</p>

                            <p className="text-muted text-xs mt-1">
                              {(Date.now() - new Date(w.updatedAt)) / 86400000 <
                              1
                                ? "Today"
                                : (Date.now() - new Date(w.updatedAt)) /
                                      86400000 <
                                    2
                                  ? "Yesterday"
                                  : new Date(w.updatedAt).toLocaleDateString(
                                      "en-us",
                                      {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      },
                                    )}
                            </p>
                          </div>
                        </div>
                      )
                    );
                  })
                )}
              </div>
            </div>

            {/* Friends Activity */}
            <div className="bg-card border border-border/10 rounded-2xl p-5 md:p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold">Friends Activity</h2>

                <Link to="/feed" className="text-primary text-sm font-medium">
                  View feed
                </Link>
              </div>

              <div className="space-y-4">
                {posts.map((p, pIndex) => {
                  return (
                    pIndex + 1 <= 4 && (
                      <div className="flex gap-3 bg-background rounded-xl p-4">
                        <div className="w-11 h-11 shrink-0 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                          {p.userName[0]}
                        </div>

                        <div>
                          <p className="text-sm leading-relaxed">
                            <span className="font-bold">{p.userName}:</span>
                            <span className="ml-1">{p.title}</span>
                          </p>

                          <p className="text-muted text-xs mt-1">
                            {(Date.now() - new Date(p.createdAt)) / 86400000 < 1
                              ? new Date(p.createdAt).toLocaleDateString('en-Us',{hour: "numeric", minute: "numeric"})
                              : (Date.now() - new Date(p.createdAt)) /
                                    86400000 <
                                  2
                                ? "Yesterday"
                                : new Date(p.createdAt).toLocaleDateString('en-Us',{
                                    month: "short",
                                    day: "numeric",
                                  })}
                          </p>
                        </div>
                      </div>
                    )
                  );
                })}
              </div>
            </div>
          </section>

          {/* Personal Best */}
          <section className="bg-card border border-border/10 rounded-2xl p-5 md:p-6">
            <h2 className="text-xl font-bold mb-5">Recent Personal Best</h2>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-muted text-sm">{prMonth[0]?.exerciseName}</p>

                <h3 className="text-3xl font-bold mt-1">
                  {prMonth[0]?.weight || <span className="font-semibold">You dont have any PR's so far.</span>}
                </h3>
              </div>

              <button
                className="bg-background rounded-xl px-5 py-3 text-sm text-muted active:opacity-80 active:scale-105 transition"
                onClick={() => setIsPrPageOpened(true)}
              >
                View Your Personal records
              </button>
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Link
                to="/workout"
                className="bg-card border border-border/10 rounded-2xl p-5 text-left hover:border-primary/40 transition"
              >
                <button className="text-start">
                  <p className="text-primary font-semibold">Start Workout</p>

                  <p className="text-muted text-sm mt-1">Begin a new session</p>
                </button>
              </Link>
              <Link
                to="/exercises"
                className="bg-card border border-border/10 rounded-2xl p-5 hover:border-primary/40 transition"
              >
                <button className="text-start">
                  <p className="text-primary font-semibold">Exercises</p>

                  <p className="text-muted text-sm mt-1">Browse the library</p>
                </button>
              </Link>
              <button className="col-span-2 bg-card border border-border/10 rounded-2xl p-5 text-left hover:border-primary/40 transition md:col-span-1">
                <p className="text-primary font-semibold">Social Feed</p>

                <p className="text-muted text-sm mt-1">See friends' workouts</p>
              </button>
            </div>
          </section>
        </div>
      </div>
      <div className="mt-32"></div>
    </div>
  );
};

export default HomePage;
