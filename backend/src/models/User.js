import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  workouts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkoutSession'
    }
  ],

  password: {
    type: String,
    required: false
  },

  googleId: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },

  profilePicture: {
    type: String,
    required: false
  },

  authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "local"
  },

  weightUnit: {
    type: String,
    required: true,
    default: 'kg'
  },
  workoutsPerWeek: {
    type: Number,
    required: false,
    defaultValue: 0
  },
  workoutPreference: {
    type: String,
    required: false,
    enum: [
      "Muscle strength",
      "Muscle hypertrophy",
      "Muscular endurance",
      "Cardiovascular endurance",
      "Explosive power",
      "Speed",
      "Agility",
      "Athletic performance",
      "Sport-specific conditioning",
      "Fat loss",
      "Weight loss",
      "Weight gain",
      "Body recomposition",
      "Muscle definition",
      "Weight maintenance",
      "General fitness",
      "Functional fitness",
      "Mobility",
      "Flexibility",
      "Balance",
      "Coordination",
      "Stability",
      "Core strength",
      "Grip strength",
      "Posture",
      "Movement technique",
      "Injury prevention",
      "Rehabilitation",
      "Return to training",
      "Bone health",
      "Joint health",
      "Healthy aging",
      "Workout consistency",
      "Stress relief",
      "Mental well-being",
      "Energy and vitality",
      "Sleep quality",
      "Competition preparation",
      "Personal record improvement"
    ]
  },
  resetToken: {
    type: String,
    required: false
  },
  resetTokenExpiration: {
    type: Date,
    required: false
  }
})

const User = mongoose.model('user', userSchema)

export default User