'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { ArrowLeft, Sparkles, FileEdit, Zap, Plus, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from 'next/navigation';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TechnoQuotationDashboard() {
    const router = useRouter();
    const [quotations, setQuotations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showNameDialog, setShowNameDialog] = useState(false);
    const [newQuotationName, setNewQuotationName] = useState('');
    const [pendingType, setPendingType] = useState<'manual' | 'automated' | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchQuotations = async () => {
            try {
                const response = await fetch('/api/techno-quotation');
                if (response.ok) {
                    const data = await response.json();
                    setQuotations(data.quotations);
                }
            } catch (error) {
                console.error("Error fetching quotations:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuotations();
    }, []);

    const handleCreateClick = (type: 'manual' | 'automated') => {
        setPendingType(type);
        setNewQuotationName('');
        setShowNameDialog(true);
    };

    const createQuotation = async () => {
        if (!pendingType || !newQuotationName.trim()) return;

        setIsCreating(true);
        setShowNameDialog(false);

        try {
            const response = await fetch('/api/techno-quotation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: pendingType,
                    title: newQuotationName
                })
            });

            if (response.ok) {
                const data = await response.json();
                router.push(`/accounting/techno-quotation/${data.quotation._id}`);
            } else {
                // Handle error (e.g. auth error)
                console.error("Failed to create", response.status);
                setIsCreating(false);
            }
        } catch (error) {
            console.error("Error creating quotation:", error);
            setIsCreating(false);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteId(id);
    };

    const deleteQuotation = async () => {
        if (!deleteId) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/techno-quotation/${deleteId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setQuotations(prev => prev.filter(q => q._id !== deleteId));
            } else {
                console.error("Failed to delete", response.status);
            }
        } catch (error) {
            console.error("Error deleting quotation:", error);
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };


    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />

            <main className="flex-1 bg-gradient-to-br from-emerald-500/10 via-background to-teal-500/10">
                {/* Header */}
                <section className="py-12 border-b">
                    <div className="container px-4">
                        <Link href="/accounting" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Accounting
                        </Link>
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                                    Techno Commercial Quotations
                                </h1>
                                <p className="text-lg text-muted-foreground">
                                    Manage your quotations and create new ones
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Content */}
                <section className="py-8">
                    <div className="container px-4">

                        {/* Creation Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
                            {/* Manual Quotation Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Card className="relative overflow-hidden border-2 border-border/50 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl group cursor-pointer h-full"
                                    onClick={() => !isCreating && handleCreateClick('manual')}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative p-8 flex flex-col h-full">
                                        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                                            {isCreating ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <FileEdit className="w-8 h-8 text-white" />}
                                        </div>

                                        <h3 className="text-2xl font-bold mb-3 text-emerald-600">
                                            Manual Quotation
                                        </h3>

                                        <p className="text-muted-foreground mb-6 flex-grow">
                                            Create a fully customizable quotation with complete control over every detail. Add pages, sections, tables, and customize the layout to match your exact requirements.
                                        </p>

                                        <div className="space-y-2 mb-6">
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                                                Dynamic page management
                                            </div>
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                                                Custom tables & sections
                                            </div>
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                                                Full design control
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 group-hover:shadow-lg transition-all"
                                            size="lg"
                                            disabled={isCreating}
                                        >
                                            Start Manual Creation
                                            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>

                            {/* Automated Quotation Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Card className="relative overflow-hidden border-2 border-border/50 hover:border-teal-500/50 transition-all duration-300 hover:shadow-xl group cursor-pointer h-full"
                                    onClick={() => !isCreating && handleCreateClick('automated')}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    {/* AI Badge */}
                                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-bold flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        AI Powered
                                    </div>

                                    <div className="relative p-8 flex flex-col h-full">
                                        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 mb-6 group-hover:scale-110 transition-transform">
                                            {isCreating ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Zap className="w-8 h-8 text-white" />}
                                        </div>

                                        <h3 className="text-2xl font-bold mb-3 text-teal-600">
                                            Automated Quotation
                                        </h3>

                                        <p className="text-muted-foreground mb-6 flex-grow">
                                            Let AI generate professional quotations instantly. Simply provide your requirements and let our intelligent system create a comprehensive quotation for you.
                                        </p>

                                        <div className="space-y-2 mb-6">
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-2" />
                                                AI-powered generation
                                            </div>
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-2" />
                                                Instant results
                                            </div>
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-2" />
                                                Smart formatting
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 group-hover:shadow-lg transition-all"
                                            size="lg"
                                            disabled={isCreating}
                                        >
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Generate with AI
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Recent Quotations */}
                        <h2 className="text-xl font-semibold mb-4">Recent Quotations</h2>

                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            </div>
                        ) : quotations.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-background/50">
                                <p className="text-muted-foreground">No quotations found. Create your first one!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                                {quotations.map((q) => (
                                    <Link key={q._id} href={`/accounting/techno-quotation/${q._id}`}>
                                        <Card className="group h-full hover:shadow-lg hover:border-emerald-400/50 transition-all duration-200 cursor-pointer overflow-hidden">
                                            {/* Preview Thumbnail - Real Document Preview */}
                                            <div className="relative h-32 bg-white dark:bg-gray-900 border-b overflow-hidden">
                                                {/* Mini Document */}
                                                <div className="absolute inset-1 bg-gray-50 dark:bg-gray-800 rounded shadow-sm border border-gray-200 dark:border-gray-700 p-2 text-[6px] leading-tight overflow-hidden">
                                                    {/* Header */}
                                                    <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-gray-200 dark:border-gray-600">
                                                        {q.companyDetails?.logo ? (
                                                            <img src={q.companyDetails.logo} alt="" className="w-4 h-4 object-contain rounded" />
                                                        ) : (
                                                            <div className="w-4 h-4 rounded bg-emerald-400 dark:bg-emerald-600" />
                                                        )}
                                                        <div className="flex-1 truncate font-bold text-gray-700 dark:text-gray-300">
                                                            {q.companyDetails?.name || 'Company'}
                                                        </div>
                                                    </div>
                                                    {/* Title */}
                                                    <div className="text-center font-bold text-emerald-600 dark:text-emerald-400 mb-1.5 truncate text-[7px]">
                                                        {q.title}
                                                    </div>
                                                    {/* Content Preview - Show first sections */}
                                                    <div className="space-y-0.5 text-gray-500 dark:text-gray-400">
                                                        {q.pages?.[0]?.sections?.slice(0, 3).map((section: any, idx: number) => (
                                                            <div key={idx} className="truncate">
                                                                {section.heading && <span className="font-medium">{section.heading}</span>}
                                                                {section.content && <span className="text-gray-400">: {section.content}</span>}
                                                            </div>
                                                        )) || (
                                                                <>
                                                                    <div className="h-1.5 w-full rounded bg-gray-200 dark:bg-gray-700" />
                                                                    <div className="h-1.5 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
                                                                    <div className="h-1.5 w-3/5 rounded bg-gray-200 dark:bg-gray-700" />
                                                                </>
                                                            )}
                                                    </div>
                                                </div>
                                                {/* Type Badge */}
                                                <div className={`absolute top-2 right-2 p-1.5 rounded-md shadow-sm ${q.quotationType === 'automated' ? 'bg-teal-500' : 'bg-emerald-500'}`}>
                                                    {q.quotationType === 'automated' ? <Sparkles className="w-3 h-3 text-white" /> : <FileEdit className="w-3 h-3 text-white" />}
                                                </div>
                                            </div>

                                            {/* Card Content */}
                                            <div className="p-4">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-sm mb-1.5 line-clamp-1 group-hover:text-emerald-600 transition-colors">{q.title}</h3>
                                                        <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                                                            {q.companyDetails?.name || 'No company set'}
                                                        </p>
                                                        <div className="text-xs text-muted-foreground">
                                                            {new Date(q.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                    </div>
                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={(e) => handleDeleteClick(e, q._id)}
                                                        className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-all"
                                                        title="Delete quotation"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <Footer />

            <AlertDialog open={showNameDialog} onOpenChange={setShowNameDialog}>
                <AlertDialogContent className="border-emerald-200 dark:border-emerald-800">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <AlertDialogTitle className="text-emerald-700 dark:text-emerald-400 text-xl">
                                Name Your Quotation
                            </AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-muted-foreground">
                            Please enter a name for this quotation to identify it later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Label htmlFor="quotation-name" className="mb-2 block text-sm font-medium">
                            Quotation Name
                        </Label>
                        <Input
                            id="quotation-name"
                            value={newQuotationName}
                            onChange={(e) => setNewQuotationName(e.target.value)}
                            placeholder="e.g., Solar Installation - Client X"
                            autoFocus
                            className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setShowNameDialog(false)}
                            className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={createQuotation}
                            disabled={!newQuotationName.trim()}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Quotation
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">Delete Quotation?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the quotation and all its data from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteId(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={deleteQuotation}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
