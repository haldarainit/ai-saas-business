// Using dynamic import to avoid module resolution issues

export async function POST(request) {
  try {
    const { prospectName, prospectCompany, prospectRole, yourProduct, yourCompany, keyBenefits, objectionHandling, tone } = await request.json();

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
    const geminiModule = await import("../../../utils/gemini.js");
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
- Structure the script with NUMBERED TOPICS (1. INTRODUCTION, 2. VALUE PROPOSITION, 3. DISCOVERY QUESTIONS, 4. OBJECTION HANDLING, 5. CLOSE & NEXT STEPS)
- Each topic MUST have "Visuals" and "Dialogue" sub-sections
- Make it conversational and natural-sounding
- Personalize it using the prospect's name and company
- Keep it concise but comprehensive (aim for 400-600 words)
- Use the specified tone throughout
- Include specific benefits and handle the mentioned objections
- End with a clear call-to-action

RESPONSE FORMAT (JSON only - EXACTLY as shown):
{
  "script": "1. INTRODUCTION\nVisuals: Professional appearance, confident posture, warm smile\nDialogue: Hi ${prospectName}, this is [Your Name] from ${yourCompany}. I hope you're having a great day.\n\n2. VALUE PROPOSITION\nVisuals: Product demo, charts showing benefits\nDialogue: Our solution helps companies like yours achieve [specific benefit].\n\n3. DISCOVERY QUESTIONS\nVisuals: Notepad ready, attentive listening posture\nDialogue: Can you tell me about your current challenges with [relevant area]?\n\n4. OBJECTION HANDLING\nVisuals: Confident body language, reassuring gestures\nDialogue: I understand your concern about [objection]. Let me address that.\n\n5. CLOSE & NEXT STEPS\nVisuals: Calendar open, professional closing posture\nDialogue: Based on our discussion, I'd like to schedule a follow-up call."
}

IMPORTANT: 
- Respond ONLY with the JSON object above
- Do not include any additional text, explanations, or formatting
- Replace bracketed content with actual script content
- Ensure each numbered topic has both "Visuals:" and "Dialogue:" sections

Generate the sales script now:`;

    const result = await gemini.generateAIResponse(prompt);

    console.log("Raw Gemini response:", result);

    if (result && !result.includes("Error")) {
      try {
        // Parse the JSON response from Gemini
        const parsedResult = JSON.parse(result);
        console.log("Parsed JSON result:", parsedResult);
        
        if (parsedResult && parsedResult.script) {
          return Response.json({
            success: true,
            script: parsedResult.script,
          });
        } else {
          console.log("No script field in parsed result");
          return Response.json({
            success: true,
            script: result, // Fallback to raw result
          });
        }
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError);
        console.log("Raw response that failed to parse:", result);
        
        // Try to extract script content if it's wrapped in extra text
        const scriptMatch = result.match(/"script":\s*"([^"]*(?:\\.[^"]*)*)"/s);
        if (scriptMatch) {
          const extractedScript = scriptMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
          console.log("Extracted script from malformed JSON:", extractedScript);
          
          return Response.json({
            success: true,
            script: extractedScript,
          });
        }
        
        // If parsing fails, return the raw result as fallback
        return Response.json({
          success: true,
          script: result,
        });
      }
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
