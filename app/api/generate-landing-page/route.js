export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, currentCode, businessDetails } = body;

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

EXAMPLE STRUCTURE (return as JSON):
{
  "/package.json": "{\\"name\\":\\"landing-page\\",\\"version\\":\\"1.0.0\\",\\"scripts\\":{\\"start\\":\\"react-scripts start\\",\\"build\\":\\"react-scripts build\\"},\\"dependencies\\":{\\"react\\":\\"^18.2.0\\",\\"react-dom\\":\\"^18.2.0\\",\\"react-router-dom\\":\\"^6.20.0\\",\\"react-scripts\\":\\"5.0.1\\",\\"lucide-react\\":\\"latest\\"}}",
  "/public/index.html": "<!DOCTYPE html>\\n<html lang=\\"en\\">\\n<head>\\n  <meta charset=\\"utf-8\\" />\\n  <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />\\n  <title>Landing Page</title>\\n  <script src=\\"https://cdn.tailwindcss.com\\"></script>\\n</head>\\n<body>\\n  <div id=\\"root\\"></div>\\n</body>\\n</html>",
  "/index.js": "import React from \\"react\\";\\nimport { createRoot } from \\"react-dom/client\\";\\nimport { BrowserRouter } from \\"react-router-dom\\";\\nimport \\"./styles.css\\";\\nimport App from \\"./App\\";\\n\\nconst root = createRoot(document.getElementById(\\"root\\"));\\nroot.render(\\n  <BrowserRouter>\\n    <App />\\n  </BrowserRouter>\\n);",
  "/styles.css": "* { margin: 0; padding: 0; box-sizing: border-box; }\\nbody { font-family: system-ui, -apple-system, sans-serif; }\\nhtml { scroll-behavior: smooth; }",
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

    if (!currentCode) {
      userPrompt = `Create a complete, multi-file landing page with the following details:
${businessContext}

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

User's new request: "${lastMessage.content}"

CRITICAL INSTRUCTIONS FOR MODIFICATIONS:
1. ANALYZE the user's request carefully to determine which files need changes
2. If the request is SMALL/SPECIFIC (e.g., "change button color", "update hero text"):
   - Return ONLY the files that need to be modified
   - DO NOT rewrite unchanged files
   - Example: If changing hero button → return ONLY /components/Hero.js

3. If the request is MAJOR (e.g., "complete redesign", "add dark mode everywhere"):
   - Return all files that need changes
   - You may need to modify multiple files

4. ALWAYS preserve the exact structure and functionality of unchanged code
5. Use the existing code as reference - maintain consistency

RESPONSE FORMAT:
Return ONLY a JSON object with the files that NEED TO BE CHANGED.
The unchanged files will be automatically preserved.`;
    }

    const fullPrompt = `${systemPrompt}

${userPrompt}`;

    const result = await gemini.generateAIResponse(fullPrompt);

    if (result && !result.includes("Error")) {
      try {
        let cleanedResult = result.trim();

        // Remove markdown
        cleanedResult = cleanedResult.replace(/^```json\n?/gm, '');
        cleanedResult = cleanedResult.replace(/^```\n?/gm, '');
        cleanedResult = cleanedResult.replace(/\n?```$/gm, '');
        cleanedResult = cleanedResult.trim();

        //  Replace literal control characters with escaped versions
        const lines = cleanedResult.split('\n');
        const fixedLines = lines.map(line => {
          // Fix lines within string values  
          if (line.includes('":')) {
            return line.replace(/(?<!\\)[\n\r\t]/g, (match) => {
              if (match === '\n') return '\\n';
              if (match === '\r') return '\\r';
              if (match === '\t') return '\\t';
              return match;
            });
          }
          return line;
        });

        cleanedResult = fixedLines.join('\n');

        const generatedFiles = JSON.parse(cleanedResult);

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
