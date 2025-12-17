import { GoogleGenAI } from "@google/genai";

// Check if API key is available
const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error('GOOGLE_API_KEY not found in environment variables');
}

// Initialize the Google GenAI client (new SDK)
// See: https://www.npmjs.com/package/@google/genai
const genAI = new GoogleGenAI({ apiKey: API_KEY });

// Available models in order of preference (aligned with utils/gemini.js)
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
    console.log(`Generating enhanced presentation content for topic: ${topic}, slides: ${slideCount}, outlineOnly: ${outlineOnly}`);

    if (!API_KEY) {
      throw new Error('Invalid API key');
    }

    const modelName = await getWorkingModelName();
    console.log(`Using model: ${modelName}`);

    // Enhanced prompt for Gamma-style presentations with different layout types
    const prompt = outlineOnly
      ? `You are an expert presentation designer like Gamma AI. Create a professional, visually-structured presentation outline for: "${topic}"

REQUIREMENTS:
- Generate exactly ${slideCount} slides with VARIED LAYOUT TYPES for visual interest
- Each slide must have an engaging, specific title (not generic like "Introduction" or "Overview")
- Content should flow logically from one slide to the next
- Use specific facts, statistics, or examples where relevant
- DO NOT use any markdown formatting in content (no **, *, _, #, etc.)
- Write all text as clean, plain text sentences

SLIDE LAYOUT TYPES (use variety!):
1. "title" - Opening slide (slide 1 only)
2. "comparison" - Two-column layout comparing approaches (e.g., "Traditional vs Modern", "Problem vs Solution")
3. "features" - Grid of 3-5 feature cards with icons (great for benefits, advantages, capabilities)
4. "imageRight" - Text on left, image on right (good for explanations)
5. "imageLeft" - Image on left, text on right (alternate with imageRight)
6. "metrics" - Large statistics/numbers showcase (2-3 key metrics)
7. "iconList" - Bullet points with icons (professional lists)
8. "textOnly" - Clean text without images (for important information that needs focus)
9. "closing" - Final slide (last slide only)

SLIDE STRUCTURE OUTPUT:
{
  "title": "Compelling Presentation Title",
  "slides": [
    {
      "title": "Slide Title",
      "layoutType": "title|comparison|features|imageRight|imageLeft|metrics|iconList|textOnly|closing",
      "content": ["Point 1", "Point 2", "Point 3"],
      "subtitle": "Optional subtitle for title slides",
      "comparison": {
        "left": { "heading": "Traditional Approach", "points": ["Point 1", "Point 2"] },
        "right": { "heading": "Modern Solution", "points": ["Point 1", "Point 2"] }
      },
      "features": [
        { "icon": "storefront|dashboard|analytics|design|security|speed|chart|check|star|rocket|globe|target", "title": "Feature Name", "description": "Brief description" }
      ],
      "metrics": [
        { "value": "50%", "label": "Increase", "description": "Brief context" }
      ],
      "hasImage": true
    }
  ]
}

IMPORTANT LAYOUT DECISIONS:
- Slide 1: Always use "title" layout
- Slide ${slideCount}: Always use "closing" layout
- Use "comparison" when discussing problems vs solutions, old vs new, before vs after
- Use "features" for benefits, capabilities, advantages (3-5 items with icons)
- Use "metrics" for statistics, results, performance data
- Use "iconList" for professional lists that deserve visual emphasis
- Alternate "imageRight" and "imageLeft" for visual variety
- Use "textOnly" sparingly for important text that needs focus
- NOT every slide needs an image - comparison, features, and metrics slides typically don't need images

Icon choices: storefront, dashboard, analytics, cart, payment, shipping, design, search, security, speed, mobile, automation, chart, growth, target, check, star, idea, rocket, globe, award, clock

Return ONLY the raw JSON object, no markdown, no code blocks.`
      : `You are an expert presentation designer like Gamma AI. Create a complete, visually stunning presentation for: "${topic}"

REQUIREMENTS:
- Generate exactly ${slideCount} slides with VARIED LAYOUT TYPES
- Each slide should have appropriate content for its layout type
- Include detailed image prompts only for slides that need images
- Content should be professional, specific, and well-researched
- DO NOT use any markdown formatting (no **, *, _, #, etc.)

SLIDE LAYOUT TYPES:
1. "title" - Opening slide with hero image
2. "comparison" - Two columns, NO image needed
3. "features" - Feature cards with icons, NO image needed
4. "imageRight" - Content left, image right
5. "imageLeft" - Image left, content right
6. "metrics" - Statistics showcase, optional decorative image
7. "iconList" - Icon bullet points, optional image
8. "textOnly" - Focus on text content, NO image
9. "closing" - CTA/Thank you, optional hero image

FULL SLIDE STRUCTURE:
{
  "title": "Compelling Presentation Title",
  "slides": [
    {
      "title": "Engaging Slide Title",
      "layoutType": "one of the types above",
      "content": ["Informative point 1", "Key insight 2", "Important detail 3"],
      "subtitle": "For title slides only",
      "comparison": {
        "left": { "heading": "Traditional Approach", "points": ["Challenge 1", "Challenge 2", "Challenge 3"] },
        "right": { "heading": "Our Solution", "points": ["Benefit 1", "Benefit 2", "Benefit 3"] }
      },
      "features": [
        { "icon": "icon_name", "title": "Feature Name", "description": "One sentence description" }
      ],
      "metrics": [
        { "value": "10X", "label": "Performance", "description": "Improvement over baseline" }
      ],
      "hasImage": true,
      "imageKeyword": "Detailed image prompt for AI generation, modern style, vibrant colors, professional, 4K quality"
    }
  ]
}

IMAGE GUIDELINES:
- Title slide: Hero image representing the main theme
- Comparison slides: Usually NO image (focus on content)
- Features slides: Usually NO image (icons are the visual)
- ImageLeft/ImageRight: ALWAYS include imageKeyword
- Metrics slides: Optional decorative image
- Closing slide: Optional inspirational image

Icon options: storefront, dashboard, analytics, cart, payment, shipping, inventory, customer, support, design, search, filter, settings, security, speed, mobile, integration, automation, document, email, notification, chat, share, chart, report, growth, target, check, star, idea, rocket, globe, heart, award, clock, calendar, key

IMPORTANT: Return ONLY raw JSON, no markdown code blocks.`;

    console.log('Making Gemini API call for enhanced presentation...');

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

    // Post-process slides to ensure proper structure
    if (parsedData.slides) {
      parsedData.slides = parsedData.slides.map((slide, index) => {
        // Ensure layoutType is set
        if (!slide.layoutType) {
          if (index === 0) slide.layoutType = 'title';
          else if (index === parsedData.slides.length - 1) slide.layoutType = 'closing';
          else slide.layoutType = (index % 2 === 0) ? 'imageRight' : 'imageLeft';
        }

        // Normalize content array - ensure it's always an array of strings
        if (slide.content && Array.isArray(slide.content)) {
          slide.content = slide.content.map(item => {
            if (typeof item === 'string') {
              return item;
            } else if (typeof item === 'object' && item !== null) {
              // If content item is an object (e.g., {icon: 'check', text: '...'})
              // Extract just the text
              return item.text || item.description || item.title || JSON.stringify(item);
            }
            return String(item);
          });
        }

        // Determine if slide should have an image
        const noImageLayouts = ['comparison', 'features', 'metrics', 'textOnly'];
        if (noImageLayouts.includes(slide.layoutType)) {
          slide.hasImage = false;
        } else if (slide.hasImage === undefined) {
          slide.hasImage = true;
        }

        return slide;
      });
    }

    return parsedData;

  } catch (error) {
    console.error('❌ Gemini Enhanced Presentation API failed:', error.message);
    throw new Error(`Failed to generate presentation: ${error.message}`);
  }
}

