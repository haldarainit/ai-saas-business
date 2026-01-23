import { NextResponse } from 'next/server';

// GET /api/debug-api-key
// Test API key validity and format
export async function GET(): Promise<NextResponse> {
    try {
        const apiKey = process.env.GOOGLE_API_KEY;

        return NextResponse.json({
            success: true,
            apiKeyInfo: {
                exists: !!apiKey,
                length: apiKey?.length || 0,
                startsWith: apiKey?.substring(0, 10) + '...',
                format: apiKey?.startsWith('AIza') ? 'Valid format (starts with AIza)' : 'Invalid format',
                expectedFormat: 'Should start with "AIza" and be about 39 characters'
            },
            message: 'API key format check',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        const err = error as Error;
        return NextResponse.json({
            success: false,
            error: err.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
