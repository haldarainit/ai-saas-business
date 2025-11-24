"use client"

import { FileCode, Folder, ChevronRight, ChevronDown, Settings, Play, Box } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useState } from "react"

export default function FileExplorer() {
    const [isOpen, setIsOpen] = useState(true)

    return (
        <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-400 font-mono text-sm">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-slate-200">Explorer</span>
                <Settings className="w-4 h-4 hover:text-white cursor-pointer" />
            </div>

            {/* Project Structure */}
            <ScrollArea className="flex-1">
                <div className="p-2">
                    <div className="mb-2">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="flex items-center w-full hover:bg-slate-800 p-1 rounded text-slate-300"
                        >
                            {isOpen ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                            <span className="font-bold">PROJECT-ROOT</span>
                        </button>

                        {isOpen && (
                            <div className="ml-2 mt-1 space-y-0.5">
                                <div className="flex items-center hover:bg-slate-800 p-1 rounded cursor-pointer group">
                                    <ChevronRight className="w-4 h-4 mr-1 text-slate-600" />
                                    <Folder className="w-4 h-4 mr-2 text-blue-400" />
                                    <span className="group-hover:text-white">app</span>
                                </div>
                                <div className="ml-6 space-y-0.5 border-l border-slate-800 pl-2">
                                    <div className="flex items-center hover:bg-slate-800 p-1 rounded cursor-pointer bg-slate-800/50 text-white">
                                        <FileCode className="w-4 h-4 mr-2 text-yellow-400" />
                                        <span>page.tsx</span>
                                    </div>
                                    <div className="flex items-center hover:bg-slate-800 p-1 rounded cursor-pointer group">
                                        <FileCode className="w-4 h-4 mr-2 text-cyan-400" />
                                        <span className="group-hover:text-white">layout.tsx</span>
                                    </div>
                                    <div className="flex items-center hover:bg-slate-800 p-1 rounded cursor-pointer group">
                                        <FileCode className="w-4 h-4 mr-2 text-cyan-400" />
                                        <span className="group-hover:text-white">globals.css</span>
                                    </div>
                                </div>

                                <div className="flex items-center hover:bg-slate-800 p-1 rounded cursor-pointer group mt-2">
                                    <ChevronRight className="w-4 h-4 mr-1 text-slate-600" />
                                    <Folder className="w-4 h-4 mr-2 text-blue-400" />
                                    <span className="group-hover:text-white">components</span>
                                </div>
                                <div className="ml-6 space-y-0.5 border-l border-slate-800 pl-2">
                                    <div className="flex items-center hover:bg-slate-800 p-1 rounded cursor-pointer group">
                                        <Box className="w-4 h-4 mr-2 text-purple-400" />
                                        <span className="group-hover:text-white">ui</span>
                                    </div>
                                </div>

                                <div className="flex items-center hover:bg-slate-800 p-1 rounded cursor-pointer group mt-2">
                                    <FileCode className="w-4 h-4 mr-2 text-red-400" />
                                    <span className="group-hover:text-white">package.json</span>
                                </div>
                                <div className="flex items-center hover:bg-slate-800 p-1 rounded cursor-pointer group">
                                    <FileCode className="w-4 h-4 mr-2 text-yellow-400" />
                                    <span className="group-hover:text-white">tsconfig.json</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>

            {/* Status Bar */}
            <div className="h-8 bg-blue-600 flex items-center px-3 text-xs text-white justify-between">
                <div className="flex items-center gap-2">
                    <Play className="w-3 h-3 fill-current" />
                    <span>Running on localhost:3000</span>
                </div>
                <span>TypeScript React</span>
            </div>
        </div>
    )
}
