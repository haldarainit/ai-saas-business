"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
    Download,
    Loader2,
    Sparkles,
    Presentation,
    ArrowLeft,
    ArrowRight,
    Edit3,
    Check,
    X,
    Palette,
    LayoutGrid,
    FileText,
    Globe,
    Share2,
    ChevronDown,
    RefreshCw,
    Plus,
    Trash2,
    Image as ImageIcon,
    Type,
    GripVertical,
    Eye,
    Settings,
    FolderOpen,
    Save,
    Wand2,
    Upload,
    Move,
    Maximize2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { AuthModal } from "@/components/auth-modal";
import PresentationDashboard from "./components/PresentationDashboard";
import SlidePreview from "./components/SlidePreview";
import SlideEditorPanel from "./components/SlideEditorPanel";
import AIRegeneratePanel from "./components/AIRegeneratePanel";

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

type SlideLayoutType = 'title' | 'comparison' | 'features' | 'imageRight' | 'imageLeft' | 'metrics' | 'iconList' | 'textOnly' | 'closing';

interface Slide {
    title: string;
    content?: string[];
    layoutType?: SlideLayoutType;
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
    // New fields for image upload and resize
    imagePublicId?: string;
    imageSource?: 'ai' | 'upload';
    imageSize?: {
        width?: number; // percentage 10-100
        height?: number; // percentage 10-100
        objectFit?: 'cover' | 'contain' | 'fill' | 'none';
    };
    customStyles?: {
        backgroundColor?: string;
        headingColor?: string;
        textColor?: string;
        accentColor?: string;
        borderRadius?: number;
        hasBackdrop?: boolean;
        backdropColor?: string;
        backdropOpacity?: number;
    };
}

interface PresentationData {
    title: string;
    slides: Slide[];
}

type Step = "input" | "outline" | "generating" | "preview";
type Theme = "warmCoral" | "softPeach" | "blushRose" | "goldenSand" | "mintBreeze" | "lavenderMist" | "skySerenity" | "neutralElegance";

// Beautiful, soothing color palettes inspired by Gamma AI - warm, soft tones that are easy on the eyes
const THEMES: { id: Theme; name: string; colors: { primary: string; secondary: string; accent: string; bg: string; bgSecondary: string } }[] = [
    {
        id: "warmCoral",
        name: "Warm Coral",
        colors: {
            primary: "#b64b6e",      // Deep magenta-coral for headings
            secondary: "#d4847c",    // Soft coral
            accent: "#e8a87c",       // Peachy accent
            bg: "#faf5f0",           // Warm cream background
            bgSecondary: "#f5ebe0"   // Slightly warmer cream
        }
    },
    {
        id: "softPeach",
        name: "Soft Peach",
        colors: {
            primary: "#c56b54",      // Warm terracotta
            secondary: "#e8a87c",    // Peachy
            accent: "#f4c9a8",       // Light peach
            bg: "#fdf8f3",           // Cream
            bgSecondary: "#f9ede3"   // Warm beige
        }
    },
    {
        id: "blushRose",
        name: "Blush Rose",
        colors: {
            primary: "#a85672",      // Dusty rose
            secondary: "#d4848f",    // Soft pink
            accent: "#e8b4bc",       // Light rose
            bg: "#fdf6f7",           // Soft pink-tinted cream
            bgSecondary: "#f9ebee"   // Rose cream
        }
    },
    {
        id: "goldenSand",
        name: "Golden Sand",
        colors: {
            primary: "#9a6b4a",      // Warm brown
            secondary: "#c9a66b",    // Golden
            accent: "#e8d4a8",       // Sandy
            bg: "#faf8f2",           // Warm ivory
            bgSecondary: "#f5f0e3"   // Light sand
        }
    },
    {
        id: "mintBreeze",
        name: "Mint Breeze",
        colors: {
            primary: "#3d7a6a",      // Deep sage
            secondary: "#6ba894",    // Soft mint
            accent: "#a8d4c2",       // Light mint
            bg: "#f5faf8",           // Mint-tinted cream
            bgSecondary: "#e8f5ef"   // Soft green
        }
    },
    {
        id: "lavenderMist",
        name: "Lavender Mist",
        colors: {
            primary: "#6b5b8c",      // Deep lavender
            secondary: "#9b8cb8",    // Soft purple
            accent: "#c8bdd8",       // Light lavender
            bg: "#f9f7fc",           // Lavender-tinted cream
            bgSecondary: "#f0ebf5"   // Soft purple
        }
    },
    {
        id: "skySerenity",
        name: "Sky Serenity",
        colors: {
            primary: "#456b8a",      // Dusty blue
            secondary: "#7899b4",    // Soft blue
            accent: "#a8c4d8",       // Light sky
            bg: "#f5f9fc",           // Blue-tinted cream
            bgSecondary: "#e8f1f8"   // Soft blue
        }
    },
    {
        id: "neutralElegance",
        name: "Neutral Elegance",
        colors: {
            primary: "#5a5a5a",      // Warm gray
            secondary: "#8a8a8a",    // Medium gray
            accent: "#b8b8b8",       // Light gray
            bg: "#fafafa",           // Off-white
            bgSecondary: "#f0f0f0"   // Light gray
        }
    },
];

const EXAMPLE_PROMPTS = [
    { icon: FileText, title: "Quarterly Business Review", subtitle: "for stakeholders" },
    { icon: Globe, title: "Digital Marketing Strategy", subtitle: "2024 campaign" },
    { icon: Presentation, title: "Startup Pitch Deck", subtitle: "for investors" },
    { icon: LayoutGrid, title: "Product Launch Plan", subtitle: "go-to-market strategy" },
    { icon: Share2, title: "Team Training Session", subtitle: "onboarding program" },
    { icon: Sparkles, title: "Annual Company Report", subtitle: "achievements & goals" },
];

// Helper function to clean up markdown formatting from AI-generated content
const cleanMarkdown = (text: string): string => {
    return text
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
        .replace(/\*([^*]+)\*/g, '$1')     // Remove *italic*
        .replace(/__([^_]+)__/g, '$1')     // Remove __bold__
        .replace(/_([^_]+)_/g, '$1')       // Remove _italic_
        .replace(/_([^_]+)_/g, '$1')       // Remove _italic*
        .replace(/`([^`]+)`/g, '$1')       // Remove `code`
        .replace(/#+\s*/g, '')             // Remove # headings
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove [link](url) -> link
        .trim();
};


function PresentationsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const { resolvedTheme } = useTheme();

    // Mounted state to prevent hydration mismatch - theme is only available on client
    const [mounted, setMounted] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);

    // Only use theme on client to prevent hydration mismatch
    const isDark = mounted && resolvedTheme === 'dark';

    // Workspace state
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Presentation state
    const [step, setStep] = useState<Step>("input");
    const [prompt, setPrompt] = useState("");
    const [slideCount, setSlideCount] = useState(8);
    const [theme, setTheme] = useState<Theme>("warmCoral");
    const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
    const [isGeneratingFull, setIsGeneratingFull] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [outline, setOutline] = useState<PresentationData | null>(null);
    const [data, setData] = useState<PresentationData | null>(null);
    const [activeSlide, setActiveSlide] = useState(0);
    const [editingSlide, setEditingSlide] = useState<number | null>(null);
    const [editingField, setEditingField] = useState<{ slide: number; field: 'title' | 'content' | 'image'; contentIndex?: number } | null>(null);
    const [isRegeneratingImage, setIsRegeneratingImage] = useState<number | null>(null);
    const [customImagePrompt, setCustomImagePrompt] = useState("");
    const [previewMode, setPreviewMode] = useState<'edit' | 'layout'>('layout'); // New: toggle between edit and layout preview

    // New: Slide Editor and AI Regeneration state
    const [isSlideEditorOpen, setIsSlideEditorOpen] = useState(false);
    const [isAIRegenerateOpen, setIsAIRegenerateOpen] = useState(false);
    const [isRegeneratingSlide, setIsRegeneratingSlide] = useState(false);
    const [slideStyles, setSlideStyles] = useState<Record<number, any>>({});

    // Image upload state
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imageUploadSlideIndex, setImageUploadSlideIndex] = useState<number | null>(null);

    // User must be logged in - no default user ID
    const userId = user?.id || '';

    // Set mounted on client
    useEffect(() => {
        setMounted(true);
    }, []);

    // Load workspace from URL params
    useEffect(() => {
        const workspaceIdFromUrl = searchParams.get("workspace");
        if (workspaceIdFromUrl) {
            setWorkspaceId(workspaceIdFromUrl);
            loadWorkspace(workspaceIdFromUrl);
        } else {
            setWorkspaceId(null);
        }
    }, [searchParams]);

    const loadWorkspace = async (id: string) => {
        try {
            const response = await fetch(`/api/presentation-workspace/${id}`);
            const data = await response.json();

            if (data.workspace) {
                setPrompt(data.workspace.prompt || "");
                setSlideCount(data.workspace.slideCount || 8);
                setTheme(data.workspace.theme || "warmCoral");

                if (data.workspace.presentation) {
                    setData(data.workspace.presentation);
                    setOutline(data.workspace.outline || null);
                    setStep("preview");
                    setActiveSlide(0);
                } else if (data.workspace.outline) {
                    setOutline(data.workspace.outline);
                    setData(null);
                    setStep("outline");
                } else {
                    setOutline(null);
                    setData(null);
                    setStep("input");
                }
            }
        } catch (error) {
            console.error("Error loading workspace:", error);
            toast.error("Failed to load workspace");
            setWorkspaceId(null);
        }
    };

    const createWorkspace = async (name: string) => {
        try {
            const response = await fetch("/api/presentation-workspace", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, userId }),
            });

            const data = await response.json();

            if (data.success && data.workspace) {
                setWorkspaceId(data.workspace._id);
                return data.workspace._id;
            }
        } catch (error) {
            console.error("Error creating workspace:", error);
            toast.error("Failed to create workspace");
        }
        return null;
    };

    const saveWorkspace = async () => {
        if (!workspaceId) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/presentation-workspace/${workspaceId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    slideCount,
                    theme,
                    status: data ? "generated" : outline ? "outline" : "draft",
                    outline: outline || undefined,
                    presentation: data || undefined,
                }),
            });

            const result = await response.json();
            if (result.success) {
                toast.success("Saved!");
            }
        } catch (error) {
            console.error("Error saving workspace:", error);
            toast.error("Failed to save");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteWorkspace = async (id: string) => {
        try {
            const response = await fetch(`/api/presentation-workspace/${id}`, {
                method: "DELETE",
            });
            if (response.ok) {
                toast.success("Workspace deleted successfully");
                if (workspaceId === id) {
                    setWorkspaceId(null);
                    router.push("/presentations");
                }
            } else {
                toast.error("Failed to delete workspace");
            }
        } catch (error) {
            console.error("Error deleting workspace:", error);
            toast.error("Failed to delete workspace");
        }
    };

    const handleNewWorkspace = () => {
        resetPresentationState();
        setWorkspaceId(null);
        router.push("/presentations?new=true");
    };

    const handleSelectWorkspace = (id: string) => {
        setWorkspaceId(id);
        router.push(`/presentations?workspace=${id}`);
    };

    const handleBackToDashboard = () => {
        setWorkspaceId(null);
        resetPresentationState();
        router.push("/presentations");
    };

    const resetPresentationState = () => {
        setStep("input");
        setPrompt("");
        setOutline(null);
        setData(null);
        setActiveSlide(0);
        setEditingSlide(null);
        setEditingField(null);
    };

    const handleGenerateOutline = async () => {
        if (!prompt.trim()) {
            toast.error("Please enter a topic");
            return;
        }

        setIsGeneratingOutline(true);
        setStep("outline");

        try {
            // Create workspace if it doesn't exist
            let wsId = workspaceId;
            if (!wsId) {
                const workspaceName = prompt.slice(0, 50) || "Untitled Presentation";
                wsId = await createWorkspace(workspaceName);
                if (wsId) {
                    const newUrl = `/presentations?workspace=${wsId}`;
                    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);
                }
            }

            const response = await fetch("/api/generate-presentation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, slideCount, outlineOnly: true }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to generate outline");
            }

            setOutline(result);

            // Auto-save the outline to workspace
            if (wsId) {
                await fetch(`/api/presentation-workspace/${wsId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt,
                        slideCount,
                        theme,
                        status: "outline",
                        outline: result,
                    }),
                });
            }

            toast.success("Outline generated! Review and edit before generating.");
        } catch (error: any) {
            toast.error(error.message);
            setStep("input");
        } finally {
            setIsGeneratingOutline(false);
        }
    };

    const handleGenerateFull = async () => {
        if (!outline) return;

        setIsGeneratingFull(true);
        setStep("generating");

        try {
            const response = await fetch("/api/generate-presentation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    slideCount,
                    outlineOnly: false,
                    existingOutline: outline
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to generate presentation");
            }

            // Add image URLs based on keywords - only for slides that should have images
            const slidesWithImages = result.slides.map((slide: Slide) => ({
                ...slide,
                imageUrl: (slide.hasImage !== false && slide.imageKeyword)
                    ? `https://image.pollinations.ai/prompt/${encodeURIComponent(slide.imageKeyword)}?width=800&height=600&nologo=true&seed=${Date.now()}`
                    : undefined
            }));

            setData({ ...result, slides: slidesWithImages });
            setStep("preview");
            setActiveSlide(0);
            toast.success("Presentation generated successfully!");
        } catch (error: any) {
            toast.error(error.message);
            setStep("outline");
        } finally {
            setIsGeneratingFull(false);
        }
    };

    const handleDownload = async () => {
        if (!data) return;

        setIsDownloading(true);

        try {
            const selectedTheme = THEMES.find(t => t.id === theme);

            const response = await fetch("/api/download-presentation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, theme: selectedTheme }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to download");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${data.title.replace(/[^a-z0-9]/gi, "_")}.pptx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("Presentation downloaded!");
        } catch (error: any) {
            console.error("Download error:", error);
            toast.error(error.message || "Failed to download presentation");
        } finally {
            setIsDownloading(false);
        }
    };

    // Outline editing functions
    const updateOutlineSlide = (index: number, field: keyof Slide, value: string | string[]) => {
        if (!outline) return;
        const newSlides = [...outline.slides];
        newSlides[index] = { ...newSlides[index], [field]: value };
        setOutline({ ...outline, slides: newSlides });
    };

    const addBulletPoint = (slideIndex: number) => {
        if (!outline) return;
        const newSlides = [...outline.slides];
        if (!newSlides[slideIndex].content) {
            newSlides[slideIndex].content = [];
        }
        newSlides[slideIndex].content!.push("New point");
        setOutline({ ...outline, slides: newSlides });
    };

    const removeBulletPoint = (slideIndex: number, bulletIndex: number) => {
        if (!outline) return;
        const newSlides = [...outline.slides];
        newSlides[slideIndex].content = (newSlides[slideIndex].content || []).filter((_, i) => i !== bulletIndex);
        setOutline({ ...outline, slides: newSlides });
    };

    const addSlide = (afterIndex: number) => {
        if (!outline) return;
        const newSlide: Slide = {
            title: "New Slide",
            content: ["Add your content here"],
            imageKeyword: "",
        };
        const newSlides = [...outline.slides];
        newSlides.splice(afterIndex + 1, 0, newSlide);
        setOutline({ ...outline, slides: newSlides });
    };

    const removeSlide = (index: number) => {
        if (!outline || outline.slides.length <= 2) {
            toast.error("Presentation must have at least 2 slides");
            return;
        }
        const newSlides = outline.slides.filter((_, i) => i !== index);
        setOutline({ ...outline, slides: newSlides });
    };

    // Preview editing functions
    const updatePreviewSlide = (index: number, field: keyof Slide, value: string | string[]) => {
        if (!data) return;
        const newSlides = [...data.slides];
        newSlides[index] = { ...newSlides[index], [field]: value };
        setData({ ...data, slides: newSlides });
    };

    const regenerateImage = async (slideIndex: number, customPrompt?: string) => {
        if (!data) return;

        setIsRegeneratingImage(slideIndex);

        const slide = data.slides[slideIndex];

        // Use custom prompt if provided and not empty, otherwise fall back to existing
        const imagePrompt = (customPrompt && customPrompt.trim())
            ? customPrompt.trim()
            : (slide.imageKeyword || slide.title);

        console.log('Regenerating image with prompt:', imagePrompt);
        console.log('Custom prompt received:', customPrompt);

        // Generate new image URL with different seed and the prompt
        const timestamp = Date.now();
        const newImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=800&height=600&nologo=true&seed=${timestamp}&t=${timestamp}`;

        console.log('New image URL:', newImageUrl);

        const newSlides = [...data.slides];
        newSlides[slideIndex] = {
            ...newSlides[slideIndex],
            imageKeyword: imagePrompt,
            imageUrl: newImageUrl,
            imageSource: 'ai', // Mark as AI-generated
            imagePublicId: undefined, // Clear any previous upload public ID
        };
        setData({ ...data, slides: newSlides });

        setIsRegeneratingImage(null);
        setCustomImagePrompt("");
        toast.success(`Image regenerated with: "${imagePrompt.substring(0, 50)}..."`);
    };

    // Handle local image upload
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || imageUploadSlideIndex === null || !data) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
            return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image size must be less than 10MB');
            return;
        }

        setIsUploadingImage(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            if (workspaceId) {
                formData.append('workspaceId', workspaceId);
                formData.append('slideIndex', imageUploadSlideIndex.toString());
            }

            const response = await fetch('/api/upload-presentation-image', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Upload failed');
            }

            // Update the slide with the uploaded image
            const newSlides = [...data.slides];
            newSlides[imageUploadSlideIndex] = {
                ...newSlides[imageUploadSlideIndex],
                imageUrl: result.image.url,
                imagePublicId: result.image.publicId,
                imageSource: 'upload',
                hasImage: true,
            };
            setData({ ...data, slides: newSlides });

            toast.success('Image uploaded successfully!');
        } catch (error: any) {
            console.error('Image upload error:', error);
            toast.error(error.message || 'Failed to upload image');
        } finally {
            setIsUploadingImage(false);
            setImageUploadSlideIndex(null);
            // Reset the input
            if (imageInputRef.current) {
                imageInputRef.current.value = '';
            }
        }
    };

    // Trigger image upload dialog
    const triggerImageUpload = (slideIndex: number) => {
        setImageUploadSlideIndex(slideIndex);
        imageInputRef.current?.click();
    };

    // Update image size for resize functionality
    const updateImageSize = (slideIndex: number, size: { width?: number; height?: number; objectFit?: 'cover' | 'contain' | 'fill' | 'none' }) => {
        if (!data) return;

        const newSlides = [...data.slides];
        newSlides[slideIndex] = {
            ...newSlides[slideIndex],
            imageSize: {
                ...newSlides[slideIndex].imageSize,
                ...size,
            },
        };
        setData({ ...data, slides: newSlides });
    };

    // New: AI Slide Regeneration handler
    const regenerateSlideWithAI = async (prompt: string, options: {
        regenerateType: 'full' | 'content' | 'layout' | 'image' | 'style';
        targetLayout?: string;
        keepImage: boolean;
        tone?: 'professional' | 'casual' | 'creative' | 'formal';
    }) => {
        if (!data) return;

        setIsRegeneratingSlide(true);

        try {
            const currentSlide = data.slides[activeSlide];

            const response = await fetch('/api/regenerate-slide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slideTitle: currentSlide.title,
                    slideContent: currentSlide.content,
                    slideLayoutType: currentSlide.layoutType,
                    prompt,
                    regenerateType: options.regenerateType,
                    targetLayout: options.targetLayout,
                    keepImage: options.keepImage,
                    tone: options.tone,
                    theme: {
                        primary: selectedTheme.colors.primary,
                        secondary: selectedTheme.colors.secondary,
                        accent: selectedTheme.colors.accent,
                    },
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to regenerate slide');
            }

            // Update the slide with regenerated content
            const newSlides = [...data.slides];
            const regeneratedSlide = result.regeneratedSlide;

            // Merge with existing slide, preserving certain fields if needed
            newSlides[activeSlide] = {
                ...currentSlide,
                ...regeneratedSlide,
                // Keep existing image if requested
                imageUrl: options.keepImage || regeneratedSlide.keepExistingImage
                    ? currentSlide.imageUrl
                    : regeneratedSlide.imageUrl || currentSlide.imageUrl,
                imageKeyword: options.keepImage || regeneratedSlide.keepExistingImage
                    ? currentSlide.imageKeyword
                    : regeneratedSlide.imageKeyword || currentSlide.imageKeyword,
            };

            setData({ ...data, slides: newSlides });
            toast.success('Slide regenerated successfully!');
        } catch (error: any) {
            console.error('Regeneration error:', error);
            toast.error(error.message || 'Failed to regenerate slide');
        } finally {
            setIsRegeneratingSlide(false);
        }
    };

    // New: Handle slide style changes
    const handleSlideStyleChange = (styles: any) => {
        if (!data) return;

        // Save styles to state
        const newStyles = { ...slideStyles, [activeSlide]: styles };
        setSlideStyles(newStyles);

        // Update the slide data with universal style properties
        const newSlides = [...data.slides];
        newSlides[activeSlide] = {
            ...newSlides[activeSlide],
            // Store custom styles in the slide object (universal styles only)
            customStyles: {
                backgroundColor: styles.backgroundColor,
                headingColor: styles.headingColor,
                textColor: styles.textColor,
                accentColor: styles.accentColor,
                borderRadius: styles.borderRadius,
                hasBackdrop: styles.hasBackdrop,
                backdropColor: styles.backdropColor,
                backdropOpacity: styles.backdropOpacity,
            },
        };
        setData({ ...data, slides: newSlides });

        toast.success('Style applied!', { duration: 1500 });
    };

    const handleBack = () => {
        if (step === "outline") {
            setStep("input");
            setOutline(null);
        } else if (step === "preview") {
            setStep("outline");
            setData(null);
        }
    };

    const selectedTheme = THEMES.find(t => t.id === theme) || THEMES[0];

    // Use light theme gradient by default for SSR consistency, dark mode via CSS
    const backgroundGradient = isDark
        ? `linear-gradient(180deg, #0a0a0a 0%, #111111 50%, #1a1a1a 100%)`
        : `linear-gradient(180deg, #fefefe 0%, ${selectedTheme?.colors.bg || '#faf8f5'} 50%, ${selectedTheme?.colors.bgSecondary || '#f5f0eb'} 100%)`;

    // Show loading while checking auth or before mount
    // Use Tailwind dark mode classes which work with next-themes automatically
    if (authLoading || !mounted) {
        return (
            <div className="flex min-h-screen flex-col bg-gradient-to-b from-white via-gray-50 to-gray-100 dark:from-[#0a0a0a] dark:via-[#111111] dark:to-[#1a1a1a]">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#b64b6e]" />
                </main>
                <Footer />
            </div>
        );
    }

    // Show login required if user is not authenticated
    if (!user) {
        return (
            <div
                className="flex min-h-screen flex-col transition-colors duration-300"
                style={{ background: backgroundGradient }}
            >
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-md mx-auto px-4">
                        <div
                            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                            style={{ boxShadow: `0 4px 20px ${selectedTheme.colors.accent}40` }}
                        >
                            <Presentation className="w-10 h-10" style={{ color: selectedTheme.colors.primary }} />
                        </div>
                        <h1 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            Login Required
                        </h1>
                        <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                            Please sign in to access your presentations and create new ones.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Button
                                onClick={() => setAuthModalOpen(true)}
                                className="text-white"
                                style={{ backgroundColor: selectedTheme.colors.primary }}
                            >
                                Get Started
                            </Button>
                        </div>
                    </div>
                </main>
                <Footer />

                {/* Auth Modal */}
                <AuthModal
                    isOpen={authModalOpen}
                    onClose={() => setAuthModalOpen(false)}
                />
            </div>
        );
    }

    // Show Dashboard if no workspace selected and not creating new
    const isCreatingNew = searchParams.get("new") === "true";
    if (!workspaceId && !isCreatingNew) {
        return (
            <div
                className="flex min-h-screen flex-col transition-colors duration-300"
                style={{ background: backgroundGradient }}
            >
                <Navbar />
                <main className="flex-1">
                    <PresentationDashboard
                        userId={userId}
                        onSelectWorkspace={handleSelectWorkspace}
                        onCreateNew={handleNewWorkspace}
                        onDeleteWorkspace={handleDeleteWorkspace}
                        isDark={isDark}
                    />
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div
            className="flex min-h-screen flex-col transition-colors duration-300"
            style={{ background: backgroundGradient }}
        >
            <Navbar />

            <main className="flex-1">
                {/* Header - Clean with subtle accent */}
                <div
                    className={`border-b-2 backdrop-blur-md sticky top-16 z-40 transition-colors duration-300 shadow-sm ${isDark ? 'bg-gray-900/95' : 'bg-white/95'}`}
                    style={{
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : `${selectedTheme.colors.accent}35`
                    }}
                >
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="sm" onClick={handleBackToDashboard} className={isDark ? 'text-gray-300 hover:text-white' : 'text-slate-600 hover:text-slate-800'}>
                                    <FolderOpen className="w-4 h-4 mr-2" />
                                    Dashboard
                                </Button>
                                {step !== "input" && (
                                    <Button variant="ghost" size="sm" onClick={handleBack} className={isDark ? 'text-gray-300 hover:text-white' : 'text-slate-600 hover:text-slate-800'}>
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back
                                    </Button>
                                )}
                                <h1
                                    className="text-2xl font-bold"
                                    style={{ color: isDark ? '#ffffff' : selectedTheme.colors.primary }}
                                >
                                    {step === "input" && "New Presentation"}
                                    {step === "outline" && "Edit Outline"}
                                    {step === "generating" && "Creating..."}
                                    {step === "preview" && "Edit Presentation"}
                                </h1>
                            </div>

                            <div className="flex items-center gap-3">
                                {workspaceId && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={saveWorkspace}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save
                                            </>
                                        )}
                                    </Button>
                                )}

                                {step === "preview" && (
                                    <div className="flex items-center gap-3">
                                        <Button
                                            onClick={handleDownload}
                                            disabled={isDownloading}
                                            className="text-white transition-colors"
                                            style={{
                                                backgroundColor: selectedTheme.colors.primary,
                                            }}
                                        >
                                            {isDownloading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Downloading...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Download .pptx
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {/* STEP 1: INPUT */}
                    {step === "input" && (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="container mx-auto px-4 py-12 max-w-4xl"
                        >
                            <div className="text-center mb-10">
                                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                                    What would you like to create today?
                                </p>
                            </div>

                            {/* Type Selection - Refined subtle styling */}
                            <div className="flex justify-center gap-4 mb-8">
                                <Button
                                    variant="default"
                                    className="flex flex-col h-auto py-4 px-6 border-2 transition-all shadow-sm hover:shadow-md"
                                    style={{
                                        backgroundColor: isDark ? '#1f2937' : 'white',
                                        borderColor: selectedTheme.colors.secondary,
                                        color: isDark ? '#ffffff' : selectedTheme.colors.primary
                                    }}
                                >
                                    <Presentation className="w-6 h-6 mb-1" />
                                    <span className="text-sm font-medium">Presentation</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className={`flex flex-col h-auto py-4 px-6 opacity-50 ${isDark ? 'bg-gray-800/50' : 'bg-white/50'}`}
                                    disabled
                                >
                                    <Globe className="w-6 h-6 mb-1" />
                                    <span className="text-sm">Webpage</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className={`flex flex-col h-auto py-4 px-6 opacity-50 ${isDark ? 'bg-gray-800/50' : 'bg-white/50'}`}
                                    disabled
                                >
                                    <FileText className="w-6 h-6 mb-1" />
                                    <span className="text-sm">Document</span>
                                </Button>
                            </div>

                            {/* Settings Bar - Clear visible dropdowns */}
                            <div className="flex flex-wrap justify-center gap-3 mb-8">
                                <div className="relative">
                                    <select
                                        value={slideCount}
                                        onChange={(e) => setSlideCount(Number(e.target.value))}
                                        className={`appearance-none border-2 rounded-lg px-4 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-2 transition-all shadow-sm ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-slate-700'}`}
                                        style={{
                                            borderColor: selectedTheme.colors.secondary
                                        }}
                                    >
                                        {[5, 6, 7, 8, 10, 12, 15].map((n) => (
                                            <option key={n} value={n}>{n} slides</option>
                                        ))}
                                    </select>
                                    <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
                                </div>

                                <div className="relative">
                                    <select
                                        value={theme}
                                        onChange={(e) => setTheme(e.target.value as Theme)}
                                        className={`appearance-none border-2 rounded-lg px-4 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-2 transition-all shadow-sm ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-slate-700'}`}
                                        style={{
                                            borderColor: selectedTheme.colors.secondary
                                        }}
                                    >
                                        {THEMES.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
                                </div>
                            </div>

                            {/* Main Input - Clean with visible text */}
                            <Card
                                className="p-6 mb-8 shadow-xl border-0 transition-colors"
                                style={{ backgroundColor: isDark ? '#1f2937' : 'white' }}
                            >
                                <div className="flex gap-3">
                                    <Input
                                        placeholder="Describe what you'd like to make (e.g., 'A pitch deck for my AI startup')"
                                        className={`text-lg h-14 border-2 focus-visible:ring-2 ${isDark ? 'text-gray-100 placeholder:text-gray-500' : 'text-slate-800 placeholder:text-slate-400'}`}
                                        style={{
                                            backgroundColor: isDark ? '#111827' : '#fafaf9',
                                            borderColor: isDark ? 'rgba(255,255,255,0.15)' : `${selectedTheme.colors.accent}80`,
                                        }}
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleGenerateOutline()}
                                    />
                                    <Button
                                        size="lg"
                                        className="h-14 px-8 text-white transition-all shadow-md hover:shadow-lg"
                                        style={{
                                            backgroundColor: selectedTheme.colors.primary,
                                        }}
                                        onClick={handleGenerateOutline}
                                        disabled={!prompt.trim()}
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                    </Button>
                                </div>
                            </Card>

                            {/* Example Prompts */}
                            <div className="text-center mb-6">
                                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Example prompts</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {EXAMPLE_PROMPTS.map((example, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPrompt(`${example.title} ${example.subtitle}`)}
                                        className={`flex items-start gap-3 p-4 rounded-xl border-2 hover:shadow-lg transition-all text-left group ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                                        style={{
                                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : `${selectedTheme.colors.accent}50`
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = selectedTheme.colors.secondary;
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : `${selectedTheme.colors.accent}50`;
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                                            style={{
                                                backgroundColor: isDark ? `${selectedTheme.colors.accent}25` : `${selectedTheme.colors.accent}40`,
                                                color: isDark ? '#ffffff' : selectedTheme.colors.primary
                                            }}
                                        >
                                            <example.icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className={`font-medium text-sm ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>{example.title}</p>
                                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{example.subtitle}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: OUTLINE */}
                    {(step === "outline" || step === "generating") && (
                        <motion.div
                            key="outline"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="container mx-auto px-4 py-8 max-w-4xl"
                        >
                            {/* Settings Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Settings:</span>
                                    <div className="relative">
                                        <select
                                            value={slideCount}
                                            onChange={(e) => setSlideCount(Number(e.target.value))}
                                            className={`appearance-none border-2 rounded-lg px-3 py-1.5 pr-7 text-sm font-medium shadow-sm ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-slate-700'}`}
                                            style={{ borderColor: selectedTheme.colors.secondary }}
                                            disabled={isGeneratingFull}
                                        >
                                            {[5, 6, 7, 8, 10, 12, 15].map((n) => (
                                                <option key={n} value={n}>{n} slides</option>
                                            ))}
                                        </select>
                                        <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={theme}
                                            onChange={(e) => setTheme(e.target.value as Theme)}
                                            className={`appearance-none border-2 rounded-lg px-3 py-1.5 pr-7 text-sm font-medium shadow-sm ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-slate-700'}`}
                                            style={{ borderColor: selectedTheme.colors.secondary }}
                                            disabled={isGeneratingFull}
                                        >
                                            {THEMES.map((t) => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGenerateOutline}
                                    disabled={isGeneratingOutline || isGeneratingFull}
                                    className="border-2 shadow-sm"
                                    style={{ borderColor: selectedTheme.colors.secondary }}
                                >
                                    <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingOutline ? 'animate-spin' : ''}`} />
                                    Regenerate
                                </Button>
                            </div>

                            {/* Prompt Display */}
                            <Card
                                className="p-4 mb-6 border-2 shadow-sm"
                                style={{
                                    backgroundColor: isDark ? '#1f2937' : 'white',
                                    borderColor: selectedTheme.colors.secondary
                                }}
                            >
                                <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>{prompt}</p>
                            </Card>

                            {/* Outline Label */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Outline</h3>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Click any slide to edit • Drag to reorder</p>
                            </div>

                            {/* Outline Cards */}
                            <div className="space-y-3 mb-24">
                                {isGeneratingOutline ? (
                                    Array.from({ length: slideCount }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="rounded-xl p-4 animate-pulse shadow-sm"
                                            style={{ backgroundColor: `${selectedTheme.colors.accent}15` }}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                                                    style={{
                                                        backgroundColor: `${selectedTheme.colors.accent}30`,
                                                        color: selectedTheme.colors.primary
                                                    }}
                                                >
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-5 rounded w-2/3" style={{ backgroundColor: `${selectedTheme.colors.accent}25` }}></div>
                                                    <div className="h-3 rounded w-full" style={{ backgroundColor: `${selectedTheme.colors.accent}18` }}></div>
                                                    <div className="h-3 rounded w-4/5" style={{ backgroundColor: `${selectedTheme.colors.accent}18` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : outline ? (
                                    outline.slides.map((slide, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className={`rounded-xl p-4 border-l-4 shadow-sm transition-all ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                                            style={{
                                                borderLeftColor: editingSlide === i ? selectedTheme.colors.primary : selectedTheme.colors.accent,
                                                boxShadow: editingSlide === i ? `0 4px 12px ${isDark ? 'rgba(0,0,0,0.3)' : selectedTheme.colors.accent + '30'}` : isDark ? '0 1px 3px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.06)'
                                            }}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
                                                        style={{
                                                            backgroundColor: isDark ? `${selectedTheme.colors.accent}25` : `${selectedTheme.colors.accent}35`,
                                                            color: isDark ? '#ffffff' : selectedTheme.colors.primary
                                                        }}
                                                    >
                                                        {i + 1}
                                                    </div>
                                                    <button className={`cursor-grab transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-slate-300 hover:text-slate-500'}`}>
                                                        <GripVertical className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    {editingSlide === i ? (
                                                        <div className="space-y-3">
                                                            <Input
                                                                value={slide.title}
                                                                onChange={(e) => updateOutlineSlide(i, 'title', e.target.value)}
                                                                className={`font-semibold text-lg border-2 ${isDark ? 'text-gray-200 bg-gray-700' : 'text-slate-800'}`}
                                                                style={{ borderColor: `${selectedTheme.colors.secondary}80` }}
                                                                placeholder="Slide title"
                                                            />

                                                            {(slide.content || []).map((point, j) => (
                                                                <div key={j} className="flex gap-2 items-start">
                                                                    <span className="mt-2.5" style={{ color: selectedTheme.colors.primary }}>•</span>
                                                                    <Input
                                                                        value={point}
                                                                        onChange={(e) => {
                                                                            const newContent = [...(slide.content || [])];
                                                                            newContent[j] = e.target.value;
                                                                            updateOutlineSlide(i, 'content', newContent);
                                                                        }}
                                                                        className={`text-sm flex-1 ${isDark ? 'text-gray-300 bg-gray-700' : 'text-slate-700'}`}
                                                                        placeholder="Bullet point"
                                                                    />
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                                        onClick={() => removeBulletPoint(i, j)}
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </Button>
                                                                </div>
                                                            ))}

                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => addBulletPoint(i)}
                                                                    className="text-xs"
                                                                >
                                                                    <Plus className="w-3 h-3 mr-1" /> Add Point
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => setEditingSlide(null)}
                                                                    className="text-xs text-white"
                                                                    style={{ backgroundColor: selectedTheme.colors.primary }}
                                                                >
                                                                    <Check className="w-3 h-3 mr-1" /> Done
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="cursor-pointer group"
                                                            onClick={() => setEditingSlide(i)}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <h4 className={`font-semibold ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>{slide.title}</h4>
                                                                <Edit3 className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-gray-400' : 'text-slate-400'}`} />
                                                            </div>
                                                            <ul className="mt-2 space-y-1">
                                                                {(slide.content || []).map((point, j) => (
                                                                    <li key={j} className={`text-sm flex items-start gap-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                                                        <span className="mt-0.5" style={{ color: selectedTheme.colors.primary }}>•</span>
                                                                        {point}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Slide Actions */}
                                                <div className="flex flex-col gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={`h-7 w-7 ${isDark ? 'text-gray-500 hover:text-blue-400' : 'text-slate-400 hover:text-blue-600'}`}
                                                        onClick={() => addSlide(i)}
                                                        title="Add slide after"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={`h-7 w-7 ${isDark ? 'text-gray-500 hover:text-red-400' : 'text-slate-400 hover:text-red-600'}`}
                                                        onClick={() => removeSlide(i)}
                                                        title="Remove slide"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : null}
                            </div>

                            {/* Bottom Generate Bar - Clean styling */}
                            {outline && (
                                <div
                                    className={`fixed bottom-0 left-0 right-0 border-t-2 py-4 px-4 z-50 backdrop-blur-md shadow-lg ${isDark ? 'bg-gray-900/95' : 'bg-white/95'}`}
                                    style={{
                                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : `${selectedTheme.colors.accent}40`
                                    }}
                                >
                                    <div className="container mx-auto max-w-4xl flex items-center justify-between">
                                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                            {outline.slides.length} slides total
                                        </span>
                                        <Button
                                            size="lg"
                                            className="px-12 text-white"
                                            style={{ backgroundColor: selectedTheme.colors.primary }}
                                            onClick={handleGenerateFull}
                                            disabled={isGeneratingFull}
                                        >
                                            {isGeneratingFull ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="mr-2 h-5 w-5" />
                                                    Generate Presentation
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* STEP 3: PREVIEW WITH EDITING */}
                    {step === "preview" && data && (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex h-[calc(100vh-8rem)]"
                        >
                            {/* Left Sidebar - Thumbnails with theme background */}
                            <div
                                className="w-52 border-r overflow-y-auto p-4 space-y-3 hidden md:block transition-colors duration-300"
                                style={{
                                    backgroundColor: isDark ? '#111827' : selectedTheme.colors.bg,
                                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : `${selectedTheme.colors.accent}40`
                                }}
                            >
                                <div className={`text-xs font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>SLIDES</div>
                                {data.slides.map((slide, i) => {
                                    return (
                                        <div key={i} className="relative group">
                                            <button
                                                onClick={() => setActiveSlide(i)}
                                                className={`w-full aspect-[16/10] rounded-lg overflow-hidden border-2 transition-all relative ${activeSlide === i
                                                    ? "shadow-lg"
                                                    : "border-transparent hover:border-slate-300"
                                                    }`}
                                                style={{
                                                    borderColor: activeSlide === i ? selectedTheme.colors.primary : undefined,
                                                    backgroundColor: '#ffffff'
                                                }}
                                            >
                                                <div className="absolute top-1 left-1 bg-black/50 text-white text-[8px] px-1 rounded z-10">
                                                    {i + 1}
                                                </div>
                                                {/* Layout type badge */}
                                                {slide.layoutType && (
                                                    <div className="absolute top-1 right-1 bg-purple-500/80 text-white text-[6px] px-1 rounded z-10 uppercase">
                                                        {slide.layoutType}
                                                    </div>
                                                )}
                                                {/* Slide container with white background to isolate from dark mode */}
                                                <div
                                                    className="w-full h-full scale-[0.15] origin-top-left"
                                                    style={{ width: '666%', height: '666%', backgroundColor: '#ffffff' }}
                                                >
                                                    <SlidePreview
                                                        slide={slide}
                                                        slideIndex={i}
                                                        totalSlides={data.slides.length}
                                                        theme={{
                                                            primary: selectedTheme.colors.primary,
                                                            secondary: selectedTheme.colors.secondary,
                                                            accent: selectedTheme.colors.accent,
                                                        }}
                                                    />
                                                </div>
                                            </button>

                                            {/* Hover-revealed action buttons */}
                                            <div className="absolute bottom-1 left-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveSlide(i);
                                                        setIsAIRegenerateOpen(true);
                                                    }}
                                                    className="flex-1 flex items-center justify-center gap-0.5 py-1 rounded text-white text-[7px] font-medium transition-colors backdrop-blur-sm"
                                                    style={{ backgroundColor: `${selectedTheme.colors.primary}cc` }}
                                                    title="AI Agent"
                                                >
                                                    <Wand2 className="w-2.5 h-2.5" />
                                                    <span>AI</span>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveSlide(i);
                                                        setIsSlideEditorOpen(true);
                                                    }}
                                                    className="flex-1 flex items-center justify-center gap-0.5 py-1 rounded text-white text-[7px] font-medium transition-colors backdrop-blur-sm"
                                                    style={{ backgroundColor: `${selectedTheme.colors.secondary}cc` }}
                                                    title="Card Editor"
                                                >
                                                    <Settings className="w-2.5 h-2.5" />
                                                    <span>Edit</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Main Preview Area - Theme-based background */}
                            <div
                                className="flex-1 overflow-y-auto p-8 transition-colors duration-300"
                                style={{
                                    background: isDark
                                        ? 'linear-gradient(180deg, #0a0a0a 0%, #111111 100%)'
                                        : `linear-gradient(180deg, ${selectedTheme.colors.bgSecondary} 0%, ${selectedTheme.colors.bg} 100%)`
                                }}
                            >
                                <div className="max-w-5xl mx-auto">
                                    {/* Current Slide Editor */}
                                    {data.slides[activeSlide] && (
                                        <div className="space-y-6">
                                            {/* Slide Header */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
                                                        disabled={activeSlide === 0}
                                                        className={`border-2 ${isDark ? 'bg-gray-800 hover:bg-gray-700' : ''}`}
                                                        style={{
                                                            borderColor: isDark ? 'rgba(255,255,255,0.2)' : selectedTheme.colors.accent,
                                                            color: isDark ? '#ffffff' : selectedTheme.colors.primary
                                                        }}
                                                    >
                                                        <ArrowLeft className="w-4 h-4" />
                                                    </Button>
                                                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                                                        Slide {activeSlide + 1} of {data.slides.length}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setActiveSlide(Math.min(data.slides.length - 1, activeSlide + 1))}
                                                        disabled={activeSlide === data.slides.length - 1}
                                                        className={`border-2 ${isDark ? 'bg-gray-800 hover:bg-gray-700' : ''}`}
                                                        style={{
                                                            borderColor: isDark ? 'rgba(255,255,255,0.2)' : selectedTheme.colors.accent,
                                                            color: isDark ? '#ffffff' : selectedTheme.colors.primary
                                                        }}
                                                    >
                                                        <ArrowRight className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                {/* Layout Type Badge & Action Buttons */}
                                                <div className="flex items-center gap-3">
                                                    {data.slides[activeSlide].layoutType && (
                                                        <span
                                                            className="text-xs px-2 py-1 rounded-full font-medium uppercase"
                                                            style={{
                                                                backgroundColor: `${selectedTheme.colors.accent}30`,
                                                                color: selectedTheme.colors.primary
                                                            }}
                                                        >
                                                            {data.slides[activeSlide].layoutType} layout
                                                        </span>
                                                    )}

                                                    {/* AI Agent Button */}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setIsAIRegenerateOpen(true)}
                                                        className="border-2"
                                                        style={{
                                                            borderColor: selectedTheme.colors.secondary,
                                                            color: selectedTheme.colors.primary
                                                        }}
                                                        title="AI Agent - Regenerate slide"
                                                    >
                                                        <Wand2 className="w-4 h-4 mr-1.5" />
                                                        AI Agent
                                                    </Button>

                                                    {/* Card Editor Button */}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setIsSlideEditorOpen(true)}
                                                        className="border-2"
                                                        style={{
                                                            borderColor: selectedTheme.colors.accent,
                                                            color: selectedTheme.colors.primary
                                                        }}
                                                        title="Card Editor - Edit styling"
                                                    >
                                                        <Settings className="w-4 h-4 mr-1.5" />
                                                        Edit Card
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Unified Slide Preview with Edit Overlay - white bg to isolate from dark mode */}
                                            <motion.div
                                                key={`${activeSlide}-unified`}
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl relative group"
                                                style={{ backgroundColor: '#ffffff' }}
                                            >
                                                {/* Slide Preview Component */}
                                                <SlidePreview
                                                    slide={data.slides[activeSlide]}
                                                    slideIndex={activeSlide}
                                                    totalSlides={data.slides.length}
                                                    theme={{
                                                        primary: selectedTheme.colors.primary,
                                                        secondary: selectedTheme.colors.secondary,
                                                        accent: selectedTheme.colors.accent,
                                                    }}
                                                />

                                                {/* Edit Overlay - REMOVED: no darkening on hover */}

                                                {/* Top Edit Bar - Title editing */}
                                                <div className="absolute top-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                                                    <div className="flex items-center gap-2">
                                                        {editingField?.slide === activeSlide && editingField.field === 'title' ? (
                                                            <div className="flex-1 flex gap-2">
                                                                <Input
                                                                    value={data.slides[activeSlide].title}
                                                                    onChange={(e) => updatePreviewSlide(activeSlide, 'title', e.target.value)}
                                                                    className="text-lg font-semibold shadow-lg text-slate-800 focus:ring-0 focus:outline-none focus:ring-offset-0"
                                                                    style={{
                                                                        backgroundColor: 'white',
                                                                        borderColor: selectedTheme.colors.secondary,
                                                                        borderWidth: '2px',
                                                                        outline: 'none',
                                                                        boxShadow: 'none'
                                                                    }}
                                                                    autoFocus
                                                                    onBlur={() => setEditingField(null)}
                                                                    onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                                                                />
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => setEditingField(null)}
                                                                    className="text-white"
                                                                    style={{ backgroundColor: selectedTheme.colors.primary }}
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setEditingField({ slide: activeSlide, field: 'title' })}
                                                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 hover:bg-white text-slate-700 text-sm font-medium shadow-lg transition-colors pointer-events-auto"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                                Edit Title
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right Side - Image Controls (if slide has image or can have image) */}
                                                {data.slides[activeSlide].hasImage !== false && (
                                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-auto">
                                                        <div
                                                            className="backdrop-blur-sm rounded-xl shadow-xl p-3 space-y-3 min-w-[220px] border-2"
                                                            style={{
                                                                backgroundColor: `${selectedTheme.colors.bg}f8`,
                                                                borderColor: selectedTheme.colors.accent
                                                            }}
                                                        >
                                                            {/* Image Source Badge */}
                                                            {data.slides[activeSlide].imageUrl && (
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-medium" style={{ color: selectedTheme.colors.primary }}>
                                                                        Image Controls
                                                                    </span>
                                                                    <span
                                                                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                                                        style={{
                                                                            backgroundColor: data.slides[activeSlide].imageSource === 'upload'
                                                                                ? `${selectedTheme.colors.accent}30`
                                                                                : `${selectedTheme.colors.secondary}30`,
                                                                            color: data.slides[activeSlide].imageSource === 'upload'
                                                                                ? selectedTheme.colors.primary
                                                                                : selectedTheme.colors.secondary
                                                                        }}
                                                                    >
                                                                        {data.slides[activeSlide].imageSource === 'upload' ? '📤 Uploaded' : '🤖 AI Generated'}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Upload Button */}
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="w-full text-xs border-2"
                                                                style={{
                                                                    borderColor: selectedTheme.colors.accent,
                                                                    color: selectedTheme.colors.primary
                                                                }}
                                                                onClick={() => triggerImageUpload(activeSlide)}
                                                                disabled={isUploadingImage}
                                                            >
                                                                {isUploadingImage ? (
                                                                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                                                ) : (
                                                                    <Upload className="w-3 h-3 mr-2" />
                                                                )}
                                                                {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                                                            </Button>

                                                            {/* AI Regeneration Section */}
                                                            <div className="space-y-2">
                                                                <p className="text-xs font-medium" style={{ color: selectedTheme.colors.primary }}>
                                                                    AI Generate Image
                                                                </p>
                                                                <Input
                                                                    placeholder="Custom image prompt..."
                                                                    value={customImagePrompt}
                                                                    onChange={(e) => setCustomImagePrompt(e.target.value)}
                                                                    className="text-sm bg-white border-2 text-slate-700"
                                                                    style={{ borderColor: `${selectedTheme.colors.secondary}60` }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' && customImagePrompt.trim()) {
                                                                            regenerateImage(activeSlide, customImagePrompt);
                                                                        }
                                                                    }}
                                                                />
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        className="flex-1 text-xs text-white"
                                                                        style={{ backgroundColor: selectedTheme.colors.secondary }}
                                                                        onClick={() => regenerateImage(activeSlide)}
                                                                        disabled={isRegeneratingImage === activeSlide}
                                                                    >
                                                                        {isRegeneratingImage === activeSlide ? (
                                                                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                                        ) : (
                                                                            <RefreshCw className="w-3 h-3 mr-1" />
                                                                        )}
                                                                        Random
                                                                    </Button>
                                                                    {customImagePrompt.trim() && (
                                                                        <Button
                                                                            size="sm"
                                                                            className="flex-1 text-xs text-white"
                                                                            style={{ backgroundColor: selectedTheme.colors.primary }}
                                                                            onClick={() => regenerateImage(activeSlide, customImagePrompt)}
                                                                            disabled={isRegeneratingImage === activeSlide}
                                                                        >
                                                                            <Wand2 className="w-3 h-3 mr-1" />
                                                                            Generate
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Image Resize Controls */}
                                                            {data.slides[activeSlide].imageUrl && (
                                                                <div className="space-y-2 pt-2 border-t" style={{ borderColor: `${selectedTheme.colors.accent}40` }}>
                                                                    <p className="text-xs font-medium flex items-center gap-1" style={{ color: selectedTheme.colors.primary }}>
                                                                        <Maximize2 className="w-3 h-3" />
                                                                        Resize Image
                                                                    </p>

                                                                    {/* Width Slider */}
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] text-slate-500 w-6">W:</span>
                                                                        <input
                                                                            type="range"
                                                                            min="30"
                                                                            max="100"
                                                                            value={data.slides[activeSlide].imageSize?.width || 100}
                                                                            onChange={(e) => updateImageSize(activeSlide, { width: parseInt(e.target.value) })}
                                                                            className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer"
                                                                            style={{ accentColor: selectedTheme.colors.primary }}
                                                                        />
                                                                        <span className="text-[10px] text-slate-500 w-8">
                                                                            {data.slides[activeSlide].imageSize?.width || 100}%
                                                                        </span>
                                                                    </div>

                                                                    {/* Height Slider */}
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] text-slate-500 w-6">H:</span>
                                                                        <input
                                                                            type="range"
                                                                            min="30"
                                                                            max="100"
                                                                            value={data.slides[activeSlide].imageSize?.height || 100}
                                                                            onChange={(e) => updateImageSize(activeSlide, { height: parseInt(e.target.value) })}
                                                                            className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer"
                                                                            style={{ accentColor: selectedTheme.colors.primary }}
                                                                        />
                                                                        <span className="text-[10px] text-slate-500 w-8">
                                                                            {data.slides[activeSlide].imageSize?.height || 100}%
                                                                        </span>
                                                                    </div>

                                                                    {/* Object Fit Selection */}
                                                                    <div className="flex gap-1">
                                                                        {(['cover', 'contain', 'fill'] as const).map((fit) => (
                                                                            <button
                                                                                key={fit}
                                                                                onClick={() => updateImageSize(activeSlide, { objectFit: fit })}
                                                                                className={`flex-1 py-1 text-[10px] rounded capitalize transition-colors ${(data.slides[activeSlide].imageSize?.objectFit || 'cover') === fit
                                                                                    ? 'text-white'
                                                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                                                    }`}
                                                                                style={(data.slides[activeSlide].imageSize?.objectFit || 'cover') === fit
                                                                                    ? { backgroundColor: selectedTheme.colors.primary }
                                                                                    : undefined}
                                                                            >
                                                                                {fit}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Bottom Edit Bar - Content editing */}
                                                <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                                                    <div className="flex items-center justify-between gap-4">
                                                        {/* Edit Content Button */}
                                                        <button
                                                            onClick={() => setEditingField({ slide: activeSlide, field: 'content', contentIndex: 0 })}
                                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/95 hover:bg-white text-slate-700 text-sm font-medium shadow-lg transition-colors pointer-events-auto border-2"
                                                            style={{ borderColor: `${selectedTheme.colors.accent}60` }}
                                                        >
                                                            <Type className="w-4 h-4" />
                                                            Edit Content
                                                        </button>

                                                        {/* Quick Actions */}
                                                        <div className="flex items-center gap-2 pointer-events-auto">
                                                            <button
                                                                onClick={() => setIsAIRegenerateOpen(true)}
                                                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-medium transition-colors backdrop-blur-sm shadow-lg"
                                                                style={{ backgroundColor: selectedTheme.colors.primary }}
                                                                title="AI Agent - Regenerate slide with AI"
                                                            >
                                                                <Wand2 className="w-3.5 h-3.5" />
                                                                <span>AI Agent</span>
                                                            </button>
                                                            <button
                                                                onClick={() => setIsSlideEditorOpen(true)}
                                                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-medium transition-colors backdrop-blur-sm shadow-lg"
                                                                style={{ backgroundColor: selectedTheme.colors.secondary }}
                                                                title="Card Editor - Edit styling and layout"
                                                            >
                                                                <Settings className="w-3.5 h-3.5" />
                                                                <span>Edit Card</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Loading overlay when regenerating image */}
                                                {isRegeneratingImage === activeSlide && (
                                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-40">
                                                        <div className="bg-white rounded-xl p-4 shadow-xl flex items-center gap-3">
                                                            <Loader2 className="w-6 h-6 animate-spin" style={{ color: selectedTheme.colors.primary }} />
                                                            <span className="text-sm font-medium text-slate-700">Regenerating image...</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>

                                            {/* Content Editor Modal - Shows when editing content */}
                                            <AnimatePresence>
                                                {editingField?.slide === activeSlide && editingField.field === 'content' && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 20 }}
                                                        className="mt-4 rounded-xl shadow-xl p-4"
                                                        style={{
                                                            backgroundColor: selectedTheme.colors.bg,
                                                            border: `2px solid ${selectedTheme.colors.accent}40`
                                                        }}
                                                    >
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="font-semibold flex items-center gap-2">
                                                                <Type className="w-4 h-4" />
                                                                Edit Slide Content
                                                            </h4>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setEditingField(null)}
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>

                                                        <div className="space-y-3">
                                                            {(data.slides[activeSlide].content || []).map((point, j) => (
                                                                <div key={j} className="flex items-start gap-2">
                                                                    <span
                                                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 text-white"
                                                                        style={{
                                                                            background: `linear-gradient(135deg, ${selectedTheme.colors.primary} 0%, ${selectedTheme.colors.secondary} 100%)`
                                                                        }}
                                                                    >
                                                                        {j + 1}
                                                                    </span>
                                                                    <Textarea
                                                                        value={point}
                                                                        onChange={(e) => {
                                                                            const newContent = [...(data.slides[activeSlide].content || [])];
                                                                            newContent[j] = e.target.value;
                                                                            updatePreviewSlide(activeSlide, 'content', newContent);
                                                                        }}
                                                                        className="flex-1 min-h-[60px] text-sm text-slate-800 focus:ring-0 focus:outline-none focus:ring-offset-0"
                                                                        style={{
                                                                            backgroundColor: 'white',
                                                                            borderColor: selectedTheme.colors.secondary,
                                                                            borderWidth: '2px',
                                                                            outline: 'none',
                                                                            boxShadow: 'none'
                                                                        }}
                                                                        placeholder={`Point ${j + 1}`}
                                                                    />
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                        onClick={() => {
                                                                            const newContent = (data.slides[activeSlide].content || []).filter((_, idx) => idx !== j);
                                                                            updatePreviewSlide(activeSlide, 'content', newContent);
                                                                        }}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            ))}

                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full mt-2"
                                                                style={{
                                                                    backgroundColor: 'white',
                                                                    borderColor: selectedTheme.colors.secondary,
                                                                    color: selectedTheme.colors.primary
                                                                }}
                                                                onClick={() => {
                                                                    const newContent = [...(data.slides[activeSlide].content || []), 'New point'];
                                                                    updatePreviewSlide(activeSlide, 'content', newContent);
                                                                }}
                                                            >
                                                                <Plus className="w-4 h-4 mr-2" />
                                                                Add Point
                                                            </Button>
                                                        </div>

                                                        <div
                                                            className="flex justify-end gap-2 mt-4 pt-4"
                                                            style={{ borderTop: `1px solid ${selectedTheme.colors.accent}30` }}
                                                        >
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => setEditingField(null)}
                                                                style={{
                                                                    backgroundColor: 'white',
                                                                    borderColor: selectedTheme.colors.secondary,
                                                                    color: selectedTheme.colors.primary
                                                                }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                className="text-white"
                                                                style={{ backgroundColor: selectedTheme.colors.primary }}
                                                                onClick={() => setEditingField(null)}
                                                            >
                                                                <Check className="w-4 h-4 mr-2" />
                                                                Done
                                                            </Button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* All Slides Overview - COMMENTED OUT
                                            <div className="mt-8">
                                                <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>All Slides ({data.slides.length} total) - Hover over cards for quick actions</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {data.slides.map((slide, i) => (
                                                        <div key={i} className="relative group">
                                                            <button
                                                                onClick={() => setActiveSlide(i)}
                                                                className={`w-full aspect-video rounded-lg overflow-hidden border-2 transition-all ${activeSlide === i ? 'ring-2' : isDark ? 'border-gray-700 hover:border-gray-500' : 'border-slate-200 hover:border-slate-400'}`}
                                                                style={activeSlide === i ? {
                                                                    borderColor: selectedTheme.colors.primary,
                                                                    boxShadow: `0 0 0 2px ${isDark ? 'rgba(255,255,255,0.1)' : selectedTheme.colors.accent + '40'}`
                                                                } : undefined}
                                                            >
                                                                <div className="w-full h-full scale-[0.25] origin-top-left" style={{ width: '400%', height: '400%' }}>
                                                                    <SlidePreview
                                                                        slide={slide}
                                                                        slideIndex={i}
                                                                        totalSlides={data.slides.length}
                                                                        theme={{
                                                                            primary: selectedTheme.colors.primary,
                                                                            secondary: selectedTheme.colors.secondary,
                                                                            accent: selectedTheme.colors.accent,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </button>

                                                            <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium z-10">
                                                                {i + 1}
                                                            </div>

                                                            {slide.layoutType && (
                                                                <div className="absolute top-2 right-2 bg-purple-500/80 text-white text-[8px] px-1.5 py-0.5 rounded z-10 uppercase font-medium">
                                                                    {slide.layoutType}
                                                                </div>
                                                            )}

                                                            <div className="absolute bottom-2 left-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-auto">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveSlide(i);
                                                                        setIsAIRegenerateOpen(true);
                                                                    }}
                                                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-violet-500/90 hover:bg-violet-600 text-white text-[9px] font-medium transition-colors backdrop-blur-sm shadow-lg"
                                                                    title="AI Agent - Regenerate with AI"
                                                                >
                                                                    <Wand2 className="w-3 h-3" />
                                                                    <span>AI Agent</span>
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveSlide(i);
                                                                        setIsSlideEditorOpen(true);
                                                                    }}
                                                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-slate-600/90 hover:bg-slate-700 text-white text-[9px] font-medium transition-colors backdrop-blur-sm shadow-lg"
                                                                    title="Card Editor - Edit styling"
                                                                >
                                                                    <Settings className="w-3 h-3" />
                                                                    <span>Edit Card</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            */}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main >

            {step === "input" && <Footer />
            }

            {/* Slide Editor Panel */}
            {step === "preview" && data && (
                <SlideEditorPanel
                    isOpen={isSlideEditorOpen}
                    onClose={() => setIsSlideEditorOpen(false)}
                    slideIndex={activeSlide}
                    currentStyles={{
                        ...data.slides[activeSlide]?.customStyles,
                        ...slideStyles[activeSlide],
                    }}
                    onStyleChange={handleSlideStyleChange}
                    theme={{
                        primary: selectedTheme.colors.primary,
                        secondary: selectedTheme.colors.secondary,
                        accent: selectedTheme.colors.accent,
                    }}
                />
            )}

            {/* AI Regenerate Panel */}
            {step === "preview" && data && (
                <AIRegeneratePanel
                    isOpen={isAIRegenerateOpen}
                    onClose={() => setIsAIRegenerateOpen(false)}
                    slideIndex={activeSlide}
                    slideTitle={data.slides[activeSlide]?.title || ''}
                    slideContent={data.slides[activeSlide]?.content}
                    onRegenerate={regenerateSlideWithAI}
                    isRegenerating={isRegeneratingSlide}
                />
            )}

            {/* Hidden file input for image upload */}
            <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleImageUpload}
                className="hidden"
            />
        </div >
    );
}

export default function PresentationsPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        }>
            <PresentationsContent />
        </Suspense>
    );
}
