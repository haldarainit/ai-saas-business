
import { NextResponse } from 'next/server';
import { generatePresentationContent } from '@/lib/geminiService';
import { enforceBillingUsage } from '@/lib/billing/enforce';

export async function POST(req: Request) {
    try {
        const usageCheck = await enforceBillingUsage(req, "presentation_generate");
        if (!usageCheck.ok) {
            return usageCheck.response;
        }

        const body = await req.json();
        const { prompt, slideCount = 8, outlineOnly = false, existingOutline } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        // If we have an existing outline and not outline-only, enhance with image keywords
        if (existingOutline && !outlineOnly) {
            // Preserve all slide properties and add image keywords only for slides that need images
            const enhancedSlides = existingOutline.slides.map((slide: any, index: number) => {
                const noImageLayouts = ['comparison', 'features', 'metrics', 'textOnly'];
                const shouldHaveImage = slide.hasImage !== false && !noImageLayouts.includes(slide.layoutType);

                return {
                    ...slide,
                    // Preserve layoutType from outline
                    layoutType: slide.layoutType || (index === 0 ? 'title' : index === existingOutline.slides.length - 1 ? 'closing' : 'imageRight'),
                    // Only add image keyword if slide should have an image
                    imageKeyword: shouldHaveImage ? (slide.imageKeyword || generateImageKeyword(slide.title, prompt, index)) : undefined,
                    hasImage: shouldHaveImage,
                };
            });

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
