"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Image as ImageIcon,
    Upload,
    Wand2,
    RefreshCw,
    Loader2,
    Maximize2,
    Move,
    Trash2,
    Type,
    Square,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Layers,
    Settings,
    PanelRight,
    PanelRightClose,
    Crop,
    Grid3X3,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

// Types for different element types
export type ElementType = 'image' | 'text' | 'shape' | null;

export interface ImageElementData {
    url?: string;
    publicId?: string;
    source?: 'ai' | 'upload';
    keyword?: string;
    size?: {
        width?: number;
        height?: number;
        objectFit?: 'cover' | 'contain' | 'fill' | 'none';
        positionX?: number;
        positionY?: number;
        cropRatio?: 'original' | 'square' | 'wide' | 'portrait';
    };
}

export interface SelectedElement {
    type: ElementType;
    slideIndex: number;
    data?: ImageElementData;
}

interface ElementEditorPanelProps {
    isOpen: boolean;
    selectedElement: SelectedElement | null;
    onClose: () => void;
    theme: {
        primary: string;
        secondary: string;
        accent: string;
    };
    // Image actions
    onImageUpload: (slideIndex: number) => void;
    onImageRegenerate: (slideIndex: number, prompt?: string) => void;
    onImageSizeChange: (slideIndex: number, size: { width?: number; height?: number; objectFit?: 'cover' | 'contain' | 'fill' | 'none'; positionX?: number; positionY?: number; cropRatio?: 'original' | 'square' | 'wide' | 'portrait' }) => void;
    onImageRemove: (slideIndex: number) => void;
    isUploadingImage: boolean;
    isRegeneratingImage: boolean;
    customImagePrompt: string;
    setCustomImagePrompt: (prompt: string) => void;
    // Collapse state
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export default function ElementEditorPanel({
    isOpen,
    selectedElement,
    onClose,
    theme,
    onImageUpload,
    onImageRegenerate,
    onImageSizeChange,
    onImageRemove,
    isUploadingImage,
    isRegeneratingImage,
    customImagePrompt,
    setCustomImagePrompt,
    isCollapsed = false,
    onToggleCollapse,
}: ElementEditorPanelProps) {
    const [expandedSection, setExpandedSection] = useState<string>('source');

    if (!isOpen || !selectedElement) return null;

    // Handle toggle - use external control if provided, otherwise use onClose
    const handleToggle = () => {
        if (onToggleCollapse) {
            onToggleCollapse();
        } else {
            onClose();
        }
    };

    // Section component for collapsible sections
    const Section = ({
        id,
        title,
        icon,
        children,
        defaultExpanded = false
    }: {
        id: string;
        title: string;
        icon: React.ReactNode;
        children: React.ReactNode;
        defaultExpanded?: boolean;
    }) => (
        <div className="border-b" style={{ borderColor: `${theme.accent}30` }}>
            <button
                onClick={() => setExpandedSection(expandedSection === id ? '' : id)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span style={{ color: theme.primary }}>{icon}</span>
                    <span className="font-medium text-sm text-slate-700">{title}</span>
                </div>
                {expandedSection === id ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
            </button>
            <AnimatePresence>
                {expandedSection === id && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-4">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    // Render Image Editor
    const renderImageEditor = () => {
        const imageData = selectedElement.data as ImageElementData;
        const hasImage = !!imageData?.url;
        const currentSize = imageData?.size || {};

        return (
            <>
                {/* Image Source Section */}
                <Section id="source" title="Image Source" icon={<ImageIcon className="w-4 h-4" />}>
                    {/* Current Image Preview */}
                    {hasImage && (
                        <div className="relative rounded-lg overflow-hidden bg-slate-100 aspect-video mb-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imageData.url}
                                alt="Current image"
                                className="w-full h-full object-cover"
                            />
                            <div
                                className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-medium"
                                style={{
                                    backgroundColor: imageData.source === 'upload'
                                        ? `${theme.accent}40`
                                        : `${theme.secondary}40`,
                                    color: imageData.source === 'upload' ? theme.primary : theme.secondary
                                }}
                            >
                                {imageData.source === 'upload' ? '📤 Uploaded' : '🤖 AI Generated'}
                            </div>
                        </div>
                    )}

                    {/* Upload Button */}
                    <Button
                        variant="outline"
                        className="w-full border-2 justify-start"
                        style={{
                            borderColor: theme.accent,
                            color: theme.primary
                        }}
                        onClick={() => onImageUpload(selectedElement.slideIndex)}
                        disabled={isUploadingImage}
                    >
                        {isUploadingImage ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4 mr-2" />
                        )}
                        {isUploadingImage ? 'Uploading...' : 'Upload from Device'}
                    </Button>

                    {hasImage && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onImageRemove(selectedElement.slideIndex)}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove Image
                        </Button>
                    )}
                </Section>

                {/* AI Generation Section */}
                <Section id="aiGenerate" title="AI Generate" icon={<Wand2 className="w-4 h-4" />}>
                    <div className="space-y-3">
                        <p className="text-xs text-slate-500">
                            Describe the image you want AI to generate
                        </p>
                        <Input
                            placeholder="E.g., Modern office with team collaboration..."
                            value={customImagePrompt}
                            onChange={(e) => setCustomImagePrompt(e.target.value)}
                            className="text-sm border-2"
                            style={{ borderColor: `${theme.secondary}50` }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && customImagePrompt.trim()) {
                                    onImageRegenerate(selectedElement.slideIndex, customImagePrompt);
                                }
                            }}
                        />
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                style={{
                                    borderColor: theme.secondary,
                                    color: theme.primary
                                }}
                                onClick={() => onImageRegenerate(selectedElement.slideIndex)}
                                disabled={isRegeneratingImage}
                            >
                                {isRegeneratingImage ? (
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-3 h-3 mr-1" />
                                )}
                                Random
                            </Button>
                            <Button
                                size="sm"
                                className="flex-1 text-white"
                                style={{ backgroundColor: theme.primary }}
                                onClick={() => onImageRegenerate(selectedElement.slideIndex, customImagePrompt)}
                                disabled={isRegeneratingImage || !customImagePrompt.trim()}
                            >
                                {isRegeneratingImage ? (
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                    <Sparkles className="w-3 h-3 mr-1" />
                                )}
                                Generate
                            </Button>
                        </div>
                    </div>
                </Section>

                {/* Resize Section */}
                {hasImage && (
                    <Section id="resize" title="Size & Fit" icon={<Maximize2 className="w-4 h-4" />}>
                        <div className="space-y-4">
                            {/* Width Slider */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-medium text-slate-600">Width</label>
                                    <span
                                        className="text-xs px-2 py-0.5 rounded"
                                        style={{ backgroundColor: `${theme.accent}30`, color: theme.primary }}
                                    >
                                        {currentSize.width || 100}%
                                    </span>
                                </div>
                                <Slider
                                    value={[currentSize.width || 100]}
                                    onValueChange={([value]) => onImageSizeChange(selectedElement.slideIndex, {
                                        ...currentSize,
                                        width: value
                                    })}
                                    min={30}
                                    max={100}
                                    step={5}
                                    className="w-full"
                                />
                            </div>

                            {/* Height Slider */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-medium text-slate-600">Height</label>
                                    <span
                                        className="text-xs px-2 py-0.5 rounded"
                                        style={{ backgroundColor: `${theme.accent}30`, color: theme.primary }}
                                    >
                                        {currentSize.height || 100}%
                                    </span>
                                </div>
                                <Slider
                                    value={[currentSize.height || 100]}
                                    onValueChange={([value]) => onImageSizeChange(selectedElement.slideIndex, {
                                        ...currentSize,
                                        height: value
                                    })}
                                    min={30}
                                    max={100}
                                    step={5}
                                    className="w-full"
                                />
                            </div>

                            {/* Object Fit */}
                            <div>
                                <label className="text-xs font-medium text-slate-600 block mb-2">Fit Mode</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['cover', 'contain', 'fill'] as const).map((fit) => (
                                        <button
                                            key={fit}
                                            onClick={() => onImageSizeChange(selectedElement.slideIndex, {
                                                ...currentSize,
                                                objectFit: fit
                                            })}
                                            className={`py-2 px-2 text-xs rounded-lg capitalize transition-all border-2 ${(currentSize.objectFit || 'cover') === fit
                                                ? 'text-white border-transparent'
                                                : 'bg-white text-slate-600 hover:bg-slate-50'
                                                }`}
                                            style={(currentSize.objectFit || 'cover') === fit
                                                ? { backgroundColor: theme.primary, borderColor: theme.primary }
                                                : { borderColor: `${theme.accent}50` }}
                                        >
                                            {fit}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Section>
                )}

                {/* Position Section */}
                {hasImage && (
                    <Section id="position" title="Position" icon={<Move className="w-4 h-4" />}>
                        <div className="space-y-4">
                            {/* X Position Slider */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-medium text-slate-600">X Offset</label>
                                    <span
                                        className="text-xs px-2 py-0.5 rounded"
                                        style={{ backgroundColor: `${theme.accent}30`, color: theme.primary }}
                                    >
                                        {currentSize.positionX || 0}%
                                    </span>
                                </div>
                                <Slider
                                    value={[currentSize.positionX || 0]}
                                    onValueChange={([value]) => onImageSizeChange(selectedElement.slideIndex, {
                                        ...currentSize,
                                        positionX: value
                                    })}
                                    min={-50}
                                    max={50}
                                    step={5}
                                    className="w-full"
                                />
                            </div>

                            {/* Y Position Slider */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-medium text-slate-600">Y Offset</label>
                                    <span
                                        className="text-xs px-2 py-0.5 rounded"
                                        style={{ backgroundColor: `${theme.accent}30`, color: theme.primary }}
                                    >
                                        {currentSize.positionY || 0}%
                                    </span>
                                </div>
                                <Slider
                                    value={[currentSize.positionY || 0]}
                                    onValueChange={([value]) => onImageSizeChange(selectedElement.slideIndex, {
                                        ...currentSize,
                                        positionY: value
                                    })}
                                    min={-50}
                                    max={50}
                                    step={5}
                                    className="w-full"
                                />
                            </div>

                            {/* Reset Position Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                style={{ borderColor: theme.accent, color: theme.primary }}
                                onClick={() => onImageSizeChange(selectedElement.slideIndex, {
                                    ...currentSize,
                                    positionX: 0,
                                    positionY: 0
                                })}
                            >
                                <RefreshCw className="w-3 h-3 mr-2" />
                                Reset Position
                            </Button>
                        </div>
                    </Section>
                )}

                {/* Crop Section */}
                {hasImage && (
                    <Section id="crop" title="Crop Ratio" icon={<Crop className="w-4 h-4" />}>
                        <div className="space-y-3">
                            <p className="text-xs text-slate-500">
                                Select aspect ratio for the image
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'original', label: 'Original', icon: <ImageIcon className="w-4 h-4" /> },
                                    { id: 'square', label: 'Square 1:1', icon: <Square className="w-4 h-4" /> },
                                    { id: 'wide', label: 'Wide 16:9', icon: <Grid3X3 className="w-4 h-4" /> },
                                    { id: 'portrait', label: 'Portrait 9:16', icon: <Grid3X3 className="w-4 h-4 rotate-90" /> },
                                ].map((ratio) => (
                                    <button
                                        key={ratio.id}
                                        onClick={() => onImageSizeChange(selectedElement.slideIndex, {
                                            ...currentSize,
                                            cropRatio: ratio.id as 'original' | 'square' | 'wide' | 'portrait'
                                        })}
                                        className={`flex items-center gap-2 py-2.5 px-3 text-xs rounded-lg transition-all border-2 ${(currentSize.cropRatio || 'original') === ratio.id
                                            ? 'text-white border-transparent'
                                            : 'bg-white text-slate-600 hover:bg-slate-50'
                                            }`}
                                        style={(currentSize.cropRatio || 'original') === ratio.id
                                            ? { backgroundColor: theme.primary, borderColor: theme.primary }
                                            : { borderColor: `${theme.accent}50` }}
                                    >
                                        {ratio.icon}
                                        <span>{ratio.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Section>
                )}
            </>
        );
    };

    // Render content based on element type
    const renderEditorContent = () => {
        switch (selectedElement.type) {
            case 'image':
                return renderImageEditor();
            case 'text':
                return (
                    <div className="p-6 text-center">
                        <Type className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p className="text-sm text-slate-500">Text editing coming soon</p>
                    </div>
                );
            case 'shape':
                return (
                    <div className="p-6 text-center">
                        <Square className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p className="text-sm text-slate-500">Shape editing coming soon</p>
                    </div>
                );
            default:
                return (
                    <div className="p-6 text-center">
                        <Settings className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p className="text-sm text-slate-500">Select an element to edit</p>
                    </div>
                );
        }
    };

    // Get title based on element type
    const getTitle = () => {
        switch (selectedElement.type) {
            case 'image':
                return 'Edit Image';
            case 'text':
                return 'Edit Text';
            case 'shape':
                return 'Edit Shape';
            default:
                return 'Element Editor';
        }
    };

    // Get icon based on element type
    const getIcon = () => {
        switch (selectedElement.type) {
            case 'image':
                return <ImageIcon className="w-5 h-5 text-white" />;
            case 'text':
                return <Type className="w-5 h-5 text-white" />;
            case 'shape':
                return <Square className="w-5 h-5 text-white" />;
            default:
                return <Layers className="w-5 h-5 text-white" />;
        }
    };

    return (
        <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: isCollapsed ? 60 : 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="h-full bg-white border-l-2 flex flex-col overflow-hidden"
            style={{ borderColor: `${theme.accent}40` }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between p-3 border-b"
                style={{
                    borderColor: `${theme.accent}30`,
                    background: `linear-gradient(135deg, ${theme.primary}10 0%, ${theme.accent}10 100%)`
                }}
            >
                {!isCollapsed && (
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` }}
                        >
                            {getIcon()}
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-slate-700">{getTitle()}</h3>
                            <p className="text-xs text-slate-400">Slide {selectedElement.slideIndex + 1}</p>
                        </div>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggle}
                    className={`h-8 w-8 ${isCollapsed ? 'mx-auto' : ''}`}
                    title={isCollapsed ? 'Expand editor' : 'Collapse editor'}
                >
                    {isCollapsed ? (
                        <PanelRight className="w-4 h-4" style={{ color: theme.primary }} />
                    ) : (
                        <PanelRightClose className="w-4 h-4" style={{ color: theme.primary }} />
                    )}
                </Button>
            </div>

            {/* Editor Content - only show when not collapsed */}
            {!isCollapsed && (
                <>
                    <div className="flex-1 overflow-y-auto">
                        {renderEditorContent()}
                    </div>

                    {/* Footer */}
                    <div
                        className="p-3 border-t text-center"
                        style={{ borderColor: `${theme.accent}30` }}
                    >
                        <p className="text-[10px] text-slate-400">
                            Click on image in slide to edit directly
                        </p>
                    </div>
                </>
            )}

            {/* Collapsed view - show icon only */}
            {isCollapsed && (
                <div className="flex-1 flex flex-col items-center py-4 gap-3">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                        style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` }}
                        onClick={handleToggle}
                        title="Click to expand"
                    >
                        {getIcon()}
                    </div>
                    <span
                        className="text-[10px] font-medium -rotate-90 whitespace-nowrap mt-4"
                        style={{ color: theme.primary }}
                    >
                        {getTitle()}
                    </span>
                </div>
            )}
        </motion.div>
    );
}
