"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Sparkles, User, Bot, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import FileCreationAnimation from "./FileCreationAnimation"
import CodeWritingAnimation from "./CodeWritingAnimation"

interface Message {
    role: "user" | "model"
    content: string
}

interface ChatInterfaceProps {
    messages: Message[]
    onSendMessage: (message: string) => void
    isLoading: boolean
    generatedFiles?: Record<string, { code: string }> | null
}

export default function ChatInterface({ messages, onSendMessage, isLoading, generatedFiles }: ChatInterfaceProps) {
    const [input, setInput] = useState("")
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim())
            setInput("")
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">AI Assistant</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Landing Page Builder</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-950"
                style={{ scrollBehavior: 'smooth' }}
            >
                <div className="space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                            <div className="w-14 h-14 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                                <Sparkles className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Start Building</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mb-6">
                                Describe your landing page and I'll create it using modern React components.
                            </p>
                            <div className="grid grid-cols-1 gap-2 w-full max-w-md">
                                <button
                                    onClick={() => onSendMessage("Create a landing page for a modern SaaS product")}
                                    className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left text-sm text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400"
                                    disabled={isLoading}
                                >
                                    💼 Create a SaaS landing page
                                </button>
                                <button
                                    onClick={() => onSendMessage("Build a landing page for a coffee shop")}
                                    className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left text-sm text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400"
                                    disabled={isLoading}
                                >
                                    ☕ Coffee shop landing page
                                </button>
                                <button
                                    onClick={() => onSendMessage("Design a portfolio landing page for a designer")}
                                    className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left text-sm text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400"
                                    disabled={isLoading}
                                >
                                    🎨 Portfolio landing page
                                </button>
                            </div>
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                                    message.role === "user" ? "justify-end" : "justify-start"
                                )}
                            >
                                {message.role === "model" && (
                                    <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        "rounded-lg px-4 py-3 max-w-[80%]",
                                        message.role === "user"
                                            ? "bg-blue-600 dark:bg-blue-500 text-white"
                                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                                    )}
                                >
                                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                </div>
                                {message.role === "user" && (
                                    <div className="w-8 h-8 rounded-lg bg-gray-700 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="rounded-lg px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-[80%]">
                                {generatedFiles && Object.keys(generatedFiles).length > 0 ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Creating your application...</p>
                                        </div>
                                        <FileCreationAnimation files={generatedFiles} />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Generating your page...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe your landing page or request changes..."
                        className="min-h-[56px] max-h-[120px] resize-none border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="h-[56px] w-[56px] rounded-lg bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex-shrink-0"
                        disabled={isLoading || !input.trim()}
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </Button>
                </form>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    )
}
