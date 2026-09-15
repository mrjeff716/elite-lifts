import mongoose from 'mongoose'

const exerciseSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: String,
      required: true,
      unique: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    force: {
      type: String,
      enum: ["push", "pull", "static", null],
      default: null
    },

    level: {
      type: String,
      enum: ["beginner", "intermediate", "expert"],
      required: true
    },

    mechanic: {
      type: String,
      enum: ["compound", "isolation", null],
      default: null
    },

    equipment: {
      type: String,
      enum: [
        "bands",
        "barbell",
        "body only",
        "cable",
        "dumbbell",
        "e-z curl bar",
        "exercise ball",
        "foam roll",
        "kettlebells",
        "machine",
        "medicine ball",
        "other",
        null
      ],
      default: null
    },

    primaryMuscles: [
      {
        type: String,
        enum: [
          "abdominals",
          "abductors",
          "adductors",
          "biceps",
          "calves",
          "chest",
          "forearms",
          "glutes",
          "hamstrings",
          "lats",
          "lowerback",
          "middle back",
          "neck",
          "quadriceps",
          "shoulders",
          "traps",
          "triceps"
        ]
      }
    ],

    secondaryMuscles: [
      {
        type: String,
        enum: [
          "abdominals",
          "abductors",
          "adductors",
          "biceps",
          "calves",
          "chest",
          "forearms",
          "glutes",
          "hamstrings",
          "lats",
          "lower back",
          "middle back",
          "neck",
          "quadriceps",
          "shoulders",
          "traps",
          "triceps"
        ]
      }
    ],

    instructions: [
      {
        type: String,
        required: true
      }
    ],

    category: {
      type: String,
      enum: [
        "cardio",
        "olympic weightlifting",
        "plyometrics",
        "powerlifting",
        "strength",
        "stretching",
        "strongman"
      ],
      required: true
    },

    imageUrls: [
      {
        type: String
      }
    ]
  },
  {
    timestamps: true
  }
);

const Exercise = mongoose.model("exercise", exerciseSchema);
export default Exercise