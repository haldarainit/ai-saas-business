const { GoogleGenAI } = require("@google/genai");

// Check if API key is available
const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error('GOOGLE_API_KEY not found in environment variables');
}

// Initialize the Google GenAI client (new SDK)
const genAI = new GoogleGenAI({ apiKey: API_KEY });

// Available models in order of preference
const AVAILABLE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-exp",
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

export async function getTrendingProducts(category) {
  try {
    console.log(`Attempting Gemini API for category: ${category}`);

    if (!API_KEY) {
      throw new Error('Invalid API key');
    }

    const modelName = await getWorkingModelName();
    console.log(`Using model: ${modelName}`);

    // Simple prompt for market analysis
    const prompt = `List 5 trending ${category} products in India. Return as JSON with format: {"category":"${category}","viralProducts":[{"productName":"name","brand":"brand","trendReason":"reason","estimatedDemandLevel":"High","priceRange":"₹X-₹Y","topCompetitors":["comp1","comp2"],"popularityScore":85}],"summary":"summary"}`;

    console.log('Making Gemini API call...');

    const result = await retryWithBackoff(async () => {
      return await genAI.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
    });

    const text = extractText(result);
    console.log('API response received, length:', text.length);

    // Try to extract JSON
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in response');
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    parsedData.generatedAt = new Date().toISOString();

    console.log('✅ Gemini API SUCCESS - Dynamic data returned');
    return parsedData;

  } catch (error) {
    console.error('❌ Gemini API failed:', error.message);

    // Return error instead of fallback data
    throw new Error(`Failed to get dynamic market data: ${error.message}`);
  }
}

export async function generatePresentationContent(topic, slideCount = 8, outlineOnly = false) {
  try {
    console.log(`Generating presentation content for topic: ${topic}, slides: ${slideCount}, outlineOnly: ${outlineOnly}`);

    if (!API_KEY) {
      throw new Error('Invalid API key');
    }

    const modelName = await getWorkingModelName();
    console.log(`Using model: ${modelName}`);

    // Different prompts for outline vs full generation
    const prompt = outlineOnly
      ? `Generate a professional presentation outline for the topic: "${topic}".
      Return a strictly valid JSON object with the following structure:
      {
        "title": "Presentation Title",
        "slides": [
          {
            "title": "Slide Title",
            "content": ["Key point 1", "Key point 2", "Key point 3"]
          }
        ]
      }
      The presentation should have exactly ${slideCount} slides.
      Slide 1 should be the Title Slide with a compelling subtitle as content.
      The last slide should be a Thank You / Q&A slide.
      Each slide should have 3-4 concise, professional bullet points.
      Make titles engaging and descriptive.
      IMPORTANT: Return ONLY the JSON, no other text.`
      : `Generate a professional presentation structure for the topic: "${topic}". 
      Return a strictly valid JSON object with the following structure:
      {
        "title": "Presentation Title",
        "slides": [
          {
            "title": "Slide Title",
            "content": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
            "imageKeyword": "detailed visual description for an AI image generator, professional style, high quality, vibrant, representing this slide topic"
          }
        ]
      }
      The presentation should have exactly ${slideCount} slides. 
      Slide 1 should be the Title Slide with a compelling tagline.
      The last slide should be a Thank You / Q&A slide.
      Each imageKeyword should be a detailed prompt for generating a relevant, professional image.
      Ensure professional tone and clear, concise bullet points.
      IMPORTANT: Return ONLY the JSON, no other text.`;

    console.log('Making Gemini API call for presentation...');

    const result = await retryWithBackoff(async () => {
      return await genAI.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
    });

    const text = extractText(result);
    console.log('API response received, length:', text.length);

    // Find JSON object
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in response');
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    return parsedData;

  } catch (error) {
    console.error('❌ Gemini Presentation API failed:', error.message);
    throw new Error(`Failed to generate presentation: ${error.message}`);
  }
}

