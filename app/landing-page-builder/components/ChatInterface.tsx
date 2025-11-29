"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Sparkles, User, Bot, Loader2, Plus, X, FileText, Image as ImageIcon, Paperclip, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import FileCreationAnimation from "./FileCreationAnimation"
import CodeWritingAnimation from "./CodeWritingAnimation"

export interface Attachment {
    type: 'image' | 'video' | 'audio' | 'document';
    content?: string; // Optional now, used for preview or text content
    url?: string; // Cloudinary URL
    publicId?: string; // Cloudinary Public ID
    mimeType: string;
    name: string;
}

interface Message {
    role: "user" | "model"
    content: string
    attachments?: Attachment[]
    error?: boolean
}

interface ChatInterfaceProps {
    messages: Message[]
    onSendMessage: (message: string, attachments: Attachment[]) => void
    isLoading: boolean
    generatedFiles?: Record<string, { code: string }> | null
    onRetry?: (index: number) => void
}

export default function ChatInterface({ messages, onSendMessage, isLoading, generatedFiles, onRetry }: ChatInterfaceProps) {
    const [input, setInput] = useState("")
    const [attachments, setAttachments] = useState<Attachment[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if ((input.trim() || attachments.length > 0) && !isLoading && !isUploading) {
            let messageContent = input.trim();
            const currentAttachments = [...attachments];

            // Parse @ mentions for URLs
            const mentionRegex = /@(https?:\/\/[^\s]+)/g;
            const matches = messageContent.match(mentionRegex);

            if (matches) {
                matches.forEach(match => {
                    const url = match.substring(1); // Remove @
                    if (!currentAttachments.some(att => att.url === url)) {
                        currentAttachments.push({
                            type: 'image',
                            url: url,
                            mimeType: 'image/jpeg',
                            name: url.split('/').pop() || 'image'
                        });
                    }
                });
            }

            onSendMessage(messageContent, currentAttachments)
            setInput("")
            setAttachments([])
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setIsUploading(true);
            const newAttachments: Attachment[] = []

            try {
                for (let i = 0; i < e.target.files.length; i++) {
                    const file = e.target.files[i]
                    const formData = new FormData();
                    formData.append('file', file);

                    const response = await fetch('/api/upload-file', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();
                    console.log("ChatInterface: Upload response:", data);

                    if (data.success && data.file) {
                        console.log("ChatInterface: File uploaded successfully:", data.file.url);
                        newAttachments.push({
                            type: data.file.type as any,
                            url: data.file.url,
                            publicId: data.file.publicId,
                            mimeType: data.file.mimeType,
                            name: data.file.filename,
                            content: data.file.extractedContent // For text files if needed
                        });
                    } else {
                        console.error("Upload failed:", data.error);
                        // Optionally show a toast here
                    }
                }
            } catch (error) {
                console.error("Error uploading file:", error);
            } finally {
                setIsUploading(false);
            }

            setAttachments(prev => [...prev, ...newAttachments])
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index))
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
                                    onClick={() => onSendMessage("Create a landing page for a modern SaaS product", [])}
                                    className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left text-sm text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400"
                                    disabled={isLoading}
                                >
                                    💼 Create a SaaS landing page
                                </button>
                                <button
                                    onClick={() => onSendMessage("Build a landing page for a coffee shop", [])}
                                    className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left text-sm text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400"
                                    disabled={isLoading}
                                >
                                    ☕ Coffee shop landing page
                                </button>
                                <button
                                    onClick={() => onSendMessage("Design a portfolio landing page for a designer", [])}
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
                                    {message.attachments && message.attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {message.attachments.map((att, i) => (
                                                <div key={i} className="relative group">
                                                    {att.type === 'image' ? (
                                                        <img src={att.url || att.content} alt={att.name} className="w-20 h-20 object-cover rounded-md border border-white/20" />
                                                    ) : (
                                                        <div className="w-20 h-20 flex flex-col items-center justify-center bg-white/10 rounded-md border border-white/20 p-1">
                                                            <FileText className="w-6 h-6 mb-1" />
                                                            <span className="text-[10px] truncate w-full text-center">{att.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                </div>
                                {message.role === "user" && (
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="w-8 h-8 rounded-lg bg-gray-700 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                        {message.error && (
                                            <button
                                                onClick={() => onRetry?.(index)}
                                                disabled={isLoading}
                                                className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-xs flex items-center gap-1 mt-1 disabled:opacity-50"
                                                title="Retry message"
                                            >
                                                <RotateCcw className="w-3 h-3" />
                                                Retry
                                            </button>
                                        )}
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
                {(attachments.length > 0 || isUploading) && (
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                        {attachments.map((att, i) => (
                            <div key={i} className="relative group flex-shrink-0">
                                {att.type === 'image' ? (
                                    <img src={att.url || att.content} alt={att.name} className="w-16 h-16 object-cover rounded-md border border-gray-200 dark:border-gray-700" />
                                ) : (
                                    <div className="w-16 h-16 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-1">
                                        <FileText className="w-6 h-6 mb-1 text-gray-500" />
                                        <span className="text-[10px] truncate w-full text-center text-gray-600 dark:text-gray-300">{att.name}</span>
                                    </div>
                                )}
                                <button
                                    onClick={() => removeAttachment(i)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        {isUploading && (
                            <div className="w-16 h-16 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-1 animate-pulse">
                                <Loader2 className="w-6 h-6 mb-1 text-blue-500 animate-spin" />
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">Uploading...</span>
                            </div>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        multiple
                        accept="image/*,video/*,audio/*,.txt,.csv,.md,.json,.js,.jsx,.ts,.tsx,.html,.css"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-[56px] w-[56px] rounded-lg border-gray-300 dark:border-gray-700 flex-shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                    >
                        <Plus className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </Button>

                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe your landing page... (Type @url to add media)"
                        className="min-h-[56px] max-h-[120px] resize-none border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="h-[56px] w-[56px] rounded-lg bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex-shrink-0"
                        disabled={isLoading || (!input.trim() && attachments.length === 0)}
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </Button>
                </form>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Press Enter to send, Shift+Enter for new line. Supports images, videos, docs, and @url.
                </p>
            </div>
        </div>
    )
}
