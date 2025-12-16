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
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[600px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border-2 border-rose-100 overflow-hidden"
                        style={{ zIndex: 9999 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b-2 border-rose-100 bg-gradient-to-r from-orange-50 via-rose-50 to-pink-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                                    <Wand2 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold flex items-center gap-2 text-slate-700">
                                        AI Agent
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
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
                        <div className="flex border-b-2 border-rose-100">
                            {[
                                { id: 'quick', label: 'Quick Actions', icon: Zap },
                                { id: 'custom', label: 'Custom Prompt', icon: MessageSquare },
                                { id: 'layout', label: 'Change Layout', icon: LayoutGrid },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                        ? 'text-rose-600 border-b-2 border-rose-600'
                                        : 'text-slate-400 hover:text-rose-500'
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
                                    <p className="text-sm text-slate-500 mb-3">
                                        Select a quick action to regenerate this slide instantly
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {QUICK_ACTIONS.map((action) => (
                                            <button
                                                key={action.id}
                                                onClick={() => handleQuickAction(action.id, action.prompt)}
                                                disabled={isRegenerating}
                                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left group ${selectedAction === action.id
                                                    ? 'border-rose-400 bg-rose-50'
                                                    : 'border-rose-100 bg-white hover:border-rose-300 hover:bg-rose-50/50'
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${selectedAction === action.id
                                                    ? 'bg-rose-600 text-white'
                                                    : 'bg-rose-50 text-rose-500 group-hover:bg-rose-100 group-hover:text-rose-600'
                                                    }`}>
                                                    {selectedAction === action.id && isRegenerating ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <action.icon className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <span className="font-medium text-sm text-slate-700">{action.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Custom Prompt Tab */}
                            {activeTab === 'custom' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-slate-700">Describe what you want</label>
                                        <Textarea
                                            placeholder="E.g., 'Rewrite this slide to focus on cost savings and include specific statistics...'"
                                            value={customPrompt}
                                            onChange={(e) => setCustomPrompt(e.target.value)}
                                            className="min-h-[100px] resize-none border-2 border-rose-100 focus:border-rose-300"
                                        />
                                    </div>

                                    {/* Regenerate Type Selection */}
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-slate-700">What to regenerate</label>
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
                                                        ? 'bg-rose-600 text-white'
                                                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                                        }`}
                                                >
                                                    <type.icon className="w-4 h-4" />
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Keep Image Toggle */}
                                    <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-100">
                                        <div className="flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4 text-rose-500" />
                                            <span className="text-sm text-slate-700">Keep current image</span>
                                        </div>
                                        <button
                                            onClick={() => setKeepImage(!keepImage)}
                                            className={`w-11 h-6 rounded-full relative transition-colors ${keepImage ? 'bg-rose-600' : 'bg-rose-200'
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
                                        className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white"
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
                                    <p className="text-sm text-slate-500">
                                        Change the layout while keeping your content
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {LAYOUT_SUGGESTIONS.map((layout) => (
                                            <button
                                                key={layout.id}
                                                onClick={() => handleLayoutChange(layout.id)}
                                                disabled={isRegenerating}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${selectedLayout === layout.id
                                                    ? 'border-rose-400 bg-rose-50'
                                                    : 'border-rose-100 bg-white hover:border-rose-300 hover:bg-rose-50/50'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-sm text-slate-700">{layout.name}</span>
                                                    {selectedLayout === layout.id && isRegenerating ? (
                                                        <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                                                    ) : (
                                                        <ArrowRight className="w-4 h-4 text-rose-400" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500">{layout.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Current content preview */}
                        <div className="border-t border-rose-100 p-3 bg-rose-50/50">
                            <p className="text-xs text-rose-500 mb-1">Current slide content:</p>
                            <p className="text-xs text-slate-600 line-clamp-2">
                                {slideContent?.slice(0, 3).join(' • ') || 'No content'}
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
