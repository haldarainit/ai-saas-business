import { NextResponse } from 'next/server';

interface KeyInfo {
    exists: boolean;
    length: number;
    startsWith: string | undefined;
    format: {
        startsWithAIza: boolean;
        expectedLength: number;
        actualLength: number;
        lengthMatch: boolean;
    };
    troubleshooting: {
        validFormat: boolean;
        needsNewKey: boolean;
    };
}

// GET /api/check-api-key
// Check API key format and provide guidance
export async function GET(): Promise<NextResponse> {
    const apiKey = process.env.GOOGLE_API_KEY;

    const keyInfo: KeyInfo = {
        exists: !!apiKey,
        length: apiKey?.length || 0,
        startsWith: apiKey?.substring(0, 10),
        format: {
            startsWithAIza: apiKey?.startsWith('AIza') || false,
            expectedLength: 39,
            actualLength: apiKey?.length || 0,
            lengthMatch: (apiKey?.length || 0) === 39
        },
        troubleshooting: {
            validFormat: apiKey?.startsWith('AIza') && (apiKey?.length || 0) === 39,
            needsNewKey: !apiKey?.startsWith('AIza') || (apiKey?.length || 0) !== 39
        }
    };

    if (!apiKey) {
        return NextResponse.json({
            success: false,
            issue: 'API key not found',
            solution: 'Add GOOGLE_API_KEY to your .env file',
            steps: [
                '1. Go to Google AI Studio: https://makersuite.google.com/app/apikey',
                '2. Create a new API key',
                '3. Add it to your .env file as: GOOGLE_API_KEY=your_key_here'
            ]
        });
    }

    if (!keyInfo.format.startsWithAIza || !keyInfo.format.lengthMatch) {
        return NextResponse.json({
            success: false,
            issue: 'Invalid API key format',
            keyInfo,
            solution: 'Get a new valid Gemini API key',
            steps: [
                '1. Go to Google AI Studio: https://makersuite.google.com/app/apikey',
                '2. Create a new API key (should start with "AIza" and be 39 characters)',
                '3. Replace the current key in your .env file',
                '4. Restart the development server'
            ]
        });
    }

    return NextResponse.json({
        success: true,
        message: 'API key format looks correct',
        keyInfo,
        nextSteps: [
            '1. Ensure billing is enabled for your Google Cloud project',
            '2. Check if Gemini API is enabled',
            '3. Verify network connectivity',
            '4. Test API call with debug endpoint'
        ]
    });
}
