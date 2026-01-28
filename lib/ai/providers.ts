// AI Provider Configuration - Aligned with geminiService.ts
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGroq } from '@ai-sdk/groq';

// Initialize providers with API keys
export const googleAI = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
});

export const openAI = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// Model configuration - using the same model names as geminiService.ts
export const modelConfigs = {
  // Google Gemini (matching geminiService.ts AVAILABLE_MODELS)
  'gemini-2.5-flash': {
    provider: googleAI,
    modelId: 'gemini-2.5-flash',
    maxTokens: 8192,
  },
  'gemini-2.0-flash': {
    provider: googleAI,
    modelId: 'gemini-2.0-flash-exp',
    maxTokens: 8192,
  },
  'gemini-1.5-flash': {
    provider: googleAI,
    modelId: 'gemini-1.5-flash',
    maxTokens: 8192,
  },
  'gemini-1.5-pro': {
    provider: googleAI,
    modelId: 'gemini-1.5-pro',
    maxTokens: 8192,
  },
  
  // OpenAI
  'gpt-4o': {
    provider: openAI,
    modelId: 'gpt-4o',
    maxTokens: 8192,
  },
  'gpt-4o-mini': {
    provider: openAI,
    modelId: 'gpt-4o-mini',
    maxTokens: 8192,
  },
  
  // Anthropic
  'claude-3-5-sonnet': {
    provider: anthropic,
    modelId: 'claude-3-5-sonnet-20241022',
    maxTokens: 8192,
  },
  'claude-3-5-haiku': {
    provider: anthropic,
    modelId: 'claude-3-5-haiku-20241022',
    maxTokens: 8192,
  },
  
  // Groq
  'llama-3.3-70b': {
    provider: groq,
    modelId: 'llama-3.3-70b-versatile',
    maxTokens: 8192,
  },
  'llama-3.1-70b': {
    provider: groq,
    modelId: 'llama-3.1-70b-versatile',
    maxTokens: 8192,
  },
} as const;

export type ModelId = keyof typeof modelConfigs;

// Get model instance by ID
export function getModel(modelId: string) {
  // If modelId is in our configs, use it
  if (modelId in modelConfigs) {
    const config = modelConfigs[modelId as ModelId];
    return config.provider(config.modelId);
  }
  
  // Default fallback to gemini-2.5-flash
  console.warn(`Model ${modelId} not found, using gemini-2.5-flash as fallback`);
  const config = modelConfigs['gemini-2.5-flash'];
  return config.provider(config.modelId);
}

// Check if a model ID is valid
export function isValidModel(modelId: string): modelId is ModelId {
  return modelId in modelConfigs;
}

// Get available models
export function getAvailableModels() {
  return Object.keys(modelConfigs) as ModelId[];
}
