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

// Icon to Unicode mapping for PPTX (using comprehensive symbol mapping)
const ICON_SYMBOLS: Record<string, string> = {
    // Business & Commerce
    storefront: '🏪', store: '🏪', shop: '🏪',
    dashboard: '📊', analytics: '📈', barchart: '📊',
    cart: '🛒', shoppingcart: '🛒',
    payment: '💳', creditcard: '💳',
    shipping: '🚚', truck: '🚚',
    inventory: '📦', package: '📦',
    customer: '👥', customers: '👥', users: '👥',
    support: '🎧', headphones: '🎧',
    briefcase: '💼',
    
    // Design & UI
    design: '🎨', palette: '🎨',
    search: '🔍', filter: '🔍',
    settings: '⚙️', edit: '✏️', trash: '🗑️',
    
    // Security
    security: '🔒', shield: '🛡️', lock: '🔒',
    unlock: '🔓', key: '🔑',
    
    // Performance & Technology
    speed: '⚡', zap: '⚡', lightning: '⚡',
    mobile: '📱', smartphone: '📱', phone: '📞',
    integration: '🔌', plug: '🔌',
    automation: '🤖', bot: '🤖', robot: '🤖',
    cpu: '💻', code: '💻', terminal: '💻',
    wifi: '📶', bluetooth: '📶',
    monitor: '🖥️', printer: '🖨️',
    cloud: '☁️', database: '🗄️',
    
    // Communication
    document: '📄', filetext: '📄', file: '📄',
    email: '📧', mail: '📧',
    notification: '🔔', bell: '🔔',
    chat: '💬', message: '💬',
    share: '🔗', link: '🔗', send: '📤',
    
    // Growth & Success
    growth: '📈', trending: '📈', chart: '📉',
    target: '🎯', goal: '🎯',
    check: '✅', checkmark: '✅',
    star: '⭐', rating: '⭐',
    award: '🏆', trophy: '🏆',
    
    // Ideas & Innovation
    idea: '💡', lightbulb: '💡', bulb: '💡',
    rocket: '🚀', launch: '🚀',
    globe: '🌐', world: '🌐', global: '🌐',
    
    // Time & Calendar
    clock: '⏰', time: '⏰',
    calendar: '📅', schedule: '📅',
    
    // Health & Life
    heart: '❤️', health: '❤️',
    home: '🏠', building: '🏢',
    
    // Actions
    plus: '➕', add: '➕',
    minus: '➖', remove: '➖',
    close: '❌', x: '❌',
    arrow: '➡️', right: '➡️',
    up: '⬆️', down: '⬇️', left: '⬅️',
    
    // Fallbacks
    circle: '●', dot: '●',
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

        // Theme colors - use coral theme as default to match frontend
        const primaryColor = theme?.colors?.primary?.replace('#', '') || 'c2410c'; // Coral primary
        const secondaryColor = theme?.colors?.secondary?.replace('#', '') || 'ea580c'; // Coral secondary
        const accentColor = theme?.colors?.accent?.replace('#', '') || 'fb923c'; // Coral accent

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

// Helper function to add properly positioned and sized images
function addSlideImage(
    slide: pptxgen.Slide,
    imageBase64: string | null,
    position: { x: number, y: number, w: number, h: number },
    borderColor: string
) {
    if (!imageBase64) return;
    
    // Add background border
    slide.addShape('rect', {
        x: position.x - 0.05, y: position.y - 0.05, 
        w: position.w + 0.1, h: position.h + 0.1,
        fill: { color: borderColor },
    });
    
    // Add the image
    slide.addImage({
        data: imageBase64,
        x: position.x, y: position.y, w: position.w, h: position.h,
        rounding: true,
    });
}

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

    const hasImage = imageBase64 && slideData.hasImage !== false;
    const textWidth = hasImage ? 5.5 : 9;
    
    // Calculate title font size based on length to prevent overflow
    const titleLength = slideData.title.length;
    const titleFontSize = titleLength > 50 ? 28 : titleLength > 30 ? 32 : 36;
    
    // Main Title with better sizing
    slide.addText(slideData.title, {
        x: 0.5, y: 1.0, w: textWidth, h: 1.2,
        fontSize: titleFontSize,
        bold: true,
        color: 'FFFFFF',
        fontFace: 'Arial',
        valign: 'top',
        wrap: true,
        lineSpacing: 24,
    });

    let currentY = 2.3;

    // Subtitle if available with proper spacing
    if (slideData.subtitle) {
        slide.addText(slideData.subtitle, {
            x: 0.5, y: currentY, w: textWidth, h: 0.6,
            fontSize: 18,
            color: 'FFFFFF',
            fontFace: 'Arial',
            wrap: true,
            lineSpacing: 20,
        });
        currentY += 0.8;
    }

    // Content with better formatting and spacing
    if (slideData.content && slideData.content.length > 0) {
        const contentText = slideData.content.map(text => `• ${cleanMarkdown(text)}`).join('\n');
        
        slide.addText(contentText, {
            x: 0.5, y: currentY, w: textWidth, h: 5.5 - currentY - 0.3,
            fontSize: 14,
            color: 'FFFFFF',
            fontFace: 'Arial',
            valign: 'top',
            wrap: true,
            lineSpacing: 18,
        });
    }

    // Hero image on right with better positioning
    if (imageBase64) {
        // Image frame
        slide.addShape('rect', {
            x: 6.05, y: 0.8, w: 3.6, h: 3.6,
            fill: { color: secondaryColor },
        });
        slide.addImage({
            data: imageBase64,
            x: 6.1, y: 0.85, w: 3.5, h: 3.5,
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

    // Calculate title font size to prevent overflow
    const titleLength = slideData.title.length;
    const titleFontSize = titleLength > 40 ? 20 : titleLength > 25 ? 24 : 28;

    // Title with better sizing
    slide.addText(slideData.title, {
        x: 0.5, y: 0.2, w: 9, h: 0.8,
        fontSize: titleFontSize,
        bold: true,
        color: primaryColor,
        fontFace: 'Arial',
        align: 'center',
        wrap: true,
        lineSpacing: 26,
    });

    // Comparison columns with improved spacing
    if (slideData.comparison) {
        const { left, right } = slideData.comparison;
        const colWidth = 4.2;
        const startY = 1.1;
        
        // Left column - Traditional/Problem (pink tinted)
        slide.addShape('rect', {
            x: 0.4, y: startY, w: colWidth, h: 3.8,
            fill: { color: 'fdf2f8' },
            line: { color: 'fbcfe8', width: 1 }
        });

        // Left column heading
        slide.addText(left.heading, {
            x: 0.5, y: startY + 0.1, w: colWidth - 0.2, h: 0.6,
            fontSize: 16,
            bold: true,
            color: accentColor,
            fontFace: 'Arial',
            align: 'center',
            wrap: true,
        });

        // Left column points with better formatting
        const leftTextItems = left.points.map((text) => ({
            text: `• ${cleanMarkdown(text)}`,
            options: {
                fontSize: 11,
                color: '374151',
                breakLine: true,
                paraSpaceBefore: 4,
                paraSpaceAfter: 4,
            },
        }));

        slide.addText(leftTextItems, {
            x: 0.6, y: startY + 0.8, w: colWidth - 0.4, h: 2.8,
            fontFace: 'Arial',
            valign: 'top',
            lineSpacing: 16,
        });

        // Right column - Solution (purple tinted)
        slide.addShape('rect', {
            x: 5.4, y: startY, w: colWidth, h: 3.8,
            fill: { color: 'faf5ff' },
            line: { color: 'ddd6fe', width: 1 }
        });

        // Right column heading
        slide.addText(right.heading, {
            x: 5.5, y: startY + 0.1, w: colWidth - 0.2, h: 0.6,
            fontSize: 16,
            bold: true,
            color: primaryColor,
            fontFace: 'Arial',
            align: 'center',
            wrap: true,
        });

        // Right column points with better formatting
        const rightTextItems = right.points.map((text) => ({
            text: `• ${cleanMarkdown(text)}`,
            options: {
                fontSize: 11,
                color: '374151',
                breakLine: true,
                paraSpaceBefore: 4,
                paraSpaceAfter: 4,
            },
        }));

        slide.addText(rightTextItems, {
            x: 5.6, y: startY + 0.8, w: colWidth - 0.4, h: 2.8,
            fontFace: 'Arial',
            valign: 'top',
            lineSpacing: 16,
        });
    }
}

function createFeaturesSlide(
    slide: pptxgen.Slide,
    slideData: Slide,
    primaryColor: string,
    secondaryColor: string,
    accentColor: string
) {
    slide.background = { color: 'FFFFFF' };

    // Calculate title font size based on length
    const titleLength = slideData.title.length;
    const titleFontSize = titleLength > 40 ? 18 : titleLength > 25 ? 22 : 28;

    // Title with responsive sizing
    slide.addText(slideData.title, {
        x: 0.5, y: 0.3, w: 9, h: 0.6,
        fontSize: titleFontSize,
        bold: true,
        color: primaryColor,
        fontFace: 'Arial',
        align: 'center',
        wrap: true,
    });

    // Feature cards matching the preview design
    if (slideData.features && slideData.features.length > 0) {
        const features = slideData.features.slice(0, 6); // Max 6 features
        const featureCount = features.length;
        
        // Define card colors to match the preview
        const cardColors = [
            { bg: 'fce7f3', icon: 'ec4899', iconBg: 'ec4899' }, // Pink
            { bg: 'e0e7ff', icon: '8b5cf6', iconBg: '8b5cf6' }, // Purple
            { bg: 'dbeafe', icon: '3b82f6', iconBg: '3b82f6' }, // Blue
            { bg: 'd1fae5', icon: '10b981', iconBg: '10b981' }, // Green/Teal
            { bg: 'fef3c7', icon: 'f59e0b', iconBg: 'f59e0b' }, // Yellow/Amber
            { bg: 'fee2e2', icon: 'ef4444', iconBg: 'ef4444' }, // Red
        ];

        // Determine layout: 2 rows of 3 cards or adjust based on count
        const cols = featureCount <= 3 ? featureCount : 3;
        const rows = Math.ceil(featureCount / cols);
        
        const cardWidth = 2.8;  // Fixed width for consistency
        const cardHeight = 1.8; // Fixed height for consistency
        const gapX = 0.4;       // Gap between cards horizontally
        const gapY = 0.3;       // Gap between cards vertically
        
        // Calculate starting position to center the grid
        const totalWidth = (cols * cardWidth) + ((cols - 1) * gapX);
        const startX = (10 - totalWidth) / 2;
        const startY = 1.2;

        features.forEach((feature, idx) => {
            const row = Math.floor(idx / cols);
            const col = idx % cols;
            const x = startX + col * (cardWidth + gapX);
            const y = startY + row * (cardHeight + gapY);
            const colorSet = cardColors[idx % cardColors.length];

            // Card background with rounded corners effect
            slide.addShape('rect', {
                x, y, w: cardWidth, h: cardHeight,
                fill: { color: colorSet.bg },
                line: { color: colorSet.bg, width: 0 },
            });

            // Circular icon background at top center
            const iconX = x + cardWidth / 2 - 0.25;
            const iconY = y + 0.15;
            
            slide.addShape('ellipse', {
                x: iconX, y: iconY, w: 0.5, h: 0.5,
                fill: { color: colorSet.iconBg },
            });

            // Icon symbol
            const iconKey = feature.icon?.toLowerCase() || 'default';
            const iconSymbol = ICON_SYMBOLS[iconKey] || ICON_SYMBOLS[feature.icon] || ICON_SYMBOLS.default;
            
            slide.addText(iconSymbol, {
                x: iconX, y: iconY, w: 0.5, h: 0.5,
                fontSize: 16,
                color: 'FFFFFF',
                align: 'center',
                valign: 'middle',
                fontFace: 'Arial',
            });

            // Feature title with responsive sizing
            const titleLength = feature.title.length;
            const featureTitleSize = titleLength > 25 ? 12 : titleLength > 20 ? 13 : 14;
            
            slide.addText(cleanMarkdown(feature.title), {
                x: x + 0.1, y: y + 0.75, w: cardWidth - 0.2, h: 0.4,
                fontSize: featureTitleSize,
                bold: true,
                color: '1e293b',
                fontFace: 'Arial',
                align: 'center',
                wrap: true,
            });

            // Feature description with proper spacing
            const descLength = feature.description.length;
            const descSize = descLength > 100 ? 9 : descLength > 80 ? 10 : descLength > 60 ? 11 : 12;
            
            slide.addText(cleanMarkdown(feature.description), {
                x: x + 0.15, y: y + 1.15, w: cardWidth - 0.3, h: cardHeight - 1.3,
                fontSize: descSize,
                color: '64748b',
                fontFace: 'Arial',
                align: 'center',
                valign: 'top',
                wrap: true,
                lineSpacing: 16,
            });
        });
    } else if (slideData.content && slideData.content.length > 0) {
        // Fallback: create cards from content items if no features
        const items = slideData.content.slice(1, 7); // Skip first item (usually title/description)
        const cardColors = [
            { bg: 'fce7f3', icon: 'ec4899' }, // Pink
            { bg: 'e0e7ff', icon: '8b5cf6' }, // Purple
            { bg: 'dbeafe', icon: '3b82f6' }, // Blue
            { bg: 'd1fae5', icon: '10b981' }, // Green
            { bg: 'fef3c7', icon: 'f59e0b' }, // Yellow
            { bg: 'fee2e2', icon: 'ef4444' }, // Red
        ];

        const cols = items.length <= 3 ? items.length : 3;
        const cardWidth = 2.8;
        const cardHeight = 1.8;
        const gapX = 0.4;
        const gapY = 0.3;
        
        const totalWidth = (cols * cardWidth) + ((cols - 1) * gapX);
        const startX = (10 - totalWidth) / 2;
        const startY = 1.2;

        items.forEach((item, idx) => {
            const row = Math.floor(idx / cols);
            const col = idx % cols;
            const x = startX + col * (cardWidth + gapX);
            const y = startY + row * (cardHeight + gapY);
            const colorSet = cardColors[idx % cardColors.length];

            // Card background
            slide.addShape('rect', {
                x, y, w: cardWidth, h: cardHeight,
                fill: { color: colorSet.bg },
            });

            // Icon circle
            const iconX = x + cardWidth / 2 - 0.25;
            const iconY = y + 0.15;
            
            slide.addShape('ellipse', {
                x: iconX, y: iconY, w: 0.5, h: 0.5,
                fill: { color: colorSet.icon },
            });

            slide.addText('✓', {
                x: iconX, y: iconY, w: 0.5, h: 0.5,
                fontSize: 16,
                color: 'FFFFFF',
                align: 'center',
                valign: 'middle',
            });

            // Content text
            const textSize = item.length > 80 ? 10 : 12;
            slide.addText(cleanMarkdown(item), {
                x: x + 0.15, y: y + 0.8, w: cardWidth - 0.3, h: cardHeight - 1,
                fontSize: textSize,
                color: '1e293b',
                fontFace: 'Arial',
                align: 'center',
                valign: 'top',
                wrap: true,
                lineSpacing: 16,
            });
        });
    }

    // Bottom accent line
    slide.addShape('rect', {
        x: 0.5, y: 5.3, w: 9, h: 0.02,
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

    // Calculate title font size based on length
    const titleLength = slideData.title.length;
    const titleFontSize = titleLength > 40 ? 18 : titleLength > 25 ? 22 : 26;

    // Title with responsive sizing
    slide.addText(slideData.title, {
        x: 0.5, y: 0.4, w: imageBase64 ? 5 : 9, h: 0.8,
        fontSize: titleFontSize,
        bold: true,
        color: primaryColor,
        fontFace: 'Arial',
    });

    // Subtitle from first content item
    if (slideData.content && slideData.content.length > 0) {
        slide.addText(cleanMarkdown(slideData.content[0]), {
            x: 0.5, y: 1.2, w: imageBase64 ? 5 : 9, h: 0.7,
            fontSize: 13,
            color: '6b7280',
            fontFace: 'Arial',
        });
    }

    // Metrics cards
    if (slideData.metrics && slideData.metrics.length > 0) {
        const metrics = slideData.metrics.slice(0, 3);
        const metricWidth = (imageBase64 ? 5.5 : 9) / metrics.length;
        const startY = 2.6;

        metrics.forEach((metric, idx) => {
            const x = 0.5 + idx * metricWidth;

            // Metric card background
            slide.addShape('rect', {
                x: x - 0.1, y: startY - 0.1, w: metricWidth - 0.1, h: 2.2,
                fill: { color: 'ffffff' },
                line: { color: accentColor, width: 2 },
            });

            // Large value with responsive sizing
            const valueLength = metric.value.length;
            const valueFontSize = valueLength > 8 ? 28 : valueLength > 5 ? 32 : 36;
            
            slide.addText(metric.value, {
                x, y: startY, w: metricWidth - 0.2, h: 0.9,
                fontSize: valueFontSize,
                bold: true,
                color: primaryColor,
                fontFace: 'Arial',
                align: 'center',
            });

            // Label with responsive sizing
            const labelLength = metric.label.length;
            const labelFontSize = labelLength > 20 ? 12 : labelLength > 15 ? 13 : 14;
            
            slide.addText(metric.label, {
                x, y: startY + 0.9, w: metricWidth - 0.2, h: 0.4,
                fontSize: labelFontSize,
                bold: true,
                color: '1f2937',
                fontFace: 'Arial',
                align: 'center',
            });

            // Description with better formatting
            if (metric.description) {
                const descLength = metric.description.length;
                const descFontSize = descLength > 40 ? 9 : descLength > 25 ? 10 : 11;
                
                slide.addText(cleanMarkdown(metric.description), {
                    x, y: startY + 1.35, w: metricWidth - 0.2, h: 0.7,
                    fontSize: descFontSize,
                    color: '6b7280',
                    fontFace: 'Arial',
                    align: 'center',
                    valign: 'top',
                });
            }
        });
    }

    // Image on right if available
    if (imageBase64) {
        slide.addImage({
            data: imageBase64,
            x: 5.95, y: 0.35, w: 3.7, h: 4.7,
            rounding: false,
        });
    }

    // Bottom accent line
    slide.addShape('rect', {
        x: 0.5, y: 5.1, w: 9, h: 0.02,
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

    // Calculate title font size based on length
    const titleLength = slideData.title.length;
    const titleFontSize = titleLength > 40 ? 18 : titleLength > 25 ? 22 : 24;

    // Title with responsive sizing
    slide.addText(slideData.title, {
        x: 0.9, y: 0.25, w: imageBase64 ? 5 : 8.5, h: 0.55,
        fontSize: titleFontSize,
        bold: true,
        color: primaryColor,
        fontFace: 'Arial',
    });

    // Divider
    slide.addShape('rect', {
        x: 0.4, y: 0.9, w: imageBase64 ? 5.3 : 9.1, h: 0.015,
        fill: { color: accentColor },
    });

    // Content with icons - improved formatting
    if (slideData.content && slideData.content.length > 0) {
        const contentWidth = imageBase64 ? 5 : 8.5;
        const maxItems = Math.min(slideData.content.length, 6); // Limit to 6 items for better spacing

        slideData.content.slice(0, maxItems).forEach((point, idx) => {
            const lineHeight = 0.7; // Reduced line height for better spacing
            const y = 1.2 + idx * lineHeight;
            const iconColors = [accentColor, primaryColor, secondaryColor, '10b981', 'f59e0b', '3b82f6'];
            const color = iconColors[idx % iconColors.length];
            
            // Extract icon and text if point contains JSON structure
            let iconText = '✓';
            let displayText = cleanMarkdown(point);
            
            // Try to parse JSON structure from content
            try {
                const parsed = JSON.parse(point);
                if (parsed.icon && parsed.point) {
                    const iconKey = parsed.icon.toLowerCase();
                    iconText = ICON_SYMBOLS[iconKey] || ICON_SYMBOLS[parsed.icon] || '●';
                    displayText = cleanMarkdown(parsed.point);
                }
            } catch (e) {
                // Not JSON, use as plain text with checkmark
            }

            // Icon circle with better sizing
            slide.addShape('ellipse', {
                x: 0.5, y: y + 0.05, w: 0.4, h: 0.4,
                fill: { color },
            });
            slide.addText(iconText, {
                x: 0.5, y: y + 0.02, w: 0.4, h: 0.4,
                fontSize: 12, color: 'FFFFFF',
                align: 'center', valign: 'middle',
            });

            // Text with responsive sizing
            const textLength = displayText.length;
            const textFontSize = textLength > 60 ? 11 : textLength > 40 ? 12 : textLength > 25 ? 13 : 14;
            
            slide.addText(displayText, {
                x: 1.0, y: y, w: contentWidth - 0.5, h: 0.6,
                fontSize: textFontSize,
                color: '374151',
                fontFace: 'Arial',
                valign: 'middle',
                wrap: true,
            });
        });
    }

    // Image on right
    if (imageBase64) {
        slide.addImage({
            data: imageBase64,
            x: 5.7, y: 0.95, w: 3.85, h: 3.7,
            rounding: false,
        });
    }

    // Bottom accent and footer
    slide.addShape('rect', {
        x: 0.4, y: 5.1, w: 9.2, h: 0.015,
        fill: { color: accentColor },
    });
    
    // Footer with presentation title
    slide.addText(presentationTitle, {
        x: 0.5, y: 5.2, w: 6, h: 0.3,
        fontSize: 9, color: secondaryColor, fontFace: 'Arial',
    });
    
    // Page number
    slide.addText(`${slideIndex + 1} / ${totalSlides}`, {
        x: 8, y: 5.2, w: 1.5, h: 0.3,
        fontSize: 9, color: primaryColor, fontFace: 'Arial', align: 'right', bold: true,
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

    // Calculate title font size based on length
    const titleLength = slideData.title.length;
    const titleFontSize = titleLength > 50 ? 18 : titleLength > 30 ? 20 : 24;

    // Title with responsive sizing
    slide.addText(slideData.title, {
        x: contentX, y: 0.25, w: contentWidth, h: 0.8,
        fontSize: titleFontSize,
        bold: true,
        color: primaryColor,
        fontFace: 'Arial',
        wrap: true,
        lineSpacing: 22,
        valign: 'top'
    });

    // Divider
    slide.addShape('rect', {
        x: 0.4, y: 1.1, w: 9.2, h: 0.015,
        fill: { color: accentColor },
    });

    // Content with proper bullet points and spacing
    if (slideData.content && slideData.content.length > 0) {
        const maxItems = Math.min(slideData.content.length, 6); // Limit items for better spacing
        const lineHeight = 0.5; // Proper line height for bullets
        const startY = 1.4; // Start below the divider
        
        slideData.content.slice(0, maxItems).forEach((text, index) => {
            const yPos = startY + (index * lineHeight);
            
            // Bullet point
            slide.addText('•', {
                x: contentX, y: yPos, w: 0.3, h: 0.4,
                fontSize: 14,
                color: secondaryColor,
                fontFace: 'Arial',
                valign: 'middle'
            });
            
            // Text content with proper spacing
            const textLength = text.length;
            const textSize = textLength > 80 ? 11 : textLength > 60 ? 12 : textLength > 40 ? 13 : 14;
            
            slide.addText(cleanMarkdown(text), {
                x: contentX + 0.3, y: yPos, w: contentWidth - 0.3, h: 0.4,
                fontSize: textSize,
                color: '374151',
                fontFace: 'Arial',
                wrap: true,
                valign: 'middle',
                lineSpacing: 18
            });
        });
    }

    // Image
    if (hasImage) {
        slide.addImage({
            data: imageBase64,
            x: imageX, y: 1, w: 3.9, h: 3.75,
            rounding: false,
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
