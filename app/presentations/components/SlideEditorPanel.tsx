"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Palette,
    Square,
    Layers,
    RotateCcw,
    Check,
    ChevronDown,
    ChevronUp,
    Type,
    Heading,
    Paintbrush,
    CircleDot,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

export interface SlideStyles {
    backgroundColor: string;
    headingColor: string;
    textColor: string;
    accentColor: string;
    borderRadius: number;
    hasBackdrop: boolean;
    backdropColor: string;
    backdropOpacity: number;
}

interface SlideEditorPanelProps {
    isOpen: boolean;
    onClose: () => void;
    slideIndex: number;
    currentStyles: Partial<SlideStyles>;
    onStyleChange: (styles: Partial<SlideStyles>) => void;
    theme: {
        primary: string;
        secondary: string;
        accent: string;
    };
}

// Comprehensive color palette
const COLOR_PALETTE = {
    basic: [
        { name: 'White', value: '#ffffff' },
        { name: 'Light Gray', value: '#f8fafc' },
        { name: 'Gray', value: '#94a3b8' },
        { name: 'Dark Gray', value: '#475569' },
        { name: 'Slate', value: '#1e293b' },
        { name: 'Black', value: '#0f172a' },
    ],
    warm: [
        { name: 'Cream', value: '#fef7f0' },
        { name: 'Peach', value: '#fed7aa' },
        { name: 'Coral', value: '#fb923c' },
        { name: 'Orange', value: '#ea580c' },
        { name: 'Red', value: '#dc2626' },
        { name: 'Rose', value: '#f43f5e' },
    ],
    cool: [
        { name: 'Sky', value: '#e0f2fe' },
        { name: 'Light Blue', value: '#7dd3fc' },
        { name: 'Blue', value: '#3b82f6' },
        { name: 'Indigo', value: '#6366f1' },
        { name: 'Violet', value: '#8b5cf6' },
        { name: 'Purple', value: '#a855f7' },
    ],
    nature: [
        { name: 'Mint', value: '#d1fae5' },
        { name: 'Green', value: '#22c55e' },
        { name: 'Teal', value: '#14b8a6' },
        { name: 'Cyan', value: '#06b6d4' },
        { name: 'Emerald', value: '#10b981' },
        { name: 'Lime', value: '#84cc16' },
    ],
    accent: [
        { name: 'Pink', value: '#ec4899' },
        { name: 'Fuchsia', value: '#d946ef' },
        { name: 'Lavender', value: '#c4b5fd' },
        { name: 'Rose Light', value: '#fecdd3' },
        { name: 'Amber', value: '#f59e0b' },
        { name: 'Yellow', value: '#eab308' },
    ],
};

const DEFAULT_STYLES: SlideStyles = {
    backgroundColor: 'transparent',
    headingColor: '#1e293b',
    textColor: '#475569',
    accentColor: '#3b82f6',
    borderRadius: 12,
    hasBackdrop: false,
    backdropColor: '#000000',
    backdropOpacity: 50,
};

export default function SlideEditorPanel({
    isOpen,
    onClose,
    slideIndex,
    currentStyles,
    onStyleChange,
    theme,
}: SlideEditorPanelProps) {
    const [expandedSection, setExpandedSection] = useState<string | null>('colors');
    const [customColor, setCustomColor] = useState('');
    const [activeColorTarget, setActiveColorTarget] = useState<keyof SlideStyles | null>(null);

    // Merge current styles with defaults
    const styles: SlideStyles = { ...DEFAULT_STYLES, ...currentStyles };

    const updateStyle = <K extends keyof SlideStyles>(key: K, value: SlideStyles[K]) => {
        const newStyles = { ...styles, [key]: value };
        onStyleChange(newStyles);
    };

    const resetStyles = () => {
        onStyleChange(DEFAULT_STYLES);
    };

    // Color picker component
    const ColorPicker = ({
        label,
        icon,
        colorKey,
        currentValue
    }: {
        label: string;
        icon: React.ReactNode;
        colorKey: keyof SlideStyles;
        currentValue: string;
    }) => (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                </div>
                <div
                    className="w-8 h-8 rounded-lg border-2 border-rose-200 cursor-pointer shadow-sm hover:scale-105 transition-transform"
                    style={{ backgroundColor: currentValue }}
                    onClick={() => setActiveColorTarget(activeColorTarget === colorKey ? null : colorKey)}
                />
            </div>

            <AnimatePresence>
                {activeColorTarget === colorKey && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 pt-2 overflow-hidden"
                    >
                        {/* Theme Colors */}
                        <div>
                            <p className="text-xs text-rose-500 mb-1.5">Theme Colors</p>
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => updateStyle(colorKey, theme.primary)}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${currentValue === theme.primary ? 'border-rose-500 ring-2 ring-rose-200' : 'border-rose-100'}`}
                                    style={{ backgroundColor: theme.primary }}
                                    title="Primary"
                                />
                                <button
                                    onClick={() => updateStyle(colorKey, theme.secondary)}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${currentValue === theme.secondary ? 'border-rose-500 ring-2 ring-rose-200' : 'border-rose-100'}`}
                                    style={{ backgroundColor: theme.secondary }}
                                    title="Secondary"
                                />
                                <button
                                    onClick={() => updateStyle(colorKey, theme.accent)}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${currentValue === theme.accent ? 'border-rose-500 ring-2 ring-rose-200' : 'border-rose-100'}`}
                                    style={{ backgroundColor: theme.accent }}
                                    title="Accent"
                                />
                                <button
                                    onClick={() => updateStyle(colorKey, 'transparent')}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${currentValue === 'transparent' ? 'border-rose-500 ring-2 ring-rose-200' : 'border-rose-100'}`}
                                    style={{ background: 'linear-gradient(45deg, #fecdd3 25%, transparent 25%), linear-gradient(-45deg, #fecdd3 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #fecdd3 75%), linear-gradient(-45deg, transparent 75%, #fecdd3 75%)', backgroundSize: '8px 8px', backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px' }}
                                    title="Transparent"
                                />
                            </div>
                        </div>

                        {/* Color Palettes */}
                        {Object.entries(COLOR_PALETTE).map(([category, colors]) => (
                            <div key={category}>
                                <p className="text-xs text-rose-500 mb-1.5 capitalize">{category}</p>
                                <div className="flex gap-1 flex-wrap">
                                    {colors.map((color) => (
                                        <button
                                            key={color.value}
                                            onClick={() => updateStyle(colorKey, color.value)}
                                            className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 ${currentValue === color.value ? 'border-rose-500 ring-2 ring-rose-200' : 'border-rose-100'}`}
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Custom Color Input */}
                        <div>
                            <p className="text-xs text-rose-500 mb-1.5">Custom Color</p>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    placeholder="#hex or color name"
                                    value={customColor}
                                    onChange={(e) => setCustomColor(e.target.value)}
                                    className="h-9 text-xs flex-1"
                                />
                                <Input
                                    type="color"
                                    value={currentValue === 'transparent' ? '#ffffff' : currentValue}
                                    onChange={(e) => updateStyle(colorKey, e.target.value)}
                                    className="w-12 h-9 p-1 cursor-pointer rounded-lg"
                                />
                                <Button
                                    size="sm"
                                    className="h-9 px-3"
                                    onClick={() => {
                                        if (customColor) {
                                            updateStyle(colorKey, customColor);
                                            setCustomColor('');
                                        }
                                    }}
                                >
                                    <Check className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    const Section = ({ id, title, icon, children }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode }) => (
        <div className="border-b border-rose-100">
            <button
                onClick={() => setExpandedSection(expandedSection === id ? null : id)}
                className="w-full flex items-center justify-between p-4 hover:bg-rose-50/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="text-rose-500">{icon}</span>
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

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                        style={{ zIndex: 9998 }}
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ x: 380, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 380, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-[380px] bg-white shadow-2xl border-l-2 border-rose-100 flex flex-col"
                        style={{ zIndex: 9999 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-pink-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                                    <Paintbrush className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-700">Card Editor</h3>
                                    <p className="text-xs text-slate-500">Slide {slideIndex + 1} Styling</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {/* Colors Section */}
                            <Section id="colors" title="Colors" icon={<Palette className="w-4 h-4" />}>
                                <ColorPicker
                                    label="Background Color"
                                    icon={<Square className="w-4 h-4 text-rose-400" />}
                                    colorKey="backgroundColor"
                                    currentValue={styles.backgroundColor === 'transparent' ? '#ffffff' : styles.backgroundColor}
                                />

                                <ColorPicker
                                    label="Heading Color"
                                    icon={<Heading className="w-4 h-4 text-rose-400" />}
                                    colorKey="headingColor"
                                    currentValue={styles.headingColor}
                                />

                                <ColorPicker
                                    label="Text Color"
                                    icon={<Type className="w-4 h-4 text-rose-400" />}
                                    colorKey="textColor"
                                    currentValue={styles.textColor}
                                />

                                <ColorPicker
                                    label="Accent Color"
                                    icon={<CircleDot className="w-4 h-4 text-rose-400" />}
                                    colorKey="accentColor"
                                    currentValue={styles.accentColor}
                                />
                            </Section>

                            {/* Card Style Section */}
                            <Section id="card" title="Card Style" icon={<Square className="w-4 h-4" />}>
                                {/* Border Radius */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-medium text-slate-700">Corner Radius</label>
                                        <span className="text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-100">{styles.borderRadius}px</span>
                                    </div>
                                    <Slider
                                        value={[styles.borderRadius]}
                                        onValueChange={([value]) => updateStyle('borderRadius', value)}
                                        min={0}
                                        max={32}
                                        step={4}
                                        className="w-full"
                                    />
                                    <div className="flex gap-1 mt-3">
                                        {[0, 8, 12, 16, 24, 32].map((r) => (
                                            <button
                                                key={r}
                                                onClick={() => updateStyle('borderRadius', r)}
                                                className={`flex-1 py-2 text-xs rounded-md transition-colors ${styles.borderRadius === r
                                                    ? 'bg-rose-600 text-white'
                                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                                    }`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </Section>

                            {/* Backdrop Section */}
                            <Section id="backdrop" title="Backdrop Overlay" icon={<Layers className="w-4 h-4" />}>
                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <span className="text-sm font-medium block text-slate-700">Enable Backdrop</span>
                                        <span className="text-xs text-slate-500">Add a color overlay on the slide</span>
                                    </div>
                                    <button
                                        onClick={() => updateStyle('hasBackdrop', !styles.hasBackdrop)}
                                        className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${styles.hasBackdrop ? 'bg-rose-600' : 'bg-rose-200'
                                            }`}
                                    >
                                        <span
                                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${styles.hasBackdrop ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                        />
                                    </button>
                                </div>

                                {styles.hasBackdrop && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4 pt-2"
                                    >
                                        <ColorPicker
                                            label="Backdrop Color"
                                            icon={<Square className="w-4 h-4 text-rose-400" />}
                                            colorKey="backdropColor"
                                            currentValue={styles.backdropColor}
                                        />

                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="text-sm font-medium text-slate-700">Opacity</label>
                                                <span className="text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-100">{styles.backdropOpacity}%</span>
                                            </div>
                                            <Slider
                                                value={[styles.backdropOpacity]}
                                                onValueChange={([value]) => updateStyle('backdropOpacity', value)}
                                                min={10}
                                                max={90}
                                                step={10}
                                                className="w-full"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </Section>
                        </div>

                        {/* Footer Actions */}
                        <div className="border-t border-rose-100 p-4 space-y-2 bg-rose-50/50">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full border-rose-200 text-rose-700 hover:bg-rose-100"
                                onClick={resetStyles}
                            >
                                <RotateCcw className="w-4 h-4 mr-2" /> Reset to Default
                            </Button>
                            <Button
                                className="w-full bg-rose-600 hover:bg-rose-700"
                                onClick={onClose}
                            >
                                <Check className="w-4 h-4 mr-2" /> Done
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
