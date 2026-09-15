import { useState } from "react";
import { ArrowLeft, Check, Dumbbell, Globe, Send } from "lucide-react";
import axios from "../api.js";
import { toast } from "react-hot-toast";
import { useNavigate } from 'react-router'

const PostWorkout = ({ workout, onCancel, isSubmitting = false }) => {
  const [postName, setPostName] = useState("");
  const [description, setDescription] = useState("");
  const [includeExercises, setIncludeExercises] = useState(false);
  const navigate = useNavigate()
  console.log(workout);

  async function handleSubmit(e) {
    try {
      e.preventDefault();
      if (!postName.trim() || isSubmitting) return;
      isSubmitting = true
      const res = await axios.post("/api/post-workout", {
        title: postName,
        description,
        includeExercises,
        workout,
      });
      if (res.status === 201) {
        toast.success(res.data.message)
        isSubmitting = false
        console.log(res.data.newPost)
        setPostName("")
        setDescription("")
        setIncludeExercises(false)
      }
      if (res.status === 401) return navigate('/auth')
    } catch (error) {}
  }

  return (
    <div className="min-h-screen bg-background px-4 pb-28 pt-6 text-text sm:px-6 sm:pt-10">
      <main className="mx-auto max-w-2xl">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-muted transition hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to workout
          </button>
        )}

        <header className="mb-7 mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Share your progress
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Post your workout
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            A new personal best or just showing up. Every session counts.
          </p>
        </header>

        <form
          onSubmit={async (e) => await handleSubmit(e)}
          className="overflow-hidden rounded-3xl border border-border/10 bg-card"
        >
          <div className="flex items-center gap-3 border-b border-border/10 bg-primary/5 px-5 py-4 sm:px-7">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Dumbbell aria-hidden="true" className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {workout?.workoutSplit || "Your workout"}
              </p>
              <p className="mt-1 text-xs text-muted">
                One more session in the books.
              </p>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-7">
            <div>
              <label
                htmlFor="post-name"
                className="mb-2 block text-sm font-semibold"
              >
                Post title <span className="text-primary">*</span>
              </label>
              <input
                id="post-name"
                name="postName"
                type="text"
                required
                maxLength={100}
                value={postName}
                onChange={(event) => setPostName(event.target.value)}
                placeholder="A little stronger than yesterday"
                className="w-full rounded-xl border border-border/10 bg-background/70 px-4 py-3 text-sm outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="post-description"
                  className="text-sm font-semibold"
                >
                  Description
                </label>
                <span className="text-xs text-muted">Optional</span>
              </div>
              <textarea
                id="post-description"
                name="description"
                rows={5}
                maxLength={2000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="How did your session go? Share a win, a challenge, or what kept you going."
                className="w-full resize-y rounded-xl border border-border/10 bg-background/70 px-4 py-3 text-sm leading-relaxed outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              <p className="mt-2 text-right text-xs tabular-nums text-muted">
                {description.length}/2000
              </p>
            </div>

            <button
              type="button"
              aria-pressed={includeExercises}
              onClick={() => setIncludeExercises((previous) => !previous)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${includeExercises ? "border-primary/50 bg-primary/10" : "border-border/10 bg-background/40 hover:border-primary/30"}`}
            >
              <Dumbbell
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-primary"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">
                  Include your workout exercises
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  Let others see the exercises from this session.
                </span>
              </span>
              <span
                aria-hidden="true"
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${includeExercises ? "border-primary bg-primary text-white" : "border-border/30 bg-background"}`}
              >
                {includeExercises && <Check className="h-4 w-4" />}
              </span>
            </button>

            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
              <Globe aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              Your post will be visible to everyone in the community.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border/10 px-5 py-4 sm:px-7">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="rounded-xl px-5 py-3 text-sm font-semibold text-muted transition hover:bg-background/50 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              //disabled={isSubmitting || !postName.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primaryHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send aria-hidden="true" className="h-4 w-4" />
              {isSubmitting ? "Posting…" : "Post workout"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default PostWorkout;
