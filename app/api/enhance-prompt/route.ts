 
import { NextRequest } from 'next/server';
import { generateText } from 'ai';
import { getModel, isValidModel } from '@/lib/ai/providers';
import { appConfig } from '@/config/app.config';

export const runtime = 'nodejs';

const ENHANCE_SYSTEM_PROMPT = `You are an expert AI prompt engineer. Your goal is to rewrite the user's raw prompt into a detailed, structured, and high-quality prompt for a full-stack web developer AI.

Rules:
1. Improve clarity, specificity, and completeness.
2. Add necessary technical details if missing (e.g., "React", "Tailwind CSS", "Mobile-first").
3. Structure the prompt with sections like "Goal", "Key Features", "UI/UX", "Tech Stack".
4. Keep the original intent of the user. Do not change the core idea.
5. Output ONLY the enhanced prompt. Do not add any conversational filler like "Here is the enhanced prompt".`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, model } = await req.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const modelName = model && isValidModel(model) ? model : appConfig.ai.defaultModel;
    const modelInstance = getModel(modelName);

    const { text } = await generateText({
      model: modelInstance,
      system: ENHANCE_SYSTEM_PROMPT,
      prompt: prompt,
      temperature: 0.7,
    });

    return Response.json({ enhancedPrompt: text });
  } catch (error: any) {
    console.error('[Enhance Prompt] Error:', error);
    return Response.json(
      { error: error.message || 'Failed to enhance prompt' },
      { status: 500 }
    );
  }
}
