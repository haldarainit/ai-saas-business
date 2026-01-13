# Web Scraper Architecture & Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│              (Marketing Campaign Planner Page)                  │
│                                                                 │
│  ┌──────────────┐  ┌───────────────────────────────────────┐ │
│  │ Text Input   │  │  URL Input (Optional)                 │ │
│  │ "My Campaign │  │  • https://competitor1.com            │ │
│  │  Goal..."    │  │  • https://competitor2.com
       │ │
│  └──────────────┘  └───────────────────────────────────────┘ │
│                                                                 │
│                  [ Unlock Campaign Genius ]                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GENERATE STRATEGIES API                      │
│                  /api/generate-strategies                       │
│                                                                 │
│  1. Receive prompt + URLs                                      │
│  2. For each URL:                                              │
│     ├─► Call Scrape Website API ────────────┐                 │
│     ├─► Collect competitive intelligence     │                 │
│     └─► Build context string                 │                 │
│  3. Send to Gemini AI with full context      │                 │
│  4. Return strategies                         │                 │
└───────────────────────────────────────────────┼─────────────────┘
                                                │
                                                ▼
                              ┌─────────────────────────────────┐
                              │    SCRAPE WEBSITE API           │
                              │   /api/scrape-website           │
                              │                                 │
                              │  1. Validate URL                │
                              │  2. Fetch HTML                  │
                              │  3. Extract content             │
                              │  4. Generate AI summary         │
                              │  5. Return structured data      │
                              └─────────────────────────────────┘
```

## Data Flow Diagram

```
USER INPUT
    │
    ├─► Prompt: "Create campaign for..."
    └─► URLs: [competitor1.com, competitor2.com]
    │
    ▼
GENERATE STRATEGIES API
    │


    ├─► For each URL:
    │   │
    │   ├─► SCRAPE WEBSITE API
    │   │   │
    │   │   ├─► Fetch HTML
    │   │   │   └─► User-Agent headers
    │   │   │   └─► 10s timeout
    │   │   │
    │   │   ├─► Parse & Clean
    │   │   │   ├─► Remove <script>, <style>
    │   │   │   ├─► Extract title, meta
    │   │   │   ├─► Extract headings (H1-H3)
    │   │   │   ├─► Extract body text
    │   │   │   └─► Count links, images
    │   │   │
    │   │   ├─► GEMINI AI (Summary)
    │   │   │   └─► Generate marketing intelligence
    │   │   │
    │   │   └─► Return structured data
    │   │
    │   └─► Build context string
    │
    ├─► Combine: Prompt + All URL contexts
    │
    ├─► GEMINI AI (Strategies)
    │   └─► Generate 4-6 campaign strategies
    │
    └─► Format & Return
        │
        └─► Array of strategies with:
            ├─► title
            ├─► description
            ├─► whyItStandsOut
            ├─► tags
            ├─► icon
            └─► gradient
```

## Request/Response Flow

### 1. User Submits Form

```javascript
// Frontend sends:
{
  "prompt": "Create marketing campaign for SaaS tool",
  "urls": [
    "https://competitor1.com",
    "https://competitor2.com"
  ]
}
```

### 2. Strategy API Processes URLs

```javascript
// For each URL, internal call to scraper:
POST /api/scrape-website
{
  "url": "https://competitor1.com"
}

// Scraper returns:
{
  "success": true,
  "data": {
    "url": "https://competitor1.com",
    "title": "Competitor - Best SaaS Tool",
    "metaDescription": "...",
    "headings": ["H1: Transform Your Workflow", ...],
    "summary": "AI-generated intelligence:
      1. Business Overview: Leading SaaS platform...
      2. Target Audience: Small to medium businesses...
      3. Value Proposition: Increase productivity by 40%...
      4. Marketing Approach: Content-driven SEO...
      5. Competitive Insights: Strong focus on user testimonials..."
  }
}
```

### 3. Build Enhanced Prompt

```javascript
const enhancedPrompt = `
You are a world-class marketing strategist AI.

User's Goal/Challenge:
${userPrompt}

--- COMPETITIVE INTELLIGENCE FROM SCRAPED WEBSITES ---

📊 WEBSITE ANALYSIS: https://competitor1.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: Competitor - Best SaaS Tool
Description: Leading productivity platform...

Key Headings:
H1: Transform Your Workflow
H2: Features That Matter
H2: Trusted by 10,000+ Teams

AI-Generated Marketing Intelligence:
1. Business Overview: ...
2. Target Audience: ...
3. Value Proposition: ...
4. Marketing Approach: ...
5. Competitive Insights: ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Repeat for each URL]

**CRITICAL INSTRUCTION**: Use the detailed competitive intelligence
above to inform your strategies...

Generate 4-6 diverse marketing campaign strategies...
`;
```

### 4. Gemini Generates Strategies

```javascript
// AI returns:
[
  {
    "title": "Social Media Engagement Blitz",
    "description": "Multi-platform campaign targeting...",
    "whyItStandsOut": "Leverages social proof like competitor1...",
    "tags": ["Social Media", "Community Building", ...],
    "channelType": "social"
  },
  // ... 3-5 more strategies
]
```

### 5. API Enhances & Returns

```javascript
// Add IDs, icons, gradients:
{
  "success": true,
  "strategies": [
    {
      "id": 1,
      "title": "Social Media Engagement Blitz",
      "description": "...",
      "whyItStandsOut": "...",
      "tags": [...],
      "icon": "Share2",
      "gradient": "from-blue-500 to-cyan-500",
      "channelType": "social"
    },
    // ... more strategies
  ]
}
```

### 6. Frontend Displays Results

```javascript
// UI shows:
- Strategy cards with icons
- Ranked by effectiveness
- "Review" and "Generate Plan" buttons
- Actionable insights
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│                                                             │
│  ┌────────────────┐         ┌─────────────────┐           │
│  │  CampaignPlan  │◄────────│  State Manage   │           │
│  │  Form          │         │  (useState)     │           │
│  └────────────────┘         └─────────────────┘           │
│         │                            │                      │
│         │ onSubmit                   │ setStage("loading") │
│         ▼                            ▼                      │
│  ┌────────────────────────────────────────────┐           │
│  │         fetch("/api/generate-strategies")   │           │
│  └────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Next.js API)                    │
│                                                             │
│  ┌──────────────────────────────────────────────┐         │
│  │  /api/generate-strategies/route.js          │         │
│  │                                               │         │
│  │  • Validate input                            │         │
│  │  • Loop through URLs ────────┐               │         │
│  │  • Build context string      │               │         │
│  │  • Call Gemini AI            │               │         │
│  │  • Format response            │               │         │
│  └──────────────────────────────┼───────────────┘         │
│                                  │                          │
│                                  ▼                          │
│  ┌──────────────────────────────────────────────┐         │
│  │  /api/scrape-website/route.js               │         │
│  │                                               │         │
│  │  • Validate URL                              │         │
│  │  • Fetch HTML (10s timeout)                  │         │
│  │  • Extract content                           │         │
│  │  • Call Gemini for summary                   │         │
│  │  • Return structured data                    │         │
│  └──────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                        │
│                                                             │
│  ┌──────────────────┐         ┌───────────────────┐       │
│  │  Target Website  │         │   Gemini AI       │       │
│  │  (Competitor)    │         │   (Google)        │       │
│  │                  │         │                   │       │
│  │  Returns HTML    │         │  Returns Summary  │       │
│  └──────────────────┘         │  & Strategies     │       │
│                                └───────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────┐
│                     ERROR SCENARIOS                     │
└─────────────────────────────────────────────────────────┘

URL Validation Failed
    ├─► Return 400 error
    └─► Message: "Invalid URL format"

Fetch Timeout (>10s)
    ├─► Catch timeout error
    └─► Continue with other URLs
    └─► Include error note in context

Scraper API Failed
    ├─► Log error
    └─► Continue with other URLs
    └─► Strategies still generate

AI Summary Failed
    ├─► Return raw scraped data
    └─► Still usable for strategies

Strategy Generation Failed
    ├─► Return fallback strategies
    └─► Use hardcoded examples

Network Error
    ├─► Return 500 error
    └─► Detailed error message
```

## Performance Optimization

```
CURRENT PERFORMANCE:
  Sequential Processing
    URL 1: ~8s (fetch + parse + AI)
    URL 2: ~8s
    URL 3: ~8s
    Total: ~24s for 3 URLs

    ↓

POTENTIAL OPTIMIZATION:
  Parallel Processing
    URL 1, 2, 3: ~8s (concurrent)
    Total: ~8s for 3 URLs

  + Caching Layer
    Check cache first
    If hit: <1s
    If miss: 8s + cache

  + Background Jobs
    Queue scraping tasks
    Return immediately
    Notify when ready
```

## Security & Rate Limiting

```
┌─────────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                       │
└─────────────────────────────────────────────────────────┘

Input Validation
    ├─► URL format check
    ├─► Protocol whitelist (http/https)
    └─► Malicious URL detection

Request Controls
    ├─► 10-second timeout
    ├─► Content size limit (3000 chars)
    └─► Proper User-Agent header

Rate Limiting (Future)
    ├─► Per-IP limits
    ├─► Per-user limits
    └─► Global endpoint limits

Bot Protection
    ├─► Some sites will block
    └─► Graceful error handling
```

## State Management

```
FRONTEND STATE:
    ├─► stage: "input" | "loading" | "results"
    ├─► userPrompt: string
    ├─► urls: string[]
    ├─► strategies: CampaignStrategy[]
    ├─► loadingStage: 0-8
    └─► errors: string[]

LOADING STAGES:
    0. Analyzing prompt
    1. Scraping websites  ← New!
    2. Researching trends
    3. Identifying opportunities
    4. Crafting strategies
    5. Optimizing campaigns
    6. Analyzing audience
    7. Calculating ROI
    8. Finalizing strategies
```

---

This architecture ensures:
✓ Robust error handling
✓ Graceful degradation
✓ User feedback at every stage
✓ Scalable design
✓ Security-conscious
