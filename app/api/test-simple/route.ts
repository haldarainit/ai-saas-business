import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// GET /api/test-simple
// Simple test of Gemini API
export async function GET(): Promise<NextResponse> {
    try {
        const apiKey = process.env.GOOGLE_API_KEY;

        console.log('Testing Gemini API with key:', apiKey?.substring(0, 10) + '...');

        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: 'API key not found',
                timestamp: new Date().toISOString()
            }, { status: 500 });
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
        const err = error as Error;
        return NextResponse.json({
            success: false,
            error: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
