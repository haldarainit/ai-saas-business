// Using dynamic import to avoid module resolution issues
import { enforceBillingUsage } from "@/lib/billing/enforce";

interface GenerateSalesScriptBody {
    prospectName: string;
    prospectCompany?: string;
    prospectRole?: string;
    yourProduct: string;
    yourCompany: string;
    keyBenefits?: string;
    objectionHandling?: string;
    tone?: string;
}

export async function POST(request: Request): Promise<Response> {
    try {
        const usageCheck = await enforceBillingUsage(request, "sales_script");
        if (!usageCheck.ok) {
            return usageCheck.response;
        }

        const {
            prospectName,
            prospectCompany,
            prospectRole,
            yourProduct,
            yourCompany,
            keyBenefits,
            objectionHandling,
            tone
        }: GenerateSalesScriptBody = await request.json();

        if (!prospectName || !yourProduct || !yourCompany) {
            return Response.json(
                {
                    success: false,
                    error: "Prospect name, your product, and your company are required",
                },
                { status: 400 }
            );
        }

        console.log("Generating sales script for:", {
            prospectName,
            prospectCompany,
            prospectRole,
            yourProduct,
            yourCompany,
            keyBenefits,
            objectionHandling,
            tone,
        });

        // Generate the sales script using Gemini AI
        const geminiModule = await import("../../../utils/gemini");
        const gemini = geminiModule.default || geminiModule;

        const prompt = `
You are an expert sales professional with 15+ years of experience closing high-value deals. Create a compelling, personalized sales script for a cold outreach call.

PROSPECT INFORMATION:
- Name: "${prospectName}"
- Company: "${prospectCompany || 'Unknown Company'}"
- Role: "${prospectRole || 'Decision Maker'}"

YOUR OFFERING:
- Product/Service: "${yourProduct}"
- Your Company: "${yourCompany}"
- Key Benefits: "${keyBenefits || 'cost savings, efficiency improvements, competitive advantage'}"
- Objection Handling: "${objectionHandling || 'price, timing, competition'}"

TONE: "${tone || 'professional, confident, consultative'}"

CRITICAL REQUIREMENTS:
- Return ONLY a valid JSON object with "script" field containing the complete sales script
- Structure the script as a natural conversation flow
- Include: Opening, Value Proposition, Questions, Objection Handling, Close
- Make it conversational and natural-sounding
- Personalize it using the prospect's name and company
- Keep it concise but comprehensive (aim for 400-600 words)
- Use the specified tone throughout
- Include specific benefits and handle the mentioned objections
- End with a clear call-to-action

RESPONSE FORMAT (JSON only):
{
  "script": "Your Name: Hi [Prospect Name], this is [Your Name] from [Your Company]. I hope you're having a great day.\\n\\n[Continue with full script...]"
}

Generate the sales script now:`;

        const result = await gemini.generateAIResponse(prompt);

        if (result && !result.includes("Error")) {
            // Try to parse the response as JSON to extract the script
            let scriptContent = result;

            try {
                // Try to extract JSON from the response
                const jsonMatch = result.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (parsed.script) {
                        scriptContent = parsed.script;
                    }
                }
            } catch (parseError) {
                // If JSON parsing fails, clean up the raw response
                console.log('Could not parse JSON, using raw response');

                // Remove any JSON wrapper artifacts
                scriptContent = result
                    .replace(/^```json\s*/i, '')
                    .replace(/```\s*$/i, '')
                    .replace(/^\s*\{\s*"script"\s*:\s*"/, '')
                    .replace(/"\s*\}\s*$/, '')
                    .replace(/\\n/g, '\n')
                    .replace(/\\"/g, '"')
                    .trim();
            }

            return Response.json({
                success: true,
                script: scriptContent,
            });
        } else {
            return Response.json(
                {
                    success: false,
                    error: result || "Failed to generate sales script",
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Error in generate-sales-script API:", error);
        return Response.json(
            {
                success: false,
                error: "Internal server error",
            },
            { status: 500 }
        );
    }
}
