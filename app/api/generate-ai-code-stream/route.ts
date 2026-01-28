// AI Code Generation Stream API
import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { getModel, isValidModel, type ModelId } from '@/lib/ai/providers';
import { SYSTEM_PROMPT, CODE_GENERATION_PROMPT, fillPromptTemplate } from '@/lib/ai/prompts';
import { appConfig } from '@/config/app.config';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface GenerateRequest {
  prompt: string;
  model?: string;
  context?: string;
  style?: string;
  websiteContent?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json();
    const { prompt, context, style, websiteContent } = body;
    let { model } = body;

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Use default model if not specified or invalid
    if (!model || !isValidModel(model)) {
      model = appConfig.ai.defaultModel;
    }

    // Build the full prompt
    let fullPrompt = prompt;
    
    if (websiteContent) {
      fullPrompt = fillPromptTemplate(CODE_GENERATION_PROMPT, {
        requirements: prompt,
        context: context || '',
      });
      
      fullPrompt += `\n\nWebsite content to reference:\n${websiteContent.slice(0, 50000)}`;
      
      if (style) {
        fullPrompt += `\n\nApply the following design style: ${style}`;
      }
    }

    // Get the AI model
    const modelInstance = getModel(model as ModelId);

    // Stream the response
    const result = await streamText({
      model: modelInstance,
      system: SYSTEM_PROMPT,
      prompt: fullPrompt,
      temperature: appConfig.ai.defaultTemperature,
    });

    // Return the streaming response using the correct method
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('AI generation error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to generate code' },
      { status: 500 }
    );
  }
}
