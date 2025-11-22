"use client";
import React, { useEffect, useState } from 'react';
import { Plus, Folder, ArrowRight, Clock, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from 'date-fns';

interface Workspace {
    _id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

interface DashboardProps {
    userId: string;
    onSelectWorkspace: (id: string) => void;
    onCreateNew: () => void;
}

export default function Dashboard({ userId, onSelectWorkspace, onCreateNew }: DashboardProps) {
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
                    {workspaces.map((workspace) => (
                        <Card
                            key={workspace._id}
                            className="bg-gray-900 border-gray-800 hover:border-blue-500/50 transition-all cursor-pointer group"
                            onClick={() => onSelectWorkspace(workspace._id)}
                        >
                            <CardHeader>
                                <CardTitle className="text-white flex items-center justify-between">
                                    <span className="truncate">{workspace.name}</span>
                                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2 text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    {formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-24 bg-gray-950/50 rounded-md flex items-center justify-center border border-gray-800/50">
                                    <span className="text-xs text-gray-600 font-mono">Preview</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
