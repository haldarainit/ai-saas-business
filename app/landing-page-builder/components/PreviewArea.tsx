"use client"

import { useState } from "react"
import { LiveProvider, LiveError, LivePreview } from "react-live"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Monitor, Code2, Download } from "lucide-react"
import * as LucideIcons from "lucide-react"

interface PreviewAreaProps {
    code: string
    isLoading?: boolean
    onDownload?: () => void
}

export default function PreviewArea({ code, isLoading, onDownload }: PreviewAreaProps) {
    const [activeTab, setActiveTab] = useState("preview")

    // Scope object with all Shadcn components and Lucide icons
    const scope = {
        Button,
        Card,
        Input,
        Textarea,
        Badge,
        Avatar,
        AvatarImage,
        AvatarFallback,
        Separator,
        ScrollArea,
        ...LucideIcons,
    }

    const handleDownload = () => {
        // Create a complete React component file
        const componentCode = `import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import * as LucideIcons from "lucide-react"

export default function LandingPage() {
  return (
    ${code}
  )
}
`
        const blob = new Blob([componentCode], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "landing-page.tsx"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        onDownload?.()
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code)
    }

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-background/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Preview</h2>
                            <p className="text-xs text-muted-foreground">Live preview of your landing page</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={copyToClipboard}
                            className="gap-2"
                        >
                            <Code2 className="w-4 h-4" />
                            Copy Code
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownload}
                            className="gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <div className="px-6 pt-4">
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="preview" className="gap-2">
                                <Monitor className="w-4 h-4" />
                                Preview
                            </TabsTrigger>
                            <TabsTrigger value="code" className="gap-2">
                                <Code2 className="w-4 h-4" />
                                Code
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="preview" className="flex-1 p-6 mt-0 overflow-auto">
                        {isLoading ? (
                            <div className="h-full flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-lg border border-border">
                                <div className="relative w-16 h-16 mb-4">
                                    <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-pulse"></div>
                                    <div className="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin"></div>
                                </div>
                                <h3 className="text-xl font-semibold text-slate-800 mb-2">Building your application...</h3>
                                <p className="text-slate-500">Writing React components and styling with Tailwind</p>
                            </div>
                        ) : code ? (
                            <div className="h-full bg-white rounded-lg border border-border shadow-lg overflow-auto">
                                <LiveProvider code={code} scope={scope} noInline={false}>
                                    <LiveError className="p-4 bg-red-50 text-red-700 text-sm font-mono whitespace-pre-wrap border-b border-red-200" />
                                    <div className="min-h-full">
                                        <LivePreview />
                                    </div>
                                </LiveProvider>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-border">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mx-auto mb-4">
                                        <Monitor className="w-8 h-8 text-gray-500" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Ready to Build</h3>
                                    <p className="text-muted-foreground">
                                        Fill out the form to generate your landing page
                                    </p>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="code" className="flex-1 p-6 mt-0 overflow-hidden">
                        {code ? (
                            <ScrollArea className="h-full">
                                <pre className="bg-slate-950 text-slate-50 p-6 rounded-lg font-mono text-sm overflow-x-auto">
                                    <code>{code}</code>
                                </pre>
                            </ScrollArea>
                        ) : (
                            <div className="h-full flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-border">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mx-auto mb-4">
                                        <Code2 className="w-8 h-8 text-gray-500" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">No Code Yet</h3>
                                    <p className="text-muted-foreground">
                                        Generated code will appear here
                                    </p>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
