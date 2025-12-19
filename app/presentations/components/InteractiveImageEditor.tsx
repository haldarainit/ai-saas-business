"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ImageSize {
    width?: number;
    height?: number;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none';
    positionX?: number;
    positionY?: number;
    cropRatio?: 'original' | 'square' | 'wide' | 'portrait';
}

interface InteractiveImageEditorProps {
    imageSize?: ImageSize;
    isSelected: boolean;
    onSelect: () => void;
    onSizeChange?: (size: ImageSize) => void;
    isEditable?: boolean;
    theme: {
        primary: string;
        secondary: string;
        accent: string;
    };
    children: React.ReactNode;
}

export default function InteractiveImageEditor({
    imageSize = {},
    isSelected,
    onSelect,
    onSizeChange,
    isEditable = false,
    theme,
    children
}: InteractiveImageEditorProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<string>('');
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialSize, setInitialSize] = useState<ImageSize>({});

    // Local state for smooth updates
    const [localSize, setLocalSize] = useState<ImageSize>(imageSize);

    // Sync local state when props change (only when not actively manipulating)
    useEffect(() => {
        if (!isDragging && !isResizing) {
            setLocalSize(imageSize);
        }
    }, [imageSize, isDragging, isResizing]);

    // Derived values
    const positionX = localSize.positionX ?? 0;
    const positionY = localSize.positionY ?? 0;
    const width = localSize.width ?? 100;
    const height = localSize.height ?? 100;
    const cropRatio = localSize.cropRatio ?? 'original';

    // Handle image drag for repositioning
    const handleDragStart = useCallback((e: React.MouseEvent) => {
        if (!isEditable || !onSizeChange) return;

        // First click selects, don't drag yet
        if (!isSelected) {
            onSelect();
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialSize({ ...localSize });
    }, [isEditable, isSelected, localSize, onSelect, onSizeChange]);

    // Handle resize start from handles
    const handleResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
        if (!isEditable || !isSelected || !onSizeChange) return;
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setResizeHandle(handle);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialSize({ ...localSize });
    }, [isEditable, isSelected, localSize, onSizeChange]);

    // Mouse move and mouse up handlers
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!onSizeChange) return;

            const deltaX = e.clientX - dragStart.x;
            const deltaY = e.clientY - dragStart.y;
            const scale = 0.15; // Sensitivity

            if (isDragging) {
                const newX = Math.max(-50, Math.min(50, (initialSize.positionX ?? 0) + deltaX * scale));
                const newY = Math.max(-50, Math.min(50, (initialSize.positionY ?? 0) + deltaY * scale));
                setLocalSize(prev => ({
                    ...prev,
                    positionX: Math.round(newX),
                    positionY: Math.round(newY),
                }));
            } else if (isResizing) {
                let newWidth = initialSize.width ?? 100;
                let newHeight = initialSize.height ?? 100;

                // Handle-specific resize logic
                if (resizeHandle === 'right' || resizeHandle === 'top-right' || resizeHandle === 'bottom-right') {
                    newWidth = Math.max(20, Math.min(100, (initialSize.width ?? 100) + deltaX * scale));
                }
                if (resizeHandle === 'left' || resizeHandle === 'top-left' || resizeHandle === 'bottom-left') {
                    newWidth = Math.max(20, Math.min(100, (initialSize.width ?? 100) - deltaX * scale));
                }
                if (resizeHandle === 'bottom' || resizeHandle === 'bottom-left' || resizeHandle === 'bottom-right') {
                    newHeight = Math.max(20, Math.min(100, (initialSize.height ?? 100) + deltaY * scale));
                }
                if (resizeHandle === 'top' || resizeHandle === 'top-left' || resizeHandle === 'top-right') {
                    newHeight = Math.max(20, Math.min(100, (initialSize.height ?? 100) - deltaY * scale));
                }

                setLocalSize(prev => ({
                    ...prev,
                    width: Math.round(newWidth),
                    height: Math.round(newHeight),
                }));
            }
        };

        const handleMouseUp = () => {
            if ((isDragging || isResizing) && onSizeChange) {
                // Commit final size to parent
                onSizeChange(localSize);
            }
            setIsDragging(false);
            setIsResizing(false);
            setResizeHandle('');
        };

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, dragStart, initialSize, localSize, onSizeChange, resizeHandle]);

    // Crop preset click handler - FIXED: properly stop all events
    const handleCropClick = useCallback((e: React.MouseEvent, ratio: 'original' | 'square' | 'wide' | 'portrait') => {
        e.preventDefault();
        e.stopPropagation();

        if (!onSizeChange) return;

        const newSize = {
            ...localSize,
            cropRatio: ratio,
        };
        setLocalSize(newSize);
        onSizeChange(newSize);
    }, [localSize, onSizeChange]);

    // Get aspect ratio CSS value
    const getAspectRatio = () => {
        switch (cropRatio) {
            case 'square': return '1 / 1';
            case 'wide': return '16 / 9';
            case 'portrait': return '9 / 16';
            default: return undefined;
        }
    };

    // Handle configurations for all 8 handles
    const handles = [
        // Corners
        { id: 'top-left', cursor: 'nwse-resize', style: { top: 0, left: 0, transform: 'translate(-50%, -50%)' } },
        { id: 'top-right', cursor: 'nesw-resize', style: { top: 0, right: 0, transform: 'translate(50%, -50%)' } },
        { id: 'bottom-left', cursor: 'nesw-resize', style: { bottom: 0, left: 0, transform: 'translate(-50%, 50%)' } },
        { id: 'bottom-right', cursor: 'nwse-resize', style: { bottom: 0, right: 0, transform: 'translate(50%, 50%)' } },
        // Sides
        { id: 'top', cursor: 'ns-resize', style: { top: 0, left: '50%', transform: 'translate(-50%, -50%)' } },
        { id: 'bottom', cursor: 'ns-resize', style: { bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' } },
        { id: 'left', cursor: 'ew-resize', style: { top: '50%', left: 0, transform: 'translate(-50%, -50%)' } },
        { id: 'right', cursor: 'ew-resize', style: { top: '50%', right: 0, transform: 'translate(50%, -50%)' } },
    ];

    const cropOptions = [
        { id: 'original', label: 'Original' },
        { id: 'square', label: 'Square' },
        { id: 'wide', label: 'Wide' },
    ];

    return (
        <div
            className={`relative w-full h-full flex items-center justify-center select-none ${isEditable ? 'cursor-pointer' : ''}`}
            onClick={(e) => {
                e.stopPropagation();
                if (isEditable) {
                    onSelect();
                }
            }}
        >
            {/* Image container with size, position, and crop applied */}
            <div
                className="relative"
                style={{
                    width: `${width}%`,
                    height: `${height}%`,
                    transform: `translate(${positionX}%, ${positionY}%)`,
                    transition: (isDragging || isResizing) ? 'none' : 'all 0.2s ease-out',
                    aspectRatio: getAspectRatio(),
                }}
                onMouseDown={handleDragStart}
            >
                {/* The actual image */}
                <div className="w-full h-full overflow-hidden rounded-xl shadow-lg">
                    {children}
                </div>

                {/* Selection UI - only when selected and editable */}
                {isSelected && isEditable && (
                    <>
                        {/* Selection border */}
                        <div
                            className="absolute inset-0 pointer-events-none rounded-xl"
                            style={{
                                border: `2px solid ${theme.primary}`,
                                boxShadow: `0 0 0 2px ${theme.primary}20`,
                            }}
                        />

                        {/* Resize handles */}
                        {handles.map((handle) => (
                            <div
                                key={handle.id}
                                className="absolute w-4 h-4 bg-white rounded-full shadow-md z-40 hover:scale-110 active:scale-95 transition-transform"
                                style={{
                                    ...handle.style,
                                    border: `2px solid ${theme.primary}`,
                                    cursor: handle.cursor,
                                }}
                                onMouseDown={(e) => handleResizeStart(e, handle.id)}
                            />
                        ))}

                        {/* Toolbar */}
                        <div
                            className="absolute left-1/2 top-3 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-white/95 backdrop-blur-md rounded-lg shadow-xl px-2 py-1.5 border border-slate-200"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Size display */}
                            <span className="text-[10px] font-medium text-slate-500 px-1">
                                {width}% × {height}%
                            </span>

                            <div className="w-px h-4 bg-slate-200" />

                            {/* Crop presets */}
                            {cropOptions.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${cropRatio === option.id
                                            ? 'text-white shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    style={cropRatio === option.id ? { backgroundColor: theme.primary } : {}}
                                    onClick={(e) => handleCropClick(e, option.id as any)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* Hover overlay when not selected */}
                {!isSelected && isEditable && (
                    <div
                        className="absolute inset-0 z-20 opacity-0 hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center bg-black/10 cursor-pointer"
                        style={{ border: `2px dashed ${theme.primary}` }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect();
                        }}
                    >
                        <div className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-lg text-xs font-medium text-slate-700">
                            Click to Edit
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
