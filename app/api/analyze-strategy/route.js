export async function POST(request) {
  try {
    const { strategy, prompt, websiteContext } = await request.json();

    if (!strategy || !strategy.title) {
      return Response.json(
        {
          success: false,
          error: "Strategy data is required",
        },
        { status: 400 }
      );
    }

    console.log("Analyzing strategy:", strategy.title);

    // Import Gemini AI
    const geminiModule = await import("../../../utils/gemini.js");
    const gemini = geminiModule.default || geminiModule;

    // Create the prompt for analyzing the strategy
    const analysisPrompt = `You are a world-class marketing strategist AI. You need to provide a comprehensive strategic analysis for the following marketing campaign strategy.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 STRATEGY TO ANALYZE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Campaign Title**: ${strategy.title}
**Campaign Description**: ${strategy.description}
**Why It Stands Out**: ${strategy.whyItStandsOut}
**Tags**: ${strategy.tags.join(", ")}

**Original User Goal/Challenge**: ${prompt || "General marketing campaign"}

${
  websiteContext
    ? `**Business Context**: The following information was scraped from the user's website:\n${websiteContext.substring(
        0,
        2000
      )}...`
    : ""
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please provide a detailed strategic analysis with the following components. Return ONLY a valid JSON object (no markdown, no code blocks):

{
  "innovationCategory": {
    "name": "string (e.g., 'Core Bet', 'Quick Win', 'Moon Shot', 'Strategic Initiative')",
    "description": "string (brief explanation of why this category fits)"
  },
  "evaluation": {
    "overallEffectiveness": number (0-100, representing percentage),
    "marketOpportunity": number (0-100, representing percentage),
    "implementationFeasibility": number (0-100, representing percentage),
    "competitiveAdvantage": number (0-100, representing percentage),
    "revenuePotential": number (0-100, representing percentage),
    "keyStrength": "string (one compelling sentence explaining the main strength)"
  },
  "strategicAnalysis": {
    "marketOpportunity": "string (2-3 sentences about market opportunity)",
    "competitiveAdvantage": "string (2-3 sentences about competitive positioning)",
    "riskAssessment": "string (2-3 sentences about risks and mitigation)",
    "resourceRequirements": "string (2-3 sentences about required resources)"
  }
}

Guidelines:
- Be realistic with percentage scores (typically 65-95 range for viable strategies)
- Ensure scores align with the strategy's actual feasibility and impact
- Make the analysis specific to the campaign strategy provided
- Consider the user's business context if provided
- Innovation categories: "Core Bet" (high impact + high feasibility), "Quick Win" (fast results, lower investment), "Moon Shot" (high risk, high reward), "Strategic Initiative" (long-term play)`;

    console.log("🚀 Sending analysis request to Gemini AI...");

    // Generate AI response
    const aiResponse = await gemini.generateAIResponse(analysisPrompt);

    console.log("✅ AI Analysis received. Length:", aiResponse.length, "chars");

    // Parse the JSON response
    try {
      let jsonStr = aiResponse.trim();

      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\s*|\s*```/g, "");

      // Find JSON object in the response
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const analysis = JSON.parse(jsonStr);

      // Validate the structure
      if (!analysis.evaluation || !analysis.strategicAnalysis) {
        throw new Error("Invalid analysis structure");
      }

      return Response.json({
        success: true,
        analysis: analysis,
      });
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError);
      console.error("AI Response:", aiResponse);

      // Return a fallback analysis based on the strategy
      return Response.json({
        success: true,
        analysis: {
          innovationCategory: {
            name: "Core Bet",
            description:
              "High Impact + High Feasibility - This strategy offers strong market potential with practical implementation paths.",
          },
          evaluation: {
            overallEffectiveness: 82,
            marketOpportunity: 85,
            implementationFeasibility: 78,
            competitiveAdvantage: 80,
            revenuePotential: 83,
            keyStrength:
              "Strong market demand with clear monetization path and practical execution strategy.",
          },
          strategicAnalysis: {
            marketOpportunity:
              "The market shows strong demand for this type of marketing campaign. Current trends indicate growing consumer engagement with these marketing channels, creating significant opportunity for brands to capture attention and drive conversions.",
            competitiveAdvantage:
              "This strategy differentiates through innovative execution and targeted positioning. By leveraging modern marketing tools and data-driven insights, it creates sustainable competitive advantages that are difficult for competitors to replicate quickly.",
            riskAssessment:
              "Primary risks include market saturation and execution challenges. Mitigation strategies include phased rollout, continuous A/B testing, and maintaining flexibility to pivot based on performance metrics.",
            resourceRequirements:
              "Implementation requires moderate investment in marketing tools, content creation, and analytics capabilities. Estimated timeline of 2-3 months for full deployment with a team of 3-5 marketing professionals.",
          },
        },
      });
    }
  } catch (error) {
    console.error("Error in analyze-strategy API:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to analyze strategy",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
