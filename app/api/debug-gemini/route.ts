import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// GET /api/debug-gemini
// Test Gemini API connection and basic functionality
export async function GET(): Promise<NextResponse> {
    try {
        // Check environment variables
        const apiKey = process.env.GOOGLE_API_KEY;
        console.log('Environment check:');
        console.log('GOOGLE_API_KEY exists:', !!apiKey);
        console.log('GOOGLE_API_KEY length:', apiKey?.length || 0);

        if (!apiKey) {
            return NextResponse.json({
                error: 'GOOGLE_API_KEY not found in environment',
                envVars: Object.keys(process.env).filter(key => key.includes('GOOGLE') || key.includes('GEMINI'))
            }, { status: 500 });
        }

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Simple test prompt
        const testPrompt = "Generate a simple JSON response with: {\"test\": \"success\", \"message\": \"Gemini API is working\"}";

        console.log('Testing Gemini API call...');
        const result = await model.generateContent(testPrompt);
        const response = await result.response;
        const text = response.text();

        console.log('Gemini API response:', text);

        return NextResponse.json({
            success: true,
            message: 'Gemini API is working',
            response: text,
            apiKeyLength: apiKey.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        const err = error as Error;
        console.error('Gemini API test failed:', err);

        return NextResponse.json({
            success: false,
            error: err.message,
            stack: err.stack,
            apiKeyExists: !!process.env.GOOGLE_API_KEY,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
