import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GOOGLE_API_KEY;

// Initialize the Google GenAI client (new SDK)
// See: https://www.npmjs.com/package/@google/genai
const genAI = new GoogleGenAI({ apiKey: API_KEY });

// Available models in order of preference
const AVAILABLE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

// Helper to normalize text from different SDK response shapes
function extractText(result) {
  try {
    // Newer response shape may have response.text() or response.text
    if (result?.response?.text) {
      return typeof result.response.text === "function"
        ? result.response.text()
        : result.response.text;
    }
    // Compatibility with older SDKs
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
        .map((p) => (typeof p?.text === "string" ? p.text : ""))
        .join("")
        .trim();
      if (joined) return joined;
    }
  } catch (_) {
    // fallthrough to empty
  }
  return "";
}

async function getWorkingModelName() {
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
        console.log(`Using model: ${modelName}`);
        return modelName;
      }
    } catch (error) {
      console.warn(`Model ${modelName} not available:`, error.message);
      continue;
    }
  }
  throw new Error(
    "No available Gemini models found. Please check your API key and permissions."
  );
}

// Helper for exponential backoff retries
async function retryWithBackoff(fn, retries = 3, baseDelay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
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
}

export async function generateAIResponse(prompt) {
  try {
    if (!API_KEY) {
      throw new Error("Google API key is not configured");
    }

    const modelName = await getWorkingModelName();

    const result = await retryWithBackoff(async () => {
      return await genAI.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
    });

    const text = extractText(result);
    console.log(text);

    return text;
  } catch (error) {
    console.error("Error generating AI response:", error);

    // Provide specific error messages
    if (error.message && error.message.includes("API key")) {
      return "Error: Invalid or missing API key. Please configure your Google AI API key.";
    }

    if (error.status === 503 || (error.message && error.message.includes("overloaded"))) {
      return "Error: The AI model is currently overloaded. Please try again in a few moments.";
    }

    return `Error: ${error.message || "An unexpected error occurred while generating content."}`;
  }
}

export async function generateEmailTemplate(
  prompt,
  availableVariables = [],
  emailType = "marketing"
) {
  try {
    if (!API_KEY) {
      throw new Error("Google API key is not configured");
    }

    // Get the best available model name
    const modelName = await getWorkingModelName();

    // Create a comprehensive prompt for email template generation
    const variablesText =
      availableVariables.length > 0
        ? `Available variables: ${availableVariables
          .map((v) => `{{${v}}}`)
          .join(
            ", "
          )}. Use these naturally in the content for personalization.`
        : "No personalization variables available.";

    const templatePrompt = `
You are an expert email marketing copywriter with 10+ years of experience. Create a professional ${emailType} email template based on this request:

User Request: "${prompt}"

${variablesText}

CRITICAL FORMATTING REQUIREMENTS:
- Return ONLY a valid JSON object with "subject" and "content" fields
- Use proper HTML tags in content: <p> for paragraphs, <strong> for bold, <em> for italic, <br> for line breaks
- Subject line should be 30-60 characters and compelling
- Email structure: personalized greeting, engaging main content, clear call-to-action, professional closing
- Tone: Professional yet conversational and engaging
- If variables are available, integrate them naturally (e.g., "Dear {{name}}" instead of "Dear Customer")
- Include relevant emojis sparingly for engagement
- Make content scannable with bullet points or short paragraph
- Don't use any emojis

RESPONSE FORMAT (JSON only):
{
  "subject": "Compelling Subject Line Here",
  "content": "<p>Dear {{name}},</p><p>Engaging opening paragraph...</p><p><strong>Key benefits:</strong></p><ul><li>Benefit 1</li><li>Benefit 2</li></ul><p>Clear call-to-action paragraph</p><p>Best regards,<br><strong>Your Name</strong><br>Company Name</p>"
}

Generate the template now:`;

    const result = await retryWithBackoff(async () => {
      return await genAI.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: templatePrompt }] }],
      });
    });
    const text = extractText(result);
    console.log("Raw AI response:", text);
    // Try to parse JSON response
    try {
      // First, try to extract JSON from the response
      let jsonStr = text.trim();

      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\s*|\s*```/g, "");

      // Find JSON object in the response
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      // Parse the JSON
      const parsed = JSON.parse(jsonStr);

      // Validate the response structure
      if (parsed.subject && parsed.content) {
        // Clean up the content
        let cleanContent = parsed.content;

        // Ensure proper HTML formatting
        if (!cleanContent.includes("<p>") && !cleanContent.includes("<div>")) {
          // Convert line breaks to paragraphs
          cleanContent = cleanContent
            .split("\n")
            .filter((line) => line.trim())
            .map((line) => `<p>${line.trim()}</p>`)
            .join("");
        }

        return {
          success: true,
          subject: parsed.subject.trim(),
          content: cleanContent,
        };
      }

      throw new Error("Missing required fields");
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError);

      // Fallback parsing for non-JSON responses
      try {
        const lines = text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line);

        // Look for subject line
        let subject = "AI Generated Email Template";
        let content = "<p>AI generated email content.</p>";

        // Try to find subject
        for (const line of lines) {
          if (
            line.toLowerCase().includes("subject:") ||
            line.toLowerCase().includes("subject line:")
          ) {
            subject = line.replace(/subject:?\s*/i, "").trim();
            break;
          }
        }

        // Try to find content
        const contentStartIndex = lines.findIndex(
          (line) =>
            line.toLowerCase().includes("content:") ||
            line.toLowerCase().includes("body:") ||
            line.toLowerCase().includes("message:")
        );

        if (contentStartIndex > -1 && contentStartIndex < lines.length - 1) {
          const contentLines = lines.slice(contentStartIndex + 1);
          content = contentLines
            .filter(
              (line) =>
                !line.toLowerCase().includes("best regards") ||
                contentLines.indexOf(line) === contentLines.length - 1
            )
            .map((line) => `<p>${line}</p>`)
            .join("");
        } else {
          // Use all content if no specific markers found
          content = lines
            .filter((line) => !line.toLowerCase().includes("subject"))
            .map((line) => `<p>${line}</p>`)
            .join("");
        }

        return {
          success: true,
          subject: subject,
          content:
            content ||
            "<p>Thank you for your interest! We'll be in touch soon.</p>",
        };
      } catch (fallbackError) {
        console.error("Fallback parsing also failed:", fallbackError);

        // Ultimate fallback
        return {
          success: true,
          subject: "AI Generated Email Template",
          content:
            "<p>Thank you for reaching out! We appreciate your interest and will get back to you soon.</p><p>Best regards,<br>The Team</p>",
        };
      }
    }
  } catch (error) {
    console.error("Error generating email template:", error);

    // Provide specific error messages
    if (error.message && error.message.includes("API key")) {
      return {
        success: false,
        error:
          "Invalid or missing API key. Please configure your Google AI API key.",
      };
    }

    if (error.message && error.message.includes("quota")) {
      return {
        success: false,
        error:
          "API quota exceeded. Please wait a few minutes before trying again.",
      };
    }

    return {
      success: false,
      error:
        error.message || "Failed to generate email template. Please try again.",
    };
  }
}

export async function analyzeImage(
  base64Image,
  mimeType = "image/jpeg",
  prompt = "Describe this image in detail"
) {
  try {
    if (!API_KEY) {
      throw new Error("Google API key is not configured");
    }

    // Use gemini-1.5-flash which reliably supports vision
    const result = await retryWithBackoff(async () => {
      return await genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { data: base64Image, mimeType } },
              { text: prompt },
            ],
          },
        ],
      });
    });

    const text = extractText(result);

    if (!text || text.trim() === "") {
      throw new Error("Empty response from API");
    }

    return text;
  } catch (error) {
    console.error("Image analysis error:", error);

    // Provide more specific error messages
    if (error.message && error.message.includes("API key")) {
      return `Error: Invalid or missing API key. Please configure your Google AI API key.`;
    } else if (error.message && error.message.includes("quota")) {
      return `Error: API quota exceeded. Please try again later.`;
    } else if (error.message && error.message.includes("model")) {
      return `Error: Model not available. Please check your API key permissions.`;
    } else {
      return `Error analyzing image: ${error.message}`;
    }
  }
}

// Default export for webpack compatibility
export default {
  generateAIResponse,
  generateEmailTemplate,
  analyzeImage,
};
