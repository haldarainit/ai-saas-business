'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { ArrowLeft, Sparkles, FileEdit, Zap, Plus, Loader2, Trash2, Check } from "lucide-react";
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

    // AI Wizard State
    const [showAIWizard, setShowAIWizard] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [aiAnswers, setAiAnswers] = useState<Record<string, string>>({});

    // 12 AI Questions for Quotation Generation
    const aiQuestions = [
        {
            id: 'company_name',
            question: 'What is your Company Name?',
            placeholder: 'e.g., XYZ Engineering Pvt Ltd',
            type: 'text',
            required: true
        },
        {
            id: 'company_address',
            question: 'What is your Company Address?',
            placeholder: 'e.g., Plot No. 123, Industrial Area, City, State - 560001',
            type: 'textarea',
            required: false
        },
        {
            id: 'company_contact',
            question: 'Company Contact Details (Phone & Email)?',
            placeholder: 'e.g., +91-9876543210, info@company.com',
            type: 'textarea',
            required: false
        },
        {
            id: 'client_name',
            question: 'Who is the Client / Customer?',
            placeholder: 'e.g., ABC Industries Ltd',
            type: 'text',
            required: true
        },
        {
            id: 'client_contact',
            question: 'Client Contact Person & Designation?',
            placeholder: 'e.g., Mr. Sharma, Purchase Manager',
            type: 'text',
            required: false
        },
        {
            id: 'client_address',
            question: 'Client Address?',
            placeholder: 'e.g., 456 Business Park, Mumbai - 400001',
            type: 'textarea',
            required: false
        },
        {
            id: 'project_subject',
            question: 'Subject / Title of the Quotation?',
            placeholder: 'e.g., Supply and Installation of 500KVA Control Panel',
            type: 'text',
            required: true
        },
        {
            id: 'project_description',
            question: 'Describe the Project / Work',
            placeholder: 'e.g., This project involves supply, installation and commissioning of electrical control panels for the new manufacturing unit...',
            type: 'textarea',
            required: true
        },
        {
            id: 'scope_of_work',
            question: 'What is the Scope of Work / Services?',
            placeholder: 'e.g., 1. Design and engineering\n2. Manufacturing of panels\n3. Transportation\n4. Installation and commissioning\n5. Testing and documentation',
            type: 'textarea',
            required: true
        },
        {
            id: 'items_boq',
            question: 'List the Items / Bill of Quantities',
            placeholder: 'e.g.:\n- Main Control Panel 500KVA - 2 Nos\n- Motor Control Center - 5 Nos\n- Cable Tray 100mm - 200 Meters\n- Installation Charges - 1 Lot',
            type: 'textarea',
            required: true
        },
        {
            id: 'technical_specs',
            question: 'Any Technical Specifications?',
            placeholder: 'e.g., All equipment shall conform to IS standards. IP65 protection rating required. Operating voltage: 415V, 50Hz...',
            type: 'textarea',
            required: false
        },
        {
            id: 'terms_conditions',
            question: 'Terms & Conditions (Payment, Delivery, Warranty)?',
            placeholder: 'e.g.:\n- Payment: 50% advance, 50% on delivery\n- Delivery: 6-8 weeks from PO\n- Warranty: 12 months\n- Validity: 30 days\n- GST: As applicable',
            type: 'textarea',
            required: false
        }
    ];

    // AI Processing Progress State
    const [showProgress, setShowProgress] = useState(false);
    const [progressPercent, setProgressPercent] = useState(0);
    const [progressStatus, setProgressStatus] = useState('');

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
        if (type === 'automated') {
            // Open AI Wizard for automated quotation
            setShowAIWizard(true);
            setCurrentStep(0);
            setAiAnswers({});
        } else {
            // Manual quotation - show name dialog
            setPendingType(type);
            setNewQuotationName('');
            setShowNameDialog(true);
        }
    };

    // AI Wizard Navigation
    const handleNextStep = () => {
        if (currentStep < aiQuestions.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleAnswerChange = (value: string) => {
        setAiAnswers(prev => ({
            ...prev,
            [aiQuestions[currentStep].id]: value
        }));
    };

    const canProceed = () => {
        const currentQ = aiQuestions[currentStep];
        if (currentQ.required) {
            return (aiAnswers[currentQ.id] || '').trim().length > 0;
        }
        return true;
    };

    const handleGenerateWithAI = async () => {
        // Validate required fields
        const missingRequired = aiQuestions.filter(q => q.required && !(aiAnswers[q.id] || '').trim());
        if (missingRequired.length > 0) {
            alert(`Please fill in required fields: ${missingRequired.map(q => q.question).join(', ')}`);
            return;
        }

        setShowAIWizard(false);
        setIsCreating(true);
        setShowProgress(true);
        setProgressPercent(0);
        setProgressStatus('Initializing AI...');

        try {
            const progressPromise = new Promise<void>((resolve) => {
                animateProgress(resolve);
            });

            // Generate quotation with AI using the answers
            const apiPromise = fetch('/api/generate-quotation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: aiAnswers })
            });

            const [_, response] = await Promise.all([progressPromise, apiPromise]);

            if (response.ok) {
                const result = await response.json();

                if (result.success) {
                    // Create the quotation with AI-generated content
                    const createResponse = await fetch('/api/techno-quotation', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'automated',
                            title: aiAnswers.project_subject || 'AI Generated Quotation',
                            aiData: result.quotation,
                            answers: aiAnswers
                        })
                    });

                    if (createResponse.ok) {
                        const data = await createResponse.json();
                        setShowProgress(false);
                        router.push(`/accounting/techno-quotation/${data.quotation._id}`);
                    } else {
                        throw new Error('Failed to create quotation');
                    }
                } else {
                    throw new Error(result.error || 'AI generation failed');
                }
            } else {
                throw new Error('API request failed');
            }
        } catch (error) {
            console.error('Error generating quotation:', error);
            alert('Failed to generate quotation. Please try again.');
            setShowProgress(false);
            setIsCreating(false);
        }
    };


    // Simulate progress animation for automated quotation
    const animateProgress = (onComplete: () => void) => {
        setShowProgress(true);
        setProgressPercent(0);

        const steps = [
            { percent: 15, status: 'Initializing AI engine...' },
            { percent: 30, status: 'Analyzing requirements...' },
            { percent: 50, status: 'Generating quotation content...' },
            { percent: 70, status: 'Creating sections and tables...' },
            { percent: 85, status: 'Formatting document...' },
            { percent: 95, status: 'Finalizing quotation...' },
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

    const createQuotation = async () => {
        if (!pendingType || !newQuotationName.trim()) return;

        setIsCreating(true);
        setShowNameDialog(false);

        try {
            // Show progress animation for automated AI quotation
            if (pendingType === 'automated') {
                setShowProgress(true);
                setProgressPercent(0);
                setProgressStatus('Initializing AI...');

                const progressPromise = new Promise<void>((resolve) => {
                    animateProgress(resolve);
                });

                const apiPromise = fetch('/api/techno-quotation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: pendingType,
                        title: newQuotationName
                    })
                });

                // Wait for both animation and API to complete
                const [_, response] = await Promise.all([progressPromise, apiPromise]);

                if (response.ok) {
                    const data = await response.json();
                    setShowProgress(false);
                    router.push(`/accounting/techno-quotation/${data.quotation._id}`);
                } else {
                    console.error("Failed to create", response.status);
                    setShowProgress(false);
                    setIsCreating(false);
                }
            } else {
                // Manual quotation - no progress animation
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
                    console.error("Failed to create", response.status);
                    setIsCreating(false);
                }
            }
        } catch (error) {
            console.error("Error creating quotation:", error);
            setShowProgress(false);
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
                            className="bg-gradient-to-br from-teal-900/90 to-emerald-900/90 border border-teal-500/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-lg">
                                    <Sparkles className="w-6 h-6 text-white animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">AI Processing</h3>
                                    <p className="text-sm text-teal-200">Generating your quotation</p>
                                </div>
                            </div>

                            {/* Progress Percentage */}
                            <div className="text-center mb-4">
                                <motion.span
                                    key={progressPercent}
                                    initial={{ scale: 1.2, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-6xl font-bold bg-gradient-to-r from-teal-300 to-emerald-300 bg-clip-text text-transparent"
                                >
                                    {progressPercent}%
                                </motion.span>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative h-3 bg-teal-900/50 rounded-full overflow-hidden mb-4 border border-teal-500/30">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 rounded-full"
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
                                    <Loader2 className="w-4 h-4 animate-spin text-teal-300" />
                                ) : (
                                    <Check className="w-4 h-4 text-green-400" />
                                )}
                                <span className={`text-sm ${progressPercent === 100 ? 'text-green-400 font-medium' : 'text-teal-200'}`}>
                                    {progressStatus}
                                </span>
                            </motion.div>

                            {/* Decorative elements */}
                            <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-2xl" />
                            <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-teal-500/20 to-transparent rounded-full blur-2xl" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Wizard Overlay */}
            <AnimatePresence>
                {showAIWizard && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-background border border-teal-500/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
                        >
                            {/* Wizard Header */}
                            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                                            <Sparkles className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">AI Quotation Generator</h2>
                                            <p className="text-sm text-teal-100">Answer questions to generate your quotation</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAIWizard(false)}
                                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-6">
                                    <div className="flex justify-between text-xs text-teal-100 mb-2">
                                        <span>Question {currentStep + 1} of {aiQuestions.length}</span>
                                        <span>{Math.round(((currentStep + 1) / aiQuestions.length) * 100)}% Complete</span>
                                    </div>
                                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-white rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${((currentStep + 1) / aiQuestions.length) * 100}%` }}
                                            transition={{ duration: 0.3, ease: "easeOut" }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Question Content */}
                            <div className="p-8">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="mb-2 flex items-center gap-2">
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                                                Step {currentStep + 1}
                                            </span>
                                            {aiQuestions[currentStep].required && (
                                                <span className="text-xs text-red-500">* Required</span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-semibold mb-4 text-foreground">
                                            {aiQuestions[currentStep].question}
                                        </h3>

                                        {aiQuestions[currentStep].type === 'textarea' ? (
                                            <textarea
                                                value={aiAnswers[aiQuestions[currentStep].id] || ''}
                                                onChange={(e) => handleAnswerChange(e.target.value)}
                                                placeholder={aiQuestions[currentStep].placeholder}
                                                className="w-full h-40 p-4 border rounded-xl bg-background focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none transition-all"
                                                autoFocus
                                            />
                                        ) : (
                                            <Input
                                                value={aiAnswers[aiQuestions[currentStep].id] || ''}
                                                onChange={(e) => handleAnswerChange(e.target.value)}
                                                placeholder={aiQuestions[currentStep].placeholder}
                                                className="w-full p-4 h-14 text-lg border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                                autoFocus
                                            />
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Navigation Footer */}
                            <div className="px-8 pb-8 flex items-center justify-between">
                                <Button
                                    variant="outline"
                                    onClick={handlePrevStep}
                                    disabled={currentStep === 0}
                                    className="gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Previous
                                </Button>

                                {/* Step Indicators */}
                                <div className="flex gap-1.5">
                                    {aiQuestions.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentStep(idx)}
                                            className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentStep
                                                    ? 'bg-teal-500 scale-125'
                                                    : idx < currentStep
                                                        ? 'bg-teal-300 dark:bg-teal-700'
                                                        : 'bg-gray-200 dark:bg-gray-700'
                                                }`}
                                        />
                                    ))}
                                </div>

                                {currentStep === aiQuestions.length - 1 ? (
                                    <Button
                                        onClick={handleGenerateWithAI}
                                        className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white gap-2"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Generate Quotation
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleNextStep}
                                        disabled={!canProceed()}
                                        className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                                    >
                                        Next
                                        <ArrowLeft className="w-4 h-4 rotate-180" />
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
