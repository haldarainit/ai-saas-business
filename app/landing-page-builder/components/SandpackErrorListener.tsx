"use client";

import { useSandpackConsole } from "@codesandbox/sandpack-react";
import { useEffect, useRef } from "react";

interface SandpackErrorListenerProps {
    onError: (error: string) => void;
}

export default function SandpackErrorListener({ onError }: SandpackErrorListenerProps) {
    const { logs } = useSandpackConsole({ resetOnPreviewRestart: true });
    const lastErrorRef = useRef<string | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const errors = logs.filter((log) => log.method === "error");

        if (errors.length > 0) {
            const latestError = errors[errors.length - 1];
            const errorMessage = latestError.data?.map(d => d.toString()).join(" ") || "Unknown error";

            // Ignore some common non-critical errors or duplicates
            if (errorMessage === lastErrorRef.current) return;

            // Ignore network errors or 404s which might be temporary
            if (errorMessage.includes("Failed to fetch") || errorMessage.includes("404")) return;

            lastErrorRef.current = errorMessage;

            // Debounce the error reporting
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            timeoutRef.current = setTimeout(() => {
                console.log("Auto-detecting error:", errorMessage);
                onError(errorMessage);
            }, 2000);
        }
    }, [logs, onError]);

    return null;
}
