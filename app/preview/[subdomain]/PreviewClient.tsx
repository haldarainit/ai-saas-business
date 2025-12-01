"use client";

import { SandpackProvider, SandpackLayout, SandpackPreview, useSandpack } from "@codesandbox/sandpack-react";
import Lookup from "@/data/Lookup";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

function LoadingOverlay() {
    const { sandpack } = useSandpack();
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (sandpack.status === "running") {
            // Add a small delay to ensure the iframe is actually ready visually
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [sandpack.status]);

    if (!isVisible) return null;

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-700">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-100 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 border-t-4 border-blue-600 rounded-full animate-spin"></div>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <h2 className="text-xl font-semibold text-gray-900">Loading Site</h2>
                    <p className="text-sm text-gray-500">Preparing your experience...</p>
                </div>
            </div>
        </div>
    );
}

export default function PreviewClient({ files }: { files: any }) {
    return (
        <div className="h-screen w-screen overflow-hidden bg-white relative">
            <SandpackProvider
                files={files}
                template="react"
                customSetup={{
                    dependencies: {
                        ...Lookup.DEPENDANCY,
                    },
                }}
                options={{
                    externalResources: ["https://cdn.tailwindcss.com"],
                    autoReload: true,
                    autorun: true,
                    initMode: "immediate", // Start compilation immediately
                }}
            >
                <SandpackLayout style={{ height: "100vh", width: "100vw", border: "none" }}>
                    <LoadingOverlay />
                    <SandpackPreview
                        style={{ height: "100%", width: "100%" }}
                        showOpenInCodeSandbox={false}
                        showRefreshButton={false}
                    />
                </SandpackLayout>
            </SandpackProvider>
        </div>
    );
}
