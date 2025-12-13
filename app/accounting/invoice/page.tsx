'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { ArrowLeft, Sparkles, FileEdit, Zap, Plus, Loader2, Banknote, IndianRupee, Trash2 } from "lucide-react";
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

export default function InvoiceDashboard() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showNameDialog, setShowNameDialog] = useState(false);
    const [newInvoiceNumber, setNewInvoiceNumber] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleCreateClick = () => {
        // Auto-generate a potential invoice number or let user edit
        const nextNum = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
        setNewInvoiceNumber(nextNum);
        setShowNameDialog(true);
    };

    const createInvoice = async () => {
        if (!newInvoiceNumber.trim()) return;

        setIsCreating(true);
        setShowNameDialog(false);

        try {
            const response = await fetch('/api/invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceNumber: newInvoiceNumber
                })
            });

            if (response.ok) {
                const data = await response.json();
                router.push(`/accounting/invoice/${data.invoice._id}`);
            } else {
                console.error("Failed to create", response.status);
                setIsCreating(false);
            }
        } catch (error) {
            console.error("Error creating invoice:", error);
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


    return (
        <div className="flex min-h-screen flex-col">
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

                        {/* Creation Card */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="col-span-1 md:col-span-2"
                            >
                                {/* Make it span full width if only one option, or add more options like "Quote to Invoice" later */}
                                <Card className="relative overflow-hidden border-2 border-border/50 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl group cursor-pointer h-full"
                                    onClick={() => !isCreating && handleCreateClick()}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative p-8 flex flex-col md:flex-row items-center gap-6">
                                        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 group-hover:scale-110 transition-transform flex-shrink-0">
                                            {isCreating ? <Loader2 className="w-10 h-10 text-white animate-spin" /> : <Plus className="w-10 h-10 text-white" />}
                                        </div>

                                        <div className="flex-grow text-center md:text-left">
                                            <h3 className="text-2xl font-bold mb-2 text-cyan-700">
                                                Create New Invoice
                                            </h3>
                                            <p className="text-muted-foreground">
                                                Start a fresh invoice from scratch using our smart editor.
                                            </p>
                                        </div>

                                        <Button
                                            className="w-full md:w-auto bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 group-hover:shadow-lg transition-all"
                                            size="lg"
                                            disabled={isCreating}
                                        >
                                            Create Now
                                            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
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

            <AlertDialog open={showNameDialog} onOpenChange={setShowNameDialog}>
                <AlertDialogContent className="border-cyan-200 dark:border-cyan-800">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
                                <Banknote className="w-5 h-5 text-white" />
                            </div>
                            <AlertDialogTitle className="text-cyan-700 dark:text-cyan-400 text-xl">
                                Create New Invoice
                            </AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-muted-foreground">
                            Confirm the invoice number to get started. You can change this later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Label htmlFor="invoice-no" className="mb-2 block text-sm font-medium">
                            Invoice Number
                        </Label>
                        <Input
                            id="invoice-no"
                            value={newInvoiceNumber}
                            onChange={(e) => setNewInvoiceNumber(e.target.value)}
                            placeholder="INV-XXXX"
                            autoFocus
                            className="border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500"
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
                            onClick={createInvoice}
                            disabled={!newInvoiceNumber.trim()}
                            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Invoice
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
