'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { ArrowLeft, Sparkles, FileEdit, Plus, Loader2, Banknote, IndianRupee, Trash2, FileText, ArrowRight, Check, Wand2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Quotation {
    _id: string;
    title: string;
    updatedAt: string;
    companyDetails?: {
        name?: string;
    };
}

export default function InvoiceDashboard() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showNameDialog, setShowNameDialog] = useState(false);
    const [newInvoiceNumber, setNewInvoiceNumber] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Quotation-to-Invoice state
    const [creationMode, setCreationMode] = useState<'fresh' | 'from-quotation'>('fresh');
    const [selectedQuotationId, setSelectedQuotationId] = useState<string>('');
    const [useAI, setUseAI] = useState(true);
    const [isLoadingQuotations, setIsLoadingQuotations] = useState(false);

    // AI Processing Progress State
    const [showProgress, setShowProgress] = useState(false);
    const [progressPercent, setProgressPercent] = useState(0);
    const [progressStatus, setProgressStatus] = useState('');

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const response = await fetch('/api/invoice');
                if (response.ok) {
                    const data = await response.json();
                    setInvoices(data.invoices);
                }
            } catch (error) {
                console.error("Error fetching invoices:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInvoices();
    }, []);

    // Fetch quotations when creation mode changes to from-quotation
    useEffect(() => {
        if (creationMode === 'from-quotation' && quotations.length === 0) {
            fetchQuotations();
        }
    }, [creationMode]);

    const fetchQuotations = async () => {
        setIsLoadingQuotations(true);
        try {
            const response = await fetch('/api/techno-quotation');
            if (response.ok) {
                const data = await response.json();
                setQuotations(data.quotations || []);
            }
        } catch (error) {
            console.error("Error fetching quotations:", error);
        } finally {
            setIsLoadingQuotations(false);
        }
    };

    const handleCreateClick = (mode: 'fresh' | 'from-quotation') => {
        const nextNum = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
        setNewInvoiceNumber(nextNum);
        setCreationMode(mode);
        setSelectedQuotationId('');
        setUseAI(true);
        setShowNameDialog(true);

        if (mode === 'from-quotation') {
            fetchQuotations();
        }
    };

    // Simulate progress animation
    const animateProgress = (onComplete: () => void) => {
        setShowProgress(true);
        setProgressPercent(0);

        const steps = [
            { percent: 15, status: 'Reading quotation data...' },
            { percent: 30, status: 'Extracting client information...' },
            { percent: 50, status: 'Analyzing items and pricing...' },
            { percent: 70, status: 'AI transforming to invoice format...' },
            { percent: 85, status: 'Calculating taxes and totals...' },
            { percent: 95, status: 'Creating invoice document...' },
            { percent: 100, status: 'Complete!' }
        ];

        let stepIndex = 0;
        const interval = setInterval(() => {
            if (stepIndex < steps.length) {
                setProgressPercent(steps[stepIndex].percent);
                setProgressStatus(steps[stepIndex].status);
                stepIndex++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    onComplete();
                }, 500);
            }
        }, 400);

        return interval;
    };

    const createInvoice = async () => {
        if (!newInvoiceNumber.trim()) return;

        // Validate quotation selection if from-quotation mode
        if (creationMode === 'from-quotation' && !selectedQuotationId) {
            return; // Don't proceed without quotation selection
        }

        setIsCreating(true);
        setShowNameDialog(false);

        try {
            let response;

            if (creationMode === 'from-quotation' && selectedQuotationId) {
                // Show progress animation for AI processing
                if (useAI) {
                    setShowProgress(true);
                    setProgressPercent(0);
                    setProgressStatus('Initializing AI...');
                }

                const progressPromise = new Promise<void>((resolve) => {
                    if (useAI) {
                        animateProgress(resolve);
                    } else {
                        resolve();
                    }
                });

                // Start API call
                const apiPromise = fetch('/api/invoice/from-quotation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        quotationId: selectedQuotationId,
                        invoiceNumber: newInvoiceNumber,
                        useAI: useAI
                    })
                });

                // Wait for both animation and API to complete
                const [_, apiResponse] = await Promise.all([progressPromise, apiPromise]);
                response = apiResponse;
            } else {
                // Create fresh invoice
                response = await fetch('/api/invoice', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        invoiceNumber: newInvoiceNumber
                    })
                });
            }

            if (response.ok) {
                const data = await response.json();
                setShowProgress(false);
                router.push(`/accounting/invoice/${data.invoice._id}`);
            } else {
                console.error("Failed to create", response.status);
                setShowProgress(false);
                setIsCreating(false);
            }
        } catch (error) {
            console.error("Error creating invoice:", error);
            setShowProgress(false);
            setIsCreating(false);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteId(id);
    };

    const deleteInvoice = async () => {
        if (!deleteId) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/invoice/${deleteId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setInvoices(prev => prev.filter(inv => inv._id !== deleteId));
            } else {
                console.error("Failed to delete", response.status);
            }
        } catch (error) {
            console.error("Error deleting invoice:", error);
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    const selectedQuotation = quotations.find(q => q._id === selectedQuotationId);

    return (
        <div className="flex min-h-screen flex-col">
            {/* AI Processing Progress Overlay */}
            <AnimatePresence>
                {showProgress && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-gradient-to-br from-purple-900/90 to-indigo-900/90 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg">
                                    <Sparkles className="w-6 h-6 text-white animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">AI Processing</h3>
                                    <p className="text-sm text-purple-200">Transforming quotation to invoice</p>
                                </div>
                            </div>

                            {/* Progress Percentage */}
                            <div className="text-center mb-4">
                                <motion.span
                                    key={progressPercent}
                                    initial={{ scale: 1.2, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-6xl font-bold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent"
                                >
                                    {progressPercent}%
                                </motion.span>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative h-3 bg-purple-900/50 rounded-full overflow-hidden mb-4 border border-purple-500/30">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 rounded-full"
                                    style={{ backgroundSize: '200% 100%' }}
                                />
                                {/* Shimmer effect */}
                                <motion.div
                                    animate={{ x: ['0%', '100%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                />
                            </div>

                            {/* Status Text */}
                            <motion.div
                                key={progressStatus}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-center gap-2"
                            >
                                {progressPercent < 100 ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
                                ) : (
                                    <Check className="w-4 h-4 text-green-400" />
                                )}
                                <span className={`text-sm ${progressPercent === 100 ? 'text-green-400 font-medium' : 'text-purple-200'}`}>
                                    {progressStatus}
                                </span>
                            </motion.div>

                            {/* Decorative elements */}
                            <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-2xl" />
                            <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-2xl" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Navbar />

            <main className="flex-1 bg-gradient-to-br from-cyan-500/10 via-background to-blue-500/10">
                {/* Header */}
                <section className="py-12 border-b">
                    <div className="container px-4">
                        <Link href="/accounting" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Accounting
                        </Link>
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                    Invoice System
                                </h1>
                                <p className="text-lg text-muted-foreground">
                                    Create and manage professional invoices
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Content */}
                <section className="py-8">
                    <div className="container px-4">

                        {/* Creation Cards - Two Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-16">
                            {/* Fresh Invoice Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Card
                                    className="relative overflow-hidden border-2 border-border/50 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl group cursor-pointer h-full"
                                    onClick={() => !isCreating && handleCreateClick('fresh')}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative p-6 flex flex-col h-full">
                                        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4 group-hover:scale-110 transition-transform">
                                            {isCreating && creationMode === 'fresh' ? <Loader2 className="w-7 h-7 text-white animate-spin" /> : <Plus className="w-7 h-7 text-white" />}
                                        </div>

                                        <h3 className="text-xl font-bold mb-2 text-cyan-700 dark:text-cyan-400">
                                            Create Fresh Invoice
                                        </h3>
                                        <p className="text-muted-foreground text-sm mb-4 flex-grow">
                                            Start from scratch and build your invoice manually with our powerful editor.
                                        </p>

                                        <div className="space-y-1.5 mb-4">
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mr-2" />
                                                Full control over details
                                            </div>
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mr-2" />
                                                Add items manually
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 group-hover:shadow-lg transition-all"
                                            disabled={isCreating}
                                        >
                                            Start Fresh
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>

                            {/* From Quotation Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Card
                                    className="relative overflow-hidden border-2 border-border/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl group cursor-pointer h-full"
                                    onClick={() => !isCreating && handleCreateClick('from-quotation')}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    {/* AI Badge */}
                                    <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        AI Powered
                                    </div>

                                    <div className="relative p-6 flex flex-col h-full">
                                        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                                            {isCreating && creationMode === 'from-quotation' ? <Loader2 className="w-7 h-7 text-white animate-spin" /> : <FileText className="w-7 h-7 text-white" />}
                                        </div>

                                        <h3 className="text-xl font-bold mb-2 text-purple-700 dark:text-purple-400">
                                            Create from Quotation
                                        </h3>
                                        <p className="text-muted-foreground text-sm mb-4 flex-grow">
                                            Select an existing quotation and let AI transform it into a professional invoice.
                                        </p>

                                        <div className="space-y-1.5 mb-4">
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2" />
                                                AI-powered transformation
                                            </div>
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2" />
                                                Auto-extract items & client details
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 group-hover:shadow-lg transition-all"
                                            disabled={isCreating}
                                        >
                                            <Wand2 className="w-4 h-4 mr-2" />
                                            Use Quotation
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Recent Invoices */}
                        <h2 className="text-xl font-semibold mb-4">Recent Invoices</h2>

                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                            </div>
                        ) : invoices.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-background/50">
                                <Banknote className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                                <p className="text-muted-foreground">No invoices found. Create your first one!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                                {invoices.map((inv) => (
                                    <Link key={inv._id} href={`/accounting/invoice/${inv._id}`}>
                                        <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-cyan-500/50 cursor-pointer h-full">
                                            {/* Preview Thumbnail - Mini Invoice Preview */}
                                            <div className="relative h-32 bg-white dark:bg-gray-900 border-b overflow-hidden">
                                                {/* Mini Document */}
                                                <div className="absolute inset-1 bg-gray-50 dark:bg-gray-800 rounded shadow-sm border border-gray-200 dark:border-gray-700 p-2 text-[6px] leading-tight overflow-hidden">
                                                    {/* Header */}
                                                    <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-gray-200 dark:border-gray-600">
                                                        <div className="flex items-center gap-1.5">
                                                            {inv.companyDetails?.logo ? (
                                                                <img src={inv.companyDetails.logo} alt="" className="w-4 h-4 object-contain rounded" />
                                                            ) : (
                                                                <div className="w-4 h-4 rounded bg-cyan-400 dark:bg-cyan-600" />
                                                            )}
                                                            <div className="truncate font-bold text-gray-700 dark:text-gray-300">
                                                                {inv.companyDetails?.name || 'Company'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Invoice Number */}
                                                    <div className="text-center font-bold text-cyan-600 dark:text-cyan-400 mb-1 truncate text-[7px]">
                                                        {inv.invoiceNumber}
                                                    </div>
                                                    {/* Items Preview */}
                                                    <div className="space-y-0.5 text-gray-500 dark:text-gray-400">
                                                        {inv.items?.slice(0, 2).map((item: any, idx: number) => (
                                                            <div key={idx} className="truncate flex justify-between">
                                                                <span>{item.description || 'Item'}</span>
                                                                <span className="text-gray-400">₹{item.rate || 0}</span>
                                                            </div>
                                                        )) || (
                                                                <>
                                                                    <div className="h-1.5 w-full rounded bg-gray-200 dark:bg-gray-700" />
                                                                    <div className="h-1.5 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
                                                                </>
                                                            )}
                                                    </div>
                                                    {/* Total at bottom */}
                                                    <div className="absolute bottom-2 right-2 text-[8px] font-bold text-cyan-600 dark:text-cyan-400">
                                                        ₹{inv.financials?.grandTotal?.toLocaleString('en-IN') || '0'}
                                                    </div>
                                                </div>
                                                {/* Status Badge */}
                                                <div className="absolute top-2 right-2 p-1.5 rounded-md shadow-sm bg-cyan-500">
                                                    <Banknote className="w-3 h-3 text-white" />
                                                </div>
                                                {/* Source Quotation Indicator */}
                                                {inv.sourceQuotationId && (
                                                    <div className="absolute top-2 left-2 p-1 rounded-md shadow-sm bg-purple-500" title="Created from quotation">
                                                        <FileText className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Card Content */}
                                            <div className="p-4">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-sm mb-1.5 line-clamp-1 group-hover:text-cyan-600 transition-colors">
                                                            {inv.invoiceNumber}
                                                        </h3>
                                                        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                                                            {inv.clientDetails?.name || 'No client set'}
                                                        </p>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1 text-sm font-bold text-emerald-600">
                                                                <IndianRupee className="w-3 h-3" />
                                                                {inv.financials?.grandTotal?.toLocaleString('en-IN') || '0'}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {new Date(inv.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={(e) => handleDeleteClick(e, inv._id)}
                                                        className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-all"
                                                        title="Delete invoice"
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

            {/* Create Invoice Dialog */}
            <AlertDialog open={showNameDialog} onOpenChange={setShowNameDialog}>
                <AlertDialogContent className={`border-2 ${creationMode === 'from-quotation' ? 'border-purple-200 dark:border-purple-800' : 'border-cyan-200 dark:border-cyan-800'} max-w-lg`}>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${creationMode === 'from-quotation' ? 'from-purple-500 to-pink-500' : 'from-cyan-500 to-blue-500'}`}>
                                {creationMode === 'from-quotation' ? <FileText className="w-5 h-5 text-white" /> : <Banknote className="w-5 h-5 text-white" />}
                            </div>
                            <AlertDialogTitle className={`${creationMode === 'from-quotation' ? 'text-purple-700 dark:text-purple-400' : 'text-cyan-700 dark:text-cyan-400'} text-xl`}>
                                {creationMode === 'from-quotation' ? 'Create Invoice from Quotation' : 'Create New Invoice'}
                            </AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-muted-foreground">
                            {creationMode === 'from-quotation'
                                ? 'Select a quotation and let AI transform it into an invoice.'
                                : 'Enter an invoice number to get started. You can change this later.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="py-4 space-y-4">
                        {/* Invoice Number */}
                        <div>
                            <Label htmlFor="invoice-no" className="mb-2 block text-sm font-medium">
                                Invoice Number
                            </Label>
                            <Input
                                id="invoice-no"
                                value={newInvoiceNumber}
                                onChange={(e) => setNewInvoiceNumber(e.target.value)}
                                placeholder="INV-XXXX"
                                className={`${creationMode === 'from-quotation' ? 'border-purple-200 focus:border-purple-500 focus:ring-purple-500' : 'border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500'}`}
                            />
                        </div>

                        {/* Quotation Selection (only for from-quotation mode) */}
                        {creationMode === 'from-quotation' && (
                            <>
                                <div>
                                    <Label className="mb-2 block text-sm font-medium">
                                        Select Quotation
                                    </Label>
                                    {isLoadingQuotations ? (
                                        <div className="flex items-center justify-center py-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                                            <Loader2 className="w-5 h-5 animate-spin text-purple-500 mr-2" />
                                            <span className="text-sm text-muted-foreground">Loading quotations...</span>
                                        </div>
                                    ) : quotations.length === 0 ? (
                                        <div className="text-center py-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                                            <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                                            <p className="text-sm text-muted-foreground">No quotations found.</p>
                                            <Link href="/accounting/techno-quotation" className="text-sm text-purple-600 hover:underline">
                                                Create a quotation first
                                            </Link>
                                        </div>
                                    ) : (
                                        <Select value={selectedQuotationId} onValueChange={setSelectedQuotationId}>
                                            <SelectTrigger className="border-purple-200 focus:border-purple-500 focus:ring-purple-500">
                                                <SelectValue placeholder="Choose a quotation..." />
                                            </SelectTrigger>
                                            <SelectContent 
                                                className="max-w-[400px] max-h-[300px] z-[100]" 
                                                position="popper"
                                                side="bottom"
                                                sideOffset={4}
                                            >
                                                {quotations.map((q) => (
                                                    <SelectItem key={q._id} value={q._id}>
                                                        <div className="flex items-center gap-2 max-w-[350px]">
                                                            <FileText className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                                            <div className="min-w-0 flex-1">
                                                                <span className="font-medium block truncate" title={q.title}>
                                                                    {q.title.length > 40 ? q.title.substring(0, 40) + '...' : q.title}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    ({new Date(q.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })})
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>

                                {/* Selected Quotation Preview */}
                                {selectedQuotation && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
                                    >
                                        <div className="flex items-center gap-2 mb-1 min-w-0">
                                            <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                            <span className="text-sm font-medium text-purple-700 dark:text-purple-300 truncate" title={selectedQuotation.title}>
                                                Selected: {selectedQuotation.title.length > 35 ? selectedQuotation.title.substring(0, 35) + '...' : selectedQuotation.title}
                                            </span>
                                        </div>
                                        <p className="text-xs text-purple-600/70 dark:text-purple-400/70 truncate">
                                            {selectedQuotation.companyDetails?.name || 'Company details will be imported'}
                                        </p>
                                    </motion.div>
                                )}

                                {/* AI Toggle */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-purple-600" />
                                        <div>
                                            <Label htmlFor="use-ai" className="text-sm font-medium cursor-pointer">
                                                Use AI Enhancement
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                Let Gemini AI intelligently parse quotation data
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        id="use-ai"
                                        checked={useAI}
                                        onCheckedChange={setUseAI}
                                        className="data-[state=checked]:bg-purple-600"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setShowNameDialog(false)}
                            className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={createInvoice}
                            disabled={!newInvoiceNumber.trim() || (creationMode === 'from-quotation' && !selectedQuotationId)}
                            className={`bg-gradient-to-r ${creationMode === 'from-quotation'
                                ? 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                                : 'from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {creationMode === 'from-quotation' ? (
                                <>
                                    <Wand2 className="w-4 h-4 mr-2" />
                                    Transform & Create
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Invoice
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">Delete Invoice?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the invoice and all its data from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteId(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={deleteInvoice}
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
