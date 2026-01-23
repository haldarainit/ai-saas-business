import { NextRequest } from 'next/server';

/**
 * Web Scraper API for Marketing Campaign Planner
 * Scrapes landing pages and provides summarized content for AI analysis
 */

interface ExtractedData {
    title: string;
    metaDescription: string;
    headings: string[];
    textContent: string;
    links: string[];
    images: string[];
}

export async function POST(request: NextRequest): Promise<Response> {
    try {
        const body = await request.json();
        const { url } = body as { url?: string };

        if (!url || !url.trim()) {
            return Response.json(
                {
                    success: false,
                    error: "URL is required",
                },
                { status: 400 }
            );
        }

        // Validate URL format
        try {
            new URL(url);
        } catch (e) {
            return Response.json(
                {
                    success: false,
                    error: "Invalid URL format",
                },
                { status: 400 }
            );
        }

        console.log("Scraping website:", url);

        // Fetch the website content
        let html: string;
        try {
            const response = await fetch(url, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                    Accept:
                        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Accept-Encoding": "gzip, deflate, br",
                    Connection: "keep-alive",
                    "Upgrade-Insecure-Requests": "1",
                },
                signal: AbortSignal.timeout(10000), // 10 second timeout
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            html = await response.text();
        } catch (fetchError) {
            const err = fetchError as Error;
            console.error("Fetch error:", err);
            return Response.json(
                {
                    success: false,
                    error: "Failed to fetch website content",
                    details: err.message,
                },
                { status: 500 }
            );
        }

        // Extract and clean text content from HTML
        const extractedData = extractLandingPageContent(html, url);

        // Generate AI summary of the scraped content
        const geminiModule = await import("../../../utils/gemini");
        const gemini = (geminiModule.default || geminiModule) as { generateAIResponse: (prompt: string) => Promise<string> };

        const summaryPrompt = `Analyze this landing page content and provide a concise business/product intelligence summary:

URL: ${url}

Title: ${extractedData.title}
Meta Description: ${extractedData.metaDescription}

Main Headings:
${extractedData.headings.join("\n")}

Key Content:
${extractedData.textContent}

Links: ${extractedData.links.length} internal/external links found

Please provide a structured summary for marketing strategy development:

1. **Business/Product Overview** (2-3 sentences): What does this company/product do? What problem does it solve?

2. **Target Audience** (1-2 sentences): Who is this product/service designed for? What customer segments do they target?

3. **Value Proposition** (2-4 bullet points): What are the key benefits and unique selling points highlighted on this page?

4. **Current Marketing Approach** (1-2 sentences): What marketing strategies or messaging patterns are visible on this page?

5. **Key Features/Services** (2-4 bullet points): What are the main offerings or features presented?

6. **Brand Positioning** (1-2 sentences): How does this business position itself in the market? What tone/style do they use?

Keep the summary concise but packed with actionable insights for creating marketing campaigns for THIS specific business.`;

        try {
            const aiSummary = await gemini.generateAIResponse(summaryPrompt);

            return Response.json({
                success: true,
                data: {
                    url: url,
                    title: extractedData.title,
                    metaDescription: extractedData.metaDescription,
                    headings: extractedData.headings,
                    textPreview: extractedData.textContent.substring(0, 500) + "...",
                    linkCount: extractedData.links.length,
                    imageCount: extractedData.images.length,
                    summary: aiSummary,
                    scrapedAt: new Date().toISOString(),
                },
            });
        } catch (aiError) {
            console.error("AI Summary error:", aiError);

            // Return scraped data even if AI summary fails
            return Response.json({
                success: true,
                data: {
                    url: url,
                    title: extractedData.title,
                    metaDescription: extractedData.metaDescription,
                    headings: extractedData.headings,
                    textPreview: extractedData.textContent.substring(0, 500) + "...",
                    linkCount: extractedData.links.length,
                    imageCount: extractedData.images.length,
                    summary:
                        "AI summary unavailable. Raw content extracted successfully.",
                    rawContent: extractedData.textContent.substring(0, 2000),
                    scrapedAt: new Date().toISOString(),
                },
            });
        }
    } catch (error) {
        const err = error as Error;
        console.error("Error in scrape-website API:", err);
        return Response.json(
            {
                success: false,
                error: "Failed to scrape website",
                details: err.message,
            },
            { status: 500 }
        );
    }
}

/**
 * Extract relevant content from HTML
 * Focus on landing page elements: headings, descriptions, CTAs, etc.
 */
function extractLandingPageContent(html: string, url: string): ExtractedData {
    // Remove script and style tags
    let cleanHtml = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");

    // Extract title
    const titleMatch = cleanHtml.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch
        ? titleMatch[1].replace(/\s+/g, " ").trim()
        : "No title found";

    // Extract meta description
    const metaDescMatch = cleanHtml.match(
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i
    );
    const metaDescription = metaDescMatch
        ? metaDescMatch[1]
        : "No meta description found";

    // Extract headings (h1, h2, h3)
    const headings: string[] = [];
    const h1Matches = cleanHtml.matchAll(/<h1[^>]*>(.*?)<\/h1>/gi);
    const h2Matches = cleanHtml.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi);
    const h3Matches = cleanHtml.matchAll(/<h3[^>]*>(.*?)<\/h3>/gi);

    for (const match of h1Matches) {
        const text = match[1]
            .replace(/<[^>]+>/g, "")
            .replace(/\s+/g, " ")
            .trim();
        if (text && text.length > 3) headings.push(`H1: ${text}`);
    }
    for (const match of h2Matches) {
        const text = match[1]
            .replace(/<[^>]+>/g, "")
            .replace(/\s+/g, " ")
            .trim();
        if (text && text.length > 3) headings.push(`H2: ${text}`);
    }
    for (const match of h3Matches) {
        const text = match[1]
            .replace(/<[^>]+>/g, "")
            .replace(/\s+/g, " ")
            .trim();
        if (text && text.length > 3) headings.push(`H3: ${text}`);
    }

    // Extract text content from paragraphs and divs
    let textContent = cleanHtml
        .replace(/<[^>]+>/g, " ") // Remove all HTML tags
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim();

    // Limit text content to reasonable size
    textContent = textContent.substring(0, 3000);

    // Extract links
    const links: string[] = [];
    const linkMatches = cleanHtml.matchAll(
        /<a[^>]*href=["']([^"']*)["'][^>]*>/gi
    );
    for (const match of linkMatches) {
        const href = match[1];
        if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
            links.push(href);
        }
    }

    // Extract images
    const images: string[] = [];
    const imgMatches = cleanHtml.matchAll(
        /<img[^>]*src=["']([^"']*)["'][^>]*>/gi
    );
    for (const match of imgMatches) {
        const src = match[1];
        if (src) {
            images.push(src);
        }
    }

    return {
        title,
        metaDescription,
        headings: headings.slice(0, 20), // Limit to first 20 headings
        textContent,
        links: links.slice(0, 50), // Limit to first 50 links
        images: images.slice(0, 30), // Limit to first 30 images
    };
}
