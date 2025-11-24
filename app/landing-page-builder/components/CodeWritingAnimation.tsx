"use client"

import { useState, useEffect } from "react"
import { FileCode2, Terminal, CheckCircle2 } from "lucide-react"

interface CodeWritingAnimationProps {
    files: Record<string, { code: string }>
    onComplete?: () => void
}

export default function CodeWritingAnimation({
    files,
    onComplete
}: CodeWritingAnimationProps) {
    const [currentFileIndex, setCurrentFileIndex] = useState(0)
    const [currentCharIndex, setCurrentCharIndex] = useState(0)
    const [isComplete, setIsComplete] = useState(false)

    // Expose an approximate total duration so other animations
    // (like file creation) can sync to this.
    const avgCharsPerMs = 0.5 // tweak speed here (higher is faster)
    const totalChars = Object.values(files).reduce((sum, f) => sum + (f.code?.length || 0), 0)
    const estimatedTypingDurationMs = totalChars / avgCharsPerMs

    const fileEntries = Object.entries(files)
    const currentFile = fileEntries[currentFileIndex]
    const currentFileName = currentFile?.[0] || ""
    const currentCode = currentFile?.[1]?.code || ""

    // Auto-typing effect
    useEffect(() => {
        if (isComplete) return

        if (currentFileIndex >= fileEntries.length) {
            setIsComplete(true)
            setTimeout(() => {
                onComplete?.()
            }, 1500)
            return
        }

        if (currentCharIndex >= currentCode.length) {
            // Current file complete, move to next
            setTimeout(() => {
                setCurrentFileIndex(prev => prev + 1)
                setCurrentCharIndex(0)
            }, 400)
            return
        }

        // Type characters – speed proportional to total size
        const typingInterval = Math.max(4, estimatedTypingDurationMs / Math.max(1, currentCode.length * fileEntries.length))

        const timer = setTimeout(() => {
            setCurrentCharIndex(prev => prev + 1)
        }, typingInterval)

        return () => clearTimeout(timer)
    }, [currentCharIndex, currentCode, currentFileIndex, fileEntries.length, isComplete, onComplete])

    const displayedCode = currentCode.slice(0, currentCharIndex)
    const overallProgress = ((currentFileIndex + (currentCharIndex / Math.max(1, currentCode.length))) / Math.max(1, fileEntries.length)) * 100

    if (isComplete) {
        return (
            <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 dark:from-green-900/60 dark:to-emerald-900/60 rounded-lg border border-green-600/50 dark:border-green-500/50 overflow-hidden p-8 text-center animate-in fade-in duration-500">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 dark:bg-green-500/30 flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-green-400 dark:text-green-300" />
                    </div>
                    <div>
                        <h3 className="text-green-100 dark:text-green-50 font-semibold text-xl">Application Built Successfully!</h3>
                        <p className="text-green-300 dark:text-green-200 text-sm mt-2">✨ All {fileEntries.length} files created and ready</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-slate-900 dark:bg-gray-950 rounded-lg border border-slate-700/50 dark:border-gray-800 overflow-hidden shadow-2xl">
            {/* Terminal Header */}
            <div className="bg-slate-800 dark:bg-gray-900 px-5 py-3 flex items-center justify-between border-b border-slate-700 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex items-center gap-2 text-slate-300 dark:text-gray-400">
                        <Terminal className="w-4 h-4" />
                        <span className="font-mono font-semibold text-base">{currentFileName}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 dark:text-gray-500 font-mono">
                        {currentCharIndex} / {currentCode.length} chars
                    </span>
                    <span className="text-xs text-blue-400 dark:text-blue-300 font-semibold">
                        {Math.round((currentCharIndex / currentCode.length) * 100)}%
                    </span>
                </div>
            </div>

            {/* Code Display */}
            <div className="p-5 font-mono text-sm text-green-400 dark:text-green-300 h-80 overflow-auto bg-slate-950 dark:bg-black">
                <pre className="whitespace-pre-wrap break-words leading-relaxed">
                    {displayedCode}
                    <span className="inline-block w-2 h-5 bg-green-400 dark:bg-green-300 animate-pulse ml-0.5 align-middle" />
                </pre>
            </div>

            {/* Progress Bar */}
            <div className="bg-slate-800 dark:bg-gray-900 px-5 py-3 border-t border-slate-700 dark:border-gray-800">
                <div className="flex items-center justify-between text-xs text-slate-300 dark:text-gray-400 mb-2">
                    <span className="font-semibold flex items-center gap-2">
                        <FileCode2 className="w-4 h-4 text-blue-400 dark:text-blue-300" />
                        File {currentFileIndex + 1} of {fileEntries.length}
                    </span>
                    <span className="flex items-center gap-2 text-blue-400 dark:text-blue-300">
                        Writing code... {Math.round(overallProgress)}%
                    </span>
                </div>
                <div className="h-2 bg-slate-700 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-150 ease-linear rounded-full"
                        style={{ width: `${overallProgress}%` }}
                    />
                </div>
            </div>
        </div>
    )
}
