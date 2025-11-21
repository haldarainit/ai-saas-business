# Web Scraper Feature - Campaign Planner AI

## Overview

The Marketing Campaign Planner AI now includes an intelligent web scraping feature that analyzes competitor landing pages and provides AI-powered competitive intelligence to enhance your campaign strategies.

## How It Works

### 1. User Input

When creating a marketing campaign, you can provide URLs of competitor websites or relevant landing pages.

### 2. Intelligent Scraping

The system:

- Fetches the landing page HTML
- Extracts key elements: title, meta description, headings, content, links, images
- Cleans and structures the data
- Generates an AI-powered summary using Gemini

### 3. AI Analysis

The scraped content is analyzed for:

- **Business/Product Overview**: What the company does
- **Target Audience**: Who they're targeting
- **Value Proposition**: Key selling points
- **Marketing Approach**: Strategies they're using
- **Competitive Insights**: What makes them unique

### 4. Strategy Generation

The AI uses this competitive intelligence to:

- Generate more informed campaign strategies
- Identify market opportunities
- Create differentiated approaches
- Provide data-driven recommendations

## API Endpoints

### POST `/api/scrape-website`

Scrapes and analyzes a single landing page.

**Request Body:**

```json
{
  "url": "https://example.com"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "title": "Company Name - Landing Page",
    "metaDescription": "...",
    "headings": ["H1: Main Heading", "H2: Subheading", ...],
    "textPreview": "First 500 characters...",
    "linkCount": 45,
    "imageCount": 12,
    "summary": "AI-generated marketing intelligence...",
    "scrapedAt": "2025-11-22T..."
  }
}
```

### POST `/api/generate-strategies`

Generates campaign strategies with optional URL scraping.

**Request Body:**

```json
{
  "prompt": "I want to create a campaign that...",
  "urls": ["https://competitor1.com", "https://competitor2.com"]
}
```

**Response:**

```json
{
  "success": true,
  "strategies": [
    {
      "id": 1,
      "title": "Strategy Name",
      "description": "...",
      "whyItStandsOut": "...",
      "tags": ["..."],
      "icon": "Share2",
      "gradient": "from-blue-500 to-cyan-500",
      "channelType": "social"
    }
  ]
}
```

## Features

### Content Extraction

- **Title & Meta**: SEO and page metadata
- **Headings**: H1, H2, H3 structure analysis
- **Text Content**: Main body content (up to 3000 chars)
- **Links**: Internal and external link analysis
- **Images**: Visual content inventory

### AI-Powered Summary

Each scraped page receives an AI-generated summary covering:

1. Business overview (2-3 sentences)
2. Target audience identification
3. Value proposition analysis
4. Marketing strategy assessment
5. Competitive differentiation insights

### Error Handling

- URL validation before scraping
- 10-second timeout for slow sites
- Graceful fallbacks if AI summary fails
- Detailed error messages for debugging

## Usage in Campaign Planner

### Step 1: Enter Your Campaign Goal

```
I want to create a marketing campaign to promote a new SaaS product for small businesses.
```

### Step 2: Add Competitor URLs

Add 1-5 competitor or reference URLs:

- `https://competitor1.com`
- `https://competitor2.com`
- `https://industry-leader.com`

### Step 3: Generate Strategies

Click "Unlock Campaign Genius" and the AI will:

1. Scrape each URL (shown in loading stage)
2. Analyze competitor strategies
3. Generate 4-6 unique strategies
4. Incorporate competitive insights

### Step 4: Review Results

Each strategy will be informed by:

- Your original prompt
- Scraped competitive intelligence
- Market trends and opportunities
- AI-powered differentiation

## Technical Details

### Web Scraping Implementation

```javascript
// Uses native fetch with proper headers
fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0...",
    Accept: "text/html...",
  },
  signal: AbortSignal.timeout(10000),
});
```

### HTML Cleaning

- Removes `<script>`, `<style>`, `<noscript>` tags
- Strips HTML tags while preserving content
- Normalizes whitespace
- Decodes HTML entities

### Content Limits

- Text content: 3000 characters
- Headings: First 20
- Links: First 50
- Images: First 30

## Environment Variables

Add to your `.env.local`:

```env
# Application Base URL (for internal API calls)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# For production (Vercel, etc.)
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## Best Practices

### For Users

1. **Use Direct Competitor URLs**: Landing pages of direct competitors
2. **Industry Leaders**: Successful companies in your space
3. **Different Approaches**: Mix of B2B, B2C, different marketing styles
4. **Limit URLs**: 2-5 URLs for best results (too many can slow down generation)

### For Developers

1. **Rate Limiting**: Consider adding rate limits for production
2. **Caching**: Cache scraped results for frequently accessed URLs
3. **Error Monitoring**: Log scraping failures for debugging
4. **Timeout Handling**: Adjust timeout based on your needs

## Limitations

### Current Limitations

- Only scrapes the landing page (no navigation to subpages)
- Text-only content extraction (no complex JS rendering)
- Limited to publicly accessible pages
- 10-second timeout per URL

### Not Supported

- Sites requiring authentication
- JavaScript-heavy SPAs (limited support)
- Pages with bot protection (Cloudflare, etc.)
- Rate-limited sites

## Future Enhancements

### Potential Improvements

- [ ] Playwright/Puppeteer for JavaScript rendering
- [ ] Multi-page scraping (sitemap analysis)
- [ ] Visual screenshot capture
- [ ] Social media profile scraping
- [ ] SEO metrics extraction
- [ ] Cache layer for repeated URLs
- [ ] Batch scraping optimization
- [ ] PDF export of competitive analysis

## Troubleshooting

### URL Not Scraping

1. Verify URL is accessible in browser
2. Check for bot protection (403/429 errors)
3. Ensure site doesn't require authentication
4. Try with www/non-www variants

### Incomplete Data

1. Some sites may have minimal HTML content
2. JavaScript-rendered content might not be captured
3. Try adding more URLs for better context

### Slow Performance

1. Reduce number of URLs
2. Check network connectivity
3. Some sites may be naturally slow
4. Timeout is set to 10 seconds per URL

## Security Considerations

- Always validate URLs before scraping
- Respect robots.txt (future enhancement)
- Don't scrape sensitive/authenticated content
- Rate limit to avoid overwhelming servers
- Use appropriate User-Agent headers

## Examples

### Example 1: SaaS Marketing

```javascript
{
  "prompt": "Launch a SaaS product for project management",
  "urls": [
    "https://asana.com",
    "https://trello.com",
    "https://monday.com"
  ]
}
```

### Example 2: E-commerce Campaign

```javascript
{
  "prompt": "Create a holiday sales campaign for online fashion store",
  "urls": [
    "https://competitor-fashion-store.com",
    "https://successful-ecom-brand.com"
  ]
}
```

### Example 3: Local Business

```javascript
{
  "prompt": "Increase foot traffic to local restaurant",
  "urls": [
    "https://popular-restaurant.com",
    "https://restaurant-chain.com"
  ]
}
```

## Support

For issues or questions:

1. Check console logs for detailed error messages
2. Verify environment variables are set
3. Test API endpoints independently
4. Review this guide for best practices

---

**Last Updated**: November 22, 2025
**Version**: 1.0.0
