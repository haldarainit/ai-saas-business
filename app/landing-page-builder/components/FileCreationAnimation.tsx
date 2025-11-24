"use client"

import { useState, useEffect } from "react"
import { FileCode2, CheckCircle2, Loader2, FileJson, FileText, FileCog } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileInfo {
    name: string
    status: "pending" | "writing" | "complete"
    content?: string
    lines?: number
}

interface FileCreationAnimationProps {
    files: Record<string, { code: string }>
    onComplete?: () => void
    /**
     * Total duration (ms) that the code-writing animation will take.
     * We use this to keep file-creation in sync with code writing.
     */
    targetDurationMs?: number
    className?: string
}

// Get appropriate icon based on file extension
const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.json')) return FileJson
    if (fileName.endsWith('.tsx') || fileName.endsWith('.jsx')) return FileCode2
    if (fileName.endsWith('.css')) return FileCog
    return FileText
}

export default function FileCreationAnimation({
    files,
    onComplete,
    className,
    targetDurationMs
}: FileCreationAnimationProps) {
    const [fileList, setFileList] = useState<FileInfo[]>([])
    const [currentFileIndex, setCurrentFileIndex] = useState(0)

    useEffect(() => {
        // Initialize file list from files object
        const initialFiles: FileInfo[] = Object.entries(files).map(([name, data]) => ({
            name,
            status: "pending",
            content: data.code,
            lines: data.code.split("\n").length
        }))
        setFileList(initialFiles)
    }, [files])

    useEffect(() => {
        if (fileList.length === 0) return

        // Base timings (fallbacks)
        const defaultPerFileTotal = 1400 // ms (400 delay + 1000 writing)
        const fileCount = fileList.length

        // If targetDurationMs is provided from CodeWritingAnimation, spread that
        // time roughly evenly across files.
        const perFileTotal = targetDurationMs
            ? Math.max(600, targetDurationMs / fileCount) // minimum sensible per-file time
            : defaultPerFileTotal

        const perFileDelay = perFileTotal * 0.3
        const perFileWrite = perFileTotal * 0.7

        // Animate files one by one
        if (currentFileIndex < fileCount) {
            const timer = setTimeout(() => {
                setFileList(prev =>
                    prev.map((file, idx) => {
                        if (idx === currentFileIndex) {
                            return { ...file, status: "writing" }
                        }
                        return file
                    })
                )

                // Mark as complete after "writing"
                const completeTimer = setTimeout(() => {
                    setFileList(prev =>
                        prev.map((file, idx) => {
                            if (idx === currentFileIndex) {
                                return { ...file, status: "complete" }
                            }
                            return file
                        })
                    )
                    setCurrentFileIndex(prev => prev + 1)
                }, perFileWrite)

                return () => clearTimeout(completeTimer)
            }, perFileDelay)

            return () => clearTimeout(timer)
        } else if (currentFileIndex >= fileList.length && fileList.length > 0) {
            // All files complete
            const finalTimer = setTimeout(() => {
                onComplete?.()
            }, 500)
            return () => clearTimeout(finalTimer)
        }
    }, [currentFileIndex, fileList.length, onComplete])

    return (
        <div className={cn("space-y-2.5", className)}>
            <div className="flex items-center gap-2 mb-1">
                <div className="h-1 w-1 rounded-full bg-blue-400 dark:bg-blue-500 animate-pulse" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Creating files...</p>
            </div>

            {fileList.map((file, index) => {
                const FileIcon = getFileIcon(file.name)

                return (
                    <div
                        key={file.name}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-300",
                            file.status === "pending" && "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60",
                            file.status === "writing" && "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700/50 shadow-sm",
                            file.status === "complete" && "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700/50"
                        )}
                    >
                        <div className="flex-shrink-0">
                            {file.status === "pending" && (
                                <FileIcon className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                            )}
                            {file.status === "writing" && (
                                <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                            )}
                            {file.status === "complete" && (
                                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <p className={cn(
                                    "text-sm font-mono font-medium truncate",
                                    file.status === "pending" && "text-slate-500 dark:text-slate-500",
                                    file.status === "writing" && "text-blue-700 dark:text-blue-300",
                                    file.status === "complete" && "text-green-700 dark:text-green-300"
                                )}>
                                    {file.name}
                                </p>
                                {file.lines && (
                                    <span className="text-xs text-slate-400 dark:text-slate-600 font-mono flex-shrink-0">
                                        {file.lines}L
                                    </span>
                                )}
                            </div>

                            {file.status === "writing" && (
                                <div className="flex items-center gap-2 mt-1.5">
                                    <div className="flex-1 h-1 bg-blue-100 dark:bg-blue-900/50 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 dark:bg-blue-400 rounded-full animate-progress w-full" />
                                    </div>
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Creating...</span>
                                </div>
                            )}

                            {file.status === "complete" && (
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                                    ✓ Created
                                </p>
                            )}
                        </div>
                    </div>
                )
            })}

            <style jsx>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }
        .animate-progress {
          animation: progress 1s ease-in-out;
        }
      `}</style>
        </div>
    )
}
