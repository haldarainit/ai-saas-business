// Extract Brand Styles API - Extracts design tokens from a website
import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { getModel, type ModelId } from '@/lib/ai/providers';
import { appConfig } from '@/config/app.config';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ExtractBrandRequest {
  url: string;
  html?: string;
  css?: string;
  screenshot?: string;
  model?: string;
}

interface BrandStyles {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    baseFontSize: string;
  };
  spacing: {
    unit: string;
    containerMaxWidth: string;
  };
  borderRadius: string;
  shadows: string[];
}

interface ExtractBrandResponse {
  success: boolean;
  brandStyles?: BrandStyles;
  rawAnalysis?: string;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<ExtractBrandResponse>> {
  try {
    const body: ExtractBrandRequest = await req.json();
    const { url, html, css, model = appConfig.ai.defaultModel } = body;

    if (!url && !html) {
      return NextResponse.json({
        success: false,
        error: 'URL or HTML content is required'
      }, { status: 400 });
    }

    // Fetch website content if only URL provided
    let content = html || '';
    let styles = css || '';

    if (!content && url) {
      try {
        const response = await fetch(url);
        content = await response.text();
        
        // Extract inline styles
        const styleMatches = content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi);
        for (const match of styleMatches) {
          styles += match[1] + '\n';
        }
      } catch {
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch website content'
        }, { status: 500 });
      }
    }

    // Use AI to extract brand styles
    const prompt = `Analyze this website and extract the brand design system.

Website URL: ${url}

HTML structure (first 10000 chars):
${content.slice(0, 10000)}

CSS styles (first 5000 chars):
${styles.slice(0, 5000)}

Extract the following design tokens and return them as JSON:

{
  "colors": {
    "primary": "#hex - main brand color",
    "secondary": "#hex - secondary brand color",
    "accent": "#hex - accent/highlight color",
    "background": "#hex - main background color",
    "text": "#hex - main text color",
    "muted": "#hex - muted/subtle text color"
  },
  "typography": {
    "headingFont": "font family name for headings",
    "bodyFont": "font family name for body text",
    "baseFontSize": "base font size like 16px"
  },
  "spacing": {
    "unit": "base spacing unit like 4px or 8px",
    "containerMaxWidth": "max container width like 1200px"
  },
  "borderRadius": "default border radius like 8px",
  "shadows": ["array of box-shadow values used"]
}

Analyze the actual CSS and HTML to extract real values, not placeholders. If a value cannot be determined, make a reasonable inference based on the overall design.

Return ONLY the JSON object, no markdown formatting.`;

    const modelInstance = getModel(model as ModelId);
    
    const { text } = await streamText({
      model: modelInstance,
      prompt,
      maxTokens: 2000,
      temperature: 0.3,
    });

    // Parse AI response
    const responseText = await text;
    
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanJson = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const brandStyles = JSON.parse(cleanJson) as BrandStyles;
      
      return NextResponse.json({
        success: true,
        brandStyles,
        rawAnalysis: responseText
      });
    } catch {
      // Return raw analysis if JSON parsing fails
      return NextResponse.json({
        success: true,
        rawAnalysis: responseText,
        error: 'Could not parse structured brand styles'
      });
    }

  } catch (error) {
    console.error('Extract brand error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract brand styles'
    }, { status: 500 });
  }
}
