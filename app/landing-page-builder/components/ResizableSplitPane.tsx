"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { GripVertical, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ResizableSplitPaneProps {
    left: React.ReactNode
    right: React.ReactNode
    initialLeftWidth?: number
    minLeftWidth?: number
    maxLeftWidth?: number
}

export default function ResizableSplitPane({
    left,
    right,
    initialLeftWidth = 400,
    minLeftWidth = 300,
    maxLeftWidth = 800,
}: ResizableSplitPaneProps) {
    const [leftWidth, setLeftWidth] = useState(initialLeftWidth)
    const [isDragging, setIsDragging] = useState(false)
    const [isLeftCollapsed, setIsLeftCollapsed] = useState(false)
    const [isRightCollapsed, setIsRightCollapsed] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const lastLeftWidthRef = useRef(initialLeftWidth)

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging || !containerRef.current) return

            const containerRect = containerRef.current.getBoundingClientRect()
            const newWidth = e.clientX - containerRect.left

            if (newWidth >= minLeftWidth && newWidth <= maxLeftWidth) {
                setLeftWidth(newWidth)
                lastLeftWidthRef.current = newWidth
            }
        },
        [isDragging, minLeftWidth, maxLeftWidth]
    )

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove)
            window.addEventListener("mouseup", handleMouseUp)
            document.body.style.cursor = "col-resize"
            document.body.style.userSelect = "none"
        } else {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
            document.body.style.cursor = ""
            document.body.style.userSelect = ""
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
            document.body.style.cursor = ""
            document.body.style.userSelect = ""
        }
    }, [isDragging, handleMouseMove, handleMouseUp])

    const toggleLeftCollapse = () => {
        if (isLeftCollapsed) {
            setIsLeftCollapsed(false)
            setLeftWidth(lastLeftWidthRef.current)
        } else {
            setIsLeftCollapsed(true)
            lastLeftWidthRef.current = leftWidth
            setLeftWidth(0)
        }
        // Ensure right is not collapsed if we are toggling left
        if (isRightCollapsed) setIsRightCollapsed(false)
    }

    const toggleRightCollapse = () => {
        if (isRightCollapsed) {
            setIsRightCollapsed(false)
            setLeftWidth(lastLeftWidthRef.current)
        } else {
            setIsRightCollapsed(true)
            lastLeftWidthRef.current = leftWidth
            // We don't set leftWidth to container width here because flex-1 takes care of it
            // But we need to hide the left panel or maximize it?
            // Wait, if right is collapsed, left should take full width.
            // So leftWidth should be "100%" effectively.
            // But our left div has fixed width.
            // We need to change the style of the left div to flex-1 when right is collapsed.
        }
        // Ensure left is not collapsed
        if (isLeftCollapsed) setIsLeftCollapsed(false)
    }

    return (
        <div ref={containerRef} className="flex h-full w-full overflow-hidden relative">
            {/* Left Panel */}
            <div
                style={{
                    width: isRightCollapsed ? "100%" : isLeftCollapsed ? "0px" : leftWidth,
                    transition: isDragging ? "none" : "width 0.3s ease-in-out"
                }}
                className={`flex-shrink-0 h-full overflow-hidden ${isRightCollapsed ? "flex-1" : ""}`}
            >
                <div className="h-full w-full" style={{ opacity: isLeftCollapsed ? 0 : 1, transition: "opacity 0.2s" }}>
                    {left}
                </div>
            </div>

            {/* Drag Handle & Controls */}
            {!isRightCollapsed && !isLeftCollapsed && (
                <div
                    className="w-1 hover:w-2 bg-border hover:bg-blue-500 cursor-col-resize flex items-center justify-center transition-all z-10 -ml-0.5 relative group"
                    onMouseDown={handleMouseDown}
                >
                    {/* Toggle Buttons - Visible on hover or always? Let's make them visible on hover of the divider area */}
                    <div className="absolute top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded-md shadow-sm p-0.5 z-50">
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleLeftCollapse(); }}
                            className="p-1 hover:bg-accent rounded"
                            title="Collapse Chat"
                        >
                            <ChevronLeft className="w-3 h-3" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleRightCollapse(); }}
                            className="p-1 hover:bg-accent rounded"
                            title="Collapse Preview"
                        >
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}

            {/* Collapsed State Restore Buttons */}
            {isLeftCollapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 z-50">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-6 rounded-l-none border-l-0 shadow-md bg-background"
                        onClick={toggleLeftCollapse}
                        title="Expand Chat"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {isRightCollapsed && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 z-50">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-6 rounded-r-none border-r-0 shadow-md bg-background"
                        onClick={toggleRightCollapse}
                        title="Expand Preview"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Right Panel */}
            <div
                className={`flex-1 h-full overflow-hidden min-w-0 ${isRightCollapsed ? "hidden" : ""}`}
                style={{ opacity: isRightCollapsed ? 0 : 1, transition: "opacity 0.2s" }}
            >
                {right}
            </div>
        </div>
    )
}
