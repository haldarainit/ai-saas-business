export async function GET(request) {
  try {
    // Test dynamic import
    const geminiModule = await import("../../../utils/gemini.js");

    return Response.json({
      success: true,
      moduleKeys: Object.keys(geminiModule),
      hasDefault: !!geminiModule.default,
      defaultKeys: geminiModule.default
        ? Object.keys(geminiModule.default)
        : [],
      namedExports: {
        generateEmailTemplate: typeof geminiModule.generateEmailTemplate,
        generateAIResponse: typeof geminiModule.generateAIResponse,
        analyzeImage: typeof geminiModule.analyzeImage,
      },
    });
  } catch (error) {
    console.error("Test error:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
