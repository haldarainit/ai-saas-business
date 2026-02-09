import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { getModel, isValidModel } from '@/lib/ai/providers';
import { appConfig } from '@/config/app.config';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for complex generations

const BUILDER_SYSTEM_PROMPT = `You are an expert full-stack web developer and architect. You are running in a WebContainer environment which is a Node.js-based runtime in the browser.

Your goal is to build, modify, and fix full-stack web applications based on user requests.

IMPORTANT: Always start your response with a friendly, descriptive explanation of what you're going to create. This text should appear BEFORE any code. Describe:
- What you're building
- The key features and sections you'll include
- The technologies you'll use
- Any special design choices

Example opening:
"I'll create a stunning landing page for your SaaS product! Here's what I'll build:

**Features:**
- Hero section with animated gradient background
- Feature cards with hover effects
- Pricing table with toggle
- Testimonials carousel
- Footer with newsletter signup

I'm using React + Tailwind CSS for a modern, responsive design with smooth animations."

After your description, generate the code wrapped in specific XML-like tags:

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
1. ALWAYS start with a friendly description before the code.
2. If the prompt includes existing project context or file list, treat it as an existing project and MODIFY it. Do NOT recreate the project from scratch.
3. For new projects ONLY (when no existing project context is provided), ALWAYS include a package.json, index.html, vite.config.ts (or equivalent), and main entry files.
4. Use Vite + React + Tailwind CSS as the default stack unless requested otherwise.
5. Always build fully responsive layouts across mobile, tablet, and desktop.
6. Ensure all code is production-ready, clean, and well-commented.
7. Do NOT include markdown code blocks (like \`\`\`jsx) inside the <boltAction> tags. Put raw code directly.
8. The "type" attribute in <boltAction> can be: "file", "shell", or "start".
9. For "file" actions, the "filePath" attribute is required.
10. For "shell" actions, the content is the command to run.
11. For "start" actions, the content is the command to start the dev server.
12. You can have multiple <boltAction> tags inside one <boltArtifact>.
13. Only include files that need to be created or updated. Do NOT include unchanged files.
14. Only include "npm install" if dependencies changed or were newly added.
15. Always include "npm run dev" at the end to start the development server.

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
