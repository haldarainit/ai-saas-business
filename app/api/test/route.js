import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';

// Test database connection
export async function GET() {
  console.log('Testing MongoDB connection...');
  
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      return NextResponse.json({
        status: 'success',
        message: 'Already connected to MongoDB',
        connection: {
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name,
          readyState: mongoose.connection.readyState,
        }
      });
    }
    
    // Try to connect
    console.log('Attempting to connect to MongoDB...');
    const isConnected = await dbConnect();
    
    if (!isConnected) {
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Failed to connect to MongoDB',
          error: 'Connection attempt failed'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Successfully connected to MongoDB',
      connection: {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
        readyState: mongoose.connection.readyState,
      }
    });
    
  } catch (error) {
    console.error('MongoDB connection test failed:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'MongoDB connection test failed',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
