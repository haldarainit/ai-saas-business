import { NextRequest, NextResponse } from 'next/server';

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

Generate professional, formal business language. Include appropriate sections based on the provided information.`
            : prompt;

        console.log('Sending to Gemini AI...');

        // Generate AI response
        const aiResponse = await gemini.generateAIResponse(systemPrompt);

        if (!aiResponse || typeof aiResponse !== 'string') {
            console.error('AI Response is null or invalid:', aiResponse);
            throw new Error('AI failed to generate a response');
        }

        console.log('AI Response received, length:', aiResponse.length);

        // Parse the JSON response
        let parsedData;
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

            // Create fallback quotation structure
            parsedData = {
                subject: "Offer for Supply and Installation of Equipment",
                greeting: "Dear Sir/Madam,",
                contentBlocks: [
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
                        content: "The scope of work includes supply, installation, testing, and commissioning of the equipment as per the specifications provided."
                    },
                    {
                        type: "heading",
                        content: "Terms & Conditions"
                    },
                    {
                        type: "list",
                        content: "Standard Terms",
                        items: [
                            "Payment: 50% advance, 50% on delivery",
                            "Delivery: 4-6 weeks from order confirmation",
                            "Warranty: 12 months from installation",
                            "Validity: 30 days from date of quotation",
                            "Taxes: GST as applicable"
                        ]
                    },
                    {
                        type: "paragraph",
                        content: "We trust the above meets your requirements and look forward to your valuable order. Please feel free to contact us for any clarifications."
                    }
                ]
            };
        }

        return NextResponse.json({ success: true, data: parsedData });
    } catch (error: any) {
        console.error('Error in AI generate:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate content', details: error.message },
            { status: 500 }
        );
    }
}
