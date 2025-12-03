import { NextResponse } from 'next/server';

// GET /api/debug-import
// Test Gemini package import step by step
export async function GET() {
  try {
    let result = {
      success: true,
      steps: [],
      timestamp: new Date().toISOString()
    };

    // Step 1: Test basic import
    try {
      const geminiPackage = require('@google/generative-ai');
      result.steps.push('✅ Package import successful');
      result.packageVersion = geminiPackage.version || 'unknown';
    } catch (importError) {
      result.steps.push('❌ Package import failed: ' + importError.message);
      throw importError;
    }

    // Step 2: Test class instantiation
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const apiKey = process.env.GOOGLE_API_KEY;
      const genAI = new GoogleGenerativeAI(apiKey);
      result.steps.push('✅ GoogleGenerativeAI instantiation successful');
    } catch (instantiationError) {
      result.steps.push('❌ Instantiation failed: ' + instantiationError.message);
      throw instantiationError;
    }

    // Step 3: Test model creation
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const apiKey = process.env.GOOGLE_API_KEY;
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      result.steps.push('✅ Model creation successful');
    } catch (modelError) {
      result.steps.push('❌ Model creation failed: ' + modelError.message);
      throw modelError;
    }

    return NextResponse.json(result);

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
