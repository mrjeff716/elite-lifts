import { Link } from "react-router";
import { useRef } from "react";
import { MoveLeft } from "lucide-react";

const Exercise = (props) => {
  if (!props.isLoading) {
    if (props.isExercisePageOpen && props.workout) {

      function addExercise(value) {
        props.setWorkout(prev => {
          return ({
            ...prev,
            exercises: prev.exercises.map((e, eIndex) => {
              if (eIndex === props.exerciseIndex) {
                return {...e, exercise: value, primaryMuscle: props.exercise.primaryMuscles[0]}
              } else {
                return {...e}
              }
            })
          })
        })
      }

      return (
        <>
        <MoveLeft
            className="fixed top-5 left-5 size-16 text-primary bg-slate-600 p-4 rounded-full cursor-pointer hover:opacity-80 transition"
            onClick={() => props.setChosenExercise(prev => {
              return {...prev, isExercisePageOpen: false}
            })}
          />
        <div className="bg-card flex flex-col rounded-xl w-full overflow-hidden cursor-pointer hover:opacity-80 transition" onClick={() => {
          addExercise(props.exercise.name)
          props.setChosenExercise(prev => {
            return {...prev, isExercisePageOpen: false}
          })
          }}>
          <div className="aspect-video w-full shrink-0 bg-white">
          <img
            src={`${import.meta.env.VITE_API_URL}${props.exercise.imageUrls[0]}`}
            alt={props.exercise.name}
            loading="lazy"
            className="block w-full h-full object-contain"
          />
          </div>
          <div className="flex flex-col mx-2 my-2">
            <h1 className="font-bold text-primary">{props.exercise.name}</h1>
            <p className="text-primaryHover">
              {props.exercise.primaryMuscles[0]}
            </p>
          </div>
        </div>
        </>
      );
    }
    else if (!props.isExercisePageOpen || props.isExercisePageOpen === undefined) {
    return (
      <a
        href={`/exercises/${props.exercise.exerciseId ? props.exercise.exerciseId : ""}`}
        className="bg-card flex flex-col rounded-xl w-full overflow-hidden cursor-pointer hover:opacity-80 transition"
      >
        <div className="aspect-video w-full shrink-0 bg-white">
        <img
          src={`http://localhost:3000${props.exercise.imageUrls[0]}`}
          alt={props.exercise.name}
          loading="lazy"
          className="block w-full h-full object-contain"
        />
        </div>
        <div className="flex flex-col mx-2 my-2">
          <h1 className="font-bold text-primary">{props.exercise.name}</h1>
          <p className="text-primaryHover">
            {props.exercise.primaryMuscles[0]}
          </p>
        </div>
      </a>
    );
  }
  } 
};

export default Exercise;
