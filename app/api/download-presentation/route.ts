import { NextResponse } from 'next/server';
import pptxgen from 'pptxgenjs';

interface FeatureCard {
    icon: string;
    title: string;
    description: string;
}

interface ComparisonColumn {
    heading: string;
    points: string[];
}

interface Metric {
    value: string;
    label: string;
    description: string;
}

interface Slide {
    title: string;
    layoutType?: 'title' | 'comparison' | 'features' | 'imageRight' | 'imageLeft' | 'metrics' | 'iconList' | 'textOnly' | 'closing';
    content?: string[];
    subtitle?: string;
    comparison?: {
        left: ComparisonColumn;
        right: ComparisonColumn;
    };
    features?: FeatureCard[];
    metrics?: Metric[];
    hasImage?: boolean;
    imageKeyword?: string;
    imageUrl?: string;
}

interface Theme {
    id: string;
    name: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
    };
}

interface PresentationData {
    title: string;
    slides: Slide[];
    theme?: Theme;
}

// Helper function to download image and convert to base64
async function fetchImageAsBase64(url: string): Promise<string | null> {
    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(15000)
        });

        if (!response.ok) {
            console.error(`Failed to fetch image: ${response.status}`);
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const contentType = response.headers.get('content-type') || 'image/png';

        return `data:${contentType};base64,${base64}`;
    } catch (error) {
        console.error('Error fetching image:', error);
        return null;
    }
}

// Helper function to clean markdown formatting
function cleanMarkdown(text: string): string {
    return text
        .replace(/\*\*([^*]+)\*\*/g, '$1')  // Bold
        .replace(/\*([^*]+)\*/g, '$1')       // Italic
        .replace(/__([^_]+)__/g, '$1')       // Bold alt
        .replace(/_([^_]+)_/g, '$1')         // Italic alt
        .replace(/~~([^~]+)~~/g, '$1')       // Strikethrough
        .replace(/`([^`]+)`/g, '$1')         // Code
        .replace(/```[\s\S]*?```/g, '')      // Code blocks
        .replace(/#+\s*/g, '')               // Headers
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Links
        .replace(/^[-*_]{3,}\s*$/gm, '')     // Horizontal rules
        .replace(/^\s*[-*+]\s+/gm, '')        // Unordered list markers
        .replace(/^\s*\d+\.\s+/gm, '')       // Ordered list markers
        .replace(/\n{3,}/g, '\n\n')          // Multiple newlines
        .trim();
}

// Helper function to create a light background color from a hex color (for tinted boxes)
// Takes a hex color and returns a very light tint version
function getLightBackground(hexColor: string): string {
    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Parse RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Blend with white (95% white, 5% original color) for very light tint
    const lightR = Math.round(r * 0.08 + 255 * 0.92);
    const lightG = Math.round(g * 0.08 + 255 * 0.92);
    const lightB = Math.round(b * 0.08 + 255 * 0.92);

    // Convert back to hex
    const toHex = (n: number) => Math.min(255, n).toString(16).padStart(2, '0');
    return `${toHex(lightR)}${toHex(lightG)}${toHex(lightB)}`;
}

// Icon to Unicode mapping for PPTX (using simple shapes as fallback)
const ICON_SYMBOLS: Record<string, string> = {
    storefront: '🏪',
    dashboard: '📊',
    analytics: '📈',
    cart: '🛒',
    payment: '💳',
    shipping: '🚚',
    design: '🎨',
    search: '🔍',
    security: '🔒',
    speed: '⚡',
    mobile: '📱',
    automation: '🤖',
    chart: '📉',
    growth: '📈',
    target: '🎯',
    check: '✓',
    star: '⭐',
    idea: '💡',
    rocket: '🚀',
    globe: '🌐',
    award: '🏆',
    clock: '⏰',
    heart: '❤️',
    key: '🔑',
    default: '●',
};

export async function POST(req: Request) {
    try {
        const body: PresentationData = await req.json();
        const { title, slides, theme } = body;

        if (!title || !slides || slides.length === 0) {
            return NextResponse.json(
                { error: 'Invalid presentation data' },
                { status: 400 }
            );
        }

        const pptx = new pptxgen();

        // Set presentation properties
        pptx.author = "BusinessAI";
        pptx.company = "BusinessAI SaaS";
        pptx.title = title;
        pptx.subject = "AI Generated Presentation";

        // Set layout to widescreen 16:9
        pptx.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 });
        pptx.layout = 'LAYOUT_16x9';

        // Theme colors - match frontend themes
        // Default fallback is now "Warm Coral" theme to match web preview
        console.log('Theme received:', JSON.stringify(theme, null, 2));

        const primaryColor = theme?.colors?.primary?.replace('#', '') || 'b64b6e'; // Warm Coral primary
        const secondaryColor = theme?.colors?.secondary?.replace('#', '') || 'd4847c'; // Warm Coral secondary
        const accentColor = theme?.colors?.accent?.replace('#', '') || 'e8a87c'; // Warm Coral accent

        console.log('Using colors:', { primaryColor, secondaryColor, accentColor });

        // Pre-fetch images for slides that need them
        console.log('Fetching images for slides...');
        const imagePromises = slides.map(async (slide) => {
            if (slide.hasImage !== false && (slide.imageUrl || slide.imageKeyword)) {
                const imageUrl = slide.imageUrl ||
                    `https://image.pollinations.ai/prompt/${encodeURIComponent(slide.imageKeyword || slide.title)}?width=800&height=600&nologo=true`;
                return await fetchImageAsBase64(imageUrl);
            }
            return null;
        });

        const images = await Promise.all(imagePromises);
        console.log(`Fetched ${images.filter(Boolean).length} images successfully`);

        // Create Slides based on layout type
        for (let i = 0; i < slides.length; i++) {
            const slideData = slides[i];
            const slide = pptx.addSlide();
            const imageBase64 = images[i];
            const layoutType = slideData.layoutType || 'imageRight';

            // Match web preview behavior: first slide is always title, last slide is always closing
            const isFirstSlide = i === 0;
            const isLastSlide = i === slides.length - 1;

            // First slide always uses title layout (matching web preview)
            if (layoutType === 'title' || isFirstSlide) {
                createTitleSlide(slide, slideData, imageBase64, primaryColor, secondaryColor, accentColor);
            }
            // Last slide always uses closing layout (matching web preview)
            else if (layoutType === 'closing' || isLastSlide) {
                createClosingSlide(slide, slideData, imageBase64, primaryColor, secondaryColor, accentColor);
            }
            // Other layout types
            else {
                switch (layoutType) {
                    case 'comparison':
                        createComparisonSlide(slide, slideData, primaryColor, secondaryColor, accentColor);
                        break;
                    case 'features':
                        createFeaturesSlide(slide, slideData, primaryColor, secondaryColor, accentColor);
                        break;
                    case 'metrics':
                        createMetricsSlide(slide, slideData, imageBase64, primaryColor, secondaryColor, accentColor);
                        break;
                    case 'iconList':
                        createIconListSlide(slide, slideData, imageBase64, primaryColor, secondaryColor, accentColor, i, slides.length, title);
                        break;
                    case 'imageLeft':
                        createImageSlide(slide, slideData, imageBase64, primaryColor, secondaryColor, accentColor, 'left', i, slides.length, title);
                        break;
                    case 'imageRight':
                    case 'textOnly':
                    default:
                        createImageSlide(slide, slideData, imageBase64, primaryColor, secondaryColor, accentColor, 'right', i, slides.length, title);
                        break;
                }
            }
        }


        // Generate the PPTX as base64
        console.log('Generating PPTX file...');
        const pptxBase64 = await pptx.write({ outputType: 'base64' }) as string;
        const buffer = Buffer.from(pptxBase64, 'base64');

        console.log(`PPTX generated successfully: ${buffer.length} bytes`);

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_')}.pptx"`,
                'Content-Length': buffer.length.toString(),
            },
        });

    } catch (error: any) {
        console.error('Error generating PPTX:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate presentation file' },
            { status: 500 }
        );
    }
}

// ========================== SLIDE LAYOUT FUNCTIONS ==========================

function createTitleSlide(
    slide: pptxgen.Slide,
    slideData: Slide,
    imageBase64: string | null,
    primaryColor: string,
    secondaryColor: string,
    accentColor: string
) {
    // Light background to match web preview (cream/light gradient feel)
    slide.background = { color: 'FEF7F0' };

    // Calculate content width based on image presence
    // Web preview: text takes ~60% width, image takes ~40%
    const hasImage = !!imageBase64;
    const contentWidth = hasImage ? 5.0 : 9;
    const contentX = 0.5;

    // Build a combined text array with title, subtitle, and content
    // This prevents overlap by letting pptxgenjs handle the layout
    const textParts: Array<{ text: string; options: any }> = [];

    // Title - large, bold, primary color
    textParts.push({
        text: cleanMarkdown(slideData.title),
        options: {
            fontSize: 32,
            bold: true,
            color: primaryColor,
            breakLine: true,
            paraSpaceAfter: 16, // Space after title
        }
    });

    // Subtitle if available
    if (slideData.subtitle) {
        textParts.push({
            text: cleanMarkdown(slideData.subtitle),
            options: {
                fontSize: 14,
                color: '475569',
                breakLine: true,
                paraSpaceBefore: 8,
                paraSpaceAfter: 8,
            }
        });
    }

    // Content items
    if (slideData.content && slideData.content.length > 0) {
        slideData.content.forEach((text, index) => {
            textParts.push({
                text: cleanMarkdown(text),
                options: {
                    fontSize: 12,
                    color: '64748b',
                    breakLine: true,
                    paraSpaceBefore: index === 0 ? 8 : 4,
                    paraSpaceAfter: 4,
                }
            });
        });
    }

    // Add all text as a single block - this prevents overlap issues
    slide.addText(textParts, {
        x: contentX,
        y: 0.6,
        w: contentWidth,
        h: 4.4, // Large height to contain all text
        fontFace: 'Arial',
        valign: 'top',
        fit: 'shrink', // Will shrink if needed
    });

    // Hero image on right - RECTANGULAR
    if (hasImage) {
        slide.addImage({
            data: imageBase64,
            x: 5.7,
            y: 0.5,
            w: 4.0,
            h: 4.5,
        });
    }

    // Footer at bottom
    slide.addText("Generated by BusinessAI", {
        x: 0.5, y: 5.2, w: 4, fontSize: 9, color: '94a3b8', fontFace: 'Arial',
    });
}

function createClosingSlide(
    slide: pptxgen.Slide,
    slideData: Slide,
    imageBase64: string | null,
    primaryColor: string,
    secondaryColor: string,
    accentColor: string
) {
    // Light background to match web preview
    slide.background = { color: 'FEF7F0' };

    // Subtle decorative shapes in corners
    slide.addShape('ellipse', {
        x: -1, y: -1, w: 2.5, h: 2.5,
        fill: { color: primaryColor, transparency: 90 },
    });
    slide.addShape('ellipse', {
        x: 8.5, y: 4, w: 2.5, h: 2.5,
        fill: { color: secondaryColor, transparency: 90 },
    });

    // Build combined text block with title and content to prevent overlap
    const textParts: Array<{ text: string; options: any }> = [];

    // Title - centered
    textParts.push({
        text: cleanMarkdown(slideData.title),
        options: {
            fontSize: 28,
            bold: true,
            color: primaryColor,
            breakLine: true,
            paraSpaceAfter: 16,
        }
    });

    // Content items
    if (slideData.content && slideData.content.length > 0) {
        slideData.content.forEach((text, index) => {
            textParts.push({
                text: cleanMarkdown(text),
                options: {
                    fontSize: 12,
                    color: '475569',
                    breakLine: true,
                    paraSpaceBefore: index === 0 ? 8 : 4,
                    paraSpaceAfter: 4,
                }
            });
        });
    }

    // Subtitle at the end
    if (slideData.subtitle) {
        textParts.push({
            text: cleanMarkdown(slideData.subtitle),
            options: {
                fontSize: 11,
                color: primaryColor,
                breakLine: true,
                paraSpaceBefore: 16,
            }
        });
    }

    // Add all text as a single centered block
    slide.addText(textParts, {
        x: 1,
        y: 1.0,
        w: 8,
        h: 4.0,
        fontFace: 'Arial',
        valign: 'middle',
        align: 'center',
        fit: 'shrink',
    });
}

function createComparisonSlide(
    slide: pptxgen.Slide,
    slideData: Slide,
    primaryColor: string,
    secondaryColor: string,
    accentColor: string
) {
    slide.background = { color: 'FFFFFF' };

    // Top accent bar
    slide.addShape('rect', {
        x: 0, y: 0, w: 10, h: 0.08,
        fill: { color: accentColor },
    });

    // Build combined text with title and optional intro
    const textParts: Array<{ text: string; options: any }> = [];

    // Title
    textParts.push({
        text: cleanMarkdown(slideData.title),
        options: {
            fontSize: 24,
            bold: true,
            color: primaryColor,
            breakLine: true,
            paraSpaceAfter: 8,
        }
    });

    // Subtitle/intro text if content exists and no comparison data
    if (slideData.content && slideData.content.length > 0 && !slideData.comparison) {
        textParts.push({
            text: cleanMarkdown(slideData.content[0]),
            options: {
                fontSize: 12,
                color: '6b7280',
                breakLine: true,
            }
        });
    }

    // Add title block
    slide.addText(textParts, {
        x: 0.5,
        y: 0.2,
        w: 9,
        h: 1.2,
        fontFace: 'Arial',
        valign: 'top',
        fit: 'shrink',
    });

    // Comparison columns
    if (slideData.comparison) {
        const startY = 1.7;
        const colWidth = 4.3;

        // Left column - Traditional/Problem (tinted with accent color)
        slide.addShape('rect', {
            x: 0.4, y: startY, w: colWidth, h: 3.2,
            fill: { color: getLightBackground(accentColor) },
        });

        slide.addText(slideData.comparison.left.heading, {
            x: 0.6, y: startY + 0.2, w: colWidth - 0.4, h: 0.5,
            fontSize: 16,
            bold: true,
            color: accentColor,
            fontFace: 'Arial',
        });

        const leftPoints = slideData.comparison.left.points.map((text) => ({
            text: '• ' + cleanMarkdown(text),
            options: {
                fontSize: 12,
                color: '374151',
                breakLine: true,
                paraSpaceBefore: 6,
                paraSpaceAfter: 6,
            },
        }));

        slide.addText(leftPoints, {
            x: 0.6, y: startY + 0.8, w: colWidth - 0.4, h: 2.2,
            fontFace: 'Arial',
            valign: 'top',
        });

        // Right column - Solution (tinted with primary color)
        slide.addShape('rect', {
            x: 5.3, y: startY, w: colWidth, h: 3.2,
            fill: { color: getLightBackground(primaryColor) },
        });

        slide.addText(slideData.comparison.right.heading, {
            x: 5.5, y: startY + 0.2, w: colWidth - 0.4, h: 0.5,
            fontSize: 16,
            bold: true,
            color: primaryColor,
            fontFace: 'Arial',
        });

        const rightPoints = slideData.comparison.right.points.map((text) => ({
            text: '• ' + cleanMarkdown(text),
            options: {
                fontSize: 12,
                color: '374151',
                breakLine: true,
                paraSpaceBefore: 6,
                paraSpaceAfter: 6,
            },
        }));

        slide.addText(rightPoints, {
            x: 5.5, y: startY + 0.8, w: colWidth - 0.4, h: 2.2,
            fontFace: 'Arial',
            valign: 'top',
        });
    } else if (slideData.content && slideData.content.length > 1) {
        // Fallback: split content into two columns
        const half = Math.ceil(slideData.content.length / 2);
        const leftContent = slideData.content.slice(0, half);
        const rightContent = slideData.content.slice(half);

        // Left column
        const leftPoints = leftContent.map((text) => ({
            text: '• ' + cleanMarkdown(text),
            options: { fontSize: 12, color: '374151', breakLine: true, paraSpaceBefore: 6, paraSpaceAfter: 6 },
        }));

        slide.addText(leftPoints, {
            x: 0.5, y: 1.8, w: 4.3, h: 3,
            fontFace: 'Arial',
            valign: 'top',
        });

        // Right column
        const rightPoints = rightContent.map((text) => ({
            text: '• ' + cleanMarkdown(text),
            options: { fontSize: 12, color: '374151', breakLine: true, paraSpaceBefore: 6, paraSpaceAfter: 6 },
        }));

        slide.addText(rightPoints, {
            x: 5.2, y: 1.8, w: 4.3, h: 3,
            fontFace: 'Arial',
            valign: 'top',
        });
    }

    // Bottom accent line
    slide.addShape('rect', {
        x: 0.5, y: 5.1, w: 9, h: 0.015,
        fill: { color: accentColor },
    });
}

function createFeaturesSlide(
    slide: pptxgen.Slide,
    slideData: Slide,
    primaryColor: string,
    secondaryColor: string,
    accentColor: string
) {
    slide.background = { color: 'FFFFFF' };

    // Top accent bar
    slide.addShape('rect', {
        x: 0, y: 0, w: 10, h: 0.08,
        fill: { color: accentColor },
    });

    // Build combined text with title and subtitle
    const textParts: Array<{ text: string; options: any }> = [];

    // Title
    textParts.push({
        text: cleanMarkdown(slideData.title),
        options: {
            fontSize: 22,
            bold: true,
            color: primaryColor,
            breakLine: true,
            paraSpaceAfter: 6,
        }
    });

    // Subtitle from first content item
    if (slideData.content && slideData.content.length > 0) {
        textParts.push({
            text: cleanMarkdown(slideData.content[0]),
            options: {
                fontSize: 12,
                color: '6b7280',
                breakLine: true,
            }
        });
    }

    // Add title block
    slide.addText(textParts, {
        x: 0.5,
        y: 0.15,
        w: 9,
        h: 1.2,
        fontFace: 'Arial',
        valign: 'top',
        fit: 'shrink',
    });

    // Feature cards
    if (slideData.features && slideData.features.length > 0) {
        const features = slideData.features.slice(0, 5); // Max 5 features
        const cardCount = features.length;
        const rows = cardCount <= 3 ? 1 : 2;
        const cardsPerRow = rows === 1 ? cardCount : Math.ceil(cardCount / 2);

        const cardWidth = (9 - (cardsPerRow - 1) * 0.25) / cardsPerRow;
        const cardHeight = rows === 1 ? 3.0 : 1.75;
        const startY = 1.5;

        // Feature card colors - derived from theme colors
        const featureColors = [
            { bg: getLightBackground(accentColor), icon: accentColor },
            { bg: getLightBackground(primaryColor), icon: primaryColor },
            { bg: getLightBackground(secondaryColor), icon: secondaryColor },
            { bg: 'ecfdf5', icon: '10b981' },      // Green (accent)
            { bg: 'fef3c7', icon: 'f59e0b' },      // Amber (accent)
        ];

        features.forEach((feature, idx) => {
            const row = Math.floor(idx / cardsPerRow);
            const col = idx % cardsPerRow;
            const x = 0.5 + col * (cardWidth + 0.25);
            const y = startY + row * (cardHeight + 0.2);
            const color = featureColors[idx % featureColors.length];

            // Card background
            slide.addShape('rect', {
                x, y, w: cardWidth, h: cardHeight,
                fill: { color: color.bg },
            });

            // Icon circle - smaller for 2 rows
            const iconSize = rows === 1 ? 0.45 : 0.35;
            const iconSymbol = ICON_SYMBOLS[feature.icon] || ICON_SYMBOLS.default;
            slide.addShape('ellipse', {
                x: x + cardWidth / 2 - iconSize / 2, y: y + 0.15, w: iconSize, h: iconSize,
                fill: { color: color.icon },
            });
            slide.addText(iconSymbol, {
                x: x + cardWidth / 2 - iconSize / 2, y: y + 0.13, w: iconSize, h: iconSize,
                fontSize: rows === 1 ? 12 : 10,
                color: 'FFFFFF',
                align: 'center',
                valign: 'middle',
            });

            // Feature title - positioned below icon
            const titleY = y + 0.15 + iconSize + 0.1;
            slide.addText(cleanMarkdown(feature.title), {
                x: x + 0.1, y: titleY, w: cardWidth - 0.2, h: 0.35,
                fontSize: rows === 1 ? 11 : 10,
                bold: true,
                color: '1f2937',
                fontFace: 'Arial',
                align: 'center',
                valign: 'top',
                fit: 'shrink',
            });

            // Feature description - fill remaining space with auto-shrink
            const descY = titleY + 0.35;
            const descHeight = cardHeight - (descY - y) - 0.1;
            slide.addText(cleanMarkdown(feature.description), {
                x: x + 0.1, y: descY, w: cardWidth - 0.2, h: descHeight,
                fontSize: rows === 1 ? 9 : 8,
                color: '6b7280',
                fontFace: 'Arial',
                align: 'center',
                valign: 'top',
                fit: 'shrink',
            });
        });
    } else if (slideData.content && slideData.content.length > 1) {
        // Fallback: create cards from content items
        const items = slideData.content.slice(1, 6);
        const cardCount = items.length;
        const cardsPerRow = Math.min(cardCount, 3);
        const cardWidth = (9 - (cardsPerRow - 1) * 0.3) / cardsPerRow;

        items.forEach((item, idx) => {
            const row = Math.floor(idx / cardsPerRow);
            const col = idx % cardsPerRow;
            const x = 0.5 + col * (cardWidth + 0.3);
            const y = 1.7 + row * 1.8;

            slide.addShape('rect', {
                x, y, w: cardWidth, h: 1.5,
                fill: { color: getLightBackground(primaryColor) },
            });

            slide.addText('✓', {
                x: x + cardWidth / 2 - 0.2, y: y + 0.15, w: 0.4, h: 0.4,
                fontSize: 18,
                color: primaryColor,
                align: 'center',
            });

            slide.addText(cleanMarkdown(item), {
                x: x + 0.1, y: y + 0.6, w: cardWidth - 0.2, h: 0.8,
                fontSize: 10,
                color: '374151',
                fontFace: 'Arial',
                align: 'center',
                valign: 'top',
                fit: 'shrink',
            });
        });
    }

    // Bottom accent
    slide.addShape('rect', {
        x: 0.5, y: 5.1, w: 9, h: 0.015,
        fill: { color: accentColor },
    });
}

function createMetricsSlide(
    slide: pptxgen.Slide,
    slideData: Slide,
    imageBase64: string | null,
    primaryColor: string,
    secondaryColor: string,
    accentColor: string
) {
    slide.background = { color: 'FFFFFF' };

    // Gradient header area (tinted with primary color)
    slide.addShape('rect', {
        x: 0, y: 0, w: imageBase64 ? 6 : 10, h: 2.2,
        fill: { color: getLightBackground(primaryColor) },
    });

    // Build combined text with title and subtitle
    const textParts: Array<{ text: string; options: any }> = [];
    const contentWidth = imageBase64 ? 5 : 9;

    // Title
    textParts.push({
        text: cleanMarkdown(slideData.title),
        options: {
            fontSize: 22,
            bold: true,
            color: primaryColor,
            breakLine: true,
            paraSpaceAfter: 8,
        }
    });

    // Subtitle
    if (slideData.content && slideData.content.length > 0) {
        textParts.push({
            text: cleanMarkdown(slideData.content[0]),
            options: {
                fontSize: 12,
                color: '6b7280',
                breakLine: true,
            }
        });
    }

    // Add title block
    slide.addText(textParts, {
        x: 0.5,
        y: 0.2,
        w: contentWidth,
        h: 2.0,
        fontFace: 'Arial',
        valign: 'top',
        fit: 'shrink',
    });

    // Metrics
    if (slideData.metrics && slideData.metrics.length > 0) {
        const metrics = slideData.metrics.slice(0, 3);
        const metricWidth = (imageBase64 ? 5.5 : 9) / metrics.length;
        const startY = 2.6;

        metrics.forEach((metric, idx) => {
            const x = 0.5 + idx * metricWidth;

            // Large value
            slide.addText(metric.value, {
                x, y: startY, w: metricWidth - 0.2, h: 0.9,
                fontSize: 36,
                bold: true,
                color: primaryColor,
                fontFace: 'Arial',
            });

            // Label
            slide.addText(metric.label, {
                x, y: startY + 0.9, w: metricWidth - 0.2, h: 0.4,
                fontSize: 14,
                bold: true,
                color: '1f2937',
                fontFace: 'Arial',
            });

            // Description
            slide.addText(cleanMarkdown(metric.description), {
                x, y: startY + 1.35, w: metricWidth - 0.2, h: 0.6,
                fontSize: 11,
                color: '6b7280',
                fontFace: 'Arial',
            });
        });
    }

    // Image on right if available (no border frame)
    if (imageBase64) {
        slide.addImage({
            data: imageBase64,
            x: 5.9, y: 0.3, w: 3.8, h: 4.8,
        });
    }

    // Bottom accent
    slide.addShape('rect', {
        x: 0.5, y: 5.1, w: 9, h: 0.015,
        fill: { color: accentColor },
    });
}

function createIconListSlide(
    slide: pptxgen.Slide,
    slideData: Slide,
    imageBase64: string | null,
    primaryColor: string,
    secondaryColor: string,
    accentColor: string,
    slideIndex: number,
    totalSlides: number,
    presentationTitle: string
) {
    slide.background = { color: 'FFFFFF' };

    // Left sidebar
    slide.addShape('rect', {
        x: 0, y: 0, w: 0.12, h: 5.625,
        fill: { color: primaryColor },
    });

    // Top bar
    slide.addShape('rect', {
        x: 0.12, y: 0, w: 9.88, h: 0.08,
        fill: { color: secondaryColor },
    });

    // Slide number
    slide.addShape('rect', {
        x: 0.25, y: 0.2, w: 0.4, h: 0.4,
        fill: { color: primaryColor },
    });
    slide.addText(String(slideIndex + 1), {
        x: 0.25, y: 0.2, w: 0.4, h: 0.4,
        fontSize: 11, bold: true, color: 'FFFFFF',
        align: 'center', valign: 'middle',
    });

    // Calculate content width based on image presence
    const hasImage = !!imageBase64;
    const contentWidth = hasImage ? 4.4 : 8.6;

    // Build combined text with title and content to prevent overlap
    const textParts: Array<{ text: string; options: any }> = [];

    // Title
    textParts.push({
        text: cleanMarkdown(slideData.title),
        options: {
            fontSize: 18,
            bold: true,
            color: primaryColor,
            breakLine: true,
            paraSpaceAfter: 10,
        }
    });

    // Content items with bullet styling
    if (slideData.content && slideData.content.length > 0) {
        const iconColors = [accentColor, primaryColor, secondaryColor, '10b981', 'f59e0b'];
        slideData.content.forEach((text, index) => {
            textParts.push({
                text: cleanMarkdown(text),
                options: {
                    fontSize: 12,
                    color: '374151',
                    bullet: { type: 'bullet' as const, color: iconColors[index % iconColors.length] },
                    breakLine: true,
                    paraSpaceBefore: index === 0 ? 6 : 4,
                    paraSpaceAfter: 4,
                }
            });
        });
    }

    // Add all text as a single block
    slide.addText(textParts, {
        x: 0.8,
        y: 0.2,
        w: contentWidth,
        h: 4.6,
        fontFace: 'Arial',
        valign: 'top',
        fit: 'shrink',
    });

    // Image on right (no border frame)
    if (hasImage) {
        slide.addImage({
            data: imageBase64,
            x: 5.4, y: 1.1, w: 4.2, h: 3.6,
        });
    }

    // Bottom accent and footer
    slide.addShape('rect', {
        x: 0.3, y: 5.1, w: 9.4, h: 0.015,
        fill: { color: accentColor },
    });
    slide.addText(presentationTitle, {
        x: 0.4, y: 5.15, w: 6, fontSize: 8, color: secondaryColor, fontFace: 'Arial',
    });
    slide.addText(`${slideIndex + 1} / ${totalSlides}`, {
        x: 8, y: 5.15, w: 1.5, fontSize: 8, color: primaryColor, fontFace: 'Arial', align: 'right', bold: true,
    });
}

function createImageSlide(
    slide: pptxgen.Slide,
    slideData: Slide,
    imageBase64: string | null,
    primaryColor: string,
    secondaryColor: string,
    accentColor: string,
    imagePosition: 'left' | 'right',
    slideIndex: number,
    totalSlides: number,
    presentationTitle: string
) {
    slide.background = { color: 'FFFFFF' };

    // Left sidebar
    slide.addShape('rect', {
        x: 0, y: 0, w: 0.12, h: 5.625,
        fill: { color: primaryColor },
    });

    // Top bar
    slide.addShape('rect', {
        x: 0.12, y: 0, w: 9.88, h: 0.08,
        fill: { color: secondaryColor },
    });

    // Slide number
    slide.addShape('rect', {
        x: 0.25, y: 0.2, w: 0.4, h: 0.4,
        fill: { color: primaryColor },
    });
    slide.addText(String(slideIndex + 1), {
        x: 0.25, y: 0.2, w: 0.4, h: 0.4,
        fontSize: 11, bold: true, color: 'FFFFFF',
        align: 'center', valign: 'middle',
    });

    const hasImage = imageBase64 && slideData.hasImage !== false;

    // Calculate layout based on image position
    // When image is on LEFT: image at 0.3, content starts at 4.5
    // When image is on RIGHT: content starts at 0.8 (after slide number), image at 5.4
    const imageWidth = 4.0;
    const imageHeight = 3.5;

    let contentX: number;
    let contentWidth: number;
    let imageX: number;

    if (hasImage) {
        if (imagePosition === 'left') {
            imageX = 0.3;
            contentX = 4.5;
            contentWidth = 5.2;
        } else {
            // Image on right
            contentX = 0.8;
            contentWidth = 4.4;
            imageX = 5.4;
        }
    } else {
        contentX = 0.8;
        contentWidth = 8.8;
        imageX = 0;
    }

    // Build combined text with title and content to prevent overlap
    const textParts: Array<{ text: string; options: any }> = [];

    // Title
    textParts.push({
        text: cleanMarkdown(slideData.title),
        options: {
            fontSize: 18,
            bold: true,
            color: primaryColor,
            breakLine: true,
            paraSpaceAfter: 12,
        }
    });

    // Content items
    if (slideData.content && slideData.content.length > 0) {
        slideData.content.forEach((text, index) => {
            textParts.push({
                text: cleanMarkdown(text),
                options: {
                    fontSize: 12,
                    color: '374151',
                    bullet: { type: 'bullet' as const, color: secondaryColor },
                    breakLine: true,
                    paraSpaceBefore: index === 0 ? 6 : 4,
                    paraSpaceAfter: 4,
                }
            });
        });
    }

    // Add all text as a single block
    slide.addText(textParts, {
        x: contentX,
        y: 0.2,
        w: contentWidth,
        h: 4.6,
        fontFace: 'Arial',
        valign: 'top',
        fit: 'shrink',
    });

    // Image (no border frame)
    if (hasImage) {
        slide.addImage({
            data: imageBase64,
            x: imageX, y: 1.15, w: imageWidth, h: imageHeight,
        });
    }

    // Bottom accent and footer
    slide.addShape('rect', {
        x: 0.3, y: 5.1, w: 9.4, h: 0.015,
        fill: { color: accentColor },
    });
    slide.addText(presentationTitle, {
        x: 0.4, y: 5.15, w: 6, fontSize: 8, color: secondaryColor, fontFace: 'Arial',
    });
    slide.addText(`${slideIndex + 1} / ${totalSlides}`, {
        x: 8, y: 5.15, w: 1.5, fontSize: 8, color: primaryColor, fontFace: 'Arial', align: 'right', bold: true,
    });
}
