"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Sparkles,
    Wand2,
    RefreshCw,
    Loader2,
    ArrowRight,
    Lightbulb,
    Palette,
    LayoutGrid,
    Type,
    Image as ImageIcon,
    Zap,
    MessageSquare,
    Target,
    ArrowUpRight,
    Check,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type SlideLayoutType = 'title' | 'comparison' | 'features' | 'imageRight' | 'imageLeft' | 'imageTop' | 'metrics' | 'iconList' | 'textOnly' | 'closing';

interface AIRegeneratePanelProps {
    isOpen: boolean;
    onClose: () => void;
    slideIndex: number;
    slideTitle: string;
    slideContent?: string[];
    onRegenerate: (prompt: string, options: RegenerateOptions) => Promise<void>;
    isRegenerating: boolean;
}

interface RegenerateOptions {
    regenerateType: 'full' | 'content' | 'layout' | 'image' | 'style';
    targetLayout?: SlideLayoutType;
    keepImage: boolean;
    tone?: 'professional' | 'casual' | 'creative' | 'formal';
}

// Quick action presets
const QUICK_ACTIONS = [
    { id: 'more-engaging', label: 'Make more engaging', icon: Sparkles, prompt: 'Make this slide more engaging and visually appealing' },
    { id: 'simplify', label: 'Simplify', icon: Zap, prompt: 'Simplify this slide content to be more concise and clear' },
    { id: 'expand', label: 'Add more detail', icon: Target, prompt: 'Expand on the content with more details and examples' },
    { id: 'professional', label: 'More professional', icon: ArrowUpRight, prompt: 'Rewrite in a more professional and formal tone' },
    { id: 'creative', label: 'Make creative', icon: Lightbulb, prompt: 'Make this slide more creative and unique' },
    { id: 'storytelling', label: 'Add storytelling', icon: MessageSquare, prompt: 'Add storytelling elements to make it more compelling' },
];

// Layout suggestions
const LAYOUT_SUGGESTIONS: { id: SlideLayoutType; name: string; description: string }[] = [
    { id: 'features', name: 'Features Grid', description: 'Display as feature cards with icons' },
    { id: 'comparison', name: 'Comparison', description: 'Split into two columns for comparison' },
    { id: 'metrics', name: 'Metrics', description: 'Highlight key numbers and stats' },
    { id: 'iconList', name: 'Icon List', description: 'List with icons for each point' },
    { id: 'imageRight', name: 'Image Right', description: 'Content left, image right' },
    { id: 'imageLeft', name: 'Image Left', description: 'Image left, content right' },
];

export default function AIRegeneratePanel({
    isOpen,
    onClose,
    slideIndex,
    slideTitle,
    slideContent,
    onRegenerate,
    isRegenerating,
}: AIRegeneratePanelProps) {
    const [customPrompt, setCustomPrompt] = useState('');
    const [selectedAction, setSelectedAction] = useState<string | null>(null);
    const [regenerateType, setRegenerateType] = useState<'full' | 'content' | 'layout' | 'image' | 'style'>('full');
    const [keepImage, setKeepImage] = useState(false);
    const [selectedLayout, setSelectedLayout] = useState<SlideLayoutType | null>(null);
    const [activeTab, setActiveTab] = useState<'quick' | 'custom' | 'layout'>('quick');

    const handleQuickAction = async (actionId: string, prompt: string) => {
        setSelectedAction(actionId);
        await onRegenerate(prompt, {
            regenerateType: 'content',
            keepImage,
            tone: actionId === 'professional' ? 'professional' : actionId === 'creative' ? 'creative' : 'casual',
        });
        setSelectedAction(null);
    };

    const handleCustomRegenerate = async () => {
        if (!customPrompt.trim()) return;
        await onRegenerate(customPrompt, {
            regenerateType,
            keepImage,
            targetLayout: selectedLayout || undefined,
        });
    };

    const handleLayoutChange = async (layoutId: SlideLayoutType) => {
        setSelectedLayout(layoutId);
        await onRegenerate(`Change the layout to ${layoutId} format while keeping the same content`, {
            regenerateType: 'layout',
            targetLayout: layoutId,
            keepImage: true,
        });
        setSelectedLayout(null);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                        style={{ zIndex: 9998 }}
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[600px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                        style={{ zIndex: 9999 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-violet-50 via-purple-50 to-blue-50 dark:from-violet-950/50 dark:via-purple-950/50 dark:to-blue-950/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                    <Wand2 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold flex items-center gap-2">
                                        AI Agent
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400">
                                            Beta
                                        </span>
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Regenerate Slide {slideIndex + 1}: {slideTitle.slice(0, 30)}...
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-slate-200 dark:border-slate-700">
                            {[
                                { id: 'quick', label: 'Quick Actions', icon: Zap },
                                { id: 'custom', label: 'Custom Prompt', icon: MessageSquare },
                                { id: 'layout', label: 'Change Layout', icon: LayoutGrid },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                        ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="p-4 max-h-[400px] overflow-y-auto">
                            {/* Quick Actions Tab */}
                            {activeTab === 'quick' && (
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Select a quick action to regenerate this slide instantly
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {QUICK_ACTIONS.map((action) => (
                                            <button
                                                key={action.id}
                                                onClick={() => handleQuickAction(action.id, action.prompt)}
                                                disabled={isRegenerating}
                                                className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left group ${selectedAction === action.id
                                                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-950/50'
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${selectedAction === action.id
                                                    ? 'bg-violet-600 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-600'
                                                    }`}>
                                                    {selectedAction === action.id && isRegenerating ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <action.icon className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <span className="font-medium text-sm">{action.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Custom Prompt Tab */}
                            {activeTab === 'custom' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Describe what you want</label>
                                        <Textarea
                                            placeholder="E.g., 'Rewrite this slide to focus on cost savings and include specific statistics...'"
                                            value={customPrompt}
                                            onChange={(e) => setCustomPrompt(e.target.value)}
                                            className="min-h-[100px] resize-none"
                                        />
                                    </div>

                                    {/* Regenerate Type Selection */}
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">What to regenerate</label>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { id: 'full', label: 'Full Slide', icon: LayoutGrid },
                                                { id: 'content', label: 'Content Only', icon: Type },
                                                { id: 'image', label: 'Image Only', icon: ImageIcon },
                                                { id: 'style', label: 'Style Only', icon: Palette },
                                            ].map((type) => (
                                                <button
                                                    key={type.id}
                                                    onClick={() => setRegenerateType(type.id as typeof regenerateType)}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${regenerateType === type.id
                                                        ? 'bg-violet-600 text-white'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    <type.icon className="w-4 h-4" />
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Keep Image Toggle */}
                                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4 text-slate-500" />
                                            <span className="text-sm">Keep current image</span>
                                        </div>
                                        <button
                                            onClick={() => setKeepImage(!keepImage)}
                                            className={`w-11 h-6 rounded-full relative transition-colors ${keepImage ? 'bg-violet-600' : 'bg-slate-200 dark:bg-slate-700'
                                                }`}
                                        >
                                            <span
                                                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${keepImage ? 'translate-x-5' : 'translate-x-0.5'
                                                    }`}
                                            />
                                        </button>
                                    </div>

                                    {/* Generate Button */}
                                    <Button
                                        className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                                        onClick={handleCustomRegenerate}
                                        disabled={!customPrompt.trim() || isRegenerating}
                                    >
                                        {isRegenerating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Regenerating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Regenerate Slide
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            {/* Layout Tab */}
                            {activeTab === 'layout' && (
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Change the layout while keeping your content
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {LAYOUT_SUGGESTIONS.map((layout) => (
                                            <button
                                                key={layout.id}
                                                onClick={() => handleLayoutChange(layout.id)}
                                                disabled={isRegenerating}
                                                className={`p-4 rounded-xl border text-left transition-all ${selectedLayout === layout.id
                                                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-violet-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-sm">{layout.name}</span>
                                                    {selectedLayout === layout.id && isRegenerating ? (
                                                        <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                                                    ) : (
                                                        <ArrowRight className="w-4 h-4 text-slate-400" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">{layout.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Current content preview */}
                        <div className="border-t border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50">
                            <p className="text-xs text-muted-foreground mb-1">Current slide content:</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                {slideContent?.slice(0, 3).join(' • ') || 'No content'}
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
