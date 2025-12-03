import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env'
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

async function dbConnect() {
  console.log('dbConnect called');
  
  // If we have a cached connection in development, use it
  if (cached.conn) {
    console.log('Using cached database connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('Creating new database connection to:', 
      MONGODB_URI.replace(/\/\/([^:]+):[^@]+@/, '//$1:****@')
    );
    
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds
      family: 4, // Use IPv4, skip trying IPv6
    };

    try {
      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
        console.log('MongoDB connected successfully');
        return mongoose;
      }).catch(error => {
        console.error('MongoDB connection error:', error);
        cached.promise = null; // Reset promise to allow retry
        throw error;
      });
    } catch (error) {
      console.error('Error creating MongoDB connection:', error);
      cached.promise = null;
      throw error;
    }
  }

  try {
    console.log('Waiting for database connection...');
    cached.conn = await cached.promise;
    console.log('Database connection established');
    return cached.conn;
  } catch (error) {
    console.error('Error in dbConnect:', {
      error: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack
    });
    cached.promise = null; // Reset promise to allow retry
    throw error;
  }
}

// Test connection on startup in development
if (process.env.NODE_ENV === 'development') {
  console.log('Running in development mode, testing database connection...');
  dbConnect().catch(error => {
    console.error('Initial database connection test failed:', error);
  });
}

export default dbConnect;
