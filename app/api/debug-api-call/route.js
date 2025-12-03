import { NextResponse } from 'next/server';

// GET /api/debug-api-call
// Test actual Gemini API call
export async function GET() {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const apiKey = process.env.GOOGLE_API_KEY;
    
    console.log('Starting API call test...');
    console.log('API Key length:', apiKey?.length);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Simple test
    console.log('Making API call...');
    const result = await model.generateContent("Say 'Hello World'");
    const response = await result.response;
    const text = response.text();
    
    console.log('API call successful:', text);

    return NextResponse.json({
      success: true,
      message: 'Gemini API call successful',
      response: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API call failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      apiKeyLength: process.env.GOOGLE_API_KEY?.length || 0,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
