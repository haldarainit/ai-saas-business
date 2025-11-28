export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, currentCode, businessDetails, attachments } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        {
          success: false,
          error: "Messages array is required",
        },
        { status: 400 }
      );
    }

    console.log("Generating landing page with conversation history:", {
      messageCount: messages.length,
      hasCurrentCode: !!currentCode,
      hasBusinessDetails: !!businessDetails,
      attachmentCount: attachments?.length || 0,
    });

    // Generate the landing page using Gemini AI
    const geminiModule = await import("../../../utils/gemini.js");
    const gemini = geminiModule.default || geminiModule;

    // Build the prompt with conversation context
    const systemPrompt = `You are an expert React developer creating production-ready landing pages like Lovable.dev.

CRITICAL FILE STRUCTURE - ALWAYS INCLUDE ALL FILES:
1. "/package.json" - Dependencies (react, react-dom, react-router-dom, react-scripts, lucide-react)
2. "/public/index.html" - HTML template with Tailwind CDN
3. "/index.js" - React 18 entry point with createRoot
4. "/styles.css" - Global styles with modern CSS
5. "/App.js" - Main app component with React Router setup
6. "/components/Hero.js" - Hero section component
7. "/components/Features.js" - Features section
8. "/components/Testimonials.js" - Testimonials section  
9. "/components/CTA.js" - Call-to-action section
10. Additional components as needed (Navbar, Footer, Pricing, About, Contact, etc.)

CRITICAL CODE RULES - READ CAREFULLY:
- USE React 18 patterns: createRoot, automatic batching
- INCLUDE react-router-dom for navigation (BrowserRouter, Routes, Route, Link)
- USE ONLY these HTML elements: div, section, h1, h2, h3, p, span, button, img, a, ul, li, nav, footer, header
- DO NOT use ANY UI component libraries (NO Badge, Card, Button, Input components)
- DO NOT import or use Shadcn components
- ONLY use lucide-react for icons: import { IconName } from 'lucide-react'
- Use Tailwind CSS classes for ALL styling
- Every component must be a vanilla React function component
- **ALWAYS use DOUBLE QUOTES ("") for ALL JavaScript strings, NEVER single quotes ('')**
- This prevents syntax errors with apostrophes (don't, we're, etc.)

REACT ROUTER SETUP:
- Wrap App in BrowserRouter in index.js
- Use Routes and Route in App.js for navigation
- Use Link component for internal navigation (not <a> tags)
- Create separate page components if needed (Home, About, Contact, etc.)

DESIGN REQUIREMENTS FOR EACH SECTION:
- Hero: Full-screen gradient background, large h1 heading, p subheading, button with icon
- Features: Grid of feature cards using div elements with icons, h3 titles, p descriptions
- Testimonials: Customer reviews in div cards with quote text, names (no Badge components)
- CTA: Compelling section with h2 heading, p text, button
- Use modern design: gradients, shadows, rounded corners, hover effects

TAILWIND CSS USAGE:
- bg-gradient-to-br, bg-gradient-to-r for gradients
- shadow-lg, shadow-xl for depth
- rounded-lg, rounded-xl for corners
- hover:scale-105, transition-all for animations
- Use flex, grid for layouts
- Responsive: sm:, md:, lg:, xl:
- **CRITICAL: ALL DESIGNS MUST BE FULLY RESPONSIVE.**
- ALWAYS use responsive prefixes (sm:, md:, lg:) for layout changes (e.g., flex-col on mobile, flex-row on desktop).
- Ensure font sizes, padding, and margins are adjusted for mobile screens.
- The design MUST look professional and perfect on mobile, tablet, and desktop devices.

JSON RESPONSE FORMATTING - CRITICAL:
- You must return a SINGLE valid JSON object.
- The keys are file paths, and values are the code content.
- **YOU MUST ESCAPE ALL DOUBLE QUOTES INSIDE THE CODE STRINGS.**
- Example: "className=\\"bg-blue-500\\"" NOT "className="bg-blue-500""
- Do not use markdown code blocks. Just the raw JSON string.
- Ensure all newlines in the code are properly escaped as \\n.

EXAMPLE STRUCTURE (return as JSON):
{
  "/package.json": "{\\"name\\":\\"landing-page\\",\\"version\\":\\"1.0.0\\",\\"scripts\\":{\\"start\\":\\"react-scripts start\\",\\"build\\":\\"react-scripts build\\"},\\"dependencies\\":{\\"react\\":\\"^18.2.0\\",\\"react-dom\\":\\"^18.2.0\\",\\"react-router-dom\\":\\"^6.20.0\\",\\"react-scripts\\":\\"5.0.1\\",\\"lucide-react\\":\\"latest\\"}}",
  "/public/index.html": "<!DOCTYPE html>\\n<html lang=\\"en\\">\\n<head>\\n  <meta charset=\\"utf-8\\" />\\n  <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />\\n  <title>Landing Page</title>\\n  <script src=\\"https://cdn.tailwindcss.com\\"></script>\\n</head>\\n<body>\\n  <div id=\\"root\\"></div>\\n</body>\\n</html>",
  "/index.js": "import React from \\"react\\";\\nimport { createRoot } from \\"react-dom/client\\";\\nimport { BrowserRouter } from \\"react-router-dom\\";\\nimport \\"./styles.css\\";\\nimport App from \\"./App\\";\\n\\nconst root = createRoot(document.getElementById(\\"root\\"));\\nroot.render(\\n  <BrowserRouter>\\n    <App />\\n  </BrowserRouter>\\n);",
  "/styles.css": "* { margin: 0; padding: 0; box-sizing: border-box; }\\nbody { font-family: system-ui, -apple-system, sans-serif; }\\nhtml { scroll-behavior: smooth; }\\n\\n/* Hide scrollbar but keep functionality */\\n::-webkit-scrollbar { width: 0px; height: 0px; }\\n* { scrollbar-width: none; -ms-overflow-style: none; }",
  "/App.js": "import React from \\"react\\";\\nimport { Routes, Route } from \\"react-router-dom\\";\\nimport Hero from \\"./components/Hero\\";\\nimport Features from \\"./components/Features\\";\\nimport CTA from \\"./components/CTA\\";\\n\\nexport default function App() {\\n  return (\\n    <Routes>\\n      <Route path=\\"/\\" element={\\n        <div>\\n          <Hero />\\n          <Features />\\n          <CTA />\\n        </div>\\n      } />\\n    </Routes>\\n  );\\n}",
  "/components/Hero.js": "import React from \\"react\\";\\nimport { ArrowRight } from \\"lucide-react\\";\\n\\nexport default function Hero() {\\n  return (\\n    <section className=\\"min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 text-white px-4\\">\\n      <div className=\\"max-w-4xl text-center\\">\\n        <h1 className=\\"text-6xl font-bold mb-6\\">Build Amazing Products</h1>\\n        <p className=\\"text-2xl mb-8 text-blue-100\\">Transform your ideas into reality</p>\\n        <button className=\\"bg-white text-blue-600 px-8 py-4 rounded-full font-semibold flex items-center gap-2 mx-auto hover:scale-105 transition-transform shadow-xl\\">\\n          Get Started <ArrowRight className=\\"w-5 h-5\\" />\\n        </button>\\n      </div>\\n    </section>\\n  );\\n}"
}

CRITICAL: Return ONLY the JSON object. NO markdown, NO explanations. Use React 18 patterns and include react-router-dom.`;

    let userPrompt;
    const lastMessage = messages[messages.length - 1];

    // Build context from business details
    let businessContext = "";
    if (businessDetails) {
      businessContext = `
Business Name: "${businessDetails.businessName}"
Business Description: "${businessDetails.businessDescription}"
${businessDetails.targetAudience ? `Target Audience: "${businessDetails.targetAudience}"` : ""}
Primary Color Scheme: "${businessDetails.colorScheme}"
`;
    }

    // Add info about uploaded files
    let fileContext = "";
    if (attachments && attachments.length > 0) {
      const fileList = attachments.map(att => {
        // Generate a safe variable name based on the filename
        const varName = att.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/^([0-9])/, '_$1');
        const safeFileName = att.name.replace(/[^a-zA-Z0-9.-]/g, '_');

        return `- ${att.type}: ${att.name} -> Available at './assets/${safeFileName}.js'.\n  Usage: import ${varName} from './assets/${safeFileName}.js';\n  <img src={${varName}} ... /> (or <video/audio src={${varName}} />)`;
      }).join("\n");

      fileContext = `
UPLOADED FILES AVAILABLE:
${fileList}

CRITICAL ASSET INSTRUCTIONS: 
1. Files are stored as individual JS modules in 'src/assets/'.
2. Each file exports the Data URL as the default export.
3. YOU MUST IMPORT them to use them.
4. **YOU MUST INCLUDE THE .js EXTENSION IN THE IMPORT PATH.**
   - CORRECT: import myImage from './assets/my-image.png.js';
   - INCORRECT: import myImage from './assets/my-image.png';
5. Use the imported variable as the src for img/video tags.

CRITICAL CONTENT PRESERVATION:
- When updating components (especially Navbar and Footer), **DO NOT REMOVE EXISTING TITLES, LINKS, OR CONTENT** unless explicitly asked.
- If adding a logo, insert it ALONGSIDE the existing business name/title, do not replace it.
- Maintain the existing structure and styling while adding the new media.
`;
    }

    if (!currentCode) {
      userPrompt = `Create a complete, multi-file landing page with the following details:
${businessContext}
${fileContext}

User's request: "${lastMessage.content}"

Return ONLY the JSON object with the file structure.`;
    } else {
      // Build full code context for AI to reference
      const currentFilesContext = Object.entries(currentCode?.files || {})
        .map(([path, fileData]) => `File: ${path}\n${fileData.code}`)
        .join("\n\n---NEXT FILE---\n\n");

      userPrompt = `EXISTING CODE CONTEXT - MEMORIZE THIS:

${currentFilesContext}

---

Business context:
${businessContext}
${fileContext}

User's new request: "${lastMessage.content}"

CRITICAL INSTRUCTIONS FOR MODIFICATIONS:
1. ANALYZE the user's request carefully to determine which files need changes.
2. **PARTIAL UPDATES ONLY:**
   - If the request is specific (e.g., "add this image to navbar"), **RETURN ONLY THE MODIFIED FILE** (e.g., "/components/Navbar.js").
   - **DO NOT** return unchanged files like App.js, index.js, or styles.css.
   - This prevents overwriting existing work and speeds up generation.

3. If the request is MAJOR (e.g., "complete redesign"), then return all affected files.

4. ALWAYS preserve the exact structure and functionality of unchanged code within the modified file.
5. Use the existing code as reference - maintain consistency.

RESPONSE FORMAT:
Return ONLY a JSON object with the files that NEED TO BE CHANGED.
The unchanged files will be automatically preserved.`;
    }

    const fullPrompt = `${systemPrompt}

${userPrompt}`;

    // Map frontend attachment format to what generateWithMedia expects
    // Frontend sends: { type, content (base64/text), mimeType, name }
    // generateWithMedia expects: { type: 'image'|'document', base64Data, mimeType, extractedContent, url }

    const processedAttachments = (attachments || []).map(att => {
      if (att.type === 'image') {
        // Strip data:image/xyz;base64, prefix if present
        const base64Data = att.content.includes('base64,')
          ? att.content.split('base64,')[1]
          : att.content;

        return {
          type: 'image',
          base64Data,
          mimeType: att.mimeType,
          url: att.url // Pass URL if present
        };
      } else {
        // For documents/text
        return {
          type: 'document',
          extractedContent: att.content,
          filename: att.name
        };
      }
    });

    const result = await gemini.generateWithMedia(fullPrompt, processedAttachments);

    if (result && !result.includes("Error")) {
      try {
        let cleanedResult = result.trim();

        // Remove markdown fences if present
        cleanedResult = cleanedResult.replace(/^```json\s */i, "");
        cleanedResult = cleanedResult.replace(/^```\s*/i, "");
        cleanedResult = cleanedResult.replace(/```$/i, "");
        cleanedResult = cleanedResult.trim();

        let generatedFiles;
        try {
          generatedFiles = JSON.parse(cleanedResult);
        } catch (firstError) {
          // If first parse fails, try aggressive cleanup
          console.log("First parse failed, attempting cleanup...");

          // Fix common issues:
          // 1. Replace literal newlines in strings with \\n
          // 2. Fix tabs
          // 3. Remove any remaining control characters

          try {
            // Parse as an object to manipulate it
            const fixedResult = cleanedResult
              // Fix newlines within string values (between quotes)
              .replace(/"([^"]*?)"\s*:\s*"((?:[^"\\]|\\.)*)"/g, (match, key, value) => {
                // Escape unescaped newlines and tabs in the value
                const fixedValue = value
                  .replace(/\n/g, '\\n')
                  .replace(/\r/g, '\\r')
                  .replace(/\t/g, '\\t');
                return `"${key}": "${fixedValue}"`;
              });

            generatedFiles = JSON.parse(fixedResult);
          } catch (secondError) {
            console.error("Error parsing cleaned AI JSON after cleanup, raw payload was:\n", cleanedResult);
            console.error("First error:", firstError.message);
            console.error("Second error:", secondError.message);
            throw secondError;
          }
        }

        // Function to fix common syntax errors in JavaScript strings
        function fixJavaScriptStrings(code) {
          if (typeof code !== 'string') return code;

          // Fix unescaped apostrophes in string literals
          // This regex finds strings and escapes apostrophes within them
          return code.replace(/'([^']*(?:\\'[^']*)*)'/g, (match) => {
            // For each single-quoted string, escape any unescaped apostrophes
            return match.replace(/(?<!\\)'/g, (quote, index) => {
              // Skip the opening and closing quotes
              if (index === 0 || index === match.length - 1) return quote;
              return "\\'";
            });
          });
        }

        const formattedFiles = {};
        Object.entries(generatedFiles).forEach(([path, content]) => {
          // Apply fixes to JavaScript/JSX files
          const fixedContent = path.endsWith('.js') || path.endsWith('.jsx')
            ? fixJavaScriptStrings(content)
            : content;
          formattedFiles[path] = { code: fixedContent };
        });

        // SMART MERGE: Combine existing files with AI modifications
        const mergedFiles = currentCode?.files
          ? { ...currentCode.files, ...formattedFiles }  // Preserve existing + overwrite modified
          : formattedFiles;  // First generation - use all files

        const modifiedFilePaths = Object.keys(formattedFiles);
        const preservedCount = Object.keys(currentCode?.files || {}).length - modifiedFilePaths.length;

        console.log(`Smart generation: Modified ${modifiedFilePaths.length} files, Preserved ${Math.max(0, preservedCount)} files`);

        return Response.json({
          success: true,
          files: mergedFiles,
          modifiedFiles: modifiedFilePaths,
          message: currentCode
            ? `Updated ${modifiedFilePaths.length} file(s): ${modifiedFilePaths.join(", ")}`
            : "Landing page generated successfully!",
          role: "ai"
        });
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        return Response.json(
          {
            success: false,
            error: "Failed to parse AI response. Please try generating again.",
          },
          { status: 500 }
        );
      }
    } else {
      return Response.json(
        {
          success: false,
          error: result || "Failed to generate landing page",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in generate-landing-page API:", error);
    return Response.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
