import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/business-ai";

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
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  console.log("Attempting to connect to MongoDB...");
  console.log(
    "MONGODB_URI:",
    MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")
  ); // Hide credentials in logs

  if (cached.conn) {
    console.log("Using cached connection");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log("Creating new connection promise...");
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("MongoDB connected successfully");
      console.log(
        "Connected to database:",
        mongoose.connection.db?.databaseName
      );
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log(
      "Connection established to database:",
      cached.conn.connection.db?.databaseName
    );
  } catch (e) {
    console.error("MongoDB connection error:", e);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
