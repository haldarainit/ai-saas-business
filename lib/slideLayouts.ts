// Slide Layout Types and Utilities for Gamma-style Presentations

export type SlideLayoutType =
    | 'title'           // Opening slide with title and subtitle
    | 'comparison'      // Two-column comparison (Traditional vs Solution)
    | 'features'        // Feature cards grid with icons
    | 'imageLeft'       // Image on left, text on right
    | 'imageRight'      // Image on right, text on left
    | 'imageTop'        // Full-width image on top
    | 'metrics'         // Stats/numbers showcase
    | 'iconList'        // List with icons for each point
    | 'textOnly'        // Text-only content slides
    | 'closing';        // Thank you / CTA slide

export interface FeatureCard {
    icon: string;       // Icon name (from lucide-react)
    title: string;
    description: string;
}

export interface ComparisonColumn {
    heading: string;
    points: string[];
}

export interface Metric {
    value: string;      // e.g., "Real..", "360°", "Smart"
    label: string;      // e.g., "Live Metrics"
    description: string;
}

export interface EnhancedSlide {
    title: string;
    layoutType: SlideLayoutType;
    content?: string[];
    features?: FeatureCard[];
    comparison?: {
        left: ComparisonColumn;
        right: ComparisonColumn;
    };
    metrics?: Metric[];
    imageKeyword?: string;
    imageUrl?: string;
    imagePosition?: 'left' | 'right' | 'top' | 'bottom' | 'none';
    subtitle?: string;  // For title slides
    accentColor?: string; // Specific slide accent color
}

export interface EnhancedPresentationData {
    title: string;
    slides: EnhancedSlide[];
    theme?: {
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        backgroundColor: string;
    };
}

// Icon mapping for feature cards
export const ICON_MAP: Record<string, string> = {
    // Business & E-commerce
    'storefront': 'Store',
    'dashboard': 'LayoutDashboard',
    'analytics': 'BarChart3',
    'cart': 'ShoppingCart',
    'payment': 'CreditCard',
    'shipping': 'Truck',
    'inventory': 'Package',
    'customer': 'Users',
    'support': 'HeadphonesIcon',

    // Features & Actions
    'design': 'Palette',
    'search': 'Search',
    'filter': 'Filter',
    'settings': 'Settings',
    'security': 'Shield',
    'speed': 'Zap',
    'mobile': 'Smartphone',
    'integration': 'Plug',
    'automation': 'Bot',

    // Content & Communication
    'document': 'FileText',
    'email': 'Mail',
    'notification': 'Bell',
    'chat': 'MessageSquare',
    'share': 'Share2',
    'link': 'Link',

    // Data & Metrics
    'chart': 'TrendingUp',
    'report': 'ClipboardList',
    'growth': 'TrendingUp',
    'target': 'Target',
    'check': 'CheckCircle',
    'star': 'Star',

    // General
    'idea': 'Lightbulb',
    'rocket': 'Rocket',
    'globe': 'Globe',
    'heart': 'Heart',
    'award': 'Award',
    'clock': 'Clock',
    'calendar': 'Calendar',
    'key': 'Key',

    // Default
    'default': 'Circle',
};

// Determine best layout based on slide content type
export function suggestLayout(slideIndex: number, totalSlides: number, content: string[], title: string): SlideLayoutType {
    const lowerTitle = title.toLowerCase();

    // First slide is always title
    if (slideIndex === 0) return 'title';

    // Last slide is closing
    if (slideIndex === totalSlides - 1) return 'closing';

    // Check for comparison-related keywords
    if (lowerTitle.includes('vs') ||
        lowerTitle.includes('traditional') ||
        lowerTitle.includes('comparison') ||
        lowerTitle.includes('difference') ||
        lowerTitle.includes('problem') ||
        lowerTitle.includes('challenge')) {
        return 'comparison';
    }

    // Check for feature-related keywords
    if (lowerTitle.includes('feature') ||
        lowerTitle.includes('benefit') ||
        lowerTitle.includes('advantage') ||
        lowerTitle.includes('built to') ||
        lowerTitle.includes('why choose')) {
        return 'features';
    }

    // Check for metrics/stats keywords
    if (lowerTitle.includes('metric') ||
        lowerTitle.includes('number') ||
        lowerTitle.includes('stat') ||
        lowerTitle.includes('result') ||
        lowerTitle.includes('performance') ||
        lowerTitle.includes('data')) {
        return 'metrics';
    }

    // Alternate between image positions for visual variety
    const slidePosition = slideIndex % 4;
    switch (slidePosition) {
        case 0: return 'imageRight';
        case 1: return 'iconList';
        case 2: return 'imageLeft';
        case 3: return 'features';
        default: return 'imageRight';
    }
}

// Color palette for feature icons (Gamma-style pink/purple theme)
export const FEATURE_COLORS = [
    { bg: 'rgba(236, 72, 153, 0.15)', icon: '#ec4899' },  // Pink
    { bg: 'rgba(168, 85, 247, 0.15)', icon: '#a855f7' },  // Purple
    { bg: 'rgba(59, 130, 246, 0.15)', icon: '#3b82f6' },  // Blue
    { bg: 'rgba(6, 182, 212, 0.15)', icon: '#06b6d4' },   // Cyan
    { bg: 'rgba(34, 197, 94, 0.15)', icon: '#22c55e' },   // Green
    { bg: 'rgba(249, 115, 22, 0.15)', icon: '#f97316' },  // Orange
];

export function getFeatureColor(index: number) {
    return FEATURE_COLORS[index % FEATURE_COLORS.length];
}
