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

    // Start dragging image (only if not clicking on a control)
    const onDragStart = useCallback((e: React.MouseEvent) => {
        // Don't start drag if target is a button or handle
        const target = e.target as HTMLElement;
        if (target.closest('[data-handle]') || target.closest('[data-toolbar]')) {
            return;
        }

        if (!isEditable || !onSizeChange) return;

        if (!isSelected) {
            onSelect();
            return;
        }

        e.preventDefault();
        setIsDragging(true);
        setStartPos({ x: e.clientX, y: e.clientY });
        setStartSize({ ...localSize });
    }, [isEditable, isSelected, localSize, onSelect, onSizeChange]);

    // Start resizing from a handle
    const onResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isEditable || !isSelected || !onSizeChange) return;

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
                const newX = Math.round(Math.max(-50, Math.min(50, (startSize.positionX ?? 0) + dx * sensitivity)));
                const newY = Math.round(Math.max(-50, Math.min(50, (startSize.positionY ?? 0) + dy * sensitivity)));
                setLocalSize(prev => ({ ...prev, positionX: newX, positionY: newY }));
            } else if (isResizing) {
                let newW = startSize.width ?? 100;
                let newH = startSize.height ?? 100;

                // Width changes
                if (activeHandle.includes('right')) {
                    newW = (startSize.width ?? 100) + dx * sensitivity;
                } else if (activeHandle.includes('left')) {
                    newW = (startSize.width ?? 100) - dx * sensitivity;
                }

                // Height changes
                if (activeHandle.includes('bottom')) {
                    newH = (startSize.height ?? 100) + dy * sensitivity;
                } else if (activeHandle.includes('top') && activeHandle !== 'top') {
                    // For corners like top-left, top-right
                    newH = (startSize.height ?? 100) - dy * sensitivity;
                } else if (activeHandle === 'top') {
                    // For center top handle
                    newH = (startSize.height ?? 100) - dy * sensitivity;
                }

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
    const onCropSelect = useCallback((ratio: 'original' | 'square' | 'wide' | 'portrait') => {
        if (!onSizeChange) return;
        const newSize = { ...localSize, cropRatio: ratio };
        setLocalSize(newSize);
        onSizeChange(newSize);
    }, [localSize, onSizeChange]);

    // Get aspect ratio
    const aspectRatio = cropRatio === 'square' ? '1/1'
        : cropRatio === 'wide' ? '16/9'
            : cropRatio === 'portrait' ? '9/16'
                : undefined;

    // Handle component - positioned INSIDE boundaries
    const Handle = ({ id, style }: { id: string; style: React.CSSProperties }) => (
        <div
            data-handle={id}
            className="absolute bg-white rounded-full shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-transform"
            style={{
                width: 14,
                height: 14,
                border: `2.5px solid ${theme.primary}`,
                zIndex: 100,
                ...style,
            }}
            onMouseDown={(e) => onResizeStart(e, id)}
        />
    );

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
            {/* Image wrapper */}
            <div
                style={{
                    position: 'relative',
                    width: `${width}%`,
                    height: `${height}%`,
                    maxWidth: '100%',
                    maxHeight: '100%',
                    transform: `translate(${posX}%, ${posY}%)`,
                    transition: (isDragging || isResizing) ? 'none' : 'all 0.15s ease-out',
                    aspectRatio,
                }}
                onMouseDown={onDragStart}
            >
                {/* Image container */}
                <div className="w-full h-full overflow-hidden rounded-xl shadow-lg">
                    {children}
                </div>

                {/* Selection UI */}
                {isSelected && isEditable && (
                    <>
                        {/* Border */}
                        <div
                            className="absolute pointer-events-none rounded-xl"
                            style={{
                                inset: -2,
                                border: `3px solid ${theme.primary}`,
                                boxShadow: `0 0 0 1px white`,
                            }}
                        />

                        {/* Corner handles - positioned at corners INSIDE with offset */}
                        <Handle id="top-left" style={{ top: -7, left: -7, cursor: 'nwse-resize' }} />
                        <Handle id="top-right" style={{ top: -7, right: -7, cursor: 'nesw-resize' }} />
                        <Handle id="bottom-left" style={{ bottom: -7, left: -7, cursor: 'nesw-resize' }} />
                        <Handle id="bottom-right" style={{ bottom: -7, right: -7, cursor: 'nwse-resize' }} />

                        {/* Edge handles - centered on edges */}
                        <Handle id="top" style={{ top: -7, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' }} />
                        <Handle id="bottom" style={{ bottom: -7, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' }} />
                        <Handle id="left" style={{ left: -7, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' }} />
                        <Handle id="right" style={{ right: -7, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' }} />

                        {/* Toolbar */}
                        <div
                            data-toolbar="true"
                            className="absolute left-1/2 top-3 -translate-x-1/2 flex items-center gap-1.5 bg-white rounded-lg shadow-2xl px-3 py-2 border border-gray-200"
                            style={{ zIndex: 150 }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            {/* Size display */}
                            <span className="text-xs font-bold text-gray-600 tabular-nums min-w-[60px]">
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
                                    className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all ${cropRatio === opt.id
                                            ? 'text-white shadow-md'
                                            : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                                        }`}
                                    style={cropRatio === opt.id ? { backgroundColor: theme.primary } : {}}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onCropSelect(opt.id as any);
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* Hover overlay when not selected */}
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
