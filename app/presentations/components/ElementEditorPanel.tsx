"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
    ChevronRight,
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
    // Track which sections are expanded (allow multiple)
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['source']));

    // Local slider values for smooth updates
    const [localValues, setLocalValues] = useState({
        width: 100,
        height: 100,
        positionX: 0,
        positionY: 0,
    });

    // Debounce timer ref
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Sync local values when selectedElement changes
    useEffect(() => {
        if (selectedElement?.data?.size) {
            setLocalValues({
                width: selectedElement.data.size.width || 100,
                height: selectedElement.data.size.height || 100,
                positionX: selectedElement.data.size.positionX || 0,
                positionY: selectedElement.data.size.positionY || 0,
            });
        }
    }, [selectedElement?.data?.size]);

    if (!isOpen || !selectedElement) return null;

    const handleToggle = () => {
        if (onToggleCollapse) {
            onToggleCollapse();
        } else {
            onClose();
        }
    };

    // Toggle section expansion
    const toggleSection = (id: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // Debounced size change for smooth slider updates
    const handleSliderChange = useCallback((field: string, value: number) => {
        // Update local state immediately (smooth UI)
        setLocalValues(prev => ({ ...prev, [field]: value }));

        // Debounce the actual update to parent
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            const imageData = selectedElement?.data as ImageElementData;
            const currentSize = imageData?.size || {};
            onImageSizeChange(selectedElement!.slideIndex, {
                ...currentSize,
                [field]: value,
            });
        }, 50); // Small debounce for smooth feel
    }, [selectedElement, onImageSizeChange]);

    // Section component with smooth animations
    const Section = ({
        id,
        title,
        icon,
        children,
    }: {
        id: string;
        title: string;
        icon: React.ReactNode;
        children: React.ReactNode;
    }) => {
        const isExpanded = expandedSections.has(id);

        return (
            <div className="border-b" style={{ borderColor: `${theme.accent}20` }}>
                <button
                    onClick={() => toggleSection(id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50/80 transition-colors"
                >
                    <div className="flex items-center gap-2.5">
                        <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${theme.primary}12` }}
                        >
                            <span style={{ color: theme.primary }}>{icon}</span>
                        </span>
                        <span className="font-medium text-sm text-slate-700">{title}</span>
                    </div>
                    <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </motion.div>
                </button>
                <AnimatePresence initial={false}>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div className="px-3 pb-3 space-y-3">
                                {children}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

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
                        <div className="relative rounded-lg overflow-hidden bg-slate-100 aspect-video mb-2">
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
                                {imageData.source === 'upload' ? '📤 Uploaded' : '🤖 AI'}
                            </div>
                        </div>
                    )}

                    {/* Upload Button */}
                    <Button
                        variant="outline"
                        className="w-full border-2 justify-start h-9"
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
                        {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                    </Button>

                    {hasImage && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 h-8"
                            onClick={() => onImageRemove(selectedElement.slideIndex)}
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Remove
                        </Button>
                    )}
                </Section>

                {/* AI Generation Section */}
                <Section id="aiGenerate" title="AI Generate" icon={<Wand2 className="w-4 h-4" />}>
                    <div className="space-y-2">
                        <Input
                            placeholder="Describe the image..."
                            value={customImagePrompt}
                            onChange={(e) => setCustomImagePrompt(e.target.value)}
                            className="text-sm border-2 h-9"
                            style={{ borderColor: `${theme.secondary}40` }}
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
                                className="flex-1 h-8"
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
                                className="flex-1 h-8 text-white"
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

                {/* Crop Ratio Section */}
                {hasImage && (
                    <Section id="crop" title="Crop Ratio" icon={<Crop className="w-4 h-4" />}>
                        <div className="grid grid-cols-2 gap-1.5">
                            {[
                                { id: 'original', label: 'Original', icon: <ImageIcon className="w-3.5 h-3.5" /> },
                                { id: 'square', label: '1:1', icon: <Square className="w-3.5 h-3.5" /> },
                                { id: 'wide', label: '16:9', icon: <Grid3X3 className="w-3.5 h-3.5" /> },
                                { id: 'portrait', label: '9:16', icon: <Grid3X3 className="w-3.5 h-3.5 rotate-90" /> },
                            ].map((ratio) => (
                                <button
                                    key={ratio.id}
                                    onClick={() => onImageSizeChange(selectedElement.slideIndex, {
                                        ...currentSize,
                                        cropRatio: ratio.id as 'original' | 'square' | 'wide' | 'portrait'
                                    })}
                                    className={`flex items-center gap-1.5 py-2 px-2.5 text-xs rounded-lg transition-all border ${(currentSize.cropRatio || 'original') === ratio.id
                                        ? 'text-white border-transparent'
                                        : 'bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                    style={(currentSize.cropRatio || 'original') === ratio.id
                                        ? { backgroundColor: theme.primary, borderColor: theme.primary }
                                        : { borderColor: `${theme.accent}40` }}
                                >
                                    {ratio.icon}
                                    <span className="font-medium">{ratio.label}</span>
                                </button>
                            ))}
                        </div>
                    </Section>
                )}

                {/* Size Section */}
                {hasImage && (
                    <Section id="size" title="Size" icon={<Maximize2 className="w-4 h-4" />}>
                        <div className="space-y-3">
                            {/* Width Slider */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-medium text-slate-500">Width</label>
                                    <span
                                        className="text-xs px-1.5 py-0.5 rounded font-semibold"
                                        style={{ backgroundColor: `${theme.accent}25`, color: theme.primary }}
                                    >
                                        {localValues.width}%
                                    </span>
                                </div>
                                <Slider
                                    value={[localValues.width]}
                                    onValueChange={([value]) => handleSliderChange('width', value)}
                                    min={30}
                                    max={100}
                                    step={1}
                                    className="w-full"
                                />
                            </div>

                            {/* Height Slider */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-medium text-slate-500">Height</label>
                                    <span
                                        className="text-xs px-1.5 py-0.5 rounded font-semibold"
                                        style={{ backgroundColor: `${theme.accent}25`, color: theme.primary }}
                                    >
                                        {localValues.height}%
                                    </span>
                                </div>
                                <Slider
                                    value={[localValues.height]}
                                    onValueChange={([value]) => handleSliderChange('height', value)}
                                    min={30}
                                    max={100}
                                    step={1}
                                    className="w-full"
                                />
                            </div>

                            {/* Fit Mode */}
                            <div>
                                <label className="text-xs font-medium text-slate-500 block mb-1.5">Fit Mode</label>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {(['cover', 'contain', 'fill'] as const).map((fit) => (
                                        <button
                                            key={fit}
                                            onClick={() => onImageSizeChange(selectedElement.slideIndex, {
                                                ...currentSize,
                                                objectFit: fit
                                            })}
                                            className={`py-1.5 px-2 text-xs rounded-lg capitalize transition-all border ${(currentSize.objectFit || 'cover') === fit
                                                ? 'text-white border-transparent'
                                                : 'bg-white text-slate-600 hover:bg-slate-50'
                                                }`}
                                            style={(currentSize.objectFit || 'cover') === fit
                                                ? { backgroundColor: theme.primary, borderColor: theme.primary }
                                                : { borderColor: `${theme.accent}40` }}
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
                        <div className="space-y-3">
                            {/* X Position Slider */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-medium text-slate-500">X Offset</label>
                                    <span
                                        className="text-xs px-1.5 py-0.5 rounded font-semibold"
                                        style={{ backgroundColor: `${theme.accent}25`, color: theme.primary }}
                                    >
                                        {localValues.positionX >= 0 ? '+' : ''}{localValues.positionX}%
                                    </span>
                                </div>
                                <Slider
                                    value={[localValues.positionX]}
                                    onValueChange={([value]) => handleSliderChange('positionX', value)}
                                    min={-50}
                                    max={50}
                                    step={1}
                                    className="w-full"
                                />
                            </div>

                            {/* Y Position Slider */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-medium text-slate-500">Y Offset</label>
                                    <span
                                        className="text-xs px-1.5 py-0.5 rounded font-semibold"
                                        style={{ backgroundColor: `${theme.accent}25`, color: theme.primary }}
                                    >
                                        {localValues.positionY >= 0 ? '+' : ''}{localValues.positionY}%
                                    </span>
                                </div>
                                <Slider
                                    value={[localValues.positionY]}
                                    onValueChange={([value]) => handleSliderChange('positionY', value)}
                                    min={-50}
                                    max={50}
                                    step={1}
                                    className="w-full"
                                />
                            </div>

                            {/* Reset Position Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-8"
                                style={{ borderColor: theme.accent, color: theme.primary }}
                                onClick={() => {
                                    setLocalValues(prev => ({ ...prev, positionX: 0, positionY: 0 }));
                                    onImageSizeChange(selectedElement.slideIndex, {
                                        ...currentSize,
                                        positionX: 0,
                                        positionY: 0
                                    });
                                }}
                            >
                                <RefreshCw className="w-3 h-3 mr-2" />
                                Reset Position
                            </Button>
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
                return <ImageIcon className="w-4 h-4 text-white" />;
            case 'text':
                return <Type className="w-4 h-4 text-white" />;
            case 'shape':
                return <Square className="w-4 h-4 text-white" />;
            default:
                return <Layers className="w-4 h-4 text-white" />;
        }
    };

    return (
        <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: isCollapsed ? 52 : 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="h-full bg-white border-l flex flex-col"
            style={{ borderColor: `${theme.accent}30` }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between p-2.5 border-b shrink-0"
                style={{
                    borderColor: `${theme.accent}20`,
                    background: `linear-gradient(135deg, ${theme.primary}08 0%, ${theme.accent}08 100%)`
                }}
            >
                {!isCollapsed && (
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` }}
                        >
                            {getIcon()}
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-slate-700 leading-tight">{getTitle()}</h3>
                            <p className="text-[10px] text-slate-400">Slide {selectedElement.slideIndex + 1}</p>
                        </div>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggle}
                    className={`h-7 w-7 ${isCollapsed ? 'mx-auto' : ''}`}
                    title={isCollapsed ? 'Expand' : 'Collapse'}
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
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    {renderEditorContent()}
                </div>
            )}

            {/* Collapsed view */}
            {isCollapsed && (
                <div className="flex-1 flex flex-col items-center py-4 gap-2">
                    <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                        style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` }}
                        onClick={handleToggle}
                        title="Expand"
                    >
                        {getIcon()}
                    </div>
                    <span
                        className="text-[9px] font-medium -rotate-90 whitespace-nowrap mt-6"
                        style={{ color: theme.primary }}
                    >
                        {getTitle()}
                    </span>
                </div>
            )}
        </motion.div>
    );
}
