 // AI Code Generation Stream API
import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { getModel, isValidModel } from '@/lib/ai/providers';
import { SYSTEM_PROMPT, CODE_GENERATION_PROMPT, fillPromptTemplate } from '@/lib/ai/prompts';
import { appConfig } from '@/config/app.config';

export const runtime = 'nodejs';
export const maxDuration = 120; // Increased for longer generations

interface GenerateRequest {
  prompt: string;
  model?: string;
  context?: Array<{ path: string; content: string }>;
  style?: string;
  websiteContent?: string;
}

export async function POST(req: NextRequest) {
  console.log('[AI Generate] Starting request...');
  
  try {
    const body: GenerateRequest = await req.json();
    const { prompt, context, style, websiteContent } = body;
    let { model } = body;

    console.log('[AI Generate] Prompt length:', prompt?.length || 0);
    console.log('[AI Generate] Requested model:', model);
    console.log('[AI Generate] Context files:', context?.length || 0);

    if (!prompt) {
      console.warn('[AI Generate] No prompt provided');
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Use default model if not specified or invalid
    if (!model || !isValidModel(model)) {
      console.log('[AI Generate] Using default model:', appConfig.ai.defaultModel);
      model = appConfig.ai.defaultModel;
    }

    // Build the full prompt with code generation instructions
    let fullPrompt = `You are an expert React developer. Create a complete, production-ready React application with Tailwind CSS.

CRITICAL RULES:
1. Use ONLY standard Tailwind CSS classes (no custom classes like bg-dark-purple, text-custom-blue, etc.)
2. Use standard color palettes: slate, gray, zinc, neutral, stone, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose
3. Color shades: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950
4. Do NOT use @apply or custom CSS classes - use only inline Tailwind classes

FILE FORMAT - Use this exact format for each file:
\`\`\`jsx:src/App.jsx
// file content here
\`\`\`

\`\`\`css:src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Only add standard CSS here, no custom utility classes */
\`\`\`

FILES TO GENERATE:
- src/App.jsx (main component with Tailwind classes)
- src/index.css (just the @tailwind directives, minimal custom CSS)

User Request: ${prompt}`;
    
    // Add context from existing files
    if (context && context.length > 0) {
      fullPrompt += `\n\nExisting project files for reference:\n`;
      for (const file of context.slice(0, 5)) { // Limit to 5 files to avoid token limits
        fullPrompt += `\n--- ${file.path} ---\n${file.content.substring(0, 2000)}\n`;
      }
    }

    if (websiteContent) {
      fullPrompt = fillPromptTemplate(CODE_GENERATION_PROMPT, {
        requirements: prompt,
        context: context ? JSON.stringify(context.map(f => f.path)) : '',
      });
      
      fullPrompt += `\n\nWebsite content to reference:\n${websiteContent.slice(0, 30000)}`;
      
      if (style) {
        fullPrompt += `\n\nApply the following design style: ${style}`;
      }
    }

    console.log('[AI Generate] Full prompt length:', fullPrompt.length);

    // Get the AI model
    const modelInstance = getModel(model);
    console.log('[AI Generate] Model initialized');

    // Stream the response
    console.log('[AI Generate] Starting stream...');
    const result = await streamText({
      model: modelInstance,
      system: SYSTEM_PROMPT,
      prompt: fullPrompt,
      temperature: appConfig.ai.defaultTemperature,
    });

    console.log('[AI Generate] Stream created, sending response');
    
    // Return the streaming response using the correct method
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[AI Generate] Error:', error);
    
    // More detailed error message
    let errorMessage = 'Failed to generate code';
    if (error instanceof Error) {
      errorMessage = error.message;
      if ('cause' in error) {
        console.error('[AI Generate] Error cause:', error.cause);
      }
    }
    
    return Response.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
