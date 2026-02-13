// Search API - Search for websites using Firecrawl or fallback
import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface SearchResult {
  url: string;
  title: string;
  description: string;
  screenshot: string | null;
  markdown: string;
}

interface SearchRequest {
  query: string;
  limit?: number;
}

interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<SearchResponse>> {
  try {
    const body: SearchRequest = await req.json();
    const { query, limit = 5 } = body;

    if (!query || !query.trim()) {
      return NextResponse.json({
        success: false,
        results: [],
        error: 'Search query is required'
      }, { status: 400 });
    }

    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    
    if (firecrawlApiKey) {
      // Use Firecrawl search
      const app = new FirecrawlApp({ apiKey: firecrawlApiKey });
      
      const searchResult = await app.search(query, {
        limit,
        scrapeOptions: {
          formats: ['markdown', 'screenshot']
        }
      }) as { success?: boolean; data?: Array<{ url: string; title?: string; description?: string; screenshot?: string; markdown?: string }> };

      if (searchResult.success && searchResult.data) {
        const results: SearchResult[] = searchResult.data.map((item) => ({
          url: item.url,
          title: item.title || 'Untitled',
          description: item.description || '',
          screenshot: item.screenshot || null,
          markdown: item.markdown || ''
        }));

        return NextResponse.json({
          success: true,
          results
        });
      }
    }

    // Fallback: Use DuckDuckGo-like search simulation
    // In production, you'd use a proper search API
    const results = await fallbackSearch(query, limit);
    
    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Search failed'
    }, { status: 500 });
  }
}

// Fallback search using basic web fetch
async function fallbackSearch(query: string, limit: number): Promise<SearchResult[]> {
  // This is a placeholder - in production, use a proper search API
  // like Google Custom Search, Bing Search, or SerpAPI
  
  console.log(`Fallback search for: ${query} (limit: ${limit})`);
  
  // Return empty results as we don't have a fallback search API configured
  return [];
}
