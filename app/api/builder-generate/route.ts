
import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { getModel, isValidModel } from '@/lib/ai/providers';
import { appConfig } from '@/config/app.config';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for complex generations

const BUILDER_SYSTEM_PROMPT = `You are an expert full-stack web developer and architect. You are running in a WebContainer environment which is a Node.js-based runtime in the browser.

Your goal is to build, modify, and fix full-stack web applications based on user requests.

CRITICAL INSTRUCTION: You must generate the code wrapped in specific XML-like tags so the system can parse and execute it.

Format your response using the following structure:

<boltArtifact id="project-id" title="Project Title">
  <boltAction type="file" filePath="package.json">
    {
      "name": "my-app",
      "version": "0.1.0",
      ...
    }
  </boltAction>

  <boltAction type="file" filePath="src/App.tsx">
    // content...
  </boltAction>

  <boltAction type="shell">
    npm install
  </boltAction>

  <boltAction type="start">
    npm run dev
  </boltAction>
</boltArtifact>

RULES:
1. If the prompt includes existing project context or file list, treat it as an existing project and MODIFY it. Do NOT recreate the project from scratch.
2. For new projects ONLY (when no existing project context is provided), ALWAYS include a package.json, index.html, vite.config.ts (or equivalent), and main entry files.
3. Use Vite + React + Tailwind CSS as the default stack unless requested otherwise.
4. Ensure all code is production-ready, clean, and well-commented.
5. Do NOT include markdown code blocks (like \`\`\`jsx) inside the <boltAction> tags. Put raw code directly.
6. The "type" attribute in <boltAction> can be: "file", "shell", or "start".
7. For "file" actions, the "filePath" attribute is required.
8. For "shell" actions, the content is the command to run.
9. For "start" actions, the content is the command to start the dev server.
10. You can have multiple <boltAction> tags inside one <boltArtifact>.
11. Only include files that need to be created or updated. Do NOT include unchanged files.
12. Only include "npm install" if dependencies changed or were newly added. Avoid repeating it.
13. Only include "npm run dev" if the user explicitly asks to start the app.

When updating existing files, provide the FULL file content, not just diffs.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, model, context } = await req.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const modelName = model && isValidModel(model) ? model : appConfig.ai.defaultModel;
    const modelInstance = getModel(modelName);

    // Construct the user message
    let userPrompt = prompt;

    // Add context if available
    if (context && context.length > 0) {
      userPrompt += `\n\nContext from previous messages:\n${context.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}`;
    }

    const result = await streamText({
      model: modelInstance,
      system: BUILDER_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('[Builder Generate] Error:', error);
    return Response.json(
      { error: error.message || 'Failed to generate code' },
      { status: 500 }
    );
  }
}
