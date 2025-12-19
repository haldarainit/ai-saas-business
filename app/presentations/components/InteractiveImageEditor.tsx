"use client";

import React, { useState, useCallback, useEffect } from 'react';

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
    const [activeHandle, setActiveHandle] = useState<string>('');
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [startSize, setStartSize] = useState<ImageSize>({});

    // Local state for smooth UI updates
    const [localSize, setLocalSize] = useState<ImageSize>(imageSize);

    // Sync with props when not actively manipulating
    useEffect(() => {
        if (!isDragging && !isResizing) {
            setLocalSize(imageSize);
        }
    }, [imageSize, isDragging, isResizing]);

    // Current values
    const width = localSize.width ?? 100;
    const height = localSize.height ?? 100;
    const posX = localSize.positionX ?? 0;
    const posY = localSize.positionY ?? 0;
    const cropRatio = localSize.cropRatio ?? 'original';

    // Start dragging image
    const onDragStart = useCallback((e: React.MouseEvent) => {
        if (!isEditable || !onSizeChange) return;

        if (!isSelected) {
            onSelect();
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setStartPos({ x: e.clientX, y: e.clientY });
        setStartSize({ ...localSize });
    }, [isEditable, isSelected, localSize, onSelect, onSizeChange]);

    // Start resizing from a handle
    const onResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
        if (!isEditable || !isSelected || !onSizeChange) return;
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setActiveHandle(handle);
        setStartPos({ x: e.clientX, y: e.clientY });
        setStartSize({ ...localSize });
    }, [isEditable, isSelected, localSize, onSizeChange]);

    // Mouse move handler
    useEffect(() => {
        if (!isDragging && !isResizing) return;

        const onMouseMove = (e: MouseEvent) => {
            const dx = e.clientX - startPos.x;
            const dy = e.clientY - startPos.y;
            const sensitivity = 0.15;

            if (isDragging) {
                // Move the image
                const newX = Math.round(Math.max(-50, Math.min(50, (startSize.positionX ?? 0) + dx * sensitivity)));
                const newY = Math.round(Math.max(-50, Math.min(50, (startSize.positionY ?? 0) + dy * sensitivity)));
                setLocalSize(prev => ({ ...prev, positionX: newX, positionY: newY }));
            } else if (isResizing) {
                let newW = startSize.width ?? 100;
                let newH = startSize.height ?? 100;

                // Handle width changes
                if (activeHandle.includes('right')) {
                    newW = (startSize.width ?? 100) + dx * sensitivity;
                } else if (activeHandle.includes('left')) {
                    newW = (startSize.width ?? 100) - dx * sensitivity;
                }

                // Handle height changes  
                if (activeHandle.includes('bottom')) {
                    newH = (startSize.height ?? 100) + dy * sensitivity;
                } else if (activeHandle.includes('top')) {
                    newH = (startSize.height ?? 100) - dy * sensitivity;
                }

                // Clamp values
                newW = Math.round(Math.max(20, Math.min(100, newW)));
                newH = Math.round(Math.max(20, Math.min(100, newH)));

                setLocalSize(prev => ({ ...prev, width: newW, height: newH }));
            }
        };

        const onMouseUp = () => {
            if (onSizeChange && (isDragging || isResizing)) {
                onSizeChange(localSize);
            }
            setIsDragging(false);
            setIsResizing(false);
            setActiveHandle('');
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, [isDragging, isResizing, startPos, startSize, activeHandle, localSize, onSizeChange]);

    // Handle crop button click
    const onCropSelect = useCallback((e: React.MouseEvent, ratio: 'original' | 'square' | 'wide' | 'portrait') => {
        e.preventDefault();
        e.stopPropagation();
        if (!onSizeChange) return;

        const newSize = { ...localSize, cropRatio: ratio };
        setLocalSize(newSize);
        onSizeChange(newSize);
    }, [localSize, onSizeChange]);

    // Aspect ratio CSS
    const aspectRatio = cropRatio === 'square' ? '1/1'
        : cropRatio === 'wide' ? '16/9'
            : cropRatio === 'portrait' ? '9/16'
                : undefined;

    // All 8 resize handles
    const resizeHandles = [
        // Corners
        { id: 'top-left', pos: { top: -8, left: -8 }, cursor: 'nwse-resize' },
        { id: 'top-right', pos: { top: -8, right: -8 }, cursor: 'nesw-resize' },
        { id: 'bottom-left', pos: { bottom: -8, left: -8 }, cursor: 'nesw-resize' },
        { id: 'bottom-right', pos: { bottom: -8, right: -8 }, cursor: 'nwse-resize' },
        // Edges
        { id: 'top', pos: { top: -8, left: '50%', marginLeft: -8 }, cursor: 'ns-resize' },
        { id: 'bottom', pos: { bottom: -8, left: '50%', marginLeft: -8 }, cursor: 'ns-resize' },
        { id: 'left', pos: { left: -8, top: '50%', marginTop: -8 }, cursor: 'ew-resize' },
        { id: 'right', pos: { right: -8, top: '50%', marginTop: -8 }, cursor: 'ew-resize' },
    ];

    return (
        <div
            className={`relative w-full h-full flex items-center justify-center select-none ${isEditable ? 'cursor-move' : ''}`}
            onClick={(e) => {
                if (isEditable && !isSelected) {
                    e.stopPropagation();
                    onSelect();
                }
            }}
        >
            {/* Image wrapper with transforms */}
            <div
                style={{
                    position: 'relative',
                    width: `${width}%`,
                    height: `${height}%`,
                    transform: `translate(${posX}%, ${posY}%)`,
                    transition: (isDragging || isResizing) ? 'none' : 'all 0.2s ease',
                    aspectRatio,
                }}
                onMouseDown={onDragStart}
            >
                {/* Image container */}
                <div className="w-full h-full overflow-hidden rounded-xl shadow-lg">
                    {children}
                </div>

                {/* Selection controls */}
                {isSelected && isEditable && (
                    <>
                        {/* Border */}
                        <div
                            className="absolute inset-0 pointer-events-none rounded-xl"
                            style={{
                                border: `3px solid ${theme.primary}`,
                                boxShadow: `0 0 0 1px white, 0 0 12px ${theme.primary}40`
                            }}
                        />

                        {/* Resize handles */}
                        {resizeHandles.map((h) => (
                            <div
                                key={h.id}
                                className="absolute w-4 h-4 bg-white rounded-full shadow-lg z-50"
                                style={{
                                    ...h.pos,
                                    border: `2px solid ${theme.primary}`,
                                    cursor: h.cursor,
                                }}
                                onMouseDown={(e) => onResizeStart(e, h.id)}
                            />
                        ))}

                        {/* Toolbar */}
                        <div
                            className="absolute left-1/2 top-4 -translate-x-1/2 z-[100] flex items-center gap-2 bg-white rounded-lg shadow-2xl px-3 py-2 border border-gray-200"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Size display */}
                            <span className="text-xs font-semibold text-gray-600 tabular-nums">
                                {width}% × {height}%
                            </span>

                            <div className="w-px h-5 bg-gray-300" />

                            {/* Crop buttons */}
                            {[
                                { id: 'original', label: 'Original' },
                                { id: 'square', label: 'Square' },
                                { id: 'wide', label: 'Wide' },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${cropRatio === opt.id
                                            ? 'text-white shadow-md'
                                            : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    style={cropRatio === opt.id ? { backgroundColor: theme.primary } : {}}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => onCropSelect(e, opt.id as any)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* Hover state when not selected */}
                {!isSelected && isEditable && (
                    <div
                        className="absolute inset-0 z-20 opacity-0 hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center bg-black/20"
                        style={{ border: `2px dashed ${theme.primary}` }}
                    >
                        <div className="bg-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium text-gray-700">
                            Click to Edit
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
