"use client";
import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import {
    SandpackProvider,
    SandpackLayout,
    SandpackCodeEditor,
    SandpackFileExplorer,
} from "@codesandbox/sandpack-react";
import { useTheme } from "next-themes";
import Lookup from "@/data/Lookup";
import SandpackPreviewClient from "./SandpackPreviewClient";
import { Loader2, Code2, Eye, Download, Upload, Trash2, Monitor, Tablet, Smartphone, Undo, Redo } from "lucide-react";
import { ActionContext } from "@/contexts/ActionContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SandpackListener from "./SandpackListener";
import SandpackErrorListener from "./SandpackErrorListener";
import CodeWritingAnimation from "./CodeWritingAnimation";

interface CodeViewWorkspaceProps {
    workspaceId: string;
    generatedCode?: any;
    isGenerating?: boolean;
    onCodeChange?: (files: any) => void;
    onDelete?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    onRuntimeError?: (error: string) => void;
}

export default function CodeViewWorkspace({
    workspaceId,
    generatedCode,
    isGenerating,
    onCodeChange,
    onDelete,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onRuntimeError
}: CodeViewWorkspaceProps) {
    const [activeTab, setActiveTab] = useState<"code" | "preview">("preview");
    const [files, setFiles] = useState(Lookup.DEFAULT_FILE);
    const [loading, setLoading] = useState(false);
    const { setAction } = useContext(ActionContext);
    const { theme } = useTheme();
    const sandpackTheme = theme === 'dark' ? 'dark' : 'light';

    const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
    const [previewWidth, setPreviewWidth] = useState<string | number>("100%");
    const [isResizingPreview, setIsResizingPreview] = useState(false);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Load workspace files on mount
    useEffect(() => {
        if (workspaceId) {
            GetFiles();
        }
    }, [workspaceId]);

    // Update files when AI generates new code
    useEffect(() => {
        if (generatedCode?.files) {
            const mergedFiles = { ...Lookup.DEFAULT_FILE, ...generatedCode.files };
            setFiles(mergedFiles);
            UpdateWorkspaceFiles(generatedCode.files);
        }
    }, [generatedCode]);

    // Update width when mode changes
    useEffect(() => {
        if (previewMode === "mobile") setPreviewWidth("375px");
        else if (previewMode === "tablet") setPreviewWidth("768px");
        else setPreviewWidth("100%");
    }, [previewMode]);

    const GetFiles = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/workspace/${workspaceId}`);
            const data = await response.json();

            if (data.workspace?.fileData) {
                const mergedFiles = { ...Lookup.DEFAULT_FILE, ...data.workspace.fileData };
                setFiles(mergedFiles);
            }
        } catch (error) {
            console.error("Error fetching files:", error);
            toast.error("Failed to load workspace files");
        } finally {
            setLoading(false);
        }
    };

    const UpdateWorkspaceFiles = async (fileData: any) => {
        try {
            await fetch(`/api/workspace/${workspaceId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileData }),
            });
        } catch (error) {
            console.error("Error updating workspace files:", error);
            toast.error("Failed to save files");
        }
    };

    const handleExport = () => {
        setAction({ actionType: "export" });
        toast.success("Exporting project...");
    };

    const handleDeploy = () => {
        setAction({ actionType: "deploy" });
        toast.success("Deploying to CodeSandbox...");
    };

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this workspace? This action cannot be undone.")) {
            onDelete?.();
        }
    };

    // Resize Logic
    const handlePreviewResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizingPreview(true);
    };

    const handlePreviewResizeEnd = useCallback(() => {
        setIsResizingPreview(false);
    }, []);

    const handlePreviewResizeMove = useCallback((e: MouseEvent) => {
        if (!isResizingPreview || !previewContainerRef.current) return;

        // We assume the container is centered or we just use the mouse position relative to the container's center?
        // Actually, simpler: just calculate width based on mouse X relative to the center of the screen?
        // Or relative to the container's left edge.
        // Since the container is centered with `alignItems: center`, resizing it symmetrically is hard with one handle.
        // Let's assume we resize the width.
        // If we drag the right handle, the new width is roughly 2 * (mouseX - centerX).

        const containerRect = previewContainerRef.current.getBoundingClientRect();
        const centerX = containerRect.left + containerRect.width / 2;
        const newHalfWidth = Math.abs(e.clientX - centerX);
        const newWidth = newHalfWidth * 2;

        if (newWidth >= 320) {
            setPreviewWidth(`${newWidth}px`);
        }
    }, [isResizingPreview]);

    useEffect(() => {
        if (isResizingPreview) {
            window.addEventListener("mousemove", handlePreviewResizeMove);
            window.addEventListener("mouseup", handlePreviewResizeEnd);
            document.body.style.cursor = "ew-resize";
            document.body.style.userSelect = "none";
        } else {
            window.removeEventListener("mousemove", handlePreviewResizeMove);
            window.removeEventListener("mouseup", handlePreviewResizeEnd);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        }
        return () => {
            window.removeEventListener("mousemove", handlePreviewResizeMove);
            window.removeEventListener("mouseup", handlePreviewResizeEnd);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
    }, [isResizingPreview, handlePreviewResizeMove, handlePreviewResizeEnd]);


    return (
        <div className="relative h-full flex flex-col">
            {/* Header with tabs and actions */}
            <div className="bg-white dark:bg-[#181818] border-b border-gray-200 dark:border-neutral-800 p-3">
                <div className="flex items-center justify-between">
                    {/* Left Side: View Toggles */}
                    <div className="flex items-center gap-4">
                        {/* Tab Switcher */}
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-black p-1 rounded-lg">
                            <button
                                className={`text-sm font-medium transition-all duration-200 px-3 py-1.5 rounded-md flex items-center gap-2 ${activeTab === "code"
                                    ? "bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300"
                                    }`}
                                onClick={() => setActiveTab("code")}
                            >
                                <Code2 className="w-4 h-4" />
                                Code
                            </button>
                            <button
                                className={`text-sm font-medium transition-all duration-200 px-3 py-1.5 rounded-md flex items-center gap-2 ${activeTab === "preview"
                                    ? "bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300"
                                    }`}
                                onClick={() => setActiveTab("preview")}
                            >
                                <Eye className="w-4 h-4" />
                                Preview
                            </button>
                        </div>

                        {/* Undo/Redo Controls */}
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-black p-1 rounded-lg border border-gray-200 dark:border-neutral-800">
                            <button
                                className={`p-1.5 rounded-md transition-all ${canUndo
                                    ? "text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-neutral-800 hover:text-blue-600 dark:hover:text-blue-400"
                                    : "text-gray-300 dark:text-gray-700 cursor-not-allowed"
                                    }`}
                                onClick={onUndo}
                                disabled={!canUndo}
                                title="Undo"
                            >
                                <Undo className="w-4 h-4" />
                            </button>
                            <button
                                className={`p-1.5 rounded-md transition-all ${canRedo
                                    ? "text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-neutral-800 hover:text-blue-600 dark:hover:text-blue-400"
                                    : "text-gray-300 dark:text-gray-700 cursor-not-allowed"
                                    }`}
                                onClick={onRedo}
                                disabled={!canRedo}
                                title="Redo"
                            >
                                <Redo className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Responsive Toggles (Only visible in Preview mode) */}
                        {activeTab === "preview" && (
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-black p-1 rounded-lg border border-gray-200 dark:border-neutral-800">
                                <button
                                    className={`p-1.5 rounded-md transition-all ${previewMode === "desktop"
                                        ? "bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-sm"
                                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                                        }`}
                                    onClick={() => setPreviewMode("desktop")}
                                    title="Desktop View"
                                >
                                    <Monitor className="w-4 h-4" />
                                </button>
                                <button
                                    className={`p-1.5 rounded-md transition-all ${previewMode === "tablet"
                                        ? "bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-sm"
                                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                                        }`}
                                    onClick={() => setPreviewMode("tablet")}
                                    title="Tablet View"
                                >
                                    <Tablet className="w-4 h-4" />
                                </button>
                                <button
                                    className={`p-1.5 rounded-md transition-all ${previewMode === "mobile"
                                        ? "bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-sm"
                                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                                        }`}
                                    onClick={() => setPreviewMode("mobile")}
                                    title="Mobile View"
                                >
                                    <Smartphone className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Actions */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            className="gap-2 bg-red-600 hover:bg-red-700 text-white h-8"
                            disabled={loading || isGenerating}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            className="gap-2 h-8"
                            disabled={loading || isGenerating}
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Export</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDeploy}
                            className="gap-2 h-8"
                            disabled={loading || isGenerating}
                        >
                            <Upload className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Deploy</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Sandpack Content */}
            <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-[#1e1e1e] relative">
                <SandpackProvider
                    files={files}
                    template="react"
                    theme={sandpackTheme}
                    customSetup={{
                        dependencies: {
                            ...Lookup.DEPENDANCY,
                        },
                    }}
                    options={{
                        externalResources: ["https://cdn.tailwindcss.com"],
                        autoReload: true,
                        autorun: true,
                        recompileMode: "immediate",
                        recompileDelay: 200,
                    }}
                >
                    {onCodeChange && <SandpackListener onCodeChange={onCodeChange} />}
                    {onRuntimeError && <SandpackErrorListener onError={onRuntimeError} />}
                    <SandpackLayout style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", border: "none", background: "transparent" }}>

                        {/* Code Editor View */}
                        <div style={{
                            display: activeTab === "code" ? "flex" : "none",
                            height: "100%",
                            width: "100%"
                        }}>
                            <SandpackFileExplorer style={{ height: "100%", minHeight: "100%", width: "250px" }} />
                            <SandpackCodeEditor
                                style={{ height: "100%", minHeight: "100%", flex: 1 }}
                                showTabs
                                showLineNumbers
                                showInlineErrors
                                wrapContent
                            />
                        </div>

                        {/* Preview View with Responsive Container */}
                        <div style={{
                            display: activeTab === "preview" ? "flex" : "none",
                            height: "100%",
                            width: "100%",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f9fafb',
                            padding: "20px",
                            overflow: "auto"
                        }}>
                            <div
                                ref={previewContainerRef}
                                className={`transition-all duration-300 ease-in-out shadow-2xl overflow-hidden bg-white dark:bg-black border border-gray-200 dark:border-gray-800 relative group ${previewMode === "mobile" ? "rounded-[30px] border-[8px] border-gray-800" :
                                        previewMode === "tablet" ? "rounded-[20px] border-[8px] border-gray-800" :
                                            "rounded-md w-full h-full"
                                    }`}
                                style={{
                                    width: previewWidth,
                                    height: previewMode === "mobile" ? "667px" : previewMode === "tablet" ? "1024px" : "100%",
                                    maxHeight: "100%",
                                    maxWidth: "100%"
                                }}
                            >
                                <SandpackPreviewClient />

                                {/* Resize Handle (Right) */}
                                <div
                                    className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-16 bg-gray-200 dark:bg-gray-700 rounded-l-md cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-50"
                                    onMouseDown={handlePreviewResizeStart}
                                >
                                    <div className="w-1 h-8 bg-gray-400 dark:bg-gray-500 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </SandpackLayout>
                </SandpackProvider>

                {/* Loading Overlay */}
                {isGenerating && generatedCode?.files && Object.keys(generatedCode.files).length > 0 ? (
                    <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-center z-50">
                        <div className="max-w-3xl w-full px-6">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center gap-3 bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 rounded-full px-6 py-3">
                                    <Loader2 className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    <span className="text-blue-700 dark:text-blue-100 font-medium">Building Your Application</span>
                                </div>
                            </div>
                            <CodeWritingAnimation
                                files={generatedCode.files}
                                onComplete={() => {
                                    // Animation complete, will automatically hide when isGenerating becomes false
                                    console.log("Code generation animation complete")
                                }}
                            />
                        </div>
                    </div>
                ) : (loading || isGenerating) ? (
                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="text-center">
                            <Loader2 className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-500 mx-auto mb-4" />
                            <h2 className="text-gray-900 dark:text-white text-lg font-semibold">
                                {isGenerating ? "Generating Your Code..." : "Loading..."}
                            </h2>
                            <p className="text-gray-500 dark:text-slate-400 text-sm mt-2">Setting up your workspace...</p>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Force Sandpack to take full height */}
            <style jsx global>{`
                .sp-wrapper,
                .sp-layout,
                .sp-stack,
                .sp-preview-container,
                .sp-preview-iframe {
                    height: 100% !important;
                    width: 100% !important;
                    flex: 1 !important;
                }
                .sp-preview-container {
                    display: flex !important;
                    flex-direction: column !important;
                }
                /* Hide default sandpack header/tabs since we have our own */
                .sp-tabs {
                    display: none !important;
                }
            `}</style>
        </div>
    );
}
