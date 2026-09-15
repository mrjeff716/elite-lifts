import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from 'dotenv'
import dns from 'node:dns'
import Exercise from "../models/Exercise.js";

// =========================
// CONFIG
// =========================

dotenv.config()
dns.setServers(['8.8.8.8'])

const MONGO_URI = process.env.MONGO_URI;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Change this path to wherever your exercises.json is
const JSON_PATH = path.resolve(
  __dirname,
  "../../../free-exercise-db/dist/exercises.json"
);

async function importExercises() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB connected");

    const rawData = fs.readFileSync(JSON_PATH, "utf8");

    const exercises = JSON.parse(rawData);

    console.log(`Found ${exercises.length} exercises`);

    const operations = exercises.map((exercise) => {
      const formattedExercise = {
        exerciseId: exercise.id,
        name: exercise.name,

        force: exercise.force ?? null,
        level: exercise.level,
        mechanic: exercise.mechanic ?? null,
        equipment: exercise.equipment ?? null,

        primaryMuscles: exercise.primaryMuscles ?? [],
        secondaryMuscles: exercise.secondaryMuscles ?? [],

        instructions: exercise.instructions ?? [],

        category: exercise.category,

        imageUrls: (exercise.images ?? []).map(
          (image) => `/images/exercises/${image}`
        )
      };

      return {
        updateOne: {
          filter: {
            exerciseId: exercise.id
          },

          update: {
            $set: formattedExercise
          },

          upsert: true
        }
      };
    });

    const result = await Exercise.bulkWrite(
      operations,
      {
        ordered: false
      }
    );

    console.log("\n✅ IMPORT COMPLETE");

    console.log("Inserted:", result.upsertedCount);
    console.log("Updated:", result.modifiedCount);
    console.log("Matched:", result.matchedCount);

  } catch (error) {
    console.error("\n❌ Import failed:");
    console.error(error);

  } finally {
    await mongoose.disconnect();

    console.log("MongoDB connection closed");
  }
}

importExercises();




/*// Change this if your downloaded free-exercise-db folder
// is somewhere else.
const DATASET_ROOT = path.resolve(
  __dirname,
  "../../../free-exercise-db"
);

const JSON_PATH = path.join(
  DATASET_ROOT,
  "dist",
  "exercises.json"
);

// Original downloaded image folder
const SOURCE_IMAGES_DIR = path.join(
  DATASET_ROOT,
  "exercises"
);

// Your backend public folder
const DEST_IMAGES_DIR = path.resolve(
  __dirname,
  "../public/images/exercises"
);

// =========================
// IMAGE COPY FUNCTION
// =========================

function copyImages(imagePaths = []) {
  const storedUrls = [];

  for (const relativeImagePath of imagePaths) {
    const sourcePath = path.join(
      SOURCE_IMAGES_DIR,
      relativeImagePath
    );

    const destinationPath = path.join(
      DEST_IMAGES_DIR,
      relativeImagePath
    );

    if (!fs.existsSync(sourcePath)) {
      console.warn(
        `⚠️ Missing image: ${relativeImagePath}`
      );

      continue;
    }

    // Create folders such as:
    // public/images/exercises/Barbell_Curl/
    fs.mkdirSync(path.dirname(destinationPath), {
      recursive: true
    });

    fs.copyFileSync(
      sourcePath,
      destinationPath
    );

    // Convert Windows \ to /
    const normalizedPath =
      relativeImagePath.split(path.sep).join("/");

    storedUrls.push(
      `/images/exercises/${normalizedPath}`
    );
  }

  return storedUrls;
}

// =========================
// TRANSFORM ONE EXERCISE
// =========================

function transformExercise(exercise) {
  return {
    exerciseId: exercise.id,

    name: exercise.name,

    force: exercise.force ?? null,

    level: exercise.level,

    mechanic: exercise.mechanic ?? null,

    equipment: exercise.equipment ?? null,

    primaryMuscles:
      exercise.primaryMuscles ?? [],

    secondaryMuscles:
      exercise.secondaryMuscles ?? [],

    instructions:
      exercise.instructions ?? [],

    category: exercise.category,

    imageUrls: copyImages(
      exercise.images ?? []
    )
  };
}

// =========================
// IMPORT FUNCTION
// =========================

async function importExercises() {
  try {
    if (!MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is missing from your environment variables."
      );
    }

    console.log("Connecting to MongoDB...");

    await mongoose.connect(MONGODB_URI);

    console.log("✅ Connected to MongoDB");

    if (!fs.existsSync(JSON_PATH)) {
      throw new Error(
        `Could not find exercises.json at:\n${JSON_PATH}`
      );
    }

    console.log("Reading exercises.json...");

    const rawData = fs.readFileSync(
      JSON_PATH,
      "utf8"
    );

    const exercises = JSON.parse(rawData);

    console.log(
      `Found ${exercises.length} exercises`
    );

    fs.mkdirSync(DEST_IMAGES_DIR, {
      recursive: true
    });

    const operations = [];

    let skipped = 0;

    for (const exercise of exercises) {
      try {
        const transformed =
          transformExercise(exercise);

        if (
          !transformed.exerciseId ||
          !transformed.name
        ) {
          console.warn(
            `⏭️ Skipping invalid exercise: ${exercise.name}`
          );

          skipped++;
          continue;
        }

        operations.push({
          updateOne: {
            filter: {
              exerciseId:
                transformed.exerciseId
            },

            update: {
              $set: transformed
            },

            upsert: true
          }
        });

      } catch (error) {
        skipped++;

        console.error(
          `❌ Failed to transform ${exercise.name}:`,
          error.message
        );
      }
    }

    console.log(
      `Preparing to import ${operations.length} exercises...`
    );

    if (operations.length === 0) {
      console.log(
        "No valid exercises found."
      );

      return;
    }

    const result =
      await Exercise.bulkWrite(
        operations,
        {
          ordered: false
        }
      );

    console.log("\n============================");
    console.log("✅ IMPORT COMPLETE");
    console.log("============================");

    console.log(
      `Inserted: ${result.upsertedCount}`
    );

    console.log(
      `Updated: ${result.modifiedCount}`
    );

    console.log(
      `Matched: ${result.matchedCount}`
    );

    console.log(
      `Skipped: ${skipped}`
    );

    console.log(
      `Total processed: ${operations.length}`
    );

  } catch (error) {
    console.error(
      "\n❌ Import failed:"
    );

    console.error(error);

  } finally {
    await mongoose.disconnect();

    console.log(
      "\nMongoDB connection closed."
    );
  }
}*/