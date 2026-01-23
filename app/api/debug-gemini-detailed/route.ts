import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ErrorDetails {
    message: string;
    type: string;
    stack?: string;
    likelyCause?: string;
    solution?: string;
}

// GET /api/debug-gemini-detailed
// Detailed Gemini API debugging
export async function GET(): Promise<NextResponse> {
    try {
        const apiKey = process.env.GOOGLE_API_KEY;

        console.log('=== DETAILED GEMINI API DEBUG ===');
        console.log('1. Environment Check:');
        console.log('   - API Key exists:', !!apiKey);
        console.log('   - API Key length:', apiKey?.length || 0);
        console.log('   - API Key format:', apiKey?.startsWith('AIza') ? 'VALID' : 'INVALID');

        if (!apiKey || apiKey.length < 10) {
            return NextResponse.json({
                success: false,
                error: 'Invalid or missing API key',
                apiKeyExists: !!apiKey,
                apiKeyLength: apiKey?.length || 0
            });
        }

        console.log('2. Package Import:');
        const genAI = new GoogleGenerativeAI(apiKey);
        console.log('   - GoogleGenerativeAI instantiated: SUCCESS');

        console.log('3. Model Creation:');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log('   - Model created: SUCCESS');

        console.log('4. API Call Test:');
        console.log('   - Making simple test call...');

        const testPrompt = "Respond with only: SUCCESS";
        const result = await model.generateContent(testPrompt);
        const response = await result.response;
        const text = response.text();

        console.log('   - API Response received:', text);
        console.log('   - Response length:', text.length);

        return NextResponse.json({
            success: true,
            message: 'Gemini API is working perfectly',
            testResponse: text,
            apiKeyInfo: {
                exists: !!apiKey,
                length: apiKey.length,
                format: apiKey.startsWith('AIza') ? 'VALID' : 'INVALID'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        const err = error as Error;
        console.error('=== GEMINI API DEBUG FAILED ===');
        console.error('Error:', err.message);
        console.error('Stack:', err.stack);
        console.error('Type:', err.constructor.name);

        // Specific error handling
        const errorDetails: ErrorDetails = {
            message: err.message,
            type: err.constructor.name,
            stack: err.stack
        };

        if (err.message.includes('API key')) {
            errorDetails.likelyCause = 'Invalid or expired API key';
            errorDetails.solution = 'Get a new Gemini API key from Google AI Studio';
        } else if (err.message.includes('quota')) {
            errorDetails.likelyCause = 'API quota exceeded';
            errorDetails.solution = 'Check billing or wait for quota reset';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
            errorDetails.likelyCause = 'Network connectivity issue';
            errorDetails.solution = 'Check internet connection and firewall settings';
        } else if (err.message.includes('model')) {
            errorDetails.likelyCause = 'Model not available or incorrect model name';
            errorDetails.solution = 'Verify model name and availability';
        }

        return NextResponse.json({
            success: false,
            error: errorDetails,
            apiKeyInfo: {
                exists: !!process.env.GOOGLE_API_KEY,
                length: process.env.GOOGLE_API_KEY?.length || 0,
                format: process.env.GOOGLE_API_KEY?.startsWith('AIza') ? 'VALID' : 'INVALID'
            },
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
