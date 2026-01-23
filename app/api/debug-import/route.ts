import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface DebugResult {
    success: boolean;
    steps: string[];
    packageVersion?: string;
    timestamp: string;
    error?: string;
    stack?: string;
}

// GET /api/debug-import
// Test Gemini package import step by step
export async function GET(): Promise<NextResponse> {
    try {
        const result: DebugResult = {
            success: true,
            steps: [],
            timestamp: new Date().toISOString()
        };

        // Step 1: Test basic import
        try {
            result.steps.push('✅ Package import successful');
        } catch (importError) {
            const err = importError as Error;
            result.steps.push('❌ Package import failed: ' + err.message);
            throw importError;
        }

        // Step 2: Test class instantiation
        try {
            const apiKey = process.env.GOOGLE_API_KEY;
            new GoogleGenerativeAI(apiKey || '');
            result.steps.push('✅ GoogleGenerativeAI instantiation successful');
        } catch (instantiationError) {
            const err = instantiationError as Error;
            result.steps.push('❌ Instantiation failed: ' + err.message);
            throw instantiationError;
        }

        // Step 3: Test model creation
        try {
            const apiKey = process.env.GOOGLE_API_KEY;
            const genAI = new GoogleGenerativeAI(apiKey || '');
            genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            result.steps.push('✅ Model creation successful');
        } catch (modelError) {
            const err = modelError as Error;
            result.steps.push('❌ Model creation failed: ' + err.message);
            throw modelError;
        }

        return NextResponse.json(result);

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
