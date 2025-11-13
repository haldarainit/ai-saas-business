// Using dynamic import to avoid module resolution issues

export async function POST(request) {
  try {
    const {
      prompt,
      emailType = "marketing",
      availableVariables = [],
    } = await request.json();

    if (!prompt || !prompt.trim()) {
      return Response.json(
        {
          success: false,
          error: "Prompt is required",
        },
        { status: 400 }
      );
    }

    console.log("Generating template with:", {
      prompt,
      emailType,
      availableVariables,
    });

    // Generate the email template using Gemini AI
    const geminiModule = await import("../../../utils/gemini.js");
    const gemini = geminiModule.default || geminiModule;
    const result = await gemini.generateEmailTemplate(
      prompt.trim(),
      availableVariables,
      emailType
    );

    if (result.success) {
      return Response.json({
        success: true,
        template: {
          subject: result.subject,
          content: result.content,
        },
      });
    } else {
      return Response.json(
        {
          success: false,
          error: result.error || "Failed to generate template",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in generate-template API:", error);
    return Response.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
