"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Sparkles, User, Bot, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
    role: "user" | "model"
    content: string
}

interface ChatInterfaceProps {
    messages: Message[]
    onSendMessage: (message: string) => void
    isLoading: boolean
}

export default function ChatInterface({ messages, onSendMessage, isLoading }: ChatInterfaceProps) {
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
        <div className="flex flex-col h-full bg-gradient-to-br from-background to-muted/20 border-r border-border">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-background/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">AI Landing Page Builder</h2>
                        <p className="text-xs text-muted-foreground">Powered by Gemini</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                <div className="space-y-6">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                                <Sparkles className="w-8 h-8 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Let's Build Something Amazing</h3>
                            <p className="text-muted-foreground max-w-sm mb-6">
                                Describe your landing page and I'll create it for you using modern React components.
                            </p>
                            <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                                <button
                                    onClick={() => onSendMessage("Create a landing page for a modern SaaS product")}
                                    className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left text-sm"
                                    disabled={isLoading}
                                >
                                    💼 Create a SaaS landing page
                                </button>
                                <button
                                    onClick={() => onSendMessage("Build a landing page for a coffee shop")}
                                    className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left text-sm"
                                    disabled={isLoading}
                                >
                                    ☕ Coffee shop landing page
                                </button>
                                <button
                                    onClick={() => onSendMessage("Design a portfolio landing page for a designer")}
                                    className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left text-sm"
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
                                    "flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500",
                                    message.role === "user" ? "justify-end" : "justify-start"
                                )}
                            >
                                {message.role === "model" && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        "rounded-2xl px-4 py-3 max-w-[80%]",
                                        message.role === "user"
                                            ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white"
                                            : "bg-muted border border-border"
                                    )}
                                >
                                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                </div>
                                {message.role === "user" && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="rounded-2xl px-4 py-3 bg-muted border border-border">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <p className="text-sm text-muted-foreground">Generating your page...</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border bg-background/80 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe your landing page or request changes..."
                        className="min-h-[60px] max-h-[120px] resize-none"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="h-[60px] w-[60px] rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all"
                        disabled={isLoading || !input.trim()}
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    )
}
