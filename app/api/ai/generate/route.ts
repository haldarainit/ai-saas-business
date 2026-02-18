import { NextRequest, NextResponse } from 'next/server';

// Helper to extract field value from prompt string (handles multi-line values)
function extractFromPrompt(prompt: string, field: string): string {
    // Escape special regex chars in field name
    const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Capture everything from **field:** up to the next **AnyWord or end of string
    const regex = new RegExp(`\\*\\*${escaped}:\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*[A-Z]|\\n\\nPlease|$)`, 'i');
    const match = prompt.match(regex);
    return match ? match[1].trim() : '';
}

// Build a smart fallback quotation using user-provided data from the prompt
function buildFallback(prompt: string): Record<string, unknown> {
    const subject = extractFromPrompt(prompt, 'Subject/Title') || 'Offer for Supply and Installation of Equipment';
    const scopeOfWork = extractFromPrompt(prompt, 'Scope of Work');
    const termsConditions = extractFromPrompt(prompt, 'Terms & Conditions');
    const technicalSpecs = extractFromPrompt(prompt, 'Technical Specifications');
    const itemsQuantities = extractFromPrompt(prompt, 'Items/Bill of Quantities');
    const additionalNotes = extractFromPrompt(prompt, 'Additional Notes');

    const contentBlocks: Record<string, unknown>[] = [
        {
            type: "paragraph",
            content: "With reference to your enquiry, we are pleased to submit our techno-commercial quotation for your kind consideration."
        },
        {
            type: "heading",
            content: "Scope of Work"
        },
        {
            type: "paragraph",
            content: scopeOfWork || "The scope of work includes supply, installation, testing, and commissioning of the equipment as per the specifications provided."
        }
    ];

    if (technicalSpecs) {
        contentBlocks.push({ type: "heading", content: "Technical Specifications" });
        contentBlocks.push({ type: "paragraph", content: technicalSpecs });
    }

    if (itemsQuantities) {
        contentBlocks.push({ type: "heading", content: "Bill of Quantities" });
        const items = itemsQuantities.split('\n').map((s: string) => s.trim()).filter(Boolean);
        contentBlocks.push({ type: "list", content: "Items", items: items.length > 0 ? items : [itemsQuantities] });
    }

    // Terms & Conditions — use user-provided or default
    contentBlocks.push({ type: "heading", content: "Terms & Conditions" });
    if (termsConditions) {
        const termItems = termsConditions.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean);
        contentBlocks.push({
            type: "list",
            content: "Terms",
            items: termItems.length > 0 ? termItems : [termsConditions]
        });
    } else {
        contentBlocks.push({
            type: "list",
            content: "Standard Terms",
            items: [
                "Payment: 50% advance, 50% on delivery",
                "Delivery: 4-6 weeks from order confirmation",
                "Warranty: 12 months from installation",
                "Validity: 30 days from date of quotation",
                "Taxes: GST as applicable"
            ]
        });
    }

    if (additionalNotes) {
        contentBlocks.push({ type: "heading", content: "Additional Notes" });
        contentBlocks.push({ type: "paragraph", content: additionalNotes });
    }

    contentBlocks.push({
        type: "paragraph",
        content: "We trust the above meets your requirements and look forward to your valuable order. Please feel free to contact us for any clarifications."
    });

    return {
        subject,
        greeting: "Dear Sir/Madam,",
        contentBlocks
    };
}

export async function POST(request: NextRequest) {
    try {
        const { prompt, type } = await request.json();

        if (!prompt) {
            return NextResponse.json(
                { success: false, error: 'Prompt is required' },
                { status: 400 }
            );
        }

        console.log('AI Generate API called with type:', type);

        // Import the Gemini utility
        const geminiModule = await import('../../../../utils/gemini');
        const gemini = geminiModule.default || geminiModule;

        // Enhanced prompt for quotation generation
        const systemPrompt = type === 'quotation'
            ? `${prompt}

IMPORTANT: Return ONLY valid JSON without any markdown formatting. The JSON should be directly parsable.
The response should follow this exact structure:
{
    "subject": "string - subject line for the quotation",
    "greeting": "string - professional greeting",
    "contentBlocks": [
        {
            "type": "paragraph",
            "content": "string - paragraph text"
        },
        {
            "type": "heading",
            "content": "string - heading text"
        },
        {
            "type": "list",
            "content": "string - list title/description",
            "items": ["item1", "item2", "item3"]
        },
        {
            "type": "table",
            "content": "string - table description",
            "tableData": {
                "headers": ["S.No", "Description", "Unit", "Qty", "Rate", "Amount"],
                "rows": [
                    ["1", "Item description", "Nos", "10", "1000", "10000"]
                ]
            }
        }
    ]
}

Generate professional, formal business language. Include appropriate sections based on the provided information. Make sure to include a Terms & Conditions section using any terms provided by the user.`
            : prompt;

        console.log('Sending to Gemini AI...');

        // Generate AI response
        const aiResponse = await gemini.generateAIResponse(systemPrompt);

        let parsedData: Record<string, unknown> | null = null;

        if (aiResponse && typeof aiResponse === 'string') {
            console.log('AI Response received, length:', aiResponse.length);

            // Parse the JSON response
            try {
                let jsonStr = aiResponse.trim();

                // Remove markdown code blocks if present
                jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

                // Find JSON object in the response
                const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    jsonStr = jsonMatch[0];
                }

                parsedData = JSON.parse(jsonStr);
                console.log('Successfully parsed AI response');
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                console.error('Raw AI Response:', aiResponse.substring(0, 500));
                // Fall through to use smart fallback below
            }
        } else {
            console.warn('AI Response is null or invalid — using smart fallback');
        }

        // Use smart fallback if AI failed or JSON parsing failed
        if (!parsedData) {
            parsedData = buildFallback(prompt);
            console.log('Using smart fallback quotation structure');
        }

        return NextResponse.json({ success: true, data: parsedData });
    } catch (error: any) {
        console.error('Error in AI generate:', error);
        // Even on unexpected errors, try to return a fallback so the user still gets something
        try {
            const body = await (error?.request?.json?.() || Promise.resolve(null));
            const prompt = body?.prompt || '';
            return NextResponse.json({ success: true, data: buildFallback(prompt) });
        } catch {
            return NextResponse.json(
                { success: false, error: 'Failed to generate content', details: error.message },
                { status: 500 }
            );
        }
    }
}
