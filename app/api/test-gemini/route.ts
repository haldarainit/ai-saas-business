import { NextResponse } from 'next/server';
import * as geminiModule from '../../../utils/gemini';

export async function GET(): Promise<NextResponse> {
    try {
        return NextResponse.json({
            success: true,
            moduleKeys: Object.keys(geminiModule),
            hasDefault: !!(geminiModule as { default?: unknown }).default,
            defaultKeys: (geminiModule as { default?: Record<string, unknown> }).default
                ? Object.keys((geminiModule as { default: Record<string, unknown> }).default)
                : [],
            namedExports: {
                generateEmailTemplate: typeof (geminiModule as { generateEmailTemplate?: unknown }).generateEmailTemplate,
                generateAIResponse: typeof (geminiModule as { generateAIResponse?: unknown }).generateAIResponse,
                analyzeImage: typeof (geminiModule as { analyzeImage?: unknown }).analyzeImage,
            },
        });
    } catch (error) {
        const err = error as Error;
        console.error("Test error:", err);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}
