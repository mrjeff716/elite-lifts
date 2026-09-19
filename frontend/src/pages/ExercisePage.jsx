import React from "react";
import { useEffect, useState, useRef } from "react";
import { imageUrls } from "../utils/utils.js";
import { ArrowLeft, MoveLeft, ArrowRight } from "lucide-react";
import axios from "../api";
import Exercise from "../components/Exercise";
import MuscleImages from "../components/MuscleGroups";
import Loader from "../components/Loader.jsx";
import Navbar from "../components/Navbar.jsx";
import { useNavigate } from "react-router";

const ExercisePage = ({
  isExercisePageOpen,
  workout,
  setWorkout,
  setChosenExercise,
  exerciseIndex,
  setIndex,
}) => {
  const [primaryMuscles, setPrimaryMuscles] = useState("");
  const [exercises, setExercises] = useState([]);
  const ref = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const exercisesPage = useRef()

  const navigate = useNavigate();

  useEffect(() => {
    if (exercisesPage.current !== null) {
      exercisesPage.current.scrollIntoView()
    }
  }, [])

  useEffect(() => {
    async function getExercises() {
      try {
        const res = await axios.get(`/api/${primaryMuscles}`, {
          headers: {
            Accept: "application/json",
          },
        });

        /*const exercises = res.data.map(e => {
          const folderName = e.imageUrls[0].split('/')[3]
          return {...e, imageUrls: `http://localhost:3000/images/exercises/Alternating_Floor_Press/0.jpg`}
        })*/
        setExercises(res.data);
        //setSearchResult(res.data)
        setIsLoading(false);
      } catch (error) {
        if (error.status === 401 || error.statusCode === 401) {
          navigate("/auth");
        }
      }
    }
    getExercises();
  }, [primaryMuscles]);

  const scroll = (direction) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -400 : 400,
        behavior: "smooth",
      });
    }
  };

  function MuscleImages1() {
    return imageUrls.map((img) => {
      return (
        <div className="rouded-full py-4 px-10 bg-card flex flex-col items-center rounded-xl text-center">
          <button
            onClick={() => {
              setPrimaryMuscles(img.name.toLowerCase());
            }}
          >
            <img
              loading="lazy"
              src={img.imageUrl}
              className="w-24 h-32 object-contain"
            />
            <h1 className="text-xl font-bold">{img.name}</h1>
          </button>
        </div>
      );
    });
  }

  function Exercises() {
    if (!search || search === "") {
      return exercises.map((e) => {
        return (
          <Exercise
            exercise={e}
            isExercisePageOpen={isExercisePageOpen}
            setChosenExercise={setChosenExercise}
            exerciseIndex={exerciseIndex}
            setIndex={setIndex}
            setWorkout={setWorkout}
            workout={workout}
          />
        );
      });
    } else {
      return exercises.map((e) => {
        return (
          e.name.toLowerCase().trim().includes(search.toLowerCase().trim()) && (
            <Exercise
              exercise={e}
              isExercisePageOpen={isExercisePageOpen}
              setChosenExercise={setChosenExercise}
              exerciseIndex={exerciseIndex}
              setIndex={setIndex}
              setWorkout={setWorkout}
              workout={workout}
            />
          )
        );
      });
    }
  }

  /*function Exercises() {
  return exercises
    .filter((e) =>
      e.name.toLowerCase().trim().includes(search.toLowerCase().trim())
    )
    .map((e) => (
      <Exercise
        key={e.exerciseId}
        exercise={e}
        isExercisePageOpen={isExercisePageOpen}
        workout={workout}
        setWorkout={setWorkout}
        setChosenExercise={setChosenExercise}
        exerciseIndex={exerciseIndex}
        setIndex={setIndex}
      />
    ));
}*/

  return (
    <div className="h-screen scroll-mt-10" ref={exercisesPage}>
      {!primaryMuscles ? (
        <section className="mx-auto max-w-5xl px-4 pb-32 pt-8 text-text sm:px-8 sm:pt-12">
          <header className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Exercise library
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Where are we training?
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Tap a muscle to find your next exercise.
            </p>
          </header>
          <div className="rounded-3xl border border-border/10 bg-card p-3 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3 px-1 sm:mb-5">
              <h2 className="text-sm font-semibold">Choose a muscle group</h2>
              <span className="inline-flex items-center gap-2 text-[10px] text-muted sm:text-xs">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Tap blue areas
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-5">
              <div className="min-w-0 rounded-2xl border border-border/10 bg-background/60 p-2 sm:p-5">
                <p className="pt-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:text-xs">
                  Front view
                </p>
                <svg
                  viewBox="35 0 230 495"
                  className="mx-auto mt-2 w-full max-w-[280px]"
                  role="group"
                  aria-label="Front body muscle selector"
                >
                  <ellipse
                    cx="150"
                    cy="480"
                    rx="57"
                    ry="5"
                    fill="#3b82f6"
                    opacity="0.08"
                  />
                  <ellipse
                    cx="150"
                    cy="43"
                    rx="23"
                    ry="29"
                    fill="#273449"
                    stroke="#43516a"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M139 70 L137 86 L123 93 Q97 94 85 111 L74 152 L67 186 L55 215 L47 249 L46 267 Q51 278 57 267 L67 254 L80 229 L95 205 L108 170 L116 195 L107 234 L102 270 L99 318 L104 357 L99 397 L99 442 L94 464 Q92 475 106 476 L119 472 L120 448 L132 407 L137 362 L143 330 L150 284 L157 330 L163 362 L168 407 L180 448 L181 472 L194 476 Q208 475 206 464 L201 442 L201 397 L196 357 L201 318 L198 270 L193 234 L184 195 L192 170 L205 205 L220 229 L233 254 L243 267 Q249 278 254 267 L253 249 L245 215 L233 186 L226 152 L215 111 Q203 94 177 93 L163 86 L161 70 Z"
                    fill="#202d40"
                    stroke="#43516a"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Browse neck exercises"
                    onClick={() => setPrimaryMuscles("neck")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPrimaryMuscles("neck");
                      }
                    }}
                    className="group cursor-pointer outline-none"
                  >
                    <title>Neck</title>
                    <path
                      d="M139 68 L139 85 L128 96 L150 105 L172 96 L161 85 L161 68 Z"
                      className="fill-primary/30 stroke-primary/60 transition-colors duration-150 group-hover:fill-primary/80 group-hover:stroke-blue-200 group-focus:fill-primary/80 group-focus:stroke-white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </g>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Browse shoulders exercises"
                    onClick={() => setPrimaryMuscles("shoulders")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPrimaryMuscles("shoulders");
                      }
                    }}
                    className="group cursor-pointer outline-none"
                  >
                    <title>Shoulders</title>
                    <path
                      d="M124 96 Q96 95 88 113 L84 140 L102 144 L116 121 Z M176 96 Q204 95 212 113 L216 140 L198 144 L184 121 Z"
                      className="fill-primary/30 stroke-primary/60 transition-colors duration-150 group-hover:fill-primary/80 group-hover:stroke-blue-200 group-focus:fill-primary/80 group-focus:stroke-white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </g>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Browse chest exercises"
                    onClick={() => setPrimaryMuscles("chest")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPrimaryMuscles("chest");
                      }
                    }}
                    className="group cursor-pointer outline-none"
                  >
                    <title>Chest</title>
                    <path
                      d="M126 101 L147 111 L147 148 Q126 155 109 140 L116 119 Z M174 101 L153 111 L153 148 Q174 155 191 140 L184 119 Z"
                      className="fill-primary/30 stroke-primary/60 transition-colors duration-150 group-hover:fill-primary/80 group-hover:stroke-blue-200 group-focus:fill-primary/80 group-focus:stroke-white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </g>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Browse biceps exercises"
                    onClick={() => setPrimaryMuscles("biceps")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPrimaryMuscles("biceps");
                      }
                    }}
                    className="group cursor-pointer outline-none"
                  >
                    <title>Biceps</title>
                    <path
                      d="M84 146 L102 150 L100 171 L88 192 L75 184 Z M216 146 L198 150 L200 171 L212 192 L225 184 Z"
                      className="fill-primary/30 stroke-primary/60 transition-colors duration-150 group-hover:fill-primary/80 group-hover:stroke-blue-200 group-focus:fill-primary/80 group-focus:stroke-white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </g>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Browse forearms exercises"
                    onClick={() => setPrimaryMuscles("forearms")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPrimaryMuscles("forearms");
                      }
                    }}
                    className="group cursor-pointer outline-none"
                  >
                    <title>Forearms</title>
                    <path
                      d="M73 191 L87 198 L78 222 L65 247 L54 243 L62 215 Z M227 191 L213 198 L222 222 L235 247 L246 243 L238 215 Z"
                      className="fill-primary/30 stroke-primary/60 transition-colors duration-150 group-hover:fill-primary/80 group-hover:stroke-blue-200 group-focus:fill-primary/80 group-focus:stroke-white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </g>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Browse abdominals exercises"
                    onClick={() => setPrimaryMuscles("abdominals")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPrimaryMuscles("abdominals");
                      }
                    }}
                    className="group cursor-pointer outline-none"
                  >
                    <title>Abdominals</title>
                    <path
                      d="M126 158 L147 155 L147 177 L127 178 Z M153 155 L174 158 L173 178 L153 177 Z M128 184 L147 183 L147 204 L131 205 Z M153 183 L172 184 L169 205 L153 204 Z M132 211 L147 210 L147 237 L138 229 Z M153 210 L168 211 L162 229 L153 237 Z"
                      className="fill-primary/30 stroke-primary/60 transition-colors duration-150 group-hover:fill-primary/80 group-hover:stroke-blue-200 group-focus:fill-primary/80 group-focus:stroke-white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </g>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Browse abductors exercises"
                    onClick={() => setPrimaryMuscles("abductors")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPrimaryMuscles("abductors");
                      }
                    }}
                    className="group cursor-pointer outline-none"
                  >
                    <title>Abductors</title>
                    <path
                      d="M112 214 L125 218 L128 245 L119 279 L108 265 Z M188 214 L175 218 L172 245 L181 279 L192 265 Z"
                      className="fill-primary/30 stroke-primary/60 transition-colors duration-150 group-hover:fill-primary/80 group-hover:stroke-blue-200 group-focus:fill-primary/80 group-focus:stroke-white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </g>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Browse adductors exercises"
                    onClick={() => setPrimaryMuscles("adductors")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPrimaryMuscles("adductors");
                      }
                    }}
                    className="group cursor-pointer outline-none"
                  >
                    <title>Adductors</title>
                    <path
                      d="M135 243 L147 252 L142 305 L133 320 L130 283 Z M165 243 L153 252 L158 305 L167 320 L170 283 Z"
                      className="fill-primary/30 stroke-primary/60 transition-colors duration-150 group-hover:fill-primary/80 group-hover:stroke-blue-200 group-focus:fill-primary/80 group-focus:stroke-white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </g>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Browse quadriceps exercises"
                    onClick={() => setPrimaryMuscles("quadriceps")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPrimaryMuscles("quadriceps");
                      }
                    }}
                    className="group cursor-pointer outline-none"
                  >
                    <title>Quadriceps</title>
                    <path
                      d="M118 280 L126 253 L127 295 L132 328 L123 351 L110 344 L106 316 Z M182 280 L174 253 L173 295 L168 328 L177 351 L190 344 L194 316 Z"
                      className="fill-primary/30 stroke-primary/60 transition-colors duration-150 group-hover:fill-primary/80 group-hover:stroke-blue-200 group-focus:fill-primary/80 group-focus:stroke-white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </g>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Browse calves exercises"
                    onClick={() => setPrimaryMuscles("calves")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPrimaryMuscles("calves");
                      }
                    }}
                    className="group cursor-pointer outline-none"
                  >
                    <title>Calves</title>
                    <path
                      d="M110 367 L127 370 L122 406 L113 443 L104 440 L103 409 Z M190 367 L173 370 L178 406 L187 443 L196 440 L197 409 Z"
                      className="fill-primary/30 stroke-primary/60 transition-colors duration-150 group-hover:fill-primary/80 group-hover:stroke-blue-200 group-focus:fill-primary/80 group-focus:stroke-white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </g>
                </svg>
              </div>
              <div className="min-w-0 rounded-2xl border border-border/10 bg-background/60 p-2 sm:p-5">
                <p className="pt-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:text-xs">
                  Back view
                </p>
                <svg
                  viewBox="35 0 230 495"
                  className="mx-auto mt-2 w-full max-w-[280px]"
                  role="group"
                  aria-label="Back body muscle selector"
                >
                  <ellipse
                    cx="150"
                    cy="480"
                    rx="57"
                    ry="5"
                    fill="#3b82f6"
                    opacity="0.08"
                  />
                  <ellipse
                    cx="150"
                    cy="43"
                    rx="23"
                    ry="29"
                    fill="#273449"
                    stroke="#43516a"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M139 70 L137 86 L123 93 Q97 94 85 111 L74 152 L67 186 L55 215 L47 249 L46 267 Q51 278 57 267 L67 254 L80 229 L95 205 L108 170 L116 195 L107 234 L102 270 L99 318 L104 357 L99 397 L99 442 L94 464 Q92 475 106 476 L119 472 L120 448 L132 407 L137 362 L143 330 L150 284 L157 330 L163 362 L168 407 L180 448 L181 472 L194 476 Q208 475 206 464 L201 442 L201 397 L196 357 L201 318 L198 270 L193 234 L184 195 L192 170 L205 205 L220 229 L233 254 L243 267 Q249 278 254 267 L253 249 L245 215 L233 186 L226 152 L215 111 Q203 94 177 93 L163 86 L161 70 Z"
                    fill="#202d40"
                    stroke="#43516a"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Browse traps exercises"
                    onClick={() => setPrimaryMuscles("traps")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPrimaryMuscles("traps");
                      }
                    }}
                    className="group cursor-pointer outline-none"
                  >
                    <title>Traps</title>
                    <path
                      d="M138 78 L148 87 L148 145 L119 112 L128 97 Z M162 78 L152 87 L152 145 L181 112 L172 97 Z"
                      className="fill-primary/30 stroke-primary/60 transition-colors duration-150 group-hover:fill-primary/80 group-hover:stroke-blue-200 group-focus:fill-primary/80 group-focus:stroke-white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </g>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Browse shoulders exercises"
                    onClick={() => setPrimaryMuscles("shoulders")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPrimaryMuscles("shoulders");
                      }
                    }}
                    className="group cursor-pointer outline-none"
                  >
                    <title>Shoulders</title>
                    <path
                      d="M119 101 L111 124 L101 143 L85 140 L88 117 Q95 102 119 101 Z M181 101 L189 124 L199 143 L215 140 L212 117 Q205 102 181 101 Z"
                      className="fill-primary/30 stroke-primary/60 transition-colors duration-150 group-hover:fill-primary/80 group-hover:stroke-blue-200 group-focus:fill-primary/80 group-focus:stroke-white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </g>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Browse triceps exercises"
                    onClick={() => setPrimaryMuscles("triceps")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPrimaryMuscles("triceps");
                      }
                    }}
                    className="group cursor-pointer outline-none"
                  >
                    <title>Triceps</title>
                    <path
                      d="M85 148 L102 148 L99 175 L88 193 L75 185 Z M215 148 L198 148 L201 175 L212 193 L225 185 Z"
                      className="fill-primary/30 stroke-primary/60 transition-colors duration-150 group-hover:fill-primary/80 group-hover:stroke-blue-200 group-focus:fill-primary/80 group-focus:stroke-white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </g>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Browse middle back exercises"
                    onClick={() => setPrimaryMuscles("middle back")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPrimaryMuscles("middle back");
                      }
                    }}
                    className="group cursor-pointer outline-none"
                  >
                    <title>Middle Back</title>
                    <path
                      d="M119 121 L146 152 L146 178 L124 159 L114 143 Z M181 121 L154 152 L154 178 L176 159 L186 143 Z"
                      className="fill-primary/30 stroke-primary/60 transition-colors duration-150 group-hover:fill-primary/80 group-hover:stroke-blue-200 group-focus:fill-primary/80 group-focus:stroke-white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </g>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Browse lats exercises"
                    onClick={() => setPrimaryMuscles("lats")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPrimaryMuscles("lats");
                      }
                    }}
                    className="group cursor-pointer outline-none"
                  >
                    <title>Lats</title>
                    <path
                      d="M109 149 L120 166 L140 184 L133 208 L119 199 L110 177 Z M191 149 L180 166 L160 184 L167 208 L181 199 L190 177 Z"
                      className="fill-primary/30 stroke-primary/60 transition-colors duration-150 group-hover:fill-primary/80 group-hover:stroke-blue-200 group-focus:fill-primary/80 group-focus:stroke-white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </g>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Browse lower back exercises"
                    onClick={() => setPrimaryMuscles("lower back")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPrimaryMuscles("lower back");
                      }
                    }}
                    className="group cursor-pointer outline-none"
                  >
                    <title>Lower Back</title>
                    <path
                      d="M141 186 L148 189 L148 232 L132 219 Z M159 186 L152 189 L152 232 L168 219 Z"
                      className="fill-primary/30 stroke-primary/60 transition-colors duration-150 group-hover:fill-primary/80 group-hover:stroke-blue-200 group-focus:fill-primary/80 group-focus:stroke-white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </g>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Browse forearms exercises"
                    onClick={() => setPrimaryMuscles("forearms")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPrimaryMuscles("forearms");
                      }
                    }}
                    className="group cursor-pointer outline-none"
                  >
                    <title>Forearms</title>
                    <path
                      d="M73 198 L85 200 L77 225 L65 247 L54 242 L63 215 Z M227 198 L215 200 L223 225 L235 247 L246 242 L237 215 Z"
                      className="fill-primary/30 stroke-primary/60 transition-colors duration-150 group-hover:fill-primary/80 group-hover:stroke-blue-200 group-focus:fill-primary/80 group-focus:stroke-white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </g>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Browse glutes exercises"
                    onClick={() => setPrimaryMuscles("glutes")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPrimaryMuscles("glutes");
                      }
                    }}
                    className="group cursor-pointer outline-none"
                  >
                    <title>Glutes</title>
                    <path
                      d="M126 228 Q137 231 147 241 L147 275 Q129 288 112 268 L114 244 Z M174 228 Q163 231 153 241 L153 275 Q171 288 188 268 L186 244 Z"
                      className="fill-primary/30 stroke-primary/60 transition-colors duration-150 group-hover:fill-primary/80 group-hover:stroke-blue-200 group-focus:fill-primary/80 group-focus:stroke-white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </g>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Browse hamstrings exercises"
                    onClick={() => setPrimaryMuscles("hamstrings")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPrimaryMuscles("hamstrings");
                      }
                    }}
                    className="group cursor-pointer outline-none"
                  >
                    <title>Hamstrings</title>
                    <path
                      d="M112 280 Q128 294 145 284 L137 323 L127 351 L111 348 L106 314 Z M188 280 Q172 294 155 284 L163 323 L173 351 L189 348 L194 314 Z"
                      className="fill-primary/30 stroke-primary/60 transition-colors duration-150 group-hover:fill-primary/80 group-hover:stroke-blue-200 group-focus:fill-primary/80 group-focus:stroke-white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </g>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Browse calves exercises"
                    onClick={() => setPrimaryMuscles("calves")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPrimaryMuscles("calves");
                      }
                    }}
                    className="group cursor-pointer outline-none"
                  >
                    <title>Calves</title>
                    <path
                      d="M111 366 L126 367 L128 391 L118 419 L110 436 L104 414 L103 389 Z M189 366 L174 367 L172 391 L182 419 L190 436 L196 414 L197 389 Z"
                      className="fill-primary/30 stroke-primary/60 transition-colors duration-150 group-hover:fill-primary/80 group-hover:stroke-blue-200 group-focus:fill-primary/80 group-focus:stroke-white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </g>
                </svg>
              </div>
            </div>
            <p className="mt-4 text-center text-xs leading-relaxed text-muted">
              Prefer to browse by name? All muscle groups are below.
            </p>
          </div>
          <div className="mb-4 mt-8 flex items-center gap-4">
            <h2 className="shrink-0 text-base font-semibold">
              All muscle groups
            </h2>
            <div className="h-px flex-1 bg-border/10" />
          </div>
          <div className="grid grid-cols-2 gap-3 text-primary sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <MuscleImages1 size={20} setPrimaryMuscles={setPrimaryMuscles} />
          </div>
        </section>
      ) : (
        <>
          {isLoading && <Loader />}
          <section className="fixed flex flex-col">
            <button
              type="button"
              aria-label="Back to muscle groups"
              className="group fixed top-5 left-5 z-10 flex size-11 items-center justify-center rounded-full border border-primary/20 bg-card text-primary shadow-lg shadow-black/20 transition-colors hover:border-primary/50 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card active:bg-primary/20"
              onClick={() => setPrimaryMuscles("")}
            >
              <MoveLeft aria-hidden="true" className="size-5 transition-transform motion-safe:group-hover:-translate-x-0.5" />
            </button>
          </section>
          <section
            ref={ref}
            className="flex gap-5 mt-10 overflow-x-auto px-5 pb-5 snap-x snap-mandatory [scrollbar-width:none] h-fit"
          >
            <div className="flex justify-between">
              {!isLoading && (
                <button
                  type="button"
                  aria-label="Scroll muscle groups left"
                  className="group absolute top-24 left-5 z-10 flex size-11 items-center justify-center rounded-full border border-primary/20 bg-card text-primary shadow-lg shadow-black/20 transition-colors hover:border-primary/50 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card active:bg-primary/20"
                  onClick={() => {
                    return scroll("left");
                  }}
                >
                  <ArrowLeft aria-hidden="true" className="size-5 transition-transform motion-safe:group-hover:-translate-x-0.5" />
                </button>
              )}
              <MuscleImages
                setPrimaryMuscles={setPrimaryMuscles}
                setIsLoading={setIsLoading}
              />
              {!isLoading && (
                <button
                  type="button"
                  aria-label="Scroll muscle groups right"
                  className="group absolute top-24 right-5 z-10 flex size-11 items-center justify-center rounded-full border border-primary/20 bg-card text-primary shadow-lg shadow-black/20 transition-colors hover:border-primary/50 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card active:bg-primary/20"
                  onClick={() => {
                    return scroll("right");
                  }}
                >
                  <ArrowRight aria-hidden="true" className="size-5 transition-transform motion-safe:group-hover:translate-x-0.5" />
                </button>
              )}
            </div>
          </section>
          <section className="flex justify-center justify-self-center w-full">
            <input
              type="text"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for an Exercise"
              className="px-4 w-3/4 sm:w-1/2 my-10 py-4 bg-card rounded-full focus:border-primary/80 focus:outline-none transition focus:border-2 text-white"
            />
          </section>
          <section className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-4 gap-12">
            <Exercises setIsLoading={setIsLoading} isLoading={isLoading} />
          </section>
        </>
      )}
      <Navbar className="z-20" />
    </div>
  );
};

export default ExercisePage;
