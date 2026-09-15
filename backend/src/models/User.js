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