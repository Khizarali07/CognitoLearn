import mongoose, { Connection } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    const mongooseInstance = await cached.promise;
    cached.conn = mongooseInstance.connection;
  } catch (e) {
    cached.promise = null;
    console.error("MongoDB connection failed:", e);

    // Provide more helpful error message
    if (e instanceof Error && e.message.includes("ECONNREFUSED")) {
      throw new Error(
        "MongoDB connection failed. Please ensure MongoDB is running locally or update MONGODB_URI to use MongoDB Atlas. " +
          "See MONGODB_SETUP.md for setup instructions."
      );
    }

    throw e;
  }

  return cached.conn;
}

export const connectToDB = dbConnect;
export default dbConnect;
