
import { NextResponse } from 'next/server';
import { generatePresentationContent } from '@/lib/geminiService';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        const presentationData = await generatePresentationContent(prompt);

        return NextResponse.json(presentationData);
    } catch (error: any) {
        console.error('Error generating presentation:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate presentation' },
            { status: 500 }
        );
    }
}
