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

// Warm coral theme colors
const WARM_THEME = {
    primary: '#b64b6e',
    secondary: '#d4847c',
    accent: '#e8a87c',
    bg: '#faf5f0',
    bgSecondary: '#f5ebe0'
};

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
        const badges: Record<string, { color: string; bg: string; label: string }> = {
            draft: { bg: `${WARM_THEME.accent}30`, color: WARM_THEME.secondary, label: 'Draft' },
            outline: { bg: `${WARM_THEME.accent}40`, color: WARM_THEME.primary, label: 'Outline' },
            generated: { bg: `${WARM_THEME.primary}20`, color: WARM_THEME.primary, label: 'Generated' },
            completed: { bg: '#d4edda', color: '#28a745', label: 'Completed' },
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
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: WARM_THEME.primary }} />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-8 max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-slate-800">
                        Your Presentations
                    </h1>
                    <p className="text-slate-500">
                        Create, edit, and manage your AI-powered presentations
                    </p>
                </div>
                <Button
                    onClick={onCreateNew}
                    className="gap-2 text-white"
                    style={{ backgroundColor: WARM_THEME.primary }}
                >
                    <Plus className="w-4 h-4" />
                    New Presentation
                </Button>
            </div>

            {workspaces.length === 0 ? (
                <div
                    className="text-center py-20 rounded-xl border border-dashed"
                    style={{
                        backgroundColor: WARM_THEME.bgSecondary,
                        borderColor: WARM_THEME.accent
                    }}
                >
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: `${WARM_THEME.accent}40` }}
                    >
                        <Presentation className="w-8 h-8" style={{ color: WARM_THEME.primary }} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-slate-700">
                        No presentations yet
                    </h3>
                    <p className="mb-6 text-slate-500">
                        Create your first AI-powered presentation to get started
                    </p>
                    <Button
                        onClick={onCreateNew}
                        className="text-white"
                        style={{ backgroundColor: WARM_THEME.primary }}
                    >
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
                                className="hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
                                style={{
                                    backgroundColor: 'white',
                                    borderColor: `${WARM_THEME.accent}40`
                                }}
                                onClick={() => onSelectWorkspace(workspace._id)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = WARM_THEME.primary;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = `${WARM_THEME.accent}40`;
                                }}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0 overflow-hidden">
                                            <CardTitle className="text-lg leading-tight line-clamp-2 text-slate-700">
                                                {workspace.name}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1 text-slate-400">
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
                                    <div
                                        className="h-28 rounded-lg flex flex-col items-center justify-center border overflow-hidden relative mb-3 transition-colors"
                                        style={{
                                            background: `linear-gradient(135deg, ${WARM_THEME.bg} 0%, ${WARM_THEME.bgSecondary} 100%)`,
                                            borderColor: `${WARM_THEME.accent}30`
                                        }}
                                    >
                                        {preview.type === 'presentation' || preview.type === 'outline' ? (
                                            <div className="text-center px-4">
                                                <Presentation className="w-8 h-8 mx-auto mb-2" style={{ color: WARM_THEME.primary }} />
                                                <p className="text-sm font-medium line-clamp-2 text-slate-700">{preview.title}</p>
                                                <span className="text-xs text-slate-400">{preview.slideCount} slides</span>
                                            </div>
                                        ) : (
                                            <div className="text-center px-4">
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
                                                    style={{ backgroundColor: `${WARM_THEME.accent}30` }}
                                                >
                                                    <FileText className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <p className="text-xs line-clamp-2 text-slate-500">{preview.title}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Info */}
                                    <div className="flex items-center justify-between">
                                        <span
                                            className="text-xs px-2 py-1 rounded-full font-medium"
                                            style={{
                                                backgroundColor: statusBadge.bg,
                                                color: statusBadge.color
                                            }}
                                        >
                                            {statusBadge.label}
                                        </span>
                                        <span className="text-xs text-slate-400">
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
