import { NextResponse } from 'next/server';

// GET /api/test-gemini-simple
// Simple test of Gemini API
export async function GET() {
  try {
    console.log('Testing Gemini API...');
    
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key not found'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Very simple test
    const result = await model.generateContent("Say 'Hello World'");
    const response = await result.response;
    const text = response.text();
    
    return NextResponse.json({
      success: true,
      message: 'Gemini API working',
      response: text,
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
