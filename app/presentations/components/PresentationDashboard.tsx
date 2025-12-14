"use client";

import React, { useEffect, useState } from 'react';
import { Plus, Presentation, Clock, Loader2, Trash2, FileText, Sparkles, Edit3 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from 'date-fns';

interface PresentationWorkspace {
    _id: string;
    name: string;
    prompt: string;
    slideCount: number;
    theme: string;
    status: 'draft' | 'outline' | 'generated' | 'completed';
    outline?: {
        title: string;
        slides: any[];
    };
    presentation?: {
        title: string;
        slides: any[];
    };
    createdAt: string;
    updatedAt: string;
}

interface PresentationDashboardProps {
    userId: string;
    onSelectWorkspace: (id: string) => void;
    onCreateNew: () => void;
    onDeleteWorkspace: (id: string) => void;
}

export default function PresentationDashboard({
    userId,
    onSelectWorkspace,
    onCreateNew,
    onDeleteWorkspace
}: PresentationDashboardProps) {
    const [workspaces, setWorkspaces] = useState<PresentationWorkspace[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWorkspaces();
    }, [userId]);

    const fetchWorkspaces = async () => {
        try {
            const response = await fetch(`/api/presentation-workspace?userId=${userId}`);
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
            setWorkspaces(prev => prev.filter(w => w._id !== id));
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { color: string; label: string }> = {
            draft: { color: 'bg-gray-500/20 text-gray-400', label: 'Draft' },
            outline: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Outline' },
            generated: { color: 'bg-blue-500/20 text-blue-400', label: 'Generated' },
            completed: { color: 'bg-green-500/20 text-green-400', label: 'Completed' },
        };
        return badges[status] || badges.draft;
    };

    const getPreviewInfo = (workspace: PresentationWorkspace) => {
        if (workspace.presentation) {
            return {
                title: workspace.presentation.title,
                slideCount: workspace.presentation.slides?.length || 0,
                type: 'presentation'
            };
        }
        if (workspace.outline) {
            return {
                title: workspace.outline.title,
                slideCount: workspace.outline.slides?.length || 0,
                type: 'outline'
            };
        }
        return {
            title: workspace.prompt ? workspace.prompt.slice(0, 50) + '...' : 'No content yet',
            slideCount: workspace.slideCount,
            type: 'empty'
        };
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-8 max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Your Presentations</h1>
                    <p className="text-muted-foreground">Create, edit, and manage your AI-powered presentations</p>
                </div>
                <Button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-700 gap-2">
                    <Plus className="w-4 h-4" />
                    New Presentation
                </Button>
            </div>

            {workspaces.length === 0 ? (
                <div className="text-center py-20 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Presentation className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No presentations yet</h3>
                    <p className="text-muted-foreground mb-6">Create your first AI-powered presentation to get started</p>
                    <Button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-700">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create Presentation
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workspaces.map((workspace) => {
                        const preview = getPreviewInfo(workspace);
                        const statusBadge = getStatusBadge(workspace.status);

                        return (
                            <Card
                                key={workspace._id}
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
                                onClick={() => onSelectWorkspace(workspace._id)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0 overflow-hidden">
                                            <CardTitle className="text-foreground text-lg leading-tight line-clamp-2">
                                                {workspace.name}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })}
                                            </CardDescription>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 flex-shrink-0 text-slate-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                            onClick={(e) => handleDelete(e, workspace._id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Preview Area */}
                                    <div className="h-28 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-lg flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700/50 overflow-hidden relative mb-3 group-hover:border-blue-500/20 transition-colors">
                                        {preview.type === 'presentation' || preview.type === 'outline' ? (
                                            <div className="text-center px-4">
                                                <Presentation className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                                                <p className="text-sm font-medium text-foreground line-clamp-2">{preview.title}</p>
                                                <span className="text-xs text-muted-foreground">{preview.slideCount} slides</span>
                                            </div>
                                        ) : (
                                            <div className="text-center px-4">
                                                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-2">
                                                    <FileText className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2">{preview.title}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Info */}
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge.color}`}>
                                            {statusBadge.label}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {workspace.theme} • {workspace.slideCount} slides
                                        </span>
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
