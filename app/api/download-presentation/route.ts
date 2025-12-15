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
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/#+\s*/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim();
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

        // Theme colors (Gamma-style pink/purple gradient)
        const primaryColor = theme?.colors?.primary?.replace('#', '') || 'c026d3'; // Fuchsia
        const secondaryColor = theme?.colors?.secondary?.replace('#', '') || 'a855f7'; // Purple
        const accentColor = theme?.colors?.accent?.replace('#', '') || 'ec4899'; // Pink

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

            switch (layoutType) {
                case 'title':
                    createTitleSlide(slide, slideData, imageBase64, primaryColor, secondaryColor, accentColor);
                    break;
                case 'closing':
                    createClosingSlide(slide, slideData, imageBase64, primaryColor, secondaryColor, accentColor);
                    break;
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
    // Gradient background
    slide.background = { color: primaryColor };

    // Decorative top gradient bar
    slide.addShape('rect', {
        x: 0, y: 0, w: 10, h: 0.15,
        fill: { color: accentColor },
    });

    // Bottom accent line
    slide.addShape('rect', {
        x: 0, y: 5.475, w: 10, h: 0.15,
        fill: { color: secondaryColor },
    });

    // Main Title
    slide.addText(slideData.title, {
        x: 0.5, y: 0.8, w: imageBase64 ? 5.5 : 9, h: 1.5,
        fontSize: 36,
        bold: true,
        color: 'FFFFFF',
        fontFace: 'Arial',
        valign: 'top',
    });

    // Subtitle if available
    if (slideData.subtitle) {
        slide.addText(slideData.subtitle, {
            x: 0.5, y: 2.3, w: imageBase64 ? 5.5 : 9, h: 0.5,
            fontSize: 18,
            color: 'FFFFFF',
            fontFace: 'Arial',
        });
    }

    // Content as clean text
    if (slideData.content && slideData.content.length > 0) {
        const textItems = slideData.content.map((text) => ({
            text: cleanMarkdown(text),
            options: {
                fontSize: 14,
                color: 'FFFFFF',
                bullet: false,
                breakLine: true,
                paraSpaceBefore: 4,
                paraSpaceAfter: 4,
            },
        }));

        slide.addText(textItems, {
            x: 0.5, y: slideData.subtitle ? 2.9 : 2.5, w: imageBase64 ? 5.5 : 9, h: 2.2,
            fontFace: 'Arial',
            valign: 'top',
        });
    }

    // Hero image on right
    if (imageBase64) {
        // Image frame
        slide.addShape('rect', {
            x: 6.1, y: 0.4, w: 3.5, h: 4.4,
            fill: { color: secondaryColor },
        });
        slide.addImage({
            data: imageBase64,
            x: 6.15, y: 0.45, w: 3.4, h: 4.3,
            rounding: true,
        });
    }

    // Footer
    slide.addText("Generated by BusinessAI", {
        x: 0.5, y: 5.1, w: 4, fontSize: 9, color: 'FFFFFF', fontFace: 'Arial',
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
    slide.background = { color: primaryColor };

    // Title
    slide.addText(slideData.title, {
        x: 0.5, y: 1, w: 9, h: 1.2,
        fontSize: 40,
        bold: true,
        color: 'FFFFFF',
        fontFace: 'Arial',
        align: 'center',
        valign: 'middle',
    });

    // Decorative line
    slide.addShape('rect', {
        x: 3, y: 2.3, w: 4, h: 0.03,
        fill: { color: accentColor },
    });

    // Content
    if (slideData.content && slideData.content.length > 0) {
        const textItems = slideData.content.map((text) => ({
            text: cleanMarkdown(text),
            options: {
                fontSize: 14,
                color: 'FFFFFF',
                bullet: false,
                breakLine: true,
                paraSpaceBefore: 6,
                paraSpaceAfter: 6,
            },
        }));

        slide.addText(textItems, {
            x: 1, y: 2.7, w: 8, h: 2.5,
            fontFace: 'Arial',
            valign: 'top',
            align: 'center',
        });
    }
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

    // Title with primary color
    slide.addText(slideData.title, {
        x: 0.5, y: 0.3, w: 9, h: 0.8,
        fontSize: 28,
        bold: true,
        color: primaryColor,
        fontFace: 'Arial',
    });

    // Subtitle/intro text if content exists
    if (slideData.content && slideData.content.length > 0 && !slideData.comparison) {
        slide.addText(cleanMarkdown(slideData.content[0]), {
            x: 0.5, y: 1.1, w: 9, h: 0.5,
            fontSize: 13,
            color: '6b7280',
            fontFace: 'Arial',
        });
    }

    // Comparison columns
    if (slideData.comparison) {
        const startY = 1.7;
        const colWidth = 4.3;

        // Left column - Traditional/Problem (pink tinted)
        slide.addShape('rect', {
            x: 0.4, y: startY, w: colWidth, h: 3.2,
            fill: { color: 'fdf2f8' }, // Light pink
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

        // Right column - Solution (purple tinted)
        slide.addShape('rect', {
            x: 5.3, y: startY, w: colWidth, h: 3.2,
            fill: { color: 'faf5ff' }, // Light purple
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

    // Title
    slide.addText(slideData.title, {
        x: 0.5, y: 0.3, w: 9, h: 0.7,
        fontSize: 26,
        bold: true,
        color: primaryColor,
        fontFace: 'Arial',
    });

    // Subtitle from first content item
    if (slideData.content && slideData.content.length > 0) {
        slide.addText(cleanMarkdown(slideData.content[0]), {
            x: 0.5, y: 1.0, w: 9, h: 0.5,
            fontSize: 13,
            color: '6b7280',
            fontFace: 'Arial',
        });
    }

    // Feature cards
    if (slideData.features && slideData.features.length > 0) {
        const features = slideData.features.slice(0, 5); // Max 5 features
        const cardCount = features.length;
        const rows = cardCount <= 3 ? 1 : 2;
        const cardsPerRow = rows === 1 ? cardCount : Math.ceil(cardCount / 2);

        const cardWidth = (9 - (cardsPerRow - 1) * 0.3) / cardsPerRow;
        const cardHeight = rows === 1 ? 2.8 : 1.6;
        const startY = 1.6;

        const featureColors = [
            { bg: 'fdf2f8', icon: accentColor },   // Pink
            { bg: 'faf5ff', icon: primaryColor },  // Purple
            { bg: 'eff6ff', icon: '3b82f6' },      // Blue
            { bg: 'ecfdf5', icon: '10b981' },      // Green
            { bg: 'fef3c7', icon: 'f59e0b' },      // Amber
        ];

        features.forEach((feature, idx) => {
            const row = Math.floor(idx / cardsPerRow);
            const col = idx % cardsPerRow;
            const x = 0.5 + col * (cardWidth + 0.3);
            const y = startY + row * (cardHeight + 0.3);
            const color = featureColors[idx % featureColors.length];

            // Card background
            slide.addShape('rect', {
                x, y, w: cardWidth, h: cardHeight,
                fill: { color: color.bg },
            });

            // Icon circle
            const iconSymbol = ICON_SYMBOLS[feature.icon] || ICON_SYMBOLS.default;
            slide.addShape('ellipse', {
                x: x + cardWidth / 2 - 0.25, y: y + 0.2, w: 0.5, h: 0.5,
                fill: { color: color.icon },
            });
            slide.addText(iconSymbol, {
                x: x + cardWidth / 2 - 0.25, y: y + 0.18, w: 0.5, h: 0.5,
                fontSize: 14,
                color: 'FFFFFF',
                align: 'center',
                valign: 'middle',
            });

            // Feature title
            slide.addText(cleanMarkdown(feature.title), {
                x: x + 0.15, y: y + 0.8, w: cardWidth - 0.3, h: 0.4,
                fontSize: 12,
                bold: true,
                color: '1f2937',
                fontFace: 'Arial',
                align: 'center',
            });

            // Feature description
            slide.addText(cleanMarkdown(feature.description), {
                x: x + 0.15, y: y + 1.2, w: cardWidth - 0.3, h: rows === 1 ? 1.3 : 0.6,
                fontSize: 10,
                color: '6b7280',
                fontFace: 'Arial',
                align: 'center',
                valign: 'top',
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
                fill: { color: 'faf5ff' },
            });

            slide.addText('✓', {
                x: x + cardWidth / 2 - 0.2, y: y + 0.15, w: 0.4, h: 0.4,
                fontSize: 18,
                color: primaryColor,
                align: 'center',
            });

            slide.addText(cleanMarkdown(item), {
                x: x + 0.1, y: y + 0.6, w: cardWidth - 0.2, h: 0.8,
                fontSize: 11,
                color: '374151',
                fontFace: 'Arial',
                align: 'center',
                valign: 'top',
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

    // Gradient header area
    slide.addShape('rect', {
        x: 0, y: 0, w: imageBase64 ? 6 : 10, h: 2.2,
        fill: { color: 'fdf2f8' },
    });

    // Title
    slide.addText(slideData.title, {
        x: 0.5, y: 0.4, w: imageBase64 ? 5 : 9, h: 0.8,
        fontSize: 26,
        bold: true,
        color: primaryColor,
        fontFace: 'Arial',
    });

    // Subtitle
    if (slideData.content && slideData.content.length > 0) {
        slide.addText(cleanMarkdown(slideData.content[0]), {
            x: 0.5, y: 1.2, w: imageBase64 ? 5 : 9, h: 0.7,
            fontSize: 13,
            color: '6b7280',
            fontFace: 'Arial',
        });
    }

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

    // Image on right if available
    if (imageBase64) {
        slide.addShape('rect', {
            x: 5.9, y: 0.3, w: 3.8, h: 4.8,
            fill: { color: accentColor },
        });
        slide.addImage({
            data: imageBase64,
            x: 5.95, y: 0.35, w: 3.7, h: 4.7,
            rounding: true,
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
        x: 0.3, y: 0.25, w: 0.45, h: 0.45,
        fill: { color: primaryColor },
    });
    slide.addText(String(slideIndex + 1), {
        x: 0.3, y: 0.25, w: 0.45, h: 0.45,
        fontSize: 12, bold: true, color: 'FFFFFF',
        align: 'center', valign: 'middle',
    });

    // Title
    slide.addText(slideData.title, {
        x: 0.9, y: 0.25, w: imageBase64 ? 5 : 8.5, h: 0.55,
        fontSize: 24,
        bold: true,
        color: primaryColor,
        fontFace: 'Arial',
    });

    // Divider
    slide.addShape('rect', {
        x: 0.4, y: 0.9, w: imageBase64 ? 5.3 : 9.1, h: 0.015,
        fill: { color: accentColor },
    });

    // Content with icons
    if (slideData.content && slideData.content.length > 0) {
        const contentWidth = imageBase64 ? 5 : 8.5;

        slideData.content.forEach((point, idx) => {
            const y = 1.1 + idx * 0.7;
            const iconColors = [accentColor, primaryColor, secondaryColor, '10b981', 'f59e0b'];
            const color = iconColors[idx % iconColors.length];

            // Icon circle
            slide.addShape('ellipse', {
                x: 0.5, y: y + 0.05, w: 0.35, h: 0.35,
                fill: { color },
            });
            slide.addText('✓', {
                x: 0.5, y: y + 0.02, w: 0.35, h: 0.35,
                fontSize: 10, color: 'FFFFFF',
                align: 'center', valign: 'middle',
            });

            // Text
            slide.addText(cleanMarkdown(point), {
                x: 1.0, y: y, w: contentWidth - 0.5, h: 0.5,
                fontSize: 13,
                color: '374151',
                fontFace: 'Arial',
                valign: 'middle',
            });
        });
    }

    // Image on right
    if (imageBase64) {
        slide.addShape('rect', {
            x: 5.65, y: 0.9, w: 3.95, h: 3.8,
            fill: { color: accentColor },
        });
        slide.addImage({
            data: imageBase64,
            x: 5.7, y: 0.95, w: 3.85, h: 3.7,
            rounding: true,
        });
    }

    // Bottom accent and footer
    slide.addShape('rect', {
        x: 0.4, y: 5.1, w: 9.2, h: 0.015,
        fill: { color: accentColor },
    });
    slide.addText(presentationTitle, {
        x: 0.5, y: 5.2, w: 6, fontSize: 9, color: secondaryColor, fontFace: 'Arial',
    });
    slide.addText(`${slideIndex + 1} / ${totalSlides}`, {
        x: 8, y: 5.2, w: 1.5, fontSize: 9, color: primaryColor, fontFace: 'Arial', align: 'right', bold: true,
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
        x: 0.3, y: 0.25, w: 0.45, h: 0.45,
        fill: { color: primaryColor },
    });
    slide.addText(String(slideIndex + 1), {
        x: 0.3, y: 0.25, w: 0.45, h: 0.45,
        fontSize: 12, bold: true, color: 'FFFFFF',
        align: 'center', valign: 'middle',
    });

    const hasImage = imageBase64 && slideData.hasImage !== false;
    const contentX = hasImage && imagePosition === 'left' ? 4.8 : 0.9;
    const contentWidth = hasImage ? 4.5 : 8.5;
    const imageX = imagePosition === 'left' ? 0.4 : 5.7;

    // Title
    slide.addText(slideData.title, {
        x: contentX, y: 0.25, w: contentWidth, h: 0.55,
        fontSize: 24,
        bold: true,
        color: primaryColor,
        fontFace: 'Arial',
    });

    // Divider
    slide.addShape('rect', {
        x: 0.4, y: 0.9, w: 9.2, h: 0.015,
        fill: { color: accentColor },
    });

    // Content bullets
    if (slideData.content && slideData.content.length > 0) {
        const textItems = slideData.content.map((text) => ({
            text: cleanMarkdown(text),
            options: {
                fontSize: 14,
                color: '374151',
                bullet: { type: 'bullet' as const, color: secondaryColor },
                breakLine: true,
                paraSpaceBefore: 8,
                paraSpaceAfter: 8,
            },
        }));

        slide.addText(textItems, {
            x: contentX, y: 1.1, w: contentWidth, h: 3.6,
            fontFace: 'Arial',
            valign: 'top',
        });
    }

    // Image
    if (hasImage) {
        slide.addShape('rect', {
            x: imageX - 0.05, y: 0.95, w: 4, h: 3.85,
            fill: { color: accentColor },
        });
        slide.addImage({
            data: imageBase64,
            x: imageX, y: 1, w: 3.9, h: 3.75,
            rounding: true,
        });
    }

    // Bottom accent and footer
    slide.addShape('rect', {
        x: 0.4, y: 5.1, w: 9.2, h: 0.015,
        fill: { color: accentColor },
    });
    slide.addText(presentationTitle, {
        x: 0.5, y: 5.2, w: 6, fontSize: 9, color: secondaryColor, fontFace: 'Arial',
    });
    slide.addText(`${slideIndex + 1} / ${totalSlides}`, {
        x: 8, y: 5.2, w: 1.5, fontSize: 9, color: primaryColor, fontFace: 'Arial', align: 'right', bold: true,
    });
}
