import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Check if API key is available
const API_KEY = process.env.GOOGLE_API_KEY;

// Initialize the Google GenAI client (new SDK)
const genAI = new GoogleGenAI({ apiKey: API_KEY || '' });

// Available models in order of preference
const AVAILABLE_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
];

// Helper to normalize text from different SDK response shapes
function extractText(result: any): string {
    try {
        if (result?.response?.text) {
            return typeof result.response.text === "function"
                ? result.response.text()
                : result.response.text;
        }
        if (typeof result?.text === "function") {
            return result.text();
        }
        if (result?.output_text) {
            return result.output_text;
        }
        const parts =
            result?.response?.candidates?.[0]?.content?.parts ||
            result?.candidates?.[0]?.content?.parts;
        if (Array.isArray(parts)) {
            const joined = parts
                .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
                .join("")
                .trim();
            if (joined) return joined;
        }
    } catch (_) {
        // fallthrough to empty
    }
    return "";
}

async function getWorkingModelName(): Promise<string> {
    if (!API_KEY) {
        throw new Error(
            "Google API key is not configured. Please set GOOGLE_API_KEY in your environment variables."
        );
    }

    for (const modelName of AVAILABLE_MODELS) {
        try {
            // Test the model with a lightweight request using the new SDK
            const result = await genAI.models.generateContent({
                model: modelName,
                contents: [{ role: "user", parts: [{ text: "Hello" }] }],
            });
            const text = extractText(result);
            if (typeof text === "string") {
                console.log(`Regenerate slide - Using model: ${modelName}`);
                return modelName;
            }
        } catch (error: any) {
            console.warn(`Model ${modelName} not available:`, error.message);
            continue;
        }
    }
    throw new Error(
        "No available Gemini models found. Please check your API key and permissions."
    );
}

// Helper for exponential backoff retries
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, baseDelay = 2000): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            const isOverloaded =
                error.status === 503 ||
                (error.message && error.message.toLowerCase().includes("overloaded")) ||
                (error.message && error.message.toLowerCase().includes("quota"));

            if (!isOverloaded || i === retries - 1) {
                throw error;
            }

            const delay = baseDelay * Math.pow(2, i);
            console.log(
                `Gemini API overloaded. Retrying in ${delay}ms (Attempt ${i + 1}/${retries})...`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw new Error("Max retries exceeded");
}

interface RegenerateRequest {
    slideTitle: string;
    slideContent?: string[];
    slideLayoutType?: string;
    prompt: string;
    regenerateType: 'full' | 'content' | 'layout' | 'image' | 'style';
    targetLayout?: string;
    keepImage?: boolean;
    tone?: 'professional' | 'casual' | 'creative' | 'formal';
    theme?: {
        primary: string;
        secondary: string;
        accent: string;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body: RegenerateRequest = await request.json();
        const {
            slideTitle,
            slideContent,
            slideLayoutType,
            prompt,
            regenerateType,
            targetLayout,
            keepImage,
            tone = 'professional',
        } = body;

        // Get a working model
        const modelName = await getWorkingModelName();

        let systemPrompt = '';
        let userPrompt = '';

        switch (regenerateType) {
            case 'full':
                systemPrompt = `You are a presentation design expert. Regenerate a complete slide based on the user's request.
                Return a JSON object with the following structure:
                {
                    "title": "New slide title",
                    "content": ["Point 1", "Point 2", "Point 3"],
                    "layoutType": "features" | "comparison" | "imageRight" | "imageLeft" | "metrics" | "iconList" | "textOnly",
                    "features": [{"icon": "icon-name", "title": "Feature title", "description": "Feature description"}] | null,
                    "comparison": {"left": {"heading": "Option A", "points": ["point1"]}, "right": {"heading": "Option B", "points": ["point1"]}} | null,
                    "metrics": [{"value": "100%", "label": "Metric label", "description": "Description"}] | null,
                    "imageKeyword": "descriptive keyword for image generation",
                    "hasImage": true | false
                }
                
                Guidelines:
                - Make content engaging and impactful
                - Use ${tone} tone
                - Choose the best layout type based on content
                - If features layout, provide 3-6 feature cards with icons from: storefront, dashboard, analytics, cart, payment, shipping, inventory, customer, support, design, search, filter, settings, security, speed, mobile, integration, automation, document, email, notification, chat, share, link, chart, report, growth, target, check, star, idea, rocket, globe, heart, award, clock, calendar, key
                - If comparison layout, provide two columns with contrasting points
                - If metrics layout, provide 3-4 key statistics or numbers`;

                userPrompt = `Current slide:
                Title: ${slideTitle}
                Content: ${slideContent?.join('\n') || 'No content'}
                Layout: ${slideLayoutType || 'Not specified'}
                
                User request: ${prompt}
                
                Generate a completely regenerated slide. Return only valid JSON.`;
                break;

            case 'content':
                systemPrompt = `You are a presentation content expert. Rewrite the slide content based on the user's request.
                Return a JSON object with:
                {
                    "title": "Updated title",
                    "content": ["Updated point 1", "Updated point 2", "Updated point 3"],
                    "features": [{"icon": "icon-name", "title": "title", "description": "description"}] | null,
                    "comparison": {...} | null,
                    "metrics": [...] | null
                }
                
                Guidelines:
                - Keep the essence of the original message
                - Use ${tone} tone
                - Make it more compelling and clear
                - Maintain appropriate length (3-5 bullet points typically)`;

                userPrompt = `Current slide:
                Title: ${slideTitle}
                Content: ${slideContent?.join('\n') || 'No content'}
                
                User request: ${prompt}
                
                Rewrite the content. Return only valid JSON.`;
                break;

            case 'layout':
                systemPrompt = `You are a presentation layout expert. Transform the content to fit the target layout.
                Target layout: ${targetLayout}
                
                Return a JSON object with:
                {
                    "layoutType": "${targetLayout}",
                    "title": "Adapted title",
                    "content": ["Point 1", "Point 2"] | null,
                    "features": [{"icon": "icon-name", "title": "title", "description": "description"}] | null (if layout is features),
                    "comparison": {"left": {...}, "right": {...}} | null (if layout is comparison),
                    "metrics": [{"value": "X%", "label": "label", "description": "desc"}] | null (if layout is metrics)
                }
                
                Transform the existing content to best fit the ${targetLayout} layout.
                Available icons: storefront, dashboard, analytics, cart, payment, shipping, customer, support, design, search, settings, security, speed, mobile, chart, growth, target, check, star, idea, rocket, globe, heart, award`;

                userPrompt = `Current slide:
                Title: ${slideTitle}
                Content: ${slideContent?.join('\n') || 'No content'}
                Current layout: ${slideLayoutType}
                
                Transform this to ${targetLayout} layout. Return only valid JSON.`;
                break;

            case 'image':
                systemPrompt = `You are a visual presentation expert. Generate an improved image keyword/prompt for this slide.
                Return a JSON object with:
                {
                    "imageKeyword": "descriptive, specific keyword for image generation",
                    "imagePrompt": "A detailed prompt for generating a professional, relevant image"
                }
                
                Guidelines:
                - The image should complement the slide content
                - Be specific and descriptive
                - Focus on professional, business-appropriate imagery`;

                userPrompt = `Slide title: ${slideTitle}
                Content: ${slideContent?.join('\n') || 'No content'}
                
                User request: ${prompt}
                
                Generate a better image keyword. Return only valid JSON.`;
                break;

            case 'style':
                systemPrompt = `You are a presentation styling expert. Suggest improved styling for this slide.
                Return a JSON object with:
                {
                    "suggestedLayout": "best layout type",
                    "accentColor": "suggested accent color hex",
                    "contentAlignment": "left" | "center" | "right",
                    "cardWidth": "M" | "L",
                    "hasBackdrop": true | false,
                    "suggestions": ["Styling suggestion 1", "Styling suggestion 2"]
                }`;

                userPrompt = `Slide title: ${slideTitle}
                Content: ${slideContent?.join('\n') || 'No content'}
                Current layout: ${slideLayoutType}
                
                User request: ${prompt}
                
                Suggest styling improvements. Return only valid JSON.`;
                break;
        }

        const fullPrompt = systemPrompt + '\n\n' + userPrompt;

        // Use retry with backoff for the API call
        const result = await retryWithBackoff(async () => {
            return await genAI.models.generateContent({
                model: modelName,
                contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
            });
        });

        const text = extractText(result);

        if (!text) {
            throw new Error('Empty response from AI model');
        }

        // Extract JSON from response
        let jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse AI response');
        }

        const regeneratedSlide = JSON.parse(jsonMatch[0]);

        // If keeping image and we have image data, preserve it
        if (keepImage && regenerateType !== 'image') {
            // The caller will handle preserving the image
            regeneratedSlide.keepExistingImage = true;
        }

        // Generate new image URL if we have a keyword and not keeping image
        if (regeneratedSlide.imageKeyword && !keepImage && regenerateType !== 'style') {
            const timestamp = Date.now();
            regeneratedSlide.imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(regeneratedSlide.imageKeyword)}?width=800&height=600&nologo=true&seed=${timestamp}`;
        }

        return NextResponse.json({
            success: true,
            regeneratedSlide,
            regenerateType,
        });

    } catch (error: any) {
        console.error('Regenerate slide error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to regenerate slide' },
            { status: 500 }
        );
    }
}
