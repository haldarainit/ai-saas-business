import { NextResponse } from 'next/server';

// GET /api/debug-env
// Test environment variables without Gemini import
export async function GET() {
  try {
    const envVars = {
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? 'EXISTS' : 'MISSING',
      GOOGLE_API_KEY_LENGTH: process.env.GOOGLE_API_KEY?.length || 0,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'EXISTS' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV,
      ALL_ENV_KEYS: Object.keys(process.env).filter(key => 
        key.includes('GOOGLE') || key.includes('GEMINI') || key.includes('API')
      )
    };

    return NextResponse.json({
      success: true,
      message: 'Environment variables check',
      envVars,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
