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
import { Loader2, Code2, Eye, Download, Upload, Trash2, Monitor, Tablet, Smartphone, Undo, Redo, Clock, User, Bot, ChevronDown, FastForward, History } from "lucide-react";
import { ActionContext } from "@/contexts/ActionContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
    sandpackKey?: number;
    historyIndex?: number;
    historyLength?: number;
    history?: any[];
    onVersionSelect?: (index: number) => void;
    isAtLatest?: boolean;
    onGoToLatest?: () => void;
    currentPrompt?: string;
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
    onRuntimeError,
    sandpackKey = 0,
    historyIndex = 0,
    historyLength = 0,
    history = [],
    onVersionSelect,
    isAtLatest = true,
    onGoToLatest,
    currentPrompt
}: CodeViewWorkspaceProps) {
    const [activeTab, setActiveTab] = useState<"code" | "preview">("preview");
    const [files, setFiles] = useState(Lookup.DEFAULT_FILE);
    const [loading, setLoading] = useState(true);
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
            // Sanitize files to ensure code is always a string
            const sanitizedFiles = Object.entries(generatedCode.files).reduce((acc, [path, file]: [string, any]) => {
                let code = file;
                if (typeof file === 'object' && file !== null && 'code' in file) {
                    code = file.code;
                }

                // Ensure code is a string
                if (typeof code !== 'string') {
                    console.warn(`Sanitizing file ${path}: code was not a string`, code);
                    code = typeof code === 'object' ? JSON.stringify(code, null, 2) : String(code);
                }

                // Special handling for package.json to prevent Sandpack crashes
                if (path === '/package.json' || path === 'package.json') {
                    try {
                        JSON.parse(code);
                    } catch (e) {
                        console.warn("Detected invalid JSON in package.json, attempting to fix...", e);
                        try {
                            // Attempt to fix common JSON errors (single quotes, unquoted keys)
                            // This is a basic heuristic repair
                            const fixedCode = code
                                .replace(/'/g, '"') // Replace single quotes with double quotes
                                .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":'); // Quote unquoted keys

                            JSON.parse(fixedCode); // Verify if fixed
                            code = fixedCode;
                            console.log("Successfully repaired package.json");
                        } catch (fixError) {
                            console.error("Failed to repair package.json, reverting to default", fixError);
                            code = Lookup.DEFAULT_FILE['/package.json'].code;
                        }
                    }
                }

                acc[path] = { code };
                return acc;
            }, {} as Record<string, { code: string }>);

            const mergedFiles = { ...Lookup.DEFAULT_FILE, ...sanitizedFiles };
            setFiles(mergedFiles);
            setLoading(false);
            UpdateWorkspaceFiles(sanitizedFiles);
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
                                className={`text-xs sm:text-sm font-medium transition-all duration-200 px-2 sm:px-3 py-1.5 rounded-md flex items-center gap-1 sm:gap-2 ${activeTab === "code"
                                    ? "bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300"
                                    }`}
                                onClick={() => setActiveTab("code")}
                            >
                                <Code2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden xs:inline">Code</span>
                            </button>
                            <button
                                className={`text-xs sm:text-sm font-medium transition-all duration-200 px-2 sm:px-3 py-1.5 rounded-md flex items-center gap-1 sm:gap-2 ${activeTab === "preview"
                                    ? "bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300"
                                    }`}
                                onClick={() => setActiveTab("preview")}
                            >
                                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden xs:inline">Preview</span>
                            </button>
                        </div>

                        {historyLength > 0 && (
                            <>
                                {/* Undo/Redo Controls */}
                                <div className="flex items-center gap-1 bg-gray-100 dark:bg-black p-1 rounded-lg border border-gray-200 dark:border-neutral-800">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-7 w-7 ${canUndo ? "hover:text-blue-600 dark:hover:text-blue-400" : "opacity-50"}`}
                                                onClick={onUndo}
                                                disabled={!canUndo}
                                            >
                                                <Undo className="w-4 h-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Undo changes</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-7 w-7 ${canRedo ? "hover:text-blue-600 dark:hover:text-blue-400" : "opacity-50"}`}
                                                onClick={onRedo}
                                                disabled={!canRedo}
                                            >
                                                <Redo className="w-4 h-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Redo changes</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>

                                {/* Version Indicator */}
                                <div className="relative group">
                                    <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Version</span>
                                        <span className="text-gray-900 dark:text-gray-200">
                                            {history[historyIndex]?.version || 'v1.0'}
                                        </span>
                                        <ChevronDown className="w-3 h-3 ml-1" />
                                    </button>

                                    {/* Dropdown */}
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl border border-gray-200 dark:border-neutral-800 hidden group-hover:block z-50 max-h-80 overflow-y-auto">
                                        <div className="p-2">
                                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">Version History</div>
                                            {Array.isArray(history) && history.length > 0 ? history.map((entry, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => onVersionSelect?.(idx)}
                                                    className={`flex items-center gap-3 p-2 rounded-md text-xs cursor-pointer ${idx === historyIndex
                                                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                                        : "hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300"
                                                        }`}
                                                >
                                                    <div className={`p-1 rounded-full ${entry.source === 'ai' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                                                        {entry.source === 'ai' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate flex items-center gap-2">
                                                            <span className="text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">
                                                                {entry.version}
                                                            </span>
                                                            {entry.label || (entry.source === 'ai' ? 'AI Generated' : 'User Edit')}
                                                        </div>
                                                        <div className="text-gray-400 text-[10px]">
                                                            {new Date(entry.timestamp).toLocaleTimeString()}
                                                        </div>
                                                    </div>
                                                    {idx === historyIndex && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                                </div>
                                            )) : (
                                                <div className="p-4 text-center text-gray-400 text-xs">No version history yet</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Go to Latest Button */}
                                {!isAtLatest && onGoToLatest && (
                                    <button
                                        onClick={onGoToLatest}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors animate-pulse"
                                        title="Return to latest version"
                                    >
                                        <FastForward className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Latest</span>
                                    </button>
                                )}
                            </>
                        )}

                        {/* Responsive Toggles (Only visible in Preview mode) */}
                        {
                            activeTab === "preview" && (
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
                            )
                        }
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
                {!loading && (
                    <SandpackProvider
                        key={sandpackKey} // Force reload only when explicitly requested (Undo/Redo)
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
                                overflow: "auto" // Allow scrolling for mobile/tablet views
                            }}>
                                <div
                                    ref={previewContainerRef}
                                    className={`shadow-2xl overflow-hidden bg-white dark:bg-black border border-gray-200 dark:border-gray-800 relative group ${previewMode === "mobile" ? "rounded-[30px] border-[8px] border-gray-800" :
                                        previewMode === "tablet" ? "rounded-[20px] border-[8px] border-gray-800" :
                                            "rounded-md w-full h-full"
                                        }`}
                                    style={{
                                        width: previewWidth,
                                        height: previewMode === "mobile" ? "900px" : previewMode === "tablet" ? "1200px" : "100%", // Increased heights
                                        maxHeight: previewMode === "desktop" ? "100%" : "none",
                                        maxWidth: "100%",
                                        transition: isResizingPreview ? "none" : "width 0.3s ease-in-out" // Smooth transition
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
                )}

                {/* Loading Overlay */}
                {
                    isGenerating && generatedCode?.files && Object.keys(generatedCode.files).length > 0 ? (
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
                    ) : null
                }
            </div>

            {/* Force Sandpack to take full height and custom scrollbars */}
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
                
                /* Custom Scrollbar Styles - Thin and subtle */
                ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                    background: rgba(156, 163, 175, 0.3);
                    border-radius: 4px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: rgba(156, 163, 175, 0.5);
                }
                
                /* Dark mode scrollbar */
                .dark ::-webkit-scrollbar-thumb {
                    background: rgba(75, 85, 99, 0.4);
                }
                .dark ::-webkit-scrollbar-thumb:hover {
                    background: rgba(75, 85, 99, 0.6);
                }
                
                /* Firefox scrollbar */
                * {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
                }
                .dark * {
                    scrollbar-color: rgba(75, 85, 99, 0.4) transparent;
                }
            `}</style>
        </div>
    );
}
