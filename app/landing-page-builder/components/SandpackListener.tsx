"use client";

import { useSandpack } from "@codesandbox/sandpack-react";
import { useEffect, useRef } from "react";

interface SandpackListenerProps {
    onCodeChange: (files: any) => void;
}

export default function SandpackListener({ onCodeChange }: SandpackListenerProps) {
    const { sandpack } = useSandpack();
    const { files } = sandpack;
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Debounce the update to avoid too many writes
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            onCodeChange(files);
        }, 2000); // Autosave every 2 seconds of inactivity

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [files, onCodeChange]);

    return null;
}
