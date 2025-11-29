"use client"

import { X, File, Image, Video, Music, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Attachment {
    type: "image" | "video" | "audio" | "document"
    url: string
    filename: string
    size: number
    extractedContent?: string
    base64Data?: string
    mimeType?: string
}

interface FileAttachmentPreviewProps {
    attachments: Attachment[]
    onRemove: (index: number) => void
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

function getFileIcon(type: string) {
    switch (type) {
        case "image":
            return <Image className="w-4 h-4 text-blue-600" />
        case "video":
            return <Video className="w-4 h-4 text-purple-600" />
        case "audio":
            return <Music className="w-4 h-4 text-green-600" />
        case "document":
            return <FileText className="w-4 h-4 text-orange-600" />
        default:
            return <File className="w-4 h-4 text-gray-600" />
    }
}

export default function FileAttachmentPreview({ attachments, onRemove }: FileAttachmentPreviewProps) {
    if (attachments.length === 0) return null

    return (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-3">
            <ScrollArea className="max-h-32">
                <div className="flex flex-wrap gap-2">
                    {attachments.map((attachment, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 pr-2 group hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                        >
                            {/* Icon or Thumbnail */}
                            <div className="flex-shrink-0">
                                {attachment.type === "image" && attachment.url ? (
                                    <div className="w-8 h-8 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                                        <img
                                            src={attachment.url}
                                            alt={attachment.filename}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                        {getFileIcon(attachment.type)}
                                    </div>
                                )}
                            </div>

                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[150px]">
                                    {attachment.filename}
                                </p>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatFileSize(attachment.size)}
                                    </p>
                                    {attachment.extractedContent && (
                                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                            • Content extracted
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Remove Button */}
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => onRemove(index)}
                                className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Document Content Preview */}
            {attachments.some((att) => att.extractedContent) && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Document Content Preview:</p>
                    {attachments
                        .filter((att) => att.extractedContent)
                        .map((att, index) => (
                            <div
                                key={index}
                                className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 mt-1"
                            >
                                <p className="font-medium mb-1">{att.filename}</p>
                                <p className="line-clamp-2 text-gray-500 dark:text-gray-400">
                                    {att.extractedContent}
                                </p>
                            </div>
                        ))}
                </div>
            )}
        </div>
    )
}
