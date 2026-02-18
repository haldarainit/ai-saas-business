// Scrape Website API - Enhanced web scraping with Firecrawl
import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ScrapeResult {
  success: boolean;
  content?: string;
  markdown?: string;
  screenshot?: string;
  title?: string;
  description?: string;
  url?: string;
  error?: string;
  source?: 'firecrawl' | 'fetch';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, includeScreenshot = true, formats = ['markdown', 'screenshot'] } = body;
    
    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'URL is required'
      }, { status: 400 });
    }
    
    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    console.log('[scrape-website] Scraping:', normalizedUrl);
    
    // Try Firecrawl first if API key is available
    if (process.env.FIRECRAWL_API_KEY) {
      try {
        const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
        
        const scrapeResult = await app.scrapeUrl(normalizedUrl, {
          formats: formats,
          waitFor: 3000,
          timeout: 30000
        }) as Record<string, unknown>;
        
        if (scrapeResult.success) {
          const result: ScrapeResult = {
            success: true,
            content: String(scrapeResult.markdown || scrapeResult.content || ''),
            markdown: String(scrapeResult.markdown || ''),
            screenshot: includeScreenshot ? String(scrapeResult.screenshot || '') : undefined,
            title: String(scrapeResult.title || ''),
            description: String(scrapeResult.description || ''),
            url: normalizedUrl,
            source: 'firecrawl'
          };
          
          return NextResponse.json(result);
        }
      } catch (firecrawlError) {
        console.warn('[scrape-website] Firecrawl error, falling back to fetch:', firecrawlError);
      }
    }
    
    // Fallback to basic fetch
    console.log('[scrape-website] Using basic fetch fallback');
    
    const response = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      redirect: 'follow'
    });
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch: ${response.status} ${response.statusText}`
      }, { status: response.status });
    }
    
    const html = await response.text();
    
    // Extract basic info from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    
    // Convert HTML to basic text (strip tags for now)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 50000); // Limit content length
    
    const result: ScrapeResult = {
      success: true,
      content: textContent,
      markdown: textContent,
      title: titleMatch?.[1]?.trim() || '',
      description: descMatch?.[1]?.trim() || '',
      url: normalizedUrl,
      source: 'fetch'
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[scrape-website] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scrape website'
    }, { status: 500 });
  }
}
