'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { ArrowLeft, Lightbulb, FileEdit, Cpu, Plus, Loader2, Trash2, Check, Users, FileCheck, ChevronDown, Save, BookOpen, X, Copy, Search, ChevronLeft, ChevronRight } from "lucide-react";
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

    // Search + Pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const ITEMS_PER_PAGE = 12;

    // Duplicate state
    const [isDuplicating, setIsDuplicating] = useState<string | null>(null);

    // AI Wizard State
    const [showAIWizard, setShowAIWizard] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [aiAnswers, setAiAnswers] = useState<Record<string, string>>({});

    // Company Profiles for AI Wizard
    interface CompanyProfile {
        _id: string;
        name: string;
        address1?: string;
        address2?: string;
        phone?: string;
        email?: string;
        logo?: string;
        gstin?: string;
        authorizedSignatory?: string;
        signatoryDesignation?: string;
        isDefault?: boolean;
    }
    const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>([]);
    const [selectedCompanyForWizard, setSelectedCompanyForWizard] = useState<string>('');
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

    // Saved Clients State
    interface SavedClient {
        _id: string;
        name: string;
        company: string;
        designation: string;
        address: string;
        phone: string;
        email: string;
        gstin: string;
    }
    const [savedClients, setSavedClients] = useState<SavedClient[]>([]);
    const [selectedClientForWizard, setSelectedClientForWizard] = useState<string>('');
    const [isLoadingClients, setIsLoadingClients] = useState(false);

    // Saved T&C Presets State
    interface TermsPreset {
        _id: string;
        label: string;
        terms: string[];
        category: string;
        isSystemPreset: boolean;
    }
    const [termsPresets, setTermsPresets] = useState<TermsPreset[]>([]);
    const [selectedTermsPreset, setSelectedTermsPreset] = useState<string>('');
    const [isLoadingTerms, setIsLoadingTerms] = useState(false);
    const [showSaveTermsDialog, setShowSaveTermsDialog] = useState(false);
    const [newTermsLabel, setNewTermsLabel] = useState('');

    // Fetch company profiles on mount
    useEffect(() => {
        const fetchProfiles = async () => {
            setIsLoadingProfiles(true);
            try {
                const res = await fetch('/api/company-profile');
                if (res.ok) {
                    const data = await res.json();
                    setCompanyProfiles(data.profiles || []);
                }
            } catch (error) {
                console.error('Error fetching company profiles:', error);
            } finally {
                setIsLoadingProfiles(false);
            }
        };
        fetchProfiles();
    }, []);

    // Fetch saved clients on mount
    useEffect(() => {
        const fetchClients = async () => {
            setIsLoadingClients(true);
            try {
                const res = await fetch('/api/saved-clients');
                if (res.ok) {
                    const data = await res.json();
                    setSavedClients(data.clients || []);
                }
            } catch (error) {
                console.error('Error fetching saved clients:', error);
            } finally {
                setIsLoadingClients(false);
            }
        };
        fetchClients();
    }, []);

    // Fetch T&C presets on mount
    useEffect(() => {
        const fetchTermsPresets = async () => {
            setIsLoadingTerms(true);
            try {
                const res = await fetch('/api/saved-terms');
                if (res.ok) {
                    const data = await res.json();
                    setTermsPresets(data.presets || []);
                }
            } catch (error) {
                console.error('Error fetching T&C presets:', error);
            } finally {
                setIsLoadingTerms(false);
            }
        };
        fetchTermsPresets();
    }, []);

    // Apply saved client to wizard (toggle select/deselect)
    const applyClientToWizard = (clientId: string) => {
        if (selectedClientForWizard === clientId) {
            setSelectedClientForWizard('');
            setAiAnswers(prev => ({
                ...prev,
                client_name: '',
                client_contact: '',
                client_address: ''
            }));
            return;
        }

        const client = savedClients.find(c => c._id === clientId);
        if (!client) return;

        setSelectedClientForWizard(clientId);
        setAiAnswers(prev => ({
            ...prev,
            client_name: client.company || client.name,
            client_contact: `${client.name}${client.designation ? ', ' + client.designation : ''}`,
            client_address: client.address || ''
        }));
    };

    // Apply T&C preset to wizard (append mode: adds to existing terms)
    const applyTermsPreset = (presetId: string) => {
        if (selectedTermsPreset === presetId) {
            setSelectedTermsPreset('');
            return;
        }

        const preset = termsPresets.find(p => p._id === presetId);
        if (!preset) return;

        setSelectedTermsPreset(presetId);
        setAiAnswers(prev => {
            const existing = (prev.terms_conditions || '').trim();
            const newTerms = preset.terms.join('\n');
            return {
                ...prev,
                terms_conditions: existing ? existing + '\n' + newTerms : newTerms
            };
        });
    };

    // Auto-save client details after quotation generation
    const autoSaveClient = async (answers: Record<string, string>) => {
        const clientName = answers.client_name?.trim();
        const clientContact = answers.client_contact?.trim();
        const clientAddress = answers.client_address?.trim();

        if (!clientName) return;

        try {
            // Parse contact person and designation
            const contactParts = (clientContact || '').split(',').map(s => s.trim());
            const contactPerson = contactParts[0] || '';
            const designation = contactParts.slice(1).join(', ') || '';

            await fetch('/api/saved-clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company: clientName,
                    name: contactPerson,
                    designation,
                    address: clientAddress
                })
            });
            // Refresh clients list
            const res = await fetch('/api/saved-clients');
            if (res.ok) {
                const data = await res.json();
                setSavedClients(data.clients || []);
            }
        } catch (error) {
            console.error('Error auto-saving client:', error);
        }
    };

    // Save current terms as custom preset
    const saveCurrentTermsAsPreset = async () => {
        const termsText = aiAnswers.terms_conditions?.trim();
        if (!termsText || !newTermsLabel.trim()) return;

        try {
            const termsItems = termsText.split('\n').map((s: string) => s.trim()).filter(Boolean);
            const res = await fetch('/api/saved-terms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    label: newTermsLabel.trim(),
                    terms: termsItems,
                    category: 'custom'
                })
            });
            if (res.ok) {
                // Refresh presets
                const fetchRes = await fetch('/api/saved-terms');
                if (fetchRes.ok) {
                    const data = await fetchRes.json();
                    setTermsPresets(data.presets || []);
                }
                setShowSaveTermsDialog(false);
                setNewTermsLabel('');
            }
        } catch (error) {
            console.error('Error saving T&C preset:', error);
        }
    };

    // Apply selected company to wizard answers (toggle select/deselect)
    const applyCompanyToWizard = (profileId: string) => {
        // If already selected, deselect and clear fields
        if (selectedCompanyForWizard === profileId) {
            setSelectedCompanyForWizard('');
            setAiAnswers(prev => ({
                ...prev,
                company_name: '',
                company_address: '',
                company_contact: ''
            }));
            return;
        }

        const profile = companyProfiles.find(p => p._id === profileId);
        if (!profile) return;

        setSelectedCompanyForWizard(profileId);
        setAiAnswers(prev => ({
            ...prev,
            company_name: profile.name,
            company_address: `${profile.address1 || ''}${profile.address2 ? '\n' + profile.address2 : ''}`,
            company_contact: `${profile.phone || ''}${profile.email ? ', ' + profile.email : ''}`
        }));
    };


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

    const fetchQuotations = async (page = 1, search = '') => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(ITEMS_PER_PAGE),
                search
            });
            const response = await fetch(`/api/techno-quotation?${params}`);
            if (response.ok) {
                const data = await response.json();
                setQuotations(data.quotations || []);
                setTotalPages(data.pagination?.pages || 1);
                setTotalCount(data.pagination?.total || 0);
                setCurrentPage(page);
            }
        } catch (error) {
            console.error("Error fetching quotations:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchQuotations(1, ''); }, []);

    // Debounce search input by 400ms
    useEffect(() => {
        const t = setTimeout(() => {
            setSearchQuery(searchInput);
            fetchQuotations(1, searchInput);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const duplicateQuotation = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDuplicating(id);
        try {
            const res = await fetch(`/api/techno-quotation/${id}`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                router.push(`/accounting/techno-quotation/${data.quotation._id}`);
            }
        } catch (error) {
            console.error('Error duplicating quotation:', error);
        } finally {
            setIsDuplicating(null);
        }
    };

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
                        // Auto-save client details for future use
                        autoSaveClient(aiAnswers);
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
                fetchQuotations(currentPage, searchQuery);
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
                                    <Lightbulb className="w-6 h-6 text-white animate-pulse" />
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
                                            <Lightbulb className="w-6 h-6" />
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

                                        {/* Company selector on first step */}
                                        {aiQuestions[currentStep].id === 'company_name' && companyProfiles.length > 0 && (
                                            <div className="mb-4 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                                                <p className="text-sm font-medium text-teal-700 dark:text-teal-300 mb-2">
                                                    Select from saved companies (click again to deselect):
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {companyProfiles.map((profile) => (
                                                        <button
                                                            key={profile._id}
                                                            onClick={() => applyCompanyToWizard(profile._id)}
                                                            className={`px-3 py-1.5 text-sm rounded-lg border transition-all flex items-center gap-1.5 ${selectedCompanyForWizard === profile._id
                                                                ? 'bg-teal-600 text-white border-teal-600'
                                                                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-teal-500'
                                                                }`}
                                                        >
                                                            {selectedCompanyForWizard === profile._id && (
                                                                <Check className="w-3.5 h-3.5" />
                                                            )}
                                                            {profile.name}
                                                            {profile.isDefault && (
                                                                <span className="ml-1 text-xs opacity-75">(Default)</span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    {selectedCompanyForWizard ? 'Company selected! Click again to deselect and enter manually.' : 'Or enter new company details below:'}
                                                </p>
                                            </div>
                                        )}

                                        {/* Saved clients selector on client_name step */}
                                        {aiQuestions[currentStep].id === 'client_name' && savedClients.length > 0 && (
                                            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1.5">
                                                    <Users className="w-4 h-4" />
                                                    Select from saved clients (auto-fills client details):
                                                </p>
                                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                                    {savedClients.map((client) => (
                                                        <button
                                                            key={client._id}
                                                            onClick={() => applyClientToWizard(client._id)}
                                                            className={`px-3 py-1.5 text-sm rounded-lg border transition-all flex items-center gap-1.5 ${selectedClientForWizard === client._id
                                                                ? 'bg-blue-600 text-white border-blue-600'
                                                                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-500'
                                                                }`}
                                                        >
                                                            {selectedClientForWizard === client._id && (
                                                                <Check className="w-3.5 h-3.5" />
                                                            )}
                                                            <span>{client.company || client.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    {selectedClientForWizard
                                                        ? 'Client selected! Contact & address auto-filled. Click again to deselect.'
                                                        : 'Or enter new client details below (will be saved automatically):'}
                                                </p>
                                            </div>
                                        )}

                                        {/* T&C Presets selector on terms_conditions step */}
                                        {aiQuestions[currentStep].id === 'terms_conditions' && (
                                            <div className="mb-4 space-y-3">
                                                {/* Presets dropdown */}
                                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                                                        <BookOpen className="w-4 h-4" />
                                                        Select from pre-built Terms & Conditions:
                                                    </p>
                                                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                                        {isLoadingTerms ? (
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                                Loading presets...
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {/* Group by category */}
                                                                {['payment', 'delivery', 'warranty', 'general', 'custom'].map(category => {
                                                                    const categoryPresets = termsPresets.filter(p => p.category === category);
                                                                    if (categoryPresets.length === 0) return null;
                                                                    return (
                                                                        <div key={category}>
                                                                            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mt-2 mb-1">
                                                                                {category === 'custom' ? 'Your Saved Presets' : category}
                                                                            </p>
                                                                            <div className="flex flex-wrap gap-1.5">
                                                                                {categoryPresets.map((preset) => (
                                                                                    <button
                                                                                        key={preset._id}
                                                                                        onClick={() => applyTermsPreset(preset._id)}
                                                                                        className={`px-2.5 py-1 text-xs rounded-lg border transition-all flex items-center gap-1 ${selectedTermsPreset === preset._id
                                                                                            ? 'bg-amber-600 text-white border-amber-600'
                                                                                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-amber-500'
                                                                                            }`}
                                                                                    >
                                                                                        {selectedTermsPreset === preset._id && (
                                                                                            <Check className="w-3 h-3" />
                                                                                        )}
                                                                                        {preset.label}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            Click presets to add terms. Click multiple to combine. Edit in textarea below.
                                                        </p>
                                                        {(aiAnswers.terms_conditions || '').trim() && (
                                                            <button
                                                                onClick={() => {
                                                                    setAiAnswers(prev => ({ ...prev, terms_conditions: '' }));
                                                                    setSelectedTermsPreset('');
                                                                }}
                                                                className="text-xs text-red-400 hover:text-red-600 mt-2 flex items-center gap-0.5"
                                                            >
                                                                <X className="w-3 h-3" /> Clear all
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Save current terms as preset button */}
                                                {(aiAnswers.terms_conditions || '').trim() && (
                                                    <div className="flex items-center gap-2">
                                                        {!showSaveTermsDialog ? (
                                                            <button
                                                                onClick={() => setShowSaveTermsDialog(true)}
                                                                className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1 hover:underline"
                                                            >
                                                                <Save className="w-3 h-3" />
                                                                Save current terms as preset
                                                            </button>
                                                        ) : (
                                                            <div className="flex items-center gap-2 w-full">
                                                                <Input
                                                                    value={newTermsLabel}
                                                                    onChange={(e) => setNewTermsLabel(e.target.value)}
                                                                    placeholder="Preset name, e.g. 'My Standard T&C'"
                                                                    className="h-8 text-sm flex-1"
                                                                    autoFocus
                                                                />
                                                                <Button
                                                                    size="sm"
                                                                    onClick={saveCurrentTermsAsPreset}
                                                                    disabled={!newTermsLabel.trim()}
                                                                    className="h-8 bg-teal-600 hover:bg-teal-700 text-white text-xs"
                                                                >
                                                                    <Save className="w-3 h-3 mr-1" />
                                                                    Save
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => { setShowSaveTermsDialog(false); setNewTermsLabel(''); }}
                                                                    className="h-8 text-xs"
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

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
                                        <Lightbulb className="w-4 h-4" />
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
                                        <Lightbulb className="w-3 h-3" />
                                        AI Powered
                                    </div>

                                    <div className="relative p-8 flex flex-col h-full">
                                        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 mb-6 group-hover:scale-110 transition-transform">
                                            {isCreating ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Cpu className="w-8 h-8 text-white" />}
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
                                            <Lightbulb className="w-4 h-4 mr-2" />
                                            Generate with AI
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        </div>

                        {/* All Quotations — Search + Grid + Pagination */}
                        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-semibold">All Quotations</h2>
                                {!isLoading && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {totalCount} quotation{totalCount !== 1 ? 's' : ''} found
                                        {searchQuery && ` for "${searchQuery}"`}
                                    </p>
                                )}
                            </div>
                            {/* Search */}
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={e => setSearchInput(e.target.value)}
                                    placeholder="Search by quotation name..."
                                    className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                                />
                                {searchInput && (
                                    <button
                                        onClick={() => { setSearchInput(''); }}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            </div>
                        ) : quotations.length === 0 ? (
                            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-background/50">
                                {searchQuery ? (
                                    <>
                                        <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                                        <p className="text-muted-foreground font-medium">No quotations matching &ldquo;{searchQuery}&rdquo;</p>
                                        <button onClick={() => setSearchInput('')} className="mt-2 text-sm text-emerald-600 hover:underline">Clear search</button>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground">No quotations found. Create your first one!</p>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {quotations.map((q) => (
                                        <Link key={q._id} href={`/accounting/techno-quotation/${q._id}`}>
                                            <Card className="group h-full hover:shadow-lg hover:border-emerald-400/50 transition-all duration-200 cursor-pointer overflow-hidden">
                                                {/* Preview Thumbnail */}
                                                <div className="relative h-28 bg-white dark:bg-gray-900 border-b overflow-hidden">
                                                    <div className="absolute inset-1 bg-gray-50 dark:bg-gray-800 rounded shadow-sm border border-gray-200 dark:border-gray-700 p-2 text-[6px] leading-tight overflow-hidden">
                                                        <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-gray-200 dark:border-gray-600">
                                                            {q.companyDetails?.logo ? (
                                                                <img src={q.companyDetails.logo} alt="" className="w-4 h-4 object-contain rounded" />
                                                            ) : (
                                                                <div className="w-4 h-4 rounded bg-emerald-400 dark:bg-emerald-600 shrink-0" />
                                                            )}
                                                            <div className="flex-1 truncate font-bold text-gray-700 dark:text-gray-300">
                                                                {q.companyDetails?.name || 'Company'}
                                                            </div>
                                                        </div>
                                                        <div className="text-center font-bold text-emerald-600 dark:text-emerald-400 mb-1 truncate text-[7px]">
                                                            {q.title}
                                                        </div>
                                                        <div className="space-y-0.5 text-gray-500 dark:text-gray-400">
                                                            <div className="h-1.5 w-full rounded bg-gray-200 dark:bg-gray-700" />
                                                            <div className="h-1.5 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
                                                            <div className="h-1.5 w-3/5 rounded bg-gray-200 dark:bg-gray-700" />
                                                        </div>
                                                    </div>
                                                    {/* Type badge */}
                                                    <div className={`absolute top-1.5 right-1.5 p-1 rounded shadow-sm ${q.quotationType === 'automated' ? 'bg-teal-500' : 'bg-emerald-500'}`}>
                                                        {q.quotationType === 'automated' ? <Lightbulb className="w-2.5 h-2.5 text-white" /> : <FileEdit className="w-2.5 h-2.5 text-white" />}
                                                    </div>
                                                    {/* Action buttons on hover */}
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-end justify-between p-1.5 opacity-0 group-hover:opacity-100">
                                                        {/* Duplicate */}
                                                        <button
                                                            onClick={(e) => duplicateQuotation(e, q._id)}
                                                            className="p-1.5 rounded-md bg-white/90 dark:bg-gray-800/90 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 shadow-sm transition-all"
                                                            title="Duplicate quotation"
                                                        >
                                                            {isDuplicating === q._id
                                                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                : <Copy className="w-3.5 h-3.5" />}
                                                        </button>
                                                        {/* Delete */}
                                                        <button
                                                            onClick={(e) => handleDeleteClick(e, q._id)}
                                                            className="p-1.5 rounded-md bg-white/90 dark:bg-gray-800/90 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500 shadow-sm transition-all"
                                                            title="Delete quotation"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Card Content */}
                                                <div className="p-2.5">
                                                    <h3 className="font-semibold text-xs mb-0.5 line-clamp-1 group-hover:text-emerald-600 transition-colors">{q.title}</h3>
                                                    <p className="text-[11px] text-muted-foreground line-clamp-1 mb-1">
                                                        {q.companyDetails?.name || 'No company'}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {new Date(q.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${q.quotationType === 'automated' ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'}`}>
                                                            {q.quotationType === 'automated' ? 'AI' : 'Manual'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-8">
                                        <button
                                            onClick={() => fetchQuotations(currentPage - 1, searchQuery)}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                                            .reduce<(number | string)[]>((acc, p, idx, arr) => {
                                                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                                                acc.push(p);
                                                return acc;
                                            }, [])
                                            .map((item, idx) =>
                                                item === '...' ? (
                                                    <span key={`dots-${idx}`} className="px-1 text-muted-foreground text-sm">…</span>
                                                ) : (
                                                    <button
                                                        key={item}
                                                        onClick={() => fetchQuotations(item as number, searchQuery)}
                                                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${currentPage === item
                                                            ? 'bg-emerald-600 text-white shadow-sm'
                                                            : 'border border-border hover:bg-muted'
                                                        }`}
                                                    >
                                                        {item}
                                                    </button>
                                                )
                                            )}

                                        <button
                                            onClick={() => fetchQuotations(currentPage + 1, searchQuery)}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </>
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
                                <Lightbulb className="w-5 h-5 text-white" />
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
