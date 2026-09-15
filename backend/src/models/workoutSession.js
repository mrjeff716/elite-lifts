import mongoose from 'mongoose'


const workoutSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    workoutSplit: {
      type: String,
      required: true,
    },

    workoutName: {
      type: String,
      required: true,
    },

    startedAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },

    duration: {
      type: String, // minutes
    },

    exercises: [
      {
        exercise: {
          type: String,
          ref: 'Exercise',
          
        },

        primaryMuscle: {
          type: String,
          required: true
        },

        sets: [
          {
            setType: {
              type: String,
              
            },
            weight: {
              type: String,
            },

            reps: {
              type: Number,
              min: 0,
            },
            isPr: {
              type: Boolean,
              default: false,
            },
          },
        ],
      },
    ],
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    completed: {
      type: Boolean,
      default: false,
    },
    aiAnalysis: {
    type: String,
    required: false
  },
  },
  {
    timestamps: true,
  },
);

const WorkoutSession = mongoose.model("WorkoutSession", workoutSessionSchema);
export default WorkoutSession
