import mongoose from 'mongoose'

const feedSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: false
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userName: {
    type: String,
    required: true
  },
  exercises: [
      {
        exercise: {
          type: String,
          ref: 'Exercise',
          
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
    mostFocusedMuscle: {
      type: String,
      required: false
    },
    startedAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },
}, {timestamps: true})

const Feed = mongoose.model('post', feedSchema)

export default Feed