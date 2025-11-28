"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Image, Video, Music, FileText, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FileUploadButtonProps {
    onFileUploaded: (fileData: any) => void
    disabled?: boolean
}

export default function FileUploadButton({ onFileUploaded, disabled }: FileUploadButtonProps) {
    const [isUploading, setIsUploading] = useState(false)
    const imageInputRef = useRef<HTMLInputElement>(null)
    const videoInputRef = useRef<HTMLInputElement>(null)
    const audioInputRef = useRef<HTMLInputElement>(null)
    const documentInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    const handleFileUpload = async (file: File) => {
        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/upload-file", {
                method: "POST",
                body: formData,
            })

            const data = await response.json()

            if (data.success) {
                // For images, also convert to base64 for vision API
                let base64Data: string | undefined
                if (data.file.type === "image") {
                    const reader = new FileReader()
                    reader.onloadend = () => {
                        const base64 = reader.result as string
                        // Remove data URL prefix to get just the base64 data
                        const base64WithoutPrefix = base64.split(",")[1]
                        onFileUploaded({
                            ...data.file,
                            base64Data: base64WithoutPrefix,
                        })
                    }
                    reader.readAsDataURL(file)
                } else {
                    onFileUploaded(data.file)
                }

                toast({
                    title: "File uploaded successfully",
                    description: `${file.name} has been uploaded.`,
                })
            } else {
                throw new Error(data.error || "Upload failed")
            }
        } catch (error) {
            console.error("Upload error:", error)
            toast({
                title: "Upload failed",
                description: error instanceof Error ? error.message : "Failed to upload file",
                variant: "destructive",
            })
        } finally {
            setIsUploading(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFileUpload(file)
        }
        // Reset input value to allow same file upload again
        e.target.value = ""
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        size="icon"
                        variant="outline"
                        disabled={disabled || isUploading}
                        className="h-[56px] w-[56px] rounded-lg border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                    >
                        {isUploading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
                        ) : (
                            <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isUploading}
                        className="cursor-pointer"
                    >
                        <Image className="w-4 h-4 mr-2 text-blue-600" />
                        Upload Image
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => videoInputRef.current?.click()}
                        disabled={isUploading}
                        className="cursor-pointer"
                    >
                        <Video className="w-4 h-4 mr-2 text-purple-600" />
                        Upload Video
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => audioInputRef.current?.click()}
                        disabled={isUploading}
                        className="cursor-pointer"
                    >
                        <Music className="w-4 h-4 mr-2 text-green-600" />
                        Upload Audio
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => documentInputRef.current?.click()}
                        disabled={isUploading}
                        className="cursor-pointer"
                    >
                        <FileText className="w-4 h-4 mr-2 text-orange-600" />
                        Upload Document
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Hidden file inputs */}
            <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleInputChange}
                className="hidden"
            />
            <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleInputChange}
                className="hidden"
            />
            <input
                ref={audioInputRef}
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
                onChange={handleInputChange}
                className="hidden"
            />
            <input
                ref={documentInputRef}
                type="file"
                accept=".txt,.csv,.pdf,.doc,.docx,text/plain,text/csv,application/pdf"
                onChange={handleInputChange}
                className="hidden"
            />
        </>
    )
}
