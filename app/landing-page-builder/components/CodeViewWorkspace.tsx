"use client";
import React, { useState, useEffect, useContext } from "react";
import {
    SandpackProvider,
    SandpackLayout,
    SandpackCodeEditor,
    SandpackFileExplorer,
} from "@codesandbox/sandpack-react";
import Lookup from "@/data/Lookup";
import SandpackPreviewClient from "./SandpackPreviewClient";
import { Loader2, Code2, Eye, Download, Upload, Trash2 } from "lucide-react";
import { ActionContext } from "@/contexts/ActionContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SandpackListener from "./SandpackListener";

interface CodeViewWorkspaceProps {
    workspaceId: string;
    generatedCode?: any;
    isGenerating?: boolean;
    onCodeChange?: (files: any) => void;
    onDelete?: () => void;
}

export default function CodeViewWorkspace({
    workspaceId,
    generatedCode,
    isGenerating,
    onCodeChange,
    onDelete
}: CodeViewWorkspaceProps) {
    const [activeTab, setActiveTab] = useState<"code" | "preview">("preview");
    const [files, setFiles] = useState(Lookup.DEFAULT_FILE);
    const [loading, setLoading] = useState(false);
    const { setAction } = useContext(ActionContext);

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

    return (
        <div className="relative h-full flex flex-col">
            {/* Header with tabs and actions */}
            <div className="bg-[#181818] border-b border-neutral-800 p-3">
                <div className="flex items-center justify-between">
                    {/* Tab Switcher */}
                    <div className="flex items-center gap-2 bg-black p-1 rounded-full">
                        <button
                            className={`text-sm font-medium transition-all duration-200 px-4 py-2 rounded-full ${activeTab === "code"
                                ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                                : "text-gray-300 hover:text-blue-400 hover:bg-blue-500/10"
                                }`}
                            onClick={() => setActiveTab("code")}
                        >
                            <Code2 className="w-4 h-4 inline mr-2" />
                            Code
                        </button>
                        <button
                            className={`text-sm font-medium transition-all duration-200 px-4 py-2 rounded-full ${activeTab === "preview"
                                ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                                : "text-gray-300 hover:text-blue-400 hover:bg-blue-500/10"
                                }`}
                            onClick={() => setActiveTab("preview")}
                        >
                            <Eye className="w-4 h-4 inline mr-2" />
                            Preview
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                            disabled={loading || isGenerating}
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            className="gap-2"
                            disabled={loading || isGenerating}
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDeploy}
                            className="gap-2"
                            disabled={loading || isGenerating}
                        >
                            <Upload className="w-4 h-4" />
                            Deploy
                        </Button>
                    </div>
                </div>
            </div>

            {/* Sandpack Content */}
            <div className="flex-1 overflow-hidden bg-[#1e1e1e]" style={{ display: "flex", flexDirection: "column" }}>
                <SandpackProvider
                    files={files}
                    template="react"
                    theme="dark"
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
                    <SandpackLayout style={{ height: "100%", width: "100%", display: "flex", flex: 1 }}>
                        <div style={{ display: activeTab === "code" ? "flex" : "none", height: "100%", width: "100%", flex: 1 }}>
                            <SandpackFileExplorer style={{ height: "100%", minHeight: "100%" }} />
                            <SandpackCodeEditor
                                style={{ height: "100%", minHeight: "100%", flex: 1 }}
                                showTabs
                                showLineNumbers
                                showInlineErrors
                            />
                        </div>
                        <div style={{ display: activeTab === "preview" ? "flex" : "none", height: "100%", width: "100%", flex: 1, flexDirection: "column" }}>
                            <SandpackPreviewClient />
                        </div>
                    </SandpackLayout>
                </SandpackProvider>

                {/* Loading Overlay */}
                {(loading || isGenerating) && (
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="text-center">
                            <Loader2 className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
                            <h2 className="text-white text-lg font-semibold">
                                {isGenerating ? "Generating Your Code..." : "Loading..."}
                            </h2>
                        </div>
                    </div>
                )}
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
            `}</style>
        </div>
    );
}
