"use client";

import React from 'react';
import {
    Store, LayoutDashboard, BarChart3, ShoppingCart, CreditCard, Truck, Package, Users, Headphones,
    Palette, Search, Filter, Settings, Shield, Zap, Smartphone, Plug, Bot,
    FileText, Mail, Bell, MessageSquare, Share2, Link,
    TrendingUp, ClipboardList, Target, CheckCircle, Star,
    Lightbulb, Rocket, Globe, Heart, Award, Clock, Calendar, Key, Circle,
    Building, Home, MapPin, Phone, Camera, Video, Music, Image, Folder, Database,
    Cloud, Lock, Unlock, Eye, EyeOff, Edit, Trash, Plus, Minus, X, Check,
    ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ChevronRight, ChevronLeft,
    User, UserPlus, UserMinus, UserCheck, Briefcase, GraduationCap, BookOpen,
    Cpu, Code, Terminal, Wifi, Bluetooth, Battery, Monitor, Printer,
    Gift, Coffee, Utensils, ShoppingBag, Bookmark, Flag, Tag, Hash,
    AlertCircle, AlertTriangle, Info, HelpCircle, XCircle,
    Play, Pause, Square, SkipBack, SkipForward, Volume2, VolumeX,
    Sun, Moon, CloudRain, Snowflake, Wind, Thermometer, Umbrella,
    Map, Navigation, Compass, Anchor, Send, Download, Upload, RefreshCw,
    type LucideIcon
} from 'lucide-react';

// Icon mapping - comprehensive list for AI-generated content
const ICON_COMPONENTS: Record<string, LucideIcon> = {
    // Business & Commerce
    storefront: Store,
    store: Store,
    shop: Store,
    dashboard: LayoutDashboard,
    analytics: BarChart3,
    barchart: BarChart3,
    cart: ShoppingCart,
    shoppingcart: ShoppingCart,
    payment: CreditCard,
    creditcard: CreditCard,
    shipping: Truck,
    truck: Truck,
    inventory: Package,
    package: Package,
    customer: Users,
    customers: Users,
    users: Users,
    support: Headphones,
    headphones: Headphones,
    briefcase: Briefcase,

    // Design & UI
    design: Palette,
    palette: Palette,
    search: Search,
    filter: Filter,
    settings: Settings,
    edit: Edit,
    trash: Trash,

    // Security
    security: Shield,
    shield: Shield,
    lock: Lock,
    unlock: Unlock,
    key: Key,

    // Performance
    speed: Zap,
    zap: Zap,
    lightning: Zap,

    // Technology
    mobile: Smartphone,
    smartphone: Smartphone,
    phone: Phone,
    integration: Plug,
    plug: Plug,
    automation: Bot,
    bot: Bot,
    robot: Bot,
    cpu: Cpu,
    code: Code,
    terminal: Terminal,
    wifi: Wifi,
    bluetooth: Bluetooth,
    monitor: Monitor,
    printer: Printer,
    cloud: Cloud,
    database: Database,

    // Communication
    document: FileText,
    filetext: FileText,
    file: FileText,
    email: Mail,
    mail: Mail,
    notification: Bell,
    bell: Bell,
    chat: MessageSquare,
    messagesquare: MessageSquare,
    message: MessageSquare,
    share: Share2,
    link: Link,
    send: Send,

    // Charts & Data
    chart: TrendingUp,
    trendingup: TrendingUp,
    report: ClipboardList,
    clipboardlist: ClipboardList,
    growth: TrendingUp,

    // Goals & Success
    target: Target,
    bullseye: Target,
    check: CheckCircle,
    checkcircle: CheckCircle,
    checkmark: Check,
    star: Star,
    award: Award,
    trophy: Award,

    // Ideas & Innovation
    idea: Lightbulb,
    lightbulb: Lightbulb,
    bulb: Lightbulb,
    rocket: Rocket,
    launch: Rocket,

    // World & Location
    globe: Globe,
    world: Globe,
    earth: Globe,
    international: Globe,
    map: Map,
    mappin: MapPin,
    location: MapPin,
    navigation: Navigation,
    compass: Compass,

    // Emotions & Social
    heart: Heart,
    love: Heart,
    like: Heart,

    // Time
    clock: Clock,
    time: Clock,
    calendar: Calendar,
    date: Calendar,

    // People & Education
    user: User,
    person: User,
    userplus: UserPlus,
    usercheck: UserCheck,
    graduation: GraduationCap,
    graduationcap: GraduationCap,
    education: GraduationCap,
    book: BookOpen,
    bookopen: BookOpen,

    // Places & Buildings
    building: Building,
    office: Building,
    home: Home,
    house: Home,

    // Media
    camera: Camera,
    video: Video,
    music: Music,
    image: Image,
    photo: Image,
    play: Play,
    pause: Pause,

    // Organization
    folder: Folder,
    bookmark: Bookmark,
    flag: Flag,
    tag: Tag,
    hash: Hash,

    // Food & Lifestyle
    gift: Gift,
    present: Gift,
    coffee: Coffee,
    food: Utensils,
    utensils: Utensils,
    shopping: ShoppingBag,
    shoppingbag: ShoppingBag,

    // Alerts & Info
    alert: AlertCircle,
    alertcircle: AlertCircle,
    warning: AlertTriangle,
    alerttriangle: AlertTriangle,
    info: Info,
    help: HelpCircle,
    helpcircle: HelpCircle,
    error: XCircle,
    xcircle: XCircle,

    // Actions
    download: Download,
    upload: Upload,
    refresh: RefreshCw,
    refreshcw: RefreshCw,
    plus: Plus,
    add: Plus,
    minus: Minus,
    remove: Minus,
    close: X,
    x: X,

    // Arrows
    arrowright: ArrowRight,
    arrowleft: ArrowLeft,
    arrowup: ArrowUp,
    arrowdown: ArrowDown,

    // Weather (for varied presentations)
    sun: Sun,
    moon: Moon,
    rain: CloudRain,
    snow: Snowflake,
    wind: Wind,
    temperature: Thermometer,
    thermometer: Thermometer,
    umbrella: Umbrella,

    // Default
    default: Circle,
    circle: Circle,
};

// Feature color palette
const FEATURE_COLORS = [
    { bg: 'bg-pink-100 dark:bg-pink-900/30', icon: 'text-pink-500' },
    { bg: 'bg-purple-100 dark:bg-purple-900/30', icon: 'text-purple-500' },
    { bg: 'bg-blue-100 dark:bg-blue-900/30', icon: 'text-blue-500' },
    { bg: 'bg-cyan-100 dark:bg-cyan-900/30', icon: 'text-cyan-500' },
    { bg: 'bg-green-100 dark:bg-green-900/30', icon: 'text-green-500' },
    { bg: 'bg-orange-100 dark:bg-orange-900/30', icon: 'text-orange-500' },
];

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
    description?: string;
}

interface SlideData {
    title: string;
    layoutType?: string;
    content?: string[];
    subtitle?: string;
    comparison?: {
        left: ComparisonColumn;
        right: ComparisonColumn;
    };
    features?: FeatureCard[];
    metrics?: Metric[];
    hasImage?: boolean;
    imageUrl?: string;
}

interface SlidePreviewProps {
    slide: SlideData;
    slideIndex: number;
    totalSlides: number;
    theme: {
        primary: string;
        secondary: string;
        accent: string;
    };
    isActive?: boolean;
}

// Helper to get icon component
const getIcon = (iconName: string): LucideIcon => {
    return ICON_COMPONENTS[iconName?.toLowerCase()] || ICON_COMPONENTS.default;
};

// Helper to clean markdown
const cleanMarkdown = (text: string): string => {
    return text
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/#+\s*/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim();
};

export default function SlidePreview({ slide, slideIndex, totalSlides, theme, isActive = false }: SlidePreviewProps) {
    const layoutType = slide.layoutType || 'imageRight';
    const isFirstSlide = slideIndex === 0;
    const isLastSlide = slideIndex === totalSlides - 1;

    // Title slide layout - Gamma AI elegant style
    if (layoutType === 'title' || isFirstSlide) {
        return (
            <div
                className="w-full h-full rounded-xl overflow-hidden relative"
                style={{
                    background: `linear-gradient(135deg, #fef7f0 0%, #fdf2f8 50%, #f0f9ff 100%)`
                }}
            >
                {/* Decorative corner shapes */}
                <div
                    className="absolute top-0 right-0 w-48 h-48 opacity-60"
                    style={{
                        background: `radial-gradient(circle at 100% 0%, ${theme.primary}30 0%, transparent 70%)`
                    }}
                />
                <div
                    className="absolute bottom-0 left-0 w-32 h-32 opacity-40"
                    style={{
                        background: `radial-gradient(circle at 0% 100%, ${theme.secondary}40 0%, transparent 70%)`
                    }}
                />

                <div className="p-10 h-full flex">
                    <div className="flex-1 flex flex-col justify-center">
                        <h1
                            className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
                            style={{ color: theme.primary }}
                        >
                            {slide.title}
                        </h1>
                        {slide.subtitle && (
                            <p className="text-lg text-slate-600 mb-6">{slide.subtitle}</p>
                        )}
                        {slide.content && slide.content.length > 0 && (
                            <div className="space-y-2 max-w-xl">
                                {slide.content.map((point, i) => (
                                    <p key={i} className="text-base text-slate-700 leading-relaxed">{cleanMarkdown(point)}</p>
                                ))}
                            </div>
                        )}
                    </div>
                    {slide.hasImage !== false && slide.imageUrl && (
                        <div className="w-2/5 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={slide.imageUrl}
                                alt={slide.title}
                                className="max-w-full max-h-full rounded-2xl shadow-2xl object-cover"
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Closing slide layout - Gamma AI elegant style
    if (layoutType === 'closing' || isLastSlide) {
        return (
            <div
                className="w-full h-full rounded-xl overflow-hidden relative flex flex-col items-center justify-center text-center"
                style={{
                    background: `linear-gradient(135deg, #fef7f0 0%, #fdf2f8 50%, #f0f9ff 100%)`
                }}
            >
                {/* Decorative shapes */}
                <div
                    className="absolute top-0 left-0 w-40 h-40 opacity-40"
                    style={{
                        background: `radial-gradient(circle at 0% 0%, ${theme.primary}30 0%, transparent 70%)`
                    }}
                />
                <div
                    className="absolute bottom-0 right-0 w-40 h-40 opacity-40"
                    style={{
                        background: `radial-gradient(circle at 100% 100%, ${theme.secondary}30 0%, transparent 70%)`
                    }}
                />

                <h1
                    className="text-4xl md:text-5xl font-bold mb-4"
                    style={{ color: theme.primary }}
                >
                    {slide.title}
                </h1>
                <div className="w-32 h-1 rounded-full mb-6" style={{ backgroundColor: theme.accent }} />
                {slide.content && slide.content.length > 0 && (
                    <div className="space-y-3 max-w-2xl">
                        {slide.content.map((point, i) => (
                            <p key={i} className="text-lg text-slate-600">{cleanMarkdown(point)}</p>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Comparison slide layout - Gamma AI elegant style
    if (layoutType === 'comparison') {
        return (
            <div
                className="w-full h-full rounded-xl overflow-hidden relative"
                style={{
                    background: `linear-gradient(180deg, #ffffff 0%, #fef7f0 50%, #fdf2f8 100%)`
                }}
            >
                <div className="p-6 h-full flex flex-col justify-center">
                    <h2
                        className="text-2xl font-bold mb-6 text-center"
                        style={{ color: theme.primary }}
                    >
                        {slide.title}
                    </h2>

                    {slide.comparison ? (
                        <div className="grid grid-cols-2 gap-5">
                            {/* Left column - pink tint */}
                            <div
                                className="rounded-xl p-5"
                                style={{
                                    background: 'linear-gradient(135deg, #fce7f380 0%, #fbcfe850 100%)',
                                    border: '1px solid #fce7f3'
                                }}
                            >
                                <h3 className="font-bold text-lg mb-4" style={{ color: '#db2777' }}>{slide.comparison.left.heading}</h3>
                                <ul className="space-y-3">
                                    {slide.comparison.left.points.slice(0, 4).map((point, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <span className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#ec4899' }} />
                                            <span className="text-sm text-slate-700 leading-relaxed">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Right column - purple tint */}
                            <div
                                className="rounded-xl p-5"
                                style={{
                                    background: 'linear-gradient(135deg, #ede9fe80 0%, #ddd6fe50 100%)',
                                    border: '1px solid #ede9fe'
                                }}
                            >
                                <h3 className="font-bold text-lg mb-4" style={{ color: '#7c3aed' }}>{slide.comparison.right.heading}</h3>
                                <ul className="space-y-3">
                                    {slide.comparison.right.points.slice(0, 4).map((point, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <span className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#8b5cf6' }} />
                                            <span className="text-sm text-slate-700 leading-relaxed">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : slide.content && slide.content.length > 1 ? (
                        <div className="grid grid-cols-2 gap-5">
                            <div
                                className="rounded-xl p-5"
                                style={{
                                    background: 'linear-gradient(135deg, #fce7f380 0%, #fbcfe850 100%)',
                                    border: '1px solid #fce7f3'
                                }}
                            >
                                <ul className="space-y-3">
                                    {slide.content.slice(0, Math.ceil(slide.content.length / 2)).map((point, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <span className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#ec4899' }} />
                                            <span className="text-sm text-slate-700">{cleanMarkdown(point)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div
                                className="rounded-xl p-5"
                                style={{
                                    background: 'linear-gradient(135deg, #ede9fe80 0%, #ddd6fe50 100%)',
                                    border: '1px solid #ede9fe'
                                }}
                            >
                                <ul className="space-y-3">
                                    {slide.content.slice(Math.ceil(slide.content.length / 2)).map((point, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <span className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#8b5cf6' }} />
                                            <span className="text-sm text-slate-700">{cleanMarkdown(point)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        );
    }

    // Features slide layout - Gamma AI elegant style
    if (layoutType === 'features') {
        // Gradient backgrounds for feature cards - Gamma AI style with icons above cards
        const CARD_COLORS = [
            { bg: '#fce7f3', border: '#fbcfe8', icon: '#ec4899', iconBg: 'linear-gradient(135deg, #f9a8d4 0%, #ec4899 100%)' },
            { bg: '#ede9fe', border: '#ddd6fe', icon: '#8b5cf6', iconBg: 'linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 100%)' },
            { bg: '#dbeafe', border: '#bfdbfe', icon: '#3b82f6', iconBg: 'linear-gradient(135deg, #93c5fd 0%, #3b82f6 100%)' },
            { bg: '#ccfbf1', border: '#99f6e4', icon: '#14b8a6', iconBg: 'linear-gradient(135deg, #5eead4 0%, #14b8a6 100%)' },
            { bg: '#fef3c7', border: '#fde68a', icon: '#f59e0b', iconBg: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)' },
            { bg: '#fee2e2', border: '#fecaca', icon: '#ef4444', iconBg: 'linear-gradient(135deg, #fca5a5 0%, #ef4444 100%)' },
        ];

        const featureCount = slide.features?.length || slide.content?.length || 0;
        // Use 2 columns for 4 items, 3 columns otherwise
        const gridCols = featureCount === 4 ? 'grid-cols-2' : 'grid-cols-3';

        return (
            <div
                className="w-full h-full rounded-xl overflow-hidden relative"
                style={{
                    background: `linear-gradient(180deg, #ffffff 0%, #fef7f0 100%)`
                }}
            >
                <div className="p-6 h-full flex flex-col justify-center">
                    <h2
                        className="text-2xl font-bold mb-6 text-center"
                        style={{ color: theme.primary }}
                    >
                        {slide.title}
                    </h2>

                    {slide.features && slide.features.length > 0 ? (
                        <div className={`grid ${gridCols} gap-x-4 gap-y-6 max-w-4xl mx-auto auto-rows-fr`}>
                            {slide.features.slice(0, 6).map((feature, i) => {
                                const Icon = getIcon(feature.icon);
                                const cardStyle = CARD_COLORS[i % CARD_COLORS.length];
                                return (
                                    <div
                                        key={i}
                                        className="relative pt-7 flex flex-col"
                                    >
                                        {/* Icon circle positioned above card */}
                                        <div
                                            className="absolute left-1/2 -translate-x-1/2 top-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-10"
                                            style={{ background: cardStyle.iconBg }}
                                        >
                                            <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                                        </div>

                                        {/* Card body - stretches to fill */}
                                        <div
                                            className="rounded-xl p-4 pt-8 flex flex-col items-center text-center flex-1"
                                            style={{
                                                background: cardStyle.bg,
                                                border: `1px solid ${cardStyle.border}`
                                            }}
                                        >
                                            <h4 className="font-bold text-sm text-slate-800 mb-1">{feature.title}</h4>
                                            <p className="text-xs text-slate-600 leading-snug">{feature.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : slide.content && slide.content.length > 1 ? (
                        <div className={`grid ${gridCols} gap-x-4 gap-y-6 max-w-4xl mx-auto auto-rows-fr`}>
                            {slide.content.slice(0, 6).map((item, i) => {
                                const cardStyle = CARD_COLORS[i % CARD_COLORS.length];
                                return (
                                    <div key={i} className="relative pt-7 flex flex-col">
                                        <div
                                            className="absolute left-1/2 -translate-x-1/2 top-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-10"
                                            style={{ background: cardStyle.iconBg }}
                                        >
                                            <CheckCircle className="w-5 h-5 text-white" strokeWidth={1.5} />
                                        </div>
                                        <div
                                            className="rounded-xl p-4 pt-8 flex flex-col items-center text-center flex-1"
                                            style={{
                                                background: cardStyle.bg,
                                                border: `1px solid ${cardStyle.border}`
                                            }}
                                        >
                                            <p className="text-xs text-slate-700 leading-snug">{cleanMarkdown(item)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}
                </div>
            </div>
        );
    }

    // Metrics slide layout - Gamma AI elegant style
    if (layoutType === 'metrics') {
        // Colors for metrics - Gamma AI style
        const METRIC_COLORS = [
            { value: '#3b82f6', bg: '#dbeafe', border: '#93c5fd' },
            { value: '#8b5cf6', bg: '#ede9fe', border: '#c4b5fd' },
            { value: '#ec4899', bg: '#fce7f3', border: '#f9a8d4' },
        ];

        return (
            <div
                className="w-full h-full rounded-xl overflow-hidden relative"
                style={{
                    background: `linear-gradient(180deg, #ffffff 0%, #f0f9ff 50%, #fdf2f8 100%)`
                }}
            >
                <div className="p-6 h-full flex flex-col justify-center">
                    <h2
                        className="text-2xl font-bold mb-6 text-center"
                        style={{ color: theme.primary }}
                    >
                        {slide.title}
                    </h2>

                    {slide.metrics && slide.metrics.length > 0 ? (
                        <div className="flex gap-4">
                            {slide.metrics.slice(0, 3).map((metric, i) => {
                                const style = METRIC_COLORS[i % METRIC_COLORS.length];
                                return (
                                    <div
                                        key={i}
                                        className="flex-1 rounded-xl p-6 text-center"
                                        style={{
                                            background: style.bg,
                                            border: `1px solid ${style.border}`
                                        }}
                                    >
                                        <div
                                            className="text-5xl font-bold mb-2"
                                            style={{ color: style.value }}
                                        >
                                            {metric.value}
                                        </div>
                                        <div className="text-base font-semibold text-slate-800 mb-2">{metric.label}</div>
                                        {metric.description && (
                                            <p className="text-sm text-slate-600 leading-relaxed">{metric.description}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}
                </div>
            </div>
        );
    }

    // IconList slide layout - Gamma AI style
    if (layoutType === 'iconList') {
        // Parse content to handle icon-point objects with title extraction
        const parseIconListContent = (content: any[]): { icon: string; title: string; description: string }[] => {
            if (!content || content.length === 0) return [];

            return content.map((item) => {
                let icon = 'check';
                let text = '';

                // If it's already an object with icon and point
                if (typeof item === 'object' && item !== null && item.point) {
                    icon = item.icon || 'check';
                    text = item.point;
                }
                // If it's a string that looks like JSON
                else if (typeof item === 'string') {
                    if (item.trim().startsWith('{')) {
                        try {
                            const parsed = JSON.parse(item);
                            if (parsed.point) {
                                icon = parsed.icon || 'check';
                                text = parsed.point;
                            }
                        } catch (e) {
                            text = item;
                        }
                    } else {
                        text = item;
                    }
                } else {
                    text = String(item);
                }

                // Extract title and description from text
                // Try to split on common separators: colon, dash, period after first few words
                let title = '';
                let description = text;

                // Check for colon separator
                const colonIndex = text.indexOf(':');
                if (colonIndex > 0 && colonIndex < 60) {
                    title = text.substring(0, colonIndex).trim();
                    description = text.substring(colonIndex + 1).trim();
                }
                // Check for " - " separator
                else if (text.includes(' - ')) {
                    const dashIndex = text.indexOf(' - ');
                    if (dashIndex > 0 && dashIndex < 60) {
                        title = text.substring(0, dashIndex).trim();
                        description = text.substring(dashIndex + 3).trim();
                    }
                }
                // If no separator found, use first sentence or first few words as title
                else {
                    const periodIndex = text.indexOf('.');
                    if (periodIndex > 0 && periodIndex < 60) {
                        title = text.substring(0, periodIndex).trim();
                        description = text.substring(periodIndex + 1).trim();
                    } else {
                        // Use first 5 words as title
                        const words = text.split(' ');
                        if (words.length > 5) {
                            title = words.slice(0, 4).join(' ');
                            description = words.slice(4).join(' ');
                        } else {
                            title = text;
                            description = '';
                        }
                    }
                }

                return { icon, title: cleanMarkdown(title), description: cleanMarkdown(description) };
            });
        };

        // Gradient backgrounds for icon boxes - matching Gamma AI style
        const ICON_GRADIENTS = [
            'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)', // Pink
            'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #c4b5fd 100%)', // Purple
            'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)', // Blue
            'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 50%, #5eead4 100%)', // Teal
            'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)', // Yellow
            'linear-gradient(135deg, #ffedd5 0%, #fed7aa 50%, #fdba74 100%)', // Orange
        ];

        const ICON_COLORS = [
            '#db2777', // Pink
            '#7c3aed', // Purple  
            '#2563eb', // Blue
            '#0d9488', // Teal
            '#d97706', // Yellow/Amber
            '#ea580c', // Orange
        ];

        const iconListItems = parseIconListContent(slide.content || []);

        return (
            <div
                className="w-full h-full rounded-xl overflow-hidden relative"
                style={{
                    background: `linear-gradient(180deg, #ffffff 0%, #fef7f0 100%)`
                }}
            >
                <div className="p-6 h-full flex items-center gap-6">
                    <div className="flex-1">
                        <h2
                            className="text-2xl font-bold mb-5"
                            style={{ color: theme.primary }}
                        >
                            {slide.title}
                        </h2>

                        {iconListItems.length > 0 && (
                            <div className="space-y-4">
                                {iconListItems.slice(0, 4).map((item, i) => {
                                    const IconComponent = getIcon(item.icon);
                                    const gradient = ICON_GRADIENTS[i % ICON_GRADIENTS.length];
                                    const iconColor = ICON_COLORS[i % ICON_COLORS.length];

                                    return (
                                        <div key={i} className="flex items-center gap-4">
                                            {/* Icon box */}
                                            <div
                                                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                                                style={{ background: gradient }}
                                            >
                                                <IconComponent
                                                    className="w-5 h-5"
                                                    style={{ color: iconColor }}
                                                    strokeWidth={1.5}
                                                />
                                            </div>

                                            {/* Text content */}
                                            <div className="flex-1">
                                                <h4 className="font-bold text-base text-slate-800">
                                                    {item.title}
                                                </h4>
                                                {item.description && (
                                                    <p className="text-sm text-slate-600 leading-snug">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {slide.hasImage !== false && slide.imageUrl && (
                        <div className="w-2/5 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={slide.imageUrl}
                                alt={slide.title}
                                className="max-w-full max-h-[320px] rounded-2xl shadow-xl object-cover"
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (layoutType === 'imageLeft') {
        return (
            <div
                className="w-full h-full rounded-xl overflow-hidden relative"
                style={{
                    background: `linear-gradient(180deg, #ffffff 0%, #f0f9ff 50%, #fdf2f8 100%)`
                }}
            >
                <div className="p-8 h-full flex items-center gap-8">
                    {slide.hasImage !== false && slide.imageUrl && (
                        <div className="w-2/5 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={slide.imageUrl}
                                alt={slide.title}
                                className="max-w-full max-h-[280px] rounded-2xl shadow-xl object-cover"
                            />
                        </div>
                    )}

                    <div className="flex-1 flex flex-col justify-center">
                        <h2
                            className="text-2xl font-bold mb-4"
                            style={{ color: theme.primary }}
                        >
                            {slide.title}
                        </h2>

                        {slide.content && slide.content.length > 0 && (
                            <ul className="space-y-3">
                                {slide.content.slice(0, 4).map((point, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span
                                            className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                            style={{ backgroundColor: theme.accent }}
                                        />
                                        <span className="text-sm text-slate-700 leading-relaxed">{cleanMarkdown(point)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Default: ImageRight / TextOnly slide layout - Gamma AI elegant style
    return (
        <div
            className="w-full h-full rounded-xl overflow-hidden relative"
            style={{
                background: `linear-gradient(180deg, #ffffff 0%, #fef7f0 50%, #fdf2f8 100%)`
            }}
        >
            <div className="p-8 h-full flex items-center gap-8">
                <div className="flex-1 flex flex-col justify-center">
                    <h2
                        className="text-2xl font-bold mb-4"
                        style={{ color: theme.primary }}
                    >
                        {slide.title}
                    </h2>

                    {slide.content && slide.content.length > 0 && (
                        <ul className="space-y-3">
                            {slide.content.slice(0, 4).map((point, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span
                                        className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                        style={{ backgroundColor: theme.accent }}
                                    />
                                    <span className="text-sm text-slate-700 leading-relaxed">{cleanMarkdown(point)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {slide.hasImage !== false && slide.imageUrl && layoutType !== 'textOnly' && (
                    <div className="w-2/5 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={slide.imageUrl}
                            alt={slide.title}
                            className="max-w-full max-h-[280px] rounded-2xl shadow-xl object-cover"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
