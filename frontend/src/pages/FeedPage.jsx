import Navbar from "../components/Navbar";
import chest from "../images/chest.webp";
import biceps from "../images/biceps.webp";
import triceps from "../images/triceps.webp";
import shoulders from "../images/shoulders.webp";
import abdominals from "../images/abs.webp";
import quadriceps from "../images/quadriceps.webp";
import hamstrings from "../images/hamstrings.webp";
import glutes from "../images/glutes.webp";
import calves from "../images/calves.webp";
import forearms from "../images/forearms.webp";
import neck from "../images/neck.webp";
import traps from "../images/traps.webp";
import lowerBack from "../images/lower_back.webp";
import middleBack from "../images/middle_back.webp";
import adductors from "../images/adductors.webp";
import abductors from "../images/abductors.webp";
import lats from "../images/lats.webp";
import { useState, useEffect } from "react";
import axios from "../api.js";
import Loader from "../components/Loader.jsx";
import { useNavigate } from "react-router";
import { ChevronDown, Dumbbell } from "lucide-react";

const muscleImages = {
  chest, biceps, triceps, shoulders, abdominals, quadriceps,
  hamstrings, glutes, calves, forearms, neck, traps,
  "lower back": lowerBack,
  "middle back": middleBack,
  adductors, abductors, lats,
};

const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function getPosts() {
      try {
        const res = await axios.get("/api/posts");
        if (res.status === 200) {
          setPosts(res.data.posts);
          setIsLoading(false);
        }
      } catch (error) {
        if (error.status === 401) {
          navigate("/auth");
        }
      }
    }
    getPosts();
  }, [navigate]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <>
      <div className="min-h-screen bg-background px-4 pb-28 pt-8 text-text sm:px-6 sm:pt-12">
        <main className="mx-auto max-w-2xl">
          <header className="mb-6 border-b border-border/10 pb-5">
            <h1 className="text-2xl font-bold tracking-tight">Feed</h1>
          </header>

          {posts.map((post) => {
            const exercises = Array.isArray(post.exercises) ? post.exercises : [];
            const isExpanded = Boolean(expandedPosts[post._id]);
            const exercisesId = `post-exercises-${post._id}`;
            const muscle = (post.mostFocusedMuscle || "").replace(/"/g, "").trim().toLowerCase();
            const muscleImage = Object.hasOwn(muscleImages, muscle) ? muscleImages[muscle] : undefined;
            return (
              <article
                key={post._id}
                aria-labelledby={`post-title-${post._id}`}
                className="rounded-xl border border-border/10 bg-card my-10"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
                    >
                      {post.userName
                        .split(" ")
                        .map((name) => name[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <p className="min-w-0 break-words text-sm font-semibold text-text">
                      {post.userName}
                    </p>
                  </div>

                  <div className="mt-4 sm:pl-12">
                    <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
                    <h2
                      id={`post-title-${post._id}`}
                      className="min-w-0 break-words text-lg font-semibold leading-snug"
                    >
                      {post.title}
                    </h2>
                    {exercises.length > 0 && (
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={exercisesId}
                        onClick={() => setExpandedPosts((previous) => ({ ...previous, [post._id]: !previous[post._id] }))}
                        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-primary/15 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card active:opacity-80"
                      >
                        <Dumbbell size={16} aria-hidden="true" />
                        {isExpanded ? "Hide exercises" : "View exercises"}
                        <span className="text-xs">({exercises.length})</span>
                        <ChevronDown size={16} aria-hidden="true" className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted">
                      {post.description}
                    </p>
                    {exercises.length > 0 && (
                      <section id={exercisesId} hidden={!isExpanded} aria-label="Workout exercises" className="mt-4 space-y-3">
                        {exercises.map((exercise, exerciseIndex) => {
                          const sets = Array.isArray(exercise.sets) ? exercise.sets : [];
                          return (
                            <div key={exercise._id || exerciseIndex} className="overflow-hidden rounded-lg border border-border/10 bg-background/60 p-4">
                              <h3 className="break-words text-sm font-semibold">{exercise.exercise || `Exercise ${exerciseIndex + 1}`}</h3>
                              {sets.length > 0 ? (
                                <table className="mt-3 w-full table-fixed text-left text-xs sm:text-sm">
                                  <caption className="sr-only">Sets for {exercise.exercise || `Exercise ${exerciseIndex + 1}`}</caption>
                                  <thead className="text-muted">
                                    <tr>
                                      <th scope="col" className="w-1/2 pb-2 font-medium">Set</th>
                                      <th scope="col" className="pb-2 text-right font-medium">Weight</th>
                                      <th scope="col" className="pb-2 text-right font-medium">Reps</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sets.map((set, setIndex) => (
                                      <tr key={set._id || setIndex} className="border-t border-border/10">
                                        <th scope="row" className="break-words py-2 pr-2 font-normal">
                                          {setIndex + 1}{set.setType && <span className="ml-2 capitalize text-muted">{set.setType}</span>}
                                          {set.isPr && <span className="ml-2 font-semibold text-primary">PR</span>}
                                        </th>
                                        <td className="break-words py-2 pl-2 text-right">{set.weight === "" || set.weight == null ? "—" : set.weight}</td>
                                        <td className="py-2 pl-2 text-right">{set.reps ?? "—"}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : <p className="mt-2 text-sm text-muted">No sets recorded.</p>}
                            </div>
                          );
                        })}
                      </section>
                    )}
                    <figure hidden={!post.mostFocusedMuscle} className="mt-5 flex items-center gap-5 overflow-hidden rounded-lg border border-border/10 bg-background/60 px-4 sm:gap-8 sm:px-6">
                      {muscleImage && <img
                        src={muscleImage}
                        alt={`Body diagram highlighting ${muscle}`}
                        width={451}
                        height={600}
                        className="h-48 w-28 shrink-0 object-contain object-bottom sm:h-56 sm:w-36"
                      />}
                      <figcaption className="py-5" hidden={post.mostFocusedMuscle === 'undefined'}>
                        <p className="text-xs text-muted">Muscle focus</p>
                        <p className="mt-1 text-base font-semibold">{post.mostFocusedMuscle}</p>
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                          <span
                            aria-hidden="true"
                            className="h-2 w-2 shrink-0 rounded-full bg-red-500"
                          />
                          Highlighted on diagram
                        </div>
                      </figcaption>
                    </figure>
                  </div>
                </div>
              </article>
            );
          })}
        </main>
      </div>
      <Navbar />
    </>
  );
};

export default FeedPage;
