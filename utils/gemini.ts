import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GOOGLE_API_KEY;

// Initialize the Google GenAI client (new SDK)
// See: https://www.npmjs.com/package/@google/genai
const genAI = new GoogleGenAI({ apiKey: API_KEY || '' });

// Available models in order of preference (models that support generateContent)
// Ordered with lite/newer models first as they typically have better quota availability
const AVAILABLE_MODELS: string[] = [
    // Latest stable releases
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.5-flash-lite",
];

// Types for API responses
interface GenerateContentResult {
    response?: {
        text?: string | (() => string);
        candidates?: Array<{
            content?: {
                parts?: Array<{ text?: string }>;
            };
        }>;
    };
    text?: () => string;
    output_text?: string;
    candidates?: Array<{
        content?: {
            parts?: Array<{ text?: string }>;
        };
    }>;
}

interface EmailTemplateResult {
    success: boolean;
    subject?: string;
    content?: string;
    error?: string;
}

interface Attachment {
    type: 'image' | 'video' | 'audio' | 'document';
    base64Data?: string;
    url?: string;
    mimeType?: string;
    filename?: string;
    extractedContent?: string;
}

interface Mention {
    type: string;
    url: string;
}

// Helper to normalize text from different SDK response shapes
function extractText(result: GenerateContentResult): string {
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

async function getWorkingModelName(): Promise<string | null> {
    if (!API_KEY) {
        console.warn("Google API key is not configured");
        return null;
    }

    for (const modelName of AVAILABLE_MODELS) {
        try {
            // Test the model with a lightweight request using the new SDK
            const result = await genAI.models.generateContent({
                model: modelName,
                contents: [{ role: "user", parts: [{ text: "Hello" }] }],
            }) as GenerateContentResult;
            const text = extractText(result);
            if (typeof text === "string") {
                console.log(`Using model: ${modelName}`);
                return modelName;
            }
        } catch (error) {
            const err = error as Error & { status?: number };
            // Check for quota exhausted specifically
            if (err.status === 429 || (err.message && err.message.includes("quota"))) {
                // Silently continue to next model
                continue;
            }
            // Silently continue for other errors too
            continue;
        }
    }
    // If we get here, no model worked. Return null instead of throwing
    console.log("AI temporarily unavailable - all models exhausted or unavailable");
    return null;
}

// Helper for exponential backoff retries
async function retryWithBackoff<T>(fn: () => Promise<T>, retries: number = 3, baseDelay: number = 2000): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            const err = error as Error & { status?: number };
            const isOverloaded =
                err.status === 503 ||
                (err.message && err.message.toLowerCase().includes("overloaded"));

            // Don't retry on quota errors, fail fast or switch models (handled in getWorkingModel)
            const isQuota =
                err.status === 429 ||
                (err.message && err.message.toLowerCase().includes("quota"));

            if (isQuota) {
                throw error;
            }

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
    throw new Error("Retry failed after all attempts");
}

export async function generateAIResponse(prompt: string): Promise<string | null> {
    try {
        if (!API_KEY) {
            return null; // Return null instead of throwing - caller will use fallback
        }

        const modelName = await getWorkingModelName();

        // If no model is available, return null (caller should use fallback)
        if (!modelName) {
            return null;
        }

        const result = await retryWithBackoff(async () => {
            return await genAI.models.generateContent({
                model: modelName,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            }) as GenerateContentResult;
        });

        const text = extractText(result);
        return text || null;
    } catch (error) {
        const err = error as Error & { status?: number };
        // Don't spam console with quota errors
        if (err.status !== 429 && !err.message?.includes("quota")) {
            console.error("Error generating AI response:", err.message);
        }

        // Return null for all errors - caller will use fallback
        return null;
    }
}

export async function generateEmailTemplate(
    prompt: string,
    availableVariables: string[] = [],
    emailType: string = "marketing"
): Promise<EmailTemplateResult> {
    try {
        if (!API_KEY) {
            throw new Error("Google API key is not configured");
        }

        // Get the best available model name
        const modelName = await getWorkingModelName();

        if (!modelName) {
            throw new Error("No AI model available");
        }

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
            }) as GenerateContentResult;
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
            const parsed = JSON.parse(jsonStr) as { subject?: string; content?: string };

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
        const err = error as Error;
        console.error("Error generating email template:", error);

        // Provide specific error messages
        if (err.message && err.message.includes("API key")) {
            return {
                success: false,
                error:
                    "Invalid or missing API key. Please configure your Google AI API key.",
            };
        }

        if (err.message && err.message.includes("quota")) {
            return {
                success: false,
                error:
                    "API quota exceeded. Please wait a few minutes before trying again.",
            };
        }

        return {
            success: false,
            error:
                err.message || "Failed to generate email template. Please try again.",
        };
    }
}

export async function analyzeImage(
    base64Image: string,
    mimeType: string = "image/jpeg",
    prompt: string = "Describe this image in detail"
): Promise<string> {
    try {
        if (!API_KEY) {
            throw new Error("Google API key is not configured");
        }

        // Get the best available model name
        const modelName = await getWorkingModelName();

        if (!modelName) {
            throw new Error("No AI model available");
        }

        const result = await retryWithBackoff(async () => {
            return await genAI.models.generateContent({
                model: modelName,
                contents: [
                    {
                        role: "user",
                        parts: [
                            { inlineData: { data: base64Image, mimeType } },
                            { text: prompt },
                        ],
                    },
                ],
            }) as GenerateContentResult;
        });

        const text = extractText(result);

        if (!text || text.trim() === "") {
            throw new Error("Empty response from API");
        }

        return text;
    } catch (error) {
        const err = error as Error;
        console.error("Image analysis error:", error);

        // Provide more specific error messages
        if (err.message && err.message.includes("API key")) {
            return `Error: Invalid or missing API key. Please configure your Google AI API key.`;
        } else if (err.message && err.message.includes("quota")) {
            return `Error: API quota exceeded. Please try again later.`;
        } else if (err.message && err.message.includes("model")) {
            return `Error: Model not available. Please check your API key permissions.`;
        } else {
            return `Error analyzing image: ${err.message}`;
        }
    }
}

/**
 * Parse @-mentions from prompt text
 * Supports @image, @video, @audio URLs
 */
function parseMentions(prompt: string): Mention[] {
    const mentions: Mention[] = [];
    const mentionRegex = /@(image|video|audio)\s+(https?:\/\/[^\s]+)/gi;
    let match: RegExpExecArray | null;

    while ((match = mentionRegex.exec(prompt)) !== null) {
        mentions.push({
            type: match[1].toLowerCase(),
            url: match[2],
        });
    }

    return mentions;
}

/**
 * Generate AI response with media attachments and document content
 * Supports images (vision API), documents, and @-mention URLs
 */
export async function generateWithMedia(prompt: string, attachments: Attachment[] = []): Promise<string> {
    try {
        if (!API_KEY) {
            throw new Error("Google API key is not configured");
        }

        const modelName = await getWorkingModelName();

        if (!modelName) {
            throw new Error("No AI model available");
        }

        interface Part {
            text?: string;
            inlineData?: {
                data: string;
                mimeType: string;
            };
        }

        const parts: Part[] = [];

        // Parse @-mentions from prompt
        const mentions = parseMentions(prompt);
        let enhancedPrompt = prompt;

        // Add mention context to prompt
        if (mentions.length > 0) {
            enhancedPrompt += "\n\nReferenced Media URLs:\n";
            mentions.forEach((mention) => {
                enhancedPrompt += `- ${mention.type.toUpperCase()}: ${mention.url}\n`;
            });
        }

        // Add document content to prompt
        const documentAttachments = attachments.filter(
            (att) => att.type === "document" && att.extractedContent
        );
        if (documentAttachments.length > 0) {
            enhancedPrompt += "\n\nDocument Content:\n";
            documentAttachments.forEach((doc) => {
                enhancedPrompt += `\n--- ${doc.filename} ---\n${doc.extractedContent}\n`;
            });
        }

        // Add text prompt
        parts.push({ text: enhancedPrompt });

        // Add image attachments for vision API
        const imageAttachments = attachments.filter((att) => att.type === "image");
        for (const img of imageAttachments) {
            // If base64 data is provided
            if (img.base64Data) {
                parts.push({
                    inlineData: {
                        data: img.base64Data,
                        mimeType: img.mimeType || "image/jpeg",
                    },
                });
            }
            // If URL is provided, add it to the context
            else if (img.url) {
                enhancedPrompt += `\n\nImage URL: ${img.url}`;
                parts[0].text = enhancedPrompt;
            }
        }

        // Use the resolved modelName which supports multimodal input
        const model = modelName;

        const result = await retryWithBackoff(async () => {
            return await genAI.models.generateContent({
                model,
                contents: [{ role: "user", parts }],
            }) as GenerateContentResult;
        });

        const text = extractText(result);
        console.log(text);

        return text;
    } catch (error) {
        const err = error as Error & { status?: number };
        console.error("Error generating AI response with media:", error);

        if (err.message && err.message.includes("API key")) {
            return "Error: Invalid or missing API key. Please configure your Google AI API key.";
        }

        if (
            err.status === 503 ||
            (err.message && err.message.includes("overloaded"))
        ) {
            return "Error: The AI model is currently overloaded. Please try again in a few moments.";
        }

        return `Error: ${err.message || "An unexpected error occurred while generating content."
            }`;
    }
}

// Default export for webpack compatibility
export default {
    generateAIResponse,
    generateEmailTemplate,
    analyzeImage,
    generateWithMedia,
};
