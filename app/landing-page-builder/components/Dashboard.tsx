import React, { useEffect, useState } from 'react';
import { Plus, Folder, ArrowRight, Clock, Loader2, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from 'date-fns';

interface Workspace {
    _id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    fileData?: any;
}

interface DashboardProps {
    userId: string;
    onSelectWorkspace: (id: string) => void;
    onCreateNew: () => void;
    onDeleteWorkspace: (id: string) => void;
}

export default function Dashboard({ userId, onSelectWorkspace, onCreateNew, onDeleteWorkspace }: DashboardProps) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWorkspaces();
    }, [userId]);

    const fetchWorkspaces = async () => {
        try {
            const response = await fetch(`/api/workspace?userId=${userId}`);
            const data = await response.json();
            if (data.workspaces) {
                setWorkspaces(data.workspaces);
            }
        } catch (error) {
            console.error("Error fetching workspaces:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this workspace?")) {
            onDeleteWorkspace(id);
            // Optimistically remove from list
            setWorkspaces(prev => prev.filter(w => w._id !== id));
        }
    };

    const getPreviewContent = (files: any) => {
        if (!files) return null;

        // Try to find Hero.js or App.js
        const heroFile = files['/components/Hero.js']?.code || files['/App.js']?.code;
        if (!heroFile) return null;

        // Extract h1 text using regex
        const h1Match = heroFile.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (h1Match && h1Match[1]) {
            return h1Match[1].trim();
        }

        return null;
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-8 max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Your Workspaces</h1>
                    <p className="text-gray-400">Manage and organize your landing page projects</p>
                </div>
                <Button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-700 gap-2">
                    <Plus className="w-4 h-4" />
                    New Project
                </Button>
            </div>

            {workspaces.length === 0 ? (
                <div className="text-center py-20 bg-gray-900/50 rounded-xl border border-gray-800 border-dashed">
                    <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Folder className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No workspaces yet</h3>
                    <p className="text-gray-400 mb-6">Create your first landing page project to get started</p>
                    <Button onClick={onCreateNew} variant="outline">
                        Create Workspace
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workspaces.map((workspace) => {
                        const previewText = getPreviewContent(workspace.fileData);
                        return (
                            <Card
                                key={workspace._id}
                                className="bg-gray-900 border-gray-800 hover:border-blue-500/50 transition-all cursor-pointer group relative"
                                onClick={() => onSelectWorkspace(workspace._id)}
                            >
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center justify-between">
                                        <span className="truncate max-w-[180px]">{workspace.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                            onClick={(e) => handleDelete(e, workspace._id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2 text-gray-400">
                                        <Clock className="w-3 h-3" />
                                        {formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-32 bg-gray-950/50 rounded-md flex items-center justify-center border border-gray-800/50 overflow-hidden relative group-hover:border-blue-500/20 transition-colors p-4">
                                        {previewText ? (
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-gray-300 line-clamp-2">"{previewText}"</p>
                                                <span className="text-xs text-gray-600 mt-2 block">Landing Page</span>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                                    <Folder className="w-5 h-5 text-gray-500" />
                                                </div>
                                                <span className="text-xs text-gray-600 font-mono">No Preview</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
