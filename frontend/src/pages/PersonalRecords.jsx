import { useEffect, useRef, useState } from "react";

// Static examples — replace these with your own records when ready.
const records = [
  { exercise: "Barbell Bench Press", muscle: "Chest", weight: 80, reps: 5, date: "Sep 10, 2026", improvement: "+5 kg" },
  { exercise: "Barbell Squat", muscle: "Legs", weight: 120, reps: 3, date: "Sep 8, 2026", improvement: "+10 kg" },
  { exercise: "Deadlift", muscle: "Back", weight: 140, reps: 1, date: "Sep 6, 2026", improvement: "+5 kg" },
  { exercise: "Overhead Press", muscle: "Shoulders", weight: 45, reps: 6, date: "Sep 2, 2026", improvement: "+2.5 kg" },
];

const PersonalRecords = ({ onClose, pr }) => {
  const dialogRef = useRef(null);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="pr-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-auto h-[80dvh] min-h-[min(560px,90dvh)] max-h-[90dvh] w-[calc(100%-2rem)] max-w-none overflow-hidden rounded-3xl border border-border/20 bg-card p-0 text-text shadow-2xl motion-safe:animate-modal-in motion-safe:backdrop:animate-backdrop-in backdrop:bg-black/70 backdrop:backdrop-blur-sm md:h-[70dvh] md:w-1/2"
    >
      <div className="flex h-full flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 px-5 pt-6 sm:px-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Your progress, recorded</p>
            <h2 id="pr-title" className="mt-2 text-2xl font-bold tracking-tight">Personal records</h2>
            <p className="mt-1 text-sm text-muted">Every new best is a step forward.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close personal records"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/20 bg-background text-2xl text-muted transition hover:border-primary/50 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="mx-5 mt-5 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/10 pb-4 sm:mx-7">
          <div role="group" aria-label="Filter records by period" className="flex gap-1 rounded-xl border border-border/10 bg-background p-1">
            {["Week", "Month", "all"].map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={period === option.toLowerCase()}
                onClick={() => setPeriod(option.toLowerCase())}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${period === option.toLowerCase() ? "bg-primary text-white shadow-sm" : "text-muted hover:bg-primary/10 hover:text-text"}`}
              >
                {option}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted">{pr[period].length} sample records</span>
        </div>

        {/* The buttons only change their selected appearance; data stays static. */}
        <div
          tabIndex={0}
          role="region"
          aria-label="Personal record list"
          className="mr-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:#475569_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-600 hover:[&::-webkit-scrollbar-thumb]:bg-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:px-7"
        >
          <ul className="space-y-3">
            {pr[period].map((record) => (
              <li key={record._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/10 bg-background/70 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{record.exerciseName}</p>
                  <p className="mt-1 text-xs text-muted">{record.date}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-lg font-bold">{record.weight} <span className="text-xs font-normal text-muted">kg × {record.reps} reps</span></p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <footer className="shrink-0 border-t border-border/10 px-5 py-3 text-xs text-muted sm:px-7">Your next milestone starts with your next workout.</footer>
      </div>
    </dialog>
  );
};

export default PersonalRecords;
