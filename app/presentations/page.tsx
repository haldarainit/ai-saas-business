"use client";

import { useState, useRef } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { toast } from "sonner";

interface Slide {
    title: string;
    content: string[];
    imageKeyword: string;
}

interface PresentationData {
    title: string;
    slides: Slide[];
}

type Step = "input" | "outline" | "generating" | "preview";
type Theme = "modern" | "classic" | "minimal" | "bold";

const THEMES: { id: Theme; name: string; colors: { primary: string; secondary: string; accent: string } }[] = [
    { id: "modern", name: "Modern", colors: { primary: "#1e40af", secondary: "#3b82f6", accent: "#60a5fa" } },
    { id: "classic", name: "Classic", colors: { primary: "#1f2937", secondary: "#4b5563", accent: "#9ca3af" } },
    { id: "minimal", name: "Minimal", colors: { primary: "#f8fafc", secondary: "#e2e8f0", accent: "#64748b" } },
    { id: "bold", name: "Bold", colors: { primary: "#7c3aed", secondary: "#a855f7", accent: "#c084fc" } },
];

const EXAMPLE_PROMPTS = [
    { icon: FileText, title: "Science fair project", subtitle: "guidance" },
    { icon: Globe, title: "Content strategy for", subtitle: "blog or YouTube" },
    { icon: Presentation, title: "Portfolio presentation", subtitle: "for [name]" },
    { icon: LayoutGrid, title: "Prototyping and testing", subtitle: "user interactions" },
    { icon: Share2, title: "Market analysis and", subtitle: "recommendations" },
    { icon: Sparkles, title: "Sales and marketing", subtitle: "strategies" },
];

export default function PresentationsPage() {
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

    const handleGenerateOutline = async () => {
        if (!prompt.trim()) {
            toast.error("Please enter a topic");
            return;
        }

        setIsGeneratingOutline(true);
        setStep("outline");

        try {
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
            // Add image keywords to outline
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

            setData(result);
            setStep("preview");
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

    const updateSlide = (index: number, field: keyof Slide, value: string | string[]) => {
        if (!outline) return;
        const newSlides = [...outline.slides];
        newSlides[index] = { ...newSlides[index], [field]: value };
        setOutline({ ...outline, slides: newSlides });
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

    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <Navbar />

            <main className="flex-1">
                {/* Header */}
                <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-16 z-40">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {step !== "input" && (
                                    <Button variant="ghost" size="sm" onClick={handleBack}>
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back
                                    </Button>
                                )}
                                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                                    Generate
                                </h1>
                            </div>

                            {step === "preview" && (
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" size="sm">
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Share
                                    </Button>
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
                                        {[5, 6, 7, 8, 10, 12].map((n) => (
                                            <option key={n} value={n}>{n} cards</option>
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
                                        placeholder="Describe what you'd like to make"
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
                            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                                <span className="text-sm font-medium text-muted-foreground">Prompt</span>
                                <div className="relative">
                                    <select
                                        value={slideCount}
                                        onChange={(e) => setSlideCount(Number(e.target.value))}
                                        className="appearance-none bg-white dark:bg-slate-800 border rounded-lg px-4 py-2 pr-8 text-sm font-medium"
                                        disabled={isGeneratingFull}
                                    >
                                        {[5, 6, 7, 8, 10, 12].map((n) => (
                                            <option key={n} value={n}>{n} cards</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                                </div>
                                <div className="relative">
                                    <select
                                        value={theme}
                                        onChange={(e) => setTheme(e.target.value as Theme)}
                                        className="appearance-none bg-white dark:bg-slate-800 border rounded-lg px-4 py-2 pr-8 text-sm font-medium"
                                        disabled={isGeneratingFull}
                                    >
                                        {THEMES.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                                </div>
                            </div>

                            {/* Prompt Display */}
                            <Card className="p-4 mb-6 bg-white dark:bg-slate-800 border-0 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <p className="text-foreground">{prompt}</p>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleGenerateOutline}
                                        disabled={isGeneratingOutline || isGeneratingFull}
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isGeneratingOutline ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>
                            </Card>

                            {/* Outline Label */}
                            <h3 className="text-sm font-medium text-muted-foreground mb-4">Outline</h3>

                            {/* Outline Cards */}
                            <div className="space-y-3 mb-24">
                                {isGeneratingOutline ? (
                                    // Skeleton loading
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
                                            className={`bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border-l-4 ${i === 0 ? 'border-blue-500' : 'border-transparent'
                                                } hover:border-blue-400 transition-colors`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm shrink-0">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {editingSlide === i ? (
                                                        <div className="space-y-3">
                                                            <Input
                                                                value={slide.title}
                                                                onChange={(e) => updateSlide(i, 'title', e.target.value)}
                                                                className="font-semibold text-lg"
                                                            />
                                                            {slide.content.map((point, j) => (
                                                                <Input
                                                                    key={j}
                                                                    value={point}
                                                                    onChange={(e) => {
                                                                        const newContent = [...slide.content];
                                                                        newContent[j] = e.target.value;
                                                                        updateSlide(i, 'content', newContent);
                                                                    }}
                                                                    className="text-sm"
                                                                />
                                                            ))}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => setEditingSlide(null)}
                                                            >
                                                                <Check className="w-4 h-4 mr-1" /> Done
                                                            </Button>
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
                                                                {slide.content.map((point, j) => (
                                                                    <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                                                                        <span className="text-blue-500 mt-1">•</span>
                                                                        {point}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
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
                                            {outline.slides.length} cards total
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
                                                    Generate
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* STEP 3: PREVIEW */}
                    {step === "preview" && data && (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex h-[calc(100vh-8rem)]"
                        >
                            {/* Left Sidebar - Thumbnails */}
                            <div className="w-48 border-r bg-slate-50 dark:bg-slate-900 overflow-y-auto p-4 space-y-3 hidden md:block">
                                {data.slides.map((slide, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveSlide(i)}
                                        className={`w-full aspect-[16/10] rounded-lg overflow-hidden border-2 transition-all ${activeSlide === i
                                                ? "border-blue-500 shadow-lg"
                                                : "border-transparent hover:border-slate-300"
                                            }`}
                                    >
                                        <div className="w-full h-full bg-white dark:bg-slate-800 p-2 text-left">
                                            <div className="text-[8px] font-bold text-slate-600 dark:text-slate-300 line-clamp-2 mb-1">
                                                {slide.title}
                                            </div>
                                            <div className="text-[6px] text-slate-400 line-clamp-3">
                                                {slide.content[0]}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Main Preview Area */}
                            <div className="flex-1 overflow-y-auto p-8 bg-slate-100 dark:bg-slate-950">
                                <div className="max-w-5xl mx-auto space-y-8">
                                    {data.slides.map((slide, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 50 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            id={`slide-${i}`}
                                            className={`aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl ${i === 0 ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-white dark:bg-slate-800'
                                                }`}
                                        >
                                            <div className="w-full h-full p-10 flex gap-8">
                                                {/* Text Content */}
                                                <div className={`flex-1 flex flex-col justify-center ${i === 0 ? 'text-white' : ''}`}>
                                                    <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${i === 0 ? '' : 'text-slate-800 dark:text-white'}`}>
                                                        {slide.title}
                                                    </h2>
                                                    {i === 0 ? (
                                                        <p className="text-lg text-white/80 leading-relaxed">
                                                            {slide.content.join(" ")}
                                                        </p>
                                                    ) : (
                                                        <ul className="space-y-3">
                                                            {slide.content.map((point, j) => (
                                                                <li key={j} className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                                                                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0"></span>
                                                                    <span className="text-lg">{point}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>

                                                {/* Image */}
                                                {slide.imageKeyword && (
                                                    <div className={`w-2/5 rounded-xl overflow-hidden ${i === 0 ? 'shadow-2xl' : 'shadow-lg'}`}>
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={`https://image.pollinations.ai/prompt/${encodeURIComponent(slide.imageKeyword)}?width=800&height=600&nologo=true`}
                                                            alt={slide.title}
                                                            className="w-full h-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {step === "input" && <Footer />}
        </div>
    );
}
