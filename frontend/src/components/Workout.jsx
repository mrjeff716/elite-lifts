import { useNavigate } from 'react-router'

const Workout = (props) => {
  const navigate = useNavigate()
  const workoutDate = props.workout.updatedAt ? new Date(props.workout.updatedAt) : null;
  const formattedDate = workoutDate && !Number.isNaN(workoutDate.getTime())
    ? workoutDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date unavailable';

  function getTotalSets() {
    const setArrays = props.workout.exercises.map((e) => e.sets);
    let totalSets = 0;
    setArrays.forEach((sa) => {
      totalSets += sa.length;
    });
    return totalSets;
  }

  return (
    <div className="bg-card border border-border/10 rounded-2xl p-5 cursor-pointer active:opacity-70 transition duration-200 hover:scale-105"
    onClick={() => {
      return setTimeout(() => {
        navigate(`/workout/workout-details/${props.workout._id}`)
      }, 200)
    }}>
              <div className="flex items-start justify-between gap-4">

                <div>
                  <h3 className="text-lg font-bold">
                    {props.workout.workoutName}
                  </h3>

                  {/*<p className="text-muted text-sm mt-1">
                    Chest • Back • Shoulders • Arms
                  </p>*/}
                  <h3 className="text-lg font-light">
                    {props.workout.workoutSplit}
                  </h3>

                  {/*<p className="text-muted text-sm mt-1">
                    Chest • Back • Shoulders • Arms
                  </p>*/}
                </div>

                <p className="text-muted text-sm">
                  {formattedDate}
                </p>

              </div>

              <div className="flex gap-6 mt-5 text-sm">

                <div>
                  <p className="text-muted">
                    Duration
                  </p>

                  <p className="font-medium mt-1">
                    {props.workout.duration}
                  </p>
                </div>

                <div>
                  <p className="text-muted">
                    Exercises
                  </p>

                  <p className="font-medium mt-1">
                    {props.workout.exercises.length}
                  </p>
                </div>

                <div>
                  <p className="text-muted">
                    Sets
                  </p>

                  <p className="font-medium mt-1">
                    {getTotalSets()}
                  </p>
                </div>

              </div>
            </div>
  )
}

export default Workout
