"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import PresentationDashboard from "./components/PresentationDashboard";
import SlidePreview from "./components/SlidePreview";

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
}

interface PresentationData {
    title: string;
    slides: Slide[];
}

type Step = "input" | "outline" | "generating" | "preview";
type Theme = "modern" | "classic" | "minimal" | "bold" | "gradient" | "dark";

const THEMES: { id: Theme; name: string; colors: { primary: string; secondary: string; accent: string; bg: string } }[] = [
    { id: "modern", name: "Modern Blue", colors: { primary: "#1e40af", secondary: "#3b82f6", accent: "#60a5fa", bg: "#f8fafc" } },
    { id: "classic", name: "Classic Gray", colors: { primary: "#1f2937", secondary: "#4b5563", accent: "#9ca3af", bg: "#ffffff" } },
    { id: "minimal", name: "Minimal", colors: { primary: "#0f172a", secondary: "#334155", accent: "#64748b", bg: "#ffffff" } },
    { id: "bold", name: "Bold Purple", colors: { primary: "#7c3aed", secondary: "#a855f7", accent: "#c084fc", bg: "#faf5ff" } },
    { id: "gradient", name: "Gradient", colors: { primary: "#ec4899", secondary: "#8b5cf6", accent: "#06b6d4", bg: "#fdf2f8" } },
    { id: "dark", name: "Dark Mode", colors: { primary: "#1e293b", secondary: "#334155", accent: "#60a5fa", bg: "#0f172a" } },
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

// Default user ID for unauthenticated users
const DEFAULT_USER_ID = "user_default";

function PresentationsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();

    // Workspace state
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Presentation state
    const [step, setStep] = useState<Step>("input");
    const [prompt, setPrompt] = useState("");
    const [slideCount, setSlideCount] = useState(8);
    const [theme, setTheme] = useState<Theme>("modern");
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

    const userId = user?.id || DEFAULT_USER_ID;

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
                setTheme(data.workspace.theme || "modern");

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
            imageUrl: newImageUrl
        };
        setData({ ...data, slides: newSlides });

        setIsRegeneratingImage(null);
        setCustomImagePrompt("");
        toast.success(`Image regenerated with: "${imagePrompt.substring(0, 50)}..."`);
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

    const selectedTheme = THEMES.find(t => t.id === theme)!;

    // Show Dashboard if no workspace selected and not creating new
    const isCreatingNew = searchParams.get("new") === "true";
    if (!workspaceId && !isCreatingNew) {
        return (
            <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <Navbar />
                <main className="flex-1">
                    <PresentationDashboard
                        userId={userId}
                        onSelectWorkspace={handleSelectWorkspace}
                        onCreateNew={handleNewWorkspace}
                        onDeleteWorkspace={handleDeleteWorkspace}
                    />
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <Navbar />

            <main className="flex-1">
                {/* Header */}
                <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-16 z-40">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="sm" onClick={handleBackToDashboard}>
                                    <FolderOpen className="w-4 h-4 mr-2" />
                                    Dashboard
                                </Button>
                                {step !== "input" && (
                                    <Button variant="ghost" size="sm" onClick={handleBack}>
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back
                                    </Button>
                                )}
                                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
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
                                            className="bg-blue-600 hover:bg-blue-700"
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
                                <p className="text-muted-foreground text-lg">
                                    What would you like to create today?
                                </p>
                            </div>

                            {/* Type Selection */}
                            <div className="flex justify-center gap-4 mb-8">
                                <Button variant="default" className="flex flex-col h-auto py-4 px-6 bg-blue-50 dark:bg-blue-950 border-2 border-blue-500 text-blue-700 dark:text-blue-300 hover:bg-blue-100">
                                    <Presentation className="w-6 h-6 mb-1" />
                                    <span className="text-sm font-medium">Presentation</span>
                                </Button>
                                <Button variant="outline" className="flex flex-col h-auto py-4 px-6 opacity-50" disabled>
                                    <Globe className="w-6 h-6 mb-1" />
                                    <span className="text-sm">Webpage</span>
                                </Button>
                                <Button variant="outline" className="flex flex-col h-auto py-4 px-6 opacity-50" disabled>
                                    <FileText className="w-6 h-6 mb-1" />
                                    <span className="text-sm">Document</span>
                                </Button>
                            </div>

                            {/* Settings Bar */}
                            <div className="flex flex-wrap justify-center gap-3 mb-8">
                                <div className="relative">
                                    <select
                                        value={slideCount}
                                        onChange={(e) => setSlideCount(Number(e.target.value))}
                                        className="appearance-none bg-white dark:bg-slate-800 border rounded-lg px-4 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {[5, 6, 7, 8, 10, 12, 15].map((n) => (
                                            <option key={n} value={n}>{n} slides</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
                                </div>

                                <div className="relative">
                                    <select
                                        value={theme}
                                        onChange={(e) => setTheme(e.target.value as Theme)}
                                        className="appearance-none bg-white dark:bg-slate-800 border rounded-lg px-4 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {THEMES.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
                                </div>
                            </div>

                            {/* Main Input */}
                            <Card className="p-6 mb-8 shadow-lg border-0 bg-white dark:bg-slate-800">
                                <div className="flex gap-3">
                                    <Input
                                        placeholder="Describe what you'd like to make (e.g., 'A pitch deck for my AI startup')"
                                        className="text-lg h-14 border-0 bg-slate-50 dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleGenerateOutline()}
                                    />
                                    <Button
                                        size="lg"
                                        className="h-14 px-8 bg-blue-600 hover:bg-blue-700"
                                        onClick={handleGenerateOutline}
                                        disabled={!prompt.trim()}
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                    </Button>
                                </div>
                            </Card>

                            {/* Example Prompts */}
                            <div className="text-center mb-6">
                                <p className="text-sm text-muted-foreground">Example prompts</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {EXAMPLE_PROMPTS.map((example, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPrompt(`${example.title} ${example.subtitle}`)}
                                        className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border hover:border-blue-300 hover:shadow-md transition-all text-left group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                            <example.icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{example.title}</p>
                                            <p className="text-xs text-muted-foreground">{example.subtitle}</p>
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
                                    <span className="text-sm font-medium text-muted-foreground">Settings:</span>
                                    <div className="relative">
                                        <select
                                            value={slideCount}
                                            onChange={(e) => setSlideCount(Number(e.target.value))}
                                            className="appearance-none bg-white dark:bg-slate-800 border rounded-lg px-3 py-1.5 pr-7 text-sm font-medium"
                                            disabled={isGeneratingFull}
                                        >
                                            {[5, 6, 7, 8, 10, 12, 15].map((n) => (
                                                <option key={n} value={n}>{n} slides</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={theme}
                                            onChange={(e) => setTheme(e.target.value as Theme)}
                                            className="appearance-none bg-white dark:bg-slate-800 border rounded-lg px-3 py-1.5 pr-7 text-sm font-medium"
                                            disabled={isGeneratingFull}
                                        >
                                            {THEMES.map((t) => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGenerateOutline}
                                    disabled={isGeneratingOutline || isGeneratingFull}
                                >
                                    <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingOutline ? 'animate-spin' : ''}`} />
                                    Regenerate
                                </Button>
                            </div>

                            {/* Prompt Display */}
                            <Card className="p-4 mb-6 bg-white dark:bg-slate-800 border-0 shadow-sm">
                                <p className="text-foreground font-medium">{prompt}</p>
                            </Card>

                            {/* Outline Label */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-muted-foreground">Outline</h3>
                                <p className="text-xs text-muted-foreground">Click any slide to edit • Drag to reorder</p>
                            </div>

                            {/* Outline Cards */}
                            <div className="space-y-3 mb-24">
                                {isGeneratingOutline ? (
                                    Array.from({ length: slideCount }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 animate-pulse"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                                                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                                                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/5"></div>
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
                                            className={`bg-white dark:bg-slate-800 rounded-xl p-4 border-l-4 shadow-sm ${editingSlide === i ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-blue-300'
                                                } transition-all`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm shrink-0">
                                                        {i + 1}
                                                    </div>
                                                    <button className="text-slate-300 hover:text-slate-500 cursor-grab">
                                                        <GripVertical className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    {editingSlide === i ? (
                                                        <div className="space-y-3">
                                                            <Input
                                                                value={slide.title}
                                                                onChange={(e) => updateOutlineSlide(i, 'title', e.target.value)}
                                                                className="font-semibold text-lg border-blue-200"
                                                                placeholder="Slide title"
                                                            />

                                                            {(slide.content || []).map((point, j) => (
                                                                <div key={j} className="flex gap-2 items-start">
                                                                    <span className="text-blue-500 mt-2.5">•</span>
                                                                    <Input
                                                                        value={point}
                                                                        onChange={(e) => {
                                                                            const newContent = [...(slide.content || [])];
                                                                            newContent[j] = e.target.value;
                                                                            updateOutlineSlide(i, 'content', newContent);
                                                                        }}
                                                                        className="text-sm flex-1"
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
                                                                    className="text-xs bg-blue-600 hover:bg-blue-700"
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
                                                                <h4 className="font-semibold text-foreground">{slide.title}</h4>
                                                                <Edit3 className="w-4 h-4 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity" />
                                                            </div>
                                                            <ul className="mt-2 space-y-1">
                                                                {(slide.content || []).map((point, j) => (
                                                                    <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                                                                        <span className="text-blue-500 mt-0.5">•</span>
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
                                                        className="h-7 w-7 text-slate-400 hover:text-blue-600"
                                                        onClick={() => addSlide(i)}
                                                        title="Add slide after"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-slate-400 hover:text-red-600"
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

                            {/* Bottom Generate Bar */}
                            {outline && (
                                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t py-4 px-4 z-50">
                                    <div className="container mx-auto max-w-4xl flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            {outline.slides.length} slides total
                                        </span>
                                        <Button
                                            size="lg"
                                            className="px-12 bg-blue-600 hover:bg-blue-700"
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
                            {/* Left Sidebar - Thumbnails */}
                            <div className="w-52 border-r bg-slate-50 dark:bg-slate-900 overflow-y-auto p-4 space-y-3 hidden md:block">
                                <div className="text-xs font-medium text-muted-foreground mb-3">SLIDES</div>
                                {data.slides.map((slide, i) => {
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setActiveSlide(i)}
                                            className={`w-full aspect-[16/10] rounded-lg overflow-hidden border-2 transition-all relative group ${activeSlide === i
                                                ? "border-blue-500 shadow-lg"
                                                : "border-transparent hover:border-slate-300"
                                                }`}
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
                                            <div className="w-full h-full scale-[0.15] origin-top-left" style={{ width: '666%', height: '666%' }}>
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
                                    );
                                })}
                            </div>

                            {/* Main Preview Area */}
                            <div className="flex-1 overflow-y-auto p-8 bg-slate-100 dark:bg-slate-950">
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
                                                    >
                                                        <ArrowLeft className="w-4 h-4" />
                                                    </Button>
                                                    <span className="text-sm font-medium">
                                                        Slide {activeSlide + 1} of {data.slides.length}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setActiveSlide(Math.min(data.slides.length - 1, activeSlide + 1))}
                                                        disabled={activeSlide === data.slides.length - 1}
                                                    >
                                                        <ArrowRight className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                {/* Preview Mode Toggle & Layout Type Badge */}
                                                <div className="flex items-center gap-3">
                                                    {data.slides[activeSlide].layoutType && (
                                                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium uppercase">
                                                            {data.slides[activeSlide].layoutType} layout
                                                        </span>
                                                    )}
                                                    <div className="flex rounded-lg border overflow-hidden">
                                                        <button
                                                            onClick={() => setPreviewMode('layout')}
                                                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${previewMode === 'layout'
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            <Eye className="w-3 h-3 inline mr-1" /> Layout
                                                        </button>
                                                        <button
                                                            onClick={() => setPreviewMode('edit')}
                                                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${previewMode === 'edit'
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            <Edit3 className="w-3 h-3 inline mr-1" /> Edit
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Slide Preview/Editor */}
                                            {previewMode === 'layout' ? (
                                                /* Layout Preview Mode - Uses SlidePreview component */
                                                <motion.div
                                                    key={`${activeSlide}-layout`}
                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl"
                                                >
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
                                                </motion.div>
                                            ) : (
                                                /* Edit Mode - Editable slide content */
                                                <motion.div
                                                    key={`${activeSlide}-edit`}
                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className={`aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl relative ${activeSlide === 0 || activeSlide === data.slides.length - 1
                                                        ? 'bg-gradient-to-br'
                                                        : 'bg-white dark:bg-slate-800'
                                                        }`}
                                                    style={(activeSlide === 0 || activeSlide === data.slides.length - 1) ? {
                                                        backgroundImage: `linear-gradient(135deg, ${selectedTheme.colors.primary}, ${selectedTheme.colors.secondary})`
                                                    } : {}}
                                                >
                                                    {/* Left sidebar accent strip for content slides */}
                                                    {activeSlide !== 0 && activeSlide !== data.slides.length - 1 && (
                                                        <div
                                                            className="absolute top-0 left-0 bottom-0 w-2"
                                                            style={{ backgroundColor: selectedTheme.colors.primary }}
                                                        />
                                                    )}

                                                    {/* Top accent bar for content slides */}
                                                    {activeSlide !== 0 && activeSlide !== data.slides.length - 1 && (
                                                        <div
                                                            className="absolute top-0 left-2 right-0 h-2"
                                                            style={{ backgroundColor: selectedTheme.colors.secondary }}
                                                        />
                                                    )}

                                                    {/* Bottom accent line for content slides */}
                                                    {activeSlide !== 0 && activeSlide !== data.slides.length - 1 && (
                                                        <div
                                                            className="absolute bottom-8 left-6 right-6 h-0.5"
                                                            style={{ backgroundColor: selectedTheme.colors.accent }}
                                                        />
                                                    )}

                                                    {/* Slide number badge for content slides */}
                                                    {activeSlide !== 0 && activeSlide !== data.slides.length - 1 && (
                                                        <div
                                                            className="absolute top-6 left-6 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                                                            style={{ backgroundColor: selectedTheme.colors.primary }}
                                                        >
                                                            {activeSlide + 1}
                                                        </div>
                                                    )}

                                                    <div className={`w-full h-full p-10 flex gap-8 ${activeSlide !== 0 && activeSlide !== data.slides.length - 1 ? 'pt-14' : ''}`}>
                                                        {/* Text Content */}
                                                        <div className={`flex-1 flex flex-col justify-center ${(activeSlide === 0 || activeSlide === data.slides.length - 1) ? 'text-white' : ''}`}>
                                                            {/* Editable Title */}
                                                            {editingField?.slide === activeSlide && editingField.field === 'title' ? (
                                                                <div className="mb-4">
                                                                    <Input
                                                                        value={data.slides[activeSlide].title}
                                                                        onChange={(e) => updatePreviewSlide(activeSlide, 'title', e.target.value)}
                                                                        className="text-3xl font-bold bg-white/20 border-white/30"
                                                                        autoFocus
                                                                        onBlur={() => setEditingField(null)}
                                                                        onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <h2
                                                                    className={`text-3xl md:text-4xl font-bold mb-6 cursor-pointer hover:opacity-80 transition-opacity group`}
                                                                    style={(activeSlide !== 0 && activeSlide !== data.slides.length - 1) ? { color: selectedTheme.colors.primary } : {}}
                                                                    onClick={() => setEditingField({ slide: activeSlide, field: 'title' })}
                                                                >
                                                                    {data.slides[activeSlide].title}
                                                                    <Edit3 className="inline-block w-5 h-5 ml-2 opacity-0 group-hover:opacity-50" />
                                                                </h2>
                                                            )}

                                                            {/* Editable Content */}
                                                            {(activeSlide === 0 || activeSlide === data.slides.length - 1) ? (
                                                                <div className="space-y-3">
                                                                    {(data.slides[activeSlide].content || []).map((point, j) => (
                                                                        <div
                                                                            key={j}
                                                                            className="flex items-start gap-3 text-white/90 group cursor-pointer hover:opacity-80"
                                                                            onClick={() => setEditingField({ slide: activeSlide, field: 'content', contentIndex: j })}
                                                                        >
                                                                            <span
                                                                                className="w-2 h-2 rounded-full mt-2 shrink-0 bg-white/60"
                                                                            ></span>
                                                                            <span className="text-lg leading-relaxed">
                                                                                {cleanMarkdown(point)}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <ul className="space-y-3">
                                                                    {(data.slides[activeSlide].content || []).map((point, j) => (
                                                                        <li key={j} className="flex items-start gap-3 text-slate-600 dark:text-slate-300 group">
                                                                            <span
                                                                                className="w-2 h-2 rounded-full mt-2 shrink-0"
                                                                                style={{ backgroundColor: selectedTheme.colors.secondary }}
                                                                            ></span>
                                                                            {editingField?.slide === activeSlide && editingField.field === 'content' && editingField.contentIndex === j ? (
                                                                                <Input
                                                                                    value={point}
                                                                                    onChange={(e) => {
                                                                                        const newContent = [...(data.slides[activeSlide].content || [])];
                                                                                        newContent[j] = e.target.value;
                                                                                        updatePreviewSlide(activeSlide, 'content', newContent);
                                                                                    }}
                                                                                    className="text-lg flex-1"
                                                                                    autoFocus
                                                                                    onBlur={() => setEditingField(null)}
                                                                                    onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                                                                                />
                                                                            ) : (
                                                                                <span
                                                                                    className="text-lg cursor-pointer hover:text-blue-600 transition-colors"
                                                                                    onClick={() => setEditingField({ slide: activeSlide, field: 'content', contentIndex: j })}
                                                                                >
                                                                                    {cleanMarkdown(point)}
                                                                                    <Edit3 className="inline-block w-4 h-4 ml-1 opacity-0 group-hover:opacity-50" />
                                                                                </span>
                                                                            )}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>

                                                        {/* Image with Regenerate option */}
                                                        {data.slides[activeSlide].imageUrl && (
                                                            <div className="w-2/5 relative group">
                                                                <div className={`w-full h-full rounded-xl overflow-hidden ${activeSlide === 0 ? 'shadow-2xl' : 'shadow-lg'}`}>
                                                                    {isRegeneratingImage === activeSlide ? (
                                                                        <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                                                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                                                        </div>
                                                                    ) : (
                                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                                        <img
                                                                            src={data.slides[activeSlide].imageUrl}
                                                                            alt={data.slides[activeSlide].title}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    )}
                                                                </div>

                                                                {/* Image Edit Overlay */}
                                                                <div
                                                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center gap-3 p-4"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    {/* Custom prompt input */}
                                                                    <div className="w-full">
                                                                        <Input
                                                                            placeholder="Type custom image prompt..."
                                                                            value={customImagePrompt}
                                                                            onChange={(e) => setCustomImagePrompt(e.target.value)}
                                                                            className="text-sm bg-white"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            onKeyDown={(e) => {
                                                                                e.stopPropagation();
                                                                                if (e.key === 'Enter' && customImagePrompt.trim()) {
                                                                                    regenerateImage(activeSlide, customImagePrompt);
                                                                                }
                                                                            }}
                                                                        />
                                                                    </div>

                                                                    {/* Buttons */}
                                                                    <div className="flex gap-2 w-full">
                                                                        {customImagePrompt.trim() ? (
                                                                            <Button
                                                                                size="sm"
                                                                                className="flex-1 bg-green-600 hover:bg-green-700"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    regenerateImage(activeSlide, customImagePrompt);
                                                                                }}
                                                                                disabled={isRegeneratingImage === activeSlide}
                                                                            >
                                                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                                                Apply Custom
                                                                            </Button>
                                                                        ) : (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="secondary"
                                                                                className="flex-1"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    regenerateImage(activeSlide);
                                                                                }}
                                                                                disabled={isRegeneratingImage === activeSlide}
                                                                            >
                                                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                                                Regenerate
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* All Slides Overview */}
                                            <div className="mt-8">
                                                <h3 className="text-sm font-medium text-muted-foreground mb-4">All Slides ({data.slides.length} total) - Layout types rendered</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {data.slides.map((slide, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setActiveSlide(i)}
                                                            className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${activeSlide === i ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200 hover:border-slate-400'
                                                                }`}
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
                                                    ))}
                                                </div>
                                            </div>
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
