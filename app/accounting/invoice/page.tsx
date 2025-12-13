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
                                <p className="text-muted-foreground">No invoices found. Create your first one!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {invoices.map((inv) => (
                                    <Link key={inv._id} href={`/accounting/invoice/${inv._id}`}>
                                        <Card className="group h-full p-6 hover:shadow-md transition-shadow cursor-pointer flex flex-col border-l-4 border-l-cyan-500">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-2 rounded-md bg-cyan-100 text-cyan-700">
                                                    <Banknote className="w-4 h-4" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(inv.updatedAt).toLocaleDateString()}
                                                    </span>
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
                                            <h3 className="font-bold mb-1 text-lg">{inv.invoiceNumber}</h3>
                                            <p className="text-sm font-medium text-slate-600 mb-3 truncate">
                                                {inv.clientDetails?.name || "Unknown Client"}
                                            </p>

                                            <div className="flex items-center gap-1 text-sm font-bold text-emerald-600 mt-auto">
                                                <IndianRupee className="w-3 h-3" />
                                                {inv.financials?.grandTotal?.toLocaleString('en-IN') || "0.00"}
                                            </div>

                                            <div className="text-xs text-muted-foreground mt-4 pt-4 border-t flex justify-between">
                                                <span>{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : 'No Date'}</span>
                                                <span className="font-mono">#{inv._id.slice(-6)}</span>
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
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>New Invoice Details</AlertDialogTitle>
                        <AlertDialogDescription>
                            Confirm the invoice number to get started. You can change this later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Label htmlFor="invoice-no" className="mb-2 block">Invoice Number</Label>
                        <Input
                            id="invoice-no"
                            value={newInvoiceNumber}
                            onChange={(e) => setNewInvoiceNumber(e.target.value)}
                            placeholder="INV-XXXX"
                            autoFocus
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowNameDialog(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={createInvoice}
                            disabled={!newInvoiceNumber.trim()}
                        >
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
