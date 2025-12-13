"use client";

import { useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, Sparkles, Presentation } from "lucide-react";
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

export default function PresentationsPage() {
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [data, setData] = useState<PresentationData | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast.error("Please enter a topic");
            return;
        }

        setIsGenerating(true);
        setData(null);

        try {
            const response = await fetch("/api/generate-presentation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to generate");
            }

            setData(result);
            toast.success("Presentation generated successfully!");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async () => {
        if (!data) return;

        setIsDownloading(true);

        try {
            const response = await fetch("/api/download-presentation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to download");
            }

            // Get the blob from the response
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${data.title.replace(/[^a-z0-9]/gi, '_')}.pptx`;
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

    return (
        <>
            <div className="flex min-h-screen flex-col bg-background">
                <Navbar />

                <main className="flex-1 container mx-auto px-4 py-24">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-center mb-12"
                        >
                            <div className="inline-flex items-center rounded-full bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 text-sm font-medium text-yellow-500 mb-6">
                                <Sparkles className="w-4 h-4 mr-2" />
                                AI Powerpoint Generator
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-600 mb-6">
                                Create Professional Presentations
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                Turn any topic into a complete PowerPoint presentation with relevant images and structure in seconds.
                            </p>
                        </motion.div>

                        {/* Input Section */}
                        <Card className="p-8 border-border/50 bg-card/50 backdrop-blur-sm mb-12 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500" />

                            <div className="flex flex-col gap-4">
                                <label className="text-lg font-semibold">What would you like to present about?</label>
                                <div className="flex gap-4 flex-col md:flex-row">
                                    <Input
                                        placeholder="e.g. The Future of Renewable Energy in 2025..."
                                        className="text-lg p-6 h-auto"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        disabled={isGenerating}
                                    />
                                    <Button
                                        size="lg"
                                        className="h-auto px-8 py-4 text-lg bg-yellow-500 hover:bg-yellow-600 text-white"
                                        onClick={handleGenerate}
                                        disabled={isGenerating || !prompt}
                                    >
                                        {isGenerating ? (
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
                        </Card>

                        {/* Results Section */}
                        <AnimatePresence>
                            {data && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <Presentation className="h-6 w-6 text-yellow-500" />
                                            Preview: {data.title}
                                        </h2>
                                        <Button
                                            onClick={handleDownload}
                                            variant="outline"
                                            className="border-yellow-500/50 hover:bg-yellow-500/10"
                                            disabled={isDownloading}
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

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {data.slides.map((slide, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="aspect-video bg-white rounded-lg p-6 shadow-xl relative overflow-hidden group border border-border"
                                            >
                                                <div className="absolute top-2 right-4 text-xs font-bold text-gray-300">#{index + 1}</div>

                                                <h3 className="text-lg font-bold text-gray-800 mb-4">{slide.title}</h3>

                                                <div className="flex gap-4 h-full">
                                                    <div className="w-1/2 space-y-2">
                                                        {slide.content.slice(0, 3).map((point, i) => (
                                                            <div key={i} className="flex gap-2 text-xs text-gray-600 leading-tight">
                                                                <span className="text-yellow-500">•</span>
                                                                {point}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="w-1/2 mt-2">
                                                        {slide.imageKeyword && (
                                                            <div className="w-full h-32 rounded bg-gray-100 overflow-hidden relative">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img
                                                                    src={`https://image.pollinations.ai/prompt/${encodeURIComponent(slide.imageKeyword)}?width=400&height=300&nologo=true`}
                                                                    alt="AI Generated"
                                                                    className="w-full h-full object-cover"
                                                                    loading="lazy"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>

                <Footer />
            </div>
        </>
    );
}
