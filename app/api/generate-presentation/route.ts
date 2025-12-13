
import { NextResponse } from 'next/server';
import { generatePresentationContent } from '@/lib/geminiService';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt, slideCount = 8, outlineOnly = false, existingOutline } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        // If we have an existing outline and not outline-only, just add image keywords
        if (existingOutline && !outlineOnly) {
            // Add image keywords to the existing outline
            const enhancedSlides = existingOutline.slides.map((slide: any, index: number) => ({
                ...slide,
                imageKeyword: slide.imageKeyword || generateImageKeyword(slide.title, prompt, index)
            }));

            return NextResponse.json({
                ...existingOutline,
                slides: enhancedSlides
            });
        }

        const presentationData = await generatePresentationContent(prompt, slideCount, outlineOnly);

        return NextResponse.json(presentationData);
    } catch (error: any) {
        console.error('Error generating presentation:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate presentation' },
            { status: 500 }
        );
    }
}

// Helper function to generate image keywords based on slide content
function generateImageKeyword(title: string, topic: string, index: number): string {
    const baseKeywords = [
        "professional business presentation",
        "modern corporate visualization",
        "high quality illustration",
        "clean professional design"
    ];

    const randomStyle = baseKeywords[index % baseKeywords.length];
    return `${title} related to ${topic}, ${randomStyle}, vibrant colors, 4k quality`;
}
