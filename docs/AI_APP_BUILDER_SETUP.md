# AI App Builder - Setup Guide

This guide explains how to set up and use the AI App Builder feature in your ai-saas-business project.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

### 3. Minimum Required Configuration

You need **at least one AI provider** and **one sandbox provider**:

```env
# AI Provider (choose at least one)
GEMINI_API_KEY=your_gemini_api_key

# Sandbox Provider
SANDBOX_PROVIDER=vercel
VERCEL_OIDC_TOKEN=auto_generated
```

### 4. Start Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000/generation` to use the AI App Builder.

---

## 🔧 Environment Configuration

### AI Providers

You need at least one AI provider. We recommend **Gemini** for best performance-to-cost ratio.

| Provider                    | Environment Variable | Get API Key                                                |
| --------------------------- | -------------------- | ---------------------------------------------------------- |
| Google Gemini (Recommended) | `GEMINI_API_KEY`     | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| Anthropic Claude            | `ANTHROPIC_API_KEY`  | [Anthropic Console](https://console.anthropic.com)         |
| OpenAI GPT                  | `OPENAI_API_KEY`     | [OpenAI Platform](https://platform.openai.com)             |
| Groq (Fast inference)       | `GROQ_API_KEY`       | [Groq Console](https://console.groq.com)                   |

### Sandbox Providers

Choose ONE sandbox provider for running generated React apps:

#### Option 1: Vercel Sandbox (Recommended)

**Method A: OIDC Token (Easiest for development)**

```bash
# In your project directory:
vercel link
vercel env pull
# This adds VERCEL_OIDC_TOKEN to your .env automatically
```

**Method B: Personal Access Token (For production/CI)**

```env
VERCEL_TEAM_ID=team_xxxxxxxxx
VERCEL_PROJECT_ID=prj_xxxxxxxxx
VERCEL_TOKEN=vercel_xxxxxxxxxxxx
```

#### Option 2: E2B Sandbox

```env
SANDBOX_PROVIDER=e2b
E2B_API_KEY=your_e2b_api_key
```

Get your E2B API key at: [e2b.dev](https://e2b.dev)

### Firecrawl (For Website Cloning)

To enable website scraping and cloning features:

```env
FIRECRAWL_API_KEY=your_firecrawl_api_key
```

Get your API key at: [firecrawl.dev](https://firecrawl.dev)

---

## 📁 Project Structure

```
ai-saas-business/
├── app/
│   ├── api/
│   │   ├── create-ai-sandbox-v2/   # Sandbox creation
│   │   ├── generate-ai-code-stream/ # AI code generation
│   │   ├── apply-ai-code-stream/   # Apply code to sandbox
│   │   ├── scrape-url-enhanced/    # Website scraping
│   │   ├── search/                 # Firecrawl search
│   │   ├── install-packages/       # NPM package installation
│   │   ├── sandbox-status/         # Sandbox health check
│   │   ├── get-sandbox-files/      # Get sandbox files
│   │   ├── restart-vite/           # Restart Vite server
│   │   ├── kill-sandbox/           # Terminate sandbox
│   │   └── conversation-state/     # Chat context management
│   └── generation/
│       ├── page.tsx               # Main AI Builder interface
│       └── layout.tsx             # Page metadata
│
├── lib/
│   ├── ai/
│   │   ├── providers.ts           # AI provider configuration
│   │   └── prompts.ts             # AI prompt templates
│   ├── sandbox/
│   │   ├── factory.ts             # Sandbox provider factory
│   │   ├── sandbox-manager.ts     # Sandbox instance management
│   │   └── providers/
│   │       ├── vercel-provider.ts # Vercel sandbox implementation
│   │       └── e2b-provider.ts    # E2B sandbox implementation
│   └── file-parser.ts             # Code block parsing utilities
│
├── types/
│   └── sandbox.ts                 # TypeScript type definitions
│
├── config/
│   └── app.config.ts              # Application configuration
│
└── components/
    └── ai-builder-section.tsx     # Homepage AI Builder widget
```

---

## 🎯 Features

### 1. Website Cloning

Enter any URL to clone it as a React + Tailwind CSS application:

- Automatic website scraping
- Brand style extraction
- Component-based recreation

### 2. Natural Language Generation

Describe what you want to build in plain English:

- "Create a landing page for a SaaS product"
- "Build a dashboard with charts and tables"
- "Make a portfolio website with dark theme"

### 3. Live Preview

- Real-time preview in embedded iframe
- Hot Module Replacement (HMR) for instant updates
- External link to view full-page

### 4. Multi-Model Support

Choose from multiple AI models:

- Gemini 2.0 Flash (Fast, cost-effective)
- GPT-4o (Versatile)
- Claude 3.5 Sonnet (Complex reasoning)
- Llama 3.3 70B (Open source)

---

## 🔌 API Endpoints

| Endpoint                       | Method | Description                       |
| ------------------------------ | ------ | --------------------------------- |
| `/api/create-ai-sandbox-v2`    | POST   | Create new sandbox environment    |
| `/api/generate-ai-code-stream` | POST   | Stream AI code generation         |
| `/api/apply-ai-code-stream`    | POST   | Apply code to sandbox (streaming) |
| `/api/scrape-url-enhanced`     | POST   | Scrape website content            |
| `/api/search`                  | POST   | Search for websites via Firecrawl |
| `/api/install-packages`        | POST   | Install NPM packages              |
| `/api/sandbox-status`          | GET    | Check sandbox health              |
| `/api/get-sandbox-files`       | GET    | Retrieve sandbox files            |
| `/api/restart-vite`            | POST   | Restart Vite dev server           |
| `/api/kill-sandbox`            | POST   | Terminate all sandboxes           |

---

## 🛠️ Troubleshooting

### Sandbox Not Creating

1. Check your sandbox provider configuration:

   ```bash
   # For Vercel:
   vercel link
   vercel env pull
   ```

2. Verify API keys are set correctly in `.env`

3. Check console logs for detailed error messages

### AI Generation Failing

1. Verify at least one AI provider API key is set
2. Check provider quotas/limits
3. Try a different model

### Website Cloning Not Working

1. Ensure `FIRECRAWL_API_KEY` is set
2. Some sites may block scraping - try a different URL
3. Check if the URL is accessible

### Preview Not Loading

1. Click the refresh button
2. Check if sandbox URL is valid
3. Try opening the URL directly in a new tab

---

## 📝 Example Usage

### Clone a Website

1. Navigate to `/generation`
2. Enter a URL: `https://example.com`
3. Wait for scraping and generation
4. View live preview

### Build from Description

1. Navigate to `/generation`
2. Enter description: "Create a modern dashboard with a sidebar, header, and analytics cards"
3. Watch the AI generate code
4. Preview and iterate

### Iterate on Design

After initial generation:

1. Type: "Add a dark mode toggle"
2. Type: "Make the header sticky"
3. Type: "Add more padding to the cards"

---

## 🔐 Security Notes

- Never commit `.env` to version control
- API keys are server-side only
- Sandboxes are isolated environments
- Auto-cleanup removes old sandboxes

---

## 📚 Resources

- [Vercel Sandbox Docs](https://vercel.com/docs/concepts/functions/sandbox)
- [E2B Documentation](https://e2b.dev/docs)
- [Firecrawl API](https://docs.firecrawl.dev)
- [AI SDK Documentation](https://sdk.vercel.ai/docs)

---

## 🆘 Support

If you encounter issues:

1. Check the browser console for errors
2. Review server logs in terminal
3. Verify all environment variables are set correctly
4. Try creating a fresh sandbox

For more help, open an issue in the repository.
