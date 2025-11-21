export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, currentCode, businessDetails } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        {
          success: false,
          error: "Messages array is required",
        },
        { status: 400 }
      );
    }

    console.log("Generating landing page with conversation history:", {
      messageCount: messages.length,
      hasCurrentCode: !!currentCode,
      hasBusinessDetails: !!businessDetails,
    });

    // Generate the landing page using Gemini AI
    const geminiModule = await import("../../../utils/gemini.js");
    const gemini = geminiModule.default || geminiModule;

    // Build the prompt with conversation context
    const systemPrompt = `You are an expert React/Next.js developer specializing in creating beautiful, modern landing pages using Tailwind CSS and Shadcn UI components.

CRITICAL REQUIREMENTS:
1. Return ONLY valid React/JSX code that can be directly rendered
2. DO NOT include imports, exports, or function declarations
3. DO NOT wrap the code in markdown code blocks  
4. Use ONLY these Shadcn components (they are already available): Button, Card, Input, Textarea, Badge, Avatar, AvatarImage, AvatarFallback, Separator, ScrollArea
5. Use Lucide React icons (all icons available: ArrowRight, Star, CheckCircle, Sparkles, Users, Target, etc.)
6. Use Tailwind CSS for styling - make it modern and beautiful
7. Make it responsive and mobile-friendly
8. Include semantic HTML and proper accessibility
9. The code should be a complete, self-contained component that renders immediately

DESIGN GUIDELINES:
- Use modern gradients and glassmorphism effects
- Include smooth animations and transitions
- Create a professional hero section with CTA
- Add features/benefits section
- Include testimonials or social proof if relevant
- Add a clear call-to-action footer
- Use the specified color scheme as the primary color

EXAMPLE OUTPUT FORMAT (return ONLY code like this):
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
  <div className="container mx-auto px-4 py-16">
    <h1 className="text-5xl font-bold text-center mb-8">Welcome to {businessName}</h1>
    <p className="text-xl text-center text-gray-600 mb-12">{tagline}</p>
    <Button className="mx-auto block bg-blue-500 hover:bg-blue-600">
      Get Started <ArrowRight className="ml-2" />
    </Button>
  </div>
</div>`;

    let userPrompt;
    const lastMessage = messages[messages.length - 1];

    // Build context from business details
    let businessContext = "";
    if (businessDetails) {
      businessContext = `
Business Name: "${businessDetails.businessName}"
Business Description: "${businessDetails.businessDescription}"
${businessDetails.targetAudience ? `Target Audience: "${businessDetails.targetAudience}"` : ""}
Primary Color Scheme: "${businessDetails.colorScheme}"
`;
    }

    if (!currentCode) {
      // First message - generate new landing page
      userPrompt = `Create a complete, professional landing page with the following details:
${businessContext}

User's request: "${lastMessage.content}"

Remember to return ONLY the JSX code - no imports, no exports, no function wrappers, no markdown formatting.
Create a beautiful, modern design with:
- Hero section with compelling headline and CTA
- Features/benefits section
- Social proof or testimonials
- Clear call-to-action
- Mobile responsive design
- Use the ${businessDetails?.colorScheme || "blue"} color scheme`;
    } else {
      // Subsequent messages - refine existing code
      userPrompt = `Current landing page code:
\`\`\`jsx
${currentCode}
\`\`\`

Business context:
${businessContext}

User's new request: "${lastMessage.content}"

Please update the code based on the user's request. Keep all existing content and structure unless the user specifically asks to change or remove it. Return ONLY the updated JSX code - no imports, no exports, no function wrappers, no markdown formatting.`;
    }

    const fullPrompt = `${systemPrompt}

${userPrompt}`;

    const result = await gemini.generateAIResponse(fullPrompt);

    if (result && !result.includes("Error")) {
      // Clean up the response - remove any markdown code blocks
      let cleanedCode = result.trim();

      // Remove markdown code blocks if present
      cleanedCode = cleanedCode.replace(/^```[\w]*\n?/gm, '');
      cleanedCode = cleanedCode.replace(/\n?```$/gm, '');

      // Remove any import statements
      cleanedCode = cleanedCode.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');

      // Remove export statements
      cleanedCode = cleanedCode.replace(/^export\s+(default\s+)?/gm, '');

      // Remove function declarations wrapping the JSX
      cleanedCode = cleanedCode.replace(/^(export\s+)?(default\s+)?function\s+\w+\([^)]*\)\s*\{?\s*/gm, '');
      cleanedCode = cleanedCode.replace(/^\s*return\s*\(/gm, '');
      cleanedCode = cleanedCode.replace(/\)\s*;?\s*}\s*$/gm, '');

      // Trim extra whitespace
      cleanedCode = cleanedCode.trim();

      return Response.json({
        success: true,
        code: cleanedCode,
        message: currentCode ? "Landing page updated successfully!" : "Landing page generated successfully!",
      });
    } else {
      return Response.json(
        {
          success: false,
          error: result || "Failed to generate landing page",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in generate-landing-page API:", error);
    return Response.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
