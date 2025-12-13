'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Printer, ArrowLeft, Plus, Trash2, PlusCircle, X, Sparkles, FileEdit, Zap, CloudOff, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import AutomatedQuotationQuestionnaire from "@/components/AutomatedQuotationQuestionnaire";
import { useParams, useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";

// Types for dynamic structures
interface Column {
    id: string;
    name: string;
    width?: string;
}

interface TableRow {
    id: string;
    cells: { [columnId: string]: string };
}

interface DynamicTable {
    id: string;
    name: string;
    columns: Column[];
    rows: TableRow[];
}

interface Section {
    id: string;
    type: 'text' | 'list' | 'table' | 'heading';
    heading?: string;
    content?: string;
    items?: string[];
    table?: DynamicTable;
}

interface Page {
    id: string;
    sections: Section[];
}

export default function TechnoQuotationPage() {
    const params = useParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false); // Tracks if debounce has caught up after loading
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Selection state: null = show selection screen, 'manual' = manual quotation, 'automated' = AI quotation, 'ai-generated' = showing AI generated quotation
    const [quotationType, setQuotationType] = useState<'manual' | 'automated' | 'ai-generated' | null>('manual'); // Default to manual/view mode, will be updated by fetch

    // Automated Quotation States
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);

    // Company Information & Logo
    const [logoUrl, setLogoUrl] = useState('');
    const [logoLetter, setLogoLetter] = useState('G');
    const [companyName, setCompanyName] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [companyAddress1, setCompanyAddress1] = useState('');
    const [companyAddress2, setCompanyAddress2] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');
    const [companyDate, setCompanyDate] = useState('');

    // Main Title
    const [mainTitle, setMainTitle] = useState('');

    // Footer Content
    const [footerLine1, setFooterLine1] = useState('');
    const [footerLine2, setFooterLine2] = useState('');
    const [footerLine3, setFooterLine3] = useState('');

    // Watermark
    const [watermarkType, setWatermarkType] = useState<'text' | 'logo'>('text');
    const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
    const [watermarkLogoUrl, setWatermarkLogoUrl] = useState('');
    const [watermarkSize, setWatermarkSize] = useState(80); // Font size for text, max-width for logo
    const [watermarkOpacity, setWatermarkOpacity] = useState(0.15);
    const [watermarkColorMode, setWatermarkColorMode] = useState<'original' | 'grayscale'>('original');
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingWatermark, setIsUploadingWatermark] = useState(false);

    // Dynamic Pages State
    const [pages, setPages] = useState<Page[]>([]);

    // Auto-pagination: detect overflow and create new pages
    const pageContentRefs = React.useRef<(HTMLDivElement | null)[]>([]);
    const [isProcessingOverflow, setIsProcessingOverflow] = React.useState(false);

    React.useEffect(() => {
        if (isProcessingOverflow || quotationType !== 'manual') return;

        const checkOverflow = () => {
            pageContentRefs.current.forEach((contentEl, pageIndex) => {
                if (!contentEl) return;

                const page = pages[pageIndex];
                if (!page || page.sections.length === 0) return;

                // Get content height
                const contentHeight = contentEl.scrollHeight;
                // Calculate available space with safe margin to prevent footer overlap
                const maxHeight = (215 * 96) / 25.4; // Convert mm to px (96 DPI)

                // If content exceeds available space, move last section to next page
                if (contentHeight > maxHeight && page.sections.length > 0) {
                    setIsProcessingOverflow(true);

                    // Move the last section to next page or create new page
                    const lastSection = page.sections[page.sections.length - 1];
                    const remainingSections = page.sections.slice(0, -1);

                    setPages(prevPages => {
                        const newPages = [...prevPages];

                        // Update current page
                        newPages[pageIndex] = {
                            ...newPages[pageIndex],
                            sections: remainingSections
                        };

                        // Check if next page exists
                        if (pageIndex + 1 < newPages.length) {
                            // Add to beginning of next page
                            newPages[pageIndex + 1] = {
                                ...newPages[pageIndex + 1],
                                sections: [lastSection, ...newPages[pageIndex + 1].sections]
                            };
                        } else {
                            // Create new page with the overflow section
                            newPages.push({
                                id: `page-${Date.now()}`,
                                sections: [lastSection]
                            });
                        }

                        return newPages;
                    });

                    // Reset flag after a shorter delay for faster response
                    setTimeout(() => setIsProcessingOverflow(false), 200);
                }
            });
        };

        // Check after content settles to avoid premature pagination
        const timeoutId = setTimeout(checkOverflow, 500);

        return () => clearTimeout(timeoutId);
    }, [pages, isProcessingOverflow, quotationType]);


    // Load Data
    React.useEffect(() => {
        const fetchQuotation = async () => {
            try {
                const response = await fetch(`/api/techno-quotation/${params.id}`, { cache: 'no-store' });
                if (!response.ok) {
                    if (response.status === 404) {
                        alert("Quotation not found");
                        router.push('/accounting/techno-quotation');
                        return;
                    }
                    throw new Error('Failed to fetch');
                }
                const data = await response.json();
                const q = data.quotation;

                if (q) {
                    setQuotationType(q.quotationType);
                    setMainTitle(q.title || 'TECHNO COMMERCIAL QUOTATION');
                    setCompanyName(q.companyDetails?.name || 'GREEN ENERGY PVT. LTD');
                    setCompanyAddress1(q.companyDetails?.address1 || 'Malad - 400 064');
                    setCompanyAddress2(q.companyDetails?.address2 || 'Mumbai, Maharashtra, India');
                    setCompanyPhone(q.companyDetails?.phone || '+91 99205 21473');
                    setLogoUrl(q.companyDetails?.logo || '');

                    // Footer defaults
                    setFooterLine1('Solar Solutions | Owner & VP and Power Plans | Water Heater | Street Lights | Home Lighting');
                    setFooterLine2('LED Lighting Solutions | Inverters | Commercial | Industrial | Customized solution');
                    setFooterLine3('Authorized Submitter: SANTOSH - M.D. - SCADA / PDD');

                    if (q.watermarkSettings) {
                        setWatermarkType(q.watermarkSettings.type || 'text');
                        setWatermarkText(q.watermarkSettings.text || 'CONFIDENTIAL');
                        setWatermarkLogoUrl(q.watermarkSettings.logoUrl || '');
                        setWatermarkSize(q.watermarkSettings.size || 80);
                        setWatermarkOpacity(q.watermarkSettings.opacity || 0.15);
                        setWatermarkColorMode(q.watermarkSettings.colorMode || 'original');
                    }

                    if (q.answers) setAnswers(q.answers);

                    // If pages exist, use them. If not, set default pages ONLY if it's a new/empty quotation
                    if (q.pages && q.pages.length > 0) {
                        setPages(q.pages);
                    } else {
                        // Default pages for new quotation
                        setPages([{
                            id: 'page-1',
                            sections: [
                                { id: 'section-1', type: 'heading', heading: 'Reference Information' },
                                { id: 'section-2', type: 'text', heading: 'Ref No', content: 'PTP/305/DAAN/2025-26/0181' },
                                { id: 'section-3', type: 'text', heading: 'Date', content: '04/05/2025' },
                                { id: 'section-4', type: 'heading', heading: 'Customer Details' },
                                { id: 'section-5', type: 'text', heading: 'Customer Name', content: 'The Head Plant - SAIL' },
                                { id: 'section-6', type: 'text', heading: 'Address', content: 'DSM, CSTL & SMRH, Bhilai, Chhattisgarh' }
                            ]
                        }]);
                    }
                }
                // Set lastSaved after initial load to enable change tracking
                setLastSaved(new Date());

                // Wait for debounce to catch up before allowing auto-save
                setTimeout(() => {
                    setIsInitialized(true);
                    console.log("Initialization complete - auto-save now enabled");
                }, 2500);
            } catch (error) {
                console.error("Error loading quotation:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            fetchQuotation();
        }
    }, [params.id, router]);

    // Auto-Save Logic
    const debouncedPages = useDebounce(pages, 2000);
    const debouncedTitle = useDebounce(mainTitle, 2000);
    const debouncedCompanyMap = useDebounce({
        name: companyName,
        address1: companyAddress1,
        address2: companyAddress2,
        phone: companyPhone,
        logo: logoUrl
    }, 2000);
    const debouncedQuotationType = useDebounce(quotationType, 2000);
    const debouncedWatermarkSettings = useDebounce({
        type: watermarkType,
        text: watermarkText,
        logoUrl: watermarkLogoUrl,
        size: watermarkSize,
        opacity: watermarkOpacity,
        colorMode: watermarkColorMode
    }, 2000);

    // Track changes - set hasChanges to true when user modifies anything
    // ONLY after initialization is complete (debounce caught up)
    React.useEffect(() => {
        if (!isLoading && isInitialized && lastSaved) {
            setHasChanges(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pages, mainTitle, companyName, companyAddress1, companyAddress2, companyPhone, logoUrl, quotationType, watermarkType, watermarkText, watermarkLogoUrl, watermarkSize, watermarkOpacity, watermarkColorMode, isLoading, isInitialized]);

    React.useEffect(() => {
        // Don't save if:
        // 1. Still loading initial data
        // 2. Not yet initialized (debounce hasn't caught up)
        // 3. No changes have been made
        if (isLoading || !isInitialized || !hasChanges) {
            return;
        }

        const saveQuotation = async () => {
            setIsSaving(true);
            try {
                console.log("Auto-saving quotation:", {
                    title: debouncedTitle,
                    watermarkSettings: debouncedWatermarkSettings
                });

                await fetch(`/api/techno-quotation/${params.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: debouncedTitle,
                        pages: debouncedPages,
                        companyDetails: debouncedCompanyMap,
                        quotationType: debouncedQuotationType,
                        watermarkSettings: debouncedWatermarkSettings
                    })
                });
                setLastSaved(new Date());
                setHasChanges(false); // Reset after successful save
            } catch (error) {
                console.error("Error auto-saving:", error);
            } finally {
                setIsSaving(false);
            }
        };

        saveQuotation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedPages, debouncedTitle, debouncedCompanyMap, debouncedQuotationType, debouncedWatermarkSettings, params.id, isLoading]);

    const handleImageUpload = async (file: File, setUrl: (url: string) => void) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            setIsSaving(true); // Show saving indicator during upload
            const response = await fetch('/api/upload-file', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                setUrl(data.file.url);
            } else {
                console.error("Upload failed:", data.error);
                alert(`Upload failed: ${data.error}`);
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Error uploading image. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploadingLogo(true);
            await handleImageUpload(file, setLogoUrl);
            setIsUploadingLogo(false);
        }
    };

    const handleWatermarkLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setWatermarkType('logo');
            setIsUploadingWatermark(true);
            await handleImageUpload(file, setWatermarkLogoUrl);
            setIsUploadingWatermark(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Page Management
    const addPage = () => {
        const newPage: Page = {
            id: `page-${Date.now()}`,
            sections: []
        };
        setPages([...pages, newPage]);
    };

    const deletePage = (pageId: string) => {
        if (pages.length > 1) {
            setPages(pages.filter(p => p.id !== pageId));
        }
    };

    // Section Management
    const addSection = (pageId: string, type: Section['type']) => {
        setPages(pages.map(page => {
            if (page.id === pageId) {
                const newSection: Section = {
                    id: `section-${Date.now()}`,
                    type,
                    heading: type === 'heading' ? 'New Heading' : type === 'list' ? 'New List' : type === 'table' ? 'New Table' : undefined,
                    content: type === 'text' ? 'New content' : undefined,
                    items: type === 'list' ? ['Item 1'] : undefined,
                    table: type === 'table' ? {
                        id: `table-${Date.now()}`,
                        name: 'New Table',
                        columns: [
                            { id: 'col-1', name: 'Column 1', width: '50%' },
                            { id: 'col-2', name: 'Column 2', width: '50%' }
                        ],
                        rows: [
                            { id: 'row-1', cells: { 'col-1': 'Data 1', 'col-2': 'Data 2' } }
                        ]
                    } : undefined
                };
                return { ...page, sections: [...page.sections, newSection] };
            }
            return page;
        }));
    };

    const deleteSection = (pageId: string, sectionId: string) => {
        setPages(pages.map(page => {
            if (page.id === pageId) {
                return { ...page, sections: page.sections.filter(s => s.id !== sectionId) };
            }
            return page;
        }));
    };

    const updateSection = (pageId: string, sectionId: string, updates: Partial<Section>) => {
        setPages(pages.map(page => {
            if (page.id === pageId) {
                return {
                    ...page,
                    sections: page.sections.map(section =>
                        section.id === sectionId ? { ...section, ...updates } : section
                    )
                };
            }
            return page;
        }));
    };

    // Table Management
    const addColumn = (pageId: string, sectionId: string) => {
        setPages(pages.map(page => {
            if (page.id === pageId) {
                return {
                    ...page,
                    sections: page.sections.map(section => {
                        if (section.id === sectionId && section.table) {
                            const newColId = `col-${Date.now()}`;
                            const newColumn: Column = { id: newColId, name: 'New Column' };
                            const updatedRows = section.table.rows.map(row => ({
                                ...row,
                                cells: { ...row.cells, [newColId]: '' }
                            }));
                            return {
                                ...section,
                                table: {
                                    ...section.table,
                                    columns: [...section.table.columns, newColumn],
                                    rows: updatedRows
                                }
                            };
                        }
                        return section;
                    })
                };
            }
            return page;
        }));
    };

    const deleteColumn = (pageId: string, sectionId: string, columnId: string) => {
        setPages(pages.map(page => {
            if (page.id === pageId) {
                return {
                    ...page,
                    sections: page.sections.map(section => {
                        if (section.id === sectionId && section.table) {
                            const updatedColumns = section.table.columns.filter(col => col.id !== columnId);
                            if (updatedColumns.length === 0) return section;

                            const updatedRows = section.table.rows.map(row => {
                                const newCells = { ...row.cells };
                                delete newCells[columnId];
                                return { ...row, cells: newCells };
                            });

                            return {
                                ...section,
                                table: {
                                    ...section.table,
                                    columns: updatedColumns,
                                    rows: updatedRows
                                }
                            };
                        }
                        return section;
                    })
                };
            }
            return page;
        }));
    };

    const addRow = (pageId: string, sectionId: string) => {
        setPages(pages.map(page => {
            if (page.id === pageId) {
                return {
                    ...page,
                    sections: page.sections.map(section => {
                        if (section.id === sectionId && section.table) {
                            const newRow: TableRow = {
                                id: `row-${Date.now()}`,
                                cells: section.table.columns.reduce((acc, col) => {
                                    acc[col.id] = '';
                                    return acc;
                                }, {} as { [key: string]: string })
                            };
                            return {
                                ...section,
                                table: {
                                    ...section.table,
                                    rows: [...section.table.rows, newRow]
                                }
                            };
                        }
                        return section;
                    })
                };
            }
            return page;
        }));
    };

    const deleteRow = (pageId: string, sectionId: string, rowId: string) => {
        setPages(pages.map(page => {
            if (page.id === pageId) {
                return {
                    ...page,
                    sections: page.sections.map(section => {
                        if (section.id === sectionId && section.table) {
                            const updatedRows = section.table.rows.filter(row => row.id !== rowId);
                            if (updatedRows.length === 0) return section;

                            return {
                                ...section,
                                table: {
                                    ...section.table,
                                    rows: updatedRows
                                }
                            };
                        }
                        return section;
                    })
                };
            }
            return page;
        }));
    };

    const updateCell = (pageId: string, sectionId: string, rowId: string, columnId: string, value: string) => {
        setPages(pages.map(page => {
            if (page.id === pageId) {
                return {
                    ...page,
                    sections: page.sections.map(section => {
                        if (section.id === sectionId && section.table) {
                            return {
                                ...section,
                                table: {
                                    ...section.table,
                                    rows: section.table.rows.map(row =>
                                        row.id === rowId
                                            ? { ...row, cells: { ...row.cells, [columnId]: value } }
                                            : row
                                    )
                                }
                            };
                        }
                        return section;
                    })
                };
            }
            return page;
        }));
    };

    const updateColumnName = (pageId: string, sectionId: string, columnId: string, name: string) => {
        setPages(pages.map(page => {
            if (page.id === pageId) {
                return {
                    ...page,
                    sections: page.sections.map(section => {
                        if (section.id === sectionId && section.table) {
                            return {
                                ...section,
                                table: {
                                    ...section.table,
                                    columns: section.table.columns.map(col =>
                                        col.id === columnId ? { ...col, name } : col
                                    )
                                }
                            };
                        }
                        return section;
                    })
                };
            }
            return page;
        }));
    };

    // List Management
    const addListItem = (pageId: string, sectionId: string) => {
        setPages(pages.map(page => {
            if (page.id === pageId) {
                return {
                    ...page,
                    sections: page.sections.map(section => {
                        if (section.id === sectionId && section.items) {
                            return {
                                ...section,
                                items: [...section.items, 'New item']
                            };
                        }
                        return section;
                    })
                };
            }
            return page;
        }));
    };

    const deleteListItem = (pageId: string, sectionId: string, index: number) => {
        setPages(pages.map(page => {
            if (page.id === pageId) {
                return {
                    ...page,
                    sections: page.sections.map(section => {
                        if (section.id === sectionId && section.items) {
                            return {
                                ...section,
                                items: section.items.filter((_, i) => i !== index)
                            };
                        }
                        return section;
                    })
                };
            }
            return page;
        }));
    };

    const updateListItem = (pageId: string, sectionId: string, index: number, value: string) => {
        setPages(pages.map(page => {
            if (page.id === pageId) {
                return {
                    ...page,
                    sections: page.sections.map(section => {
                        if (section.id === sectionId && section.items) {
                            return {
                                ...section,
                                items: section.items.map((item, i) => i === index ? value : item)
                            };
                        }
                        return section;
                    })
                };
            }
            return page;
        }));
    };

    // Questionnaire for Automated Quotation
    const questions: { id: string; question: string; placeholder: string; type: 'text' | 'textarea' }[] = [
        {
            id: 'company_name',
            question: 'What is your company name?',
            placeholder: 'e.g., GREEN ENERGY PVT. LTD',
            type: 'text'
        },
        {
            id: 'company_details',
            question: 'Please provide your company details (address, phone, email)',
            placeholder: 'e.g., Malad - 400 064, Mumbai, Maharashtra, India\nPhone: +91 99205 21473',
            type: 'textarea'
        },
        {
            id: 'client_name',
            question: 'Who is the client/customer for this quotation?',
            placeholder: 'e.g., The Head Plant - SAIL',
            type: 'text'
        },
        {
            id: 'client_details',
            question: 'Please provide client details (address, contact information)',
            placeholder: 'e.g., DSM, CSTL & SMRH, Bhilai, Chhattisgarh',
            type: 'textarea'
        },
        {
            id: 'project_type',
            question: 'What type of project/product is this quotation for?',
            placeholder: 'e.g., Solar Panel Installation, LED Lighting Solutions, etc.',
            type: 'text'
        },
        {
            id: 'project_scope',
            question: 'Describe the scope of work and project requirements',
            placeholder: 'Provide detailed information about what needs to be done, specifications, quantities, etc.',
            type: 'textarea'
        },
        {
            id: 'technical_specs',
            question: 'What are the key technical specifications or compliance requirements?',
            placeholder: 'e.g., Panel capacity, voltage requirements, certifications needed, etc.',
            type: 'textarea'
        },
        {
            id: 'items_services',
            question: 'List the main items/services to be included in the quotation',
            placeholder: 'e.g., Solar panels, inverters, installation, testing, etc.',
            type: 'textarea'
        },
        {
            id: 'terms_conditions',
            question: 'Any specific terms and conditions or special requirements?',
            placeholder: 'e.g., Payment terms, delivery schedule, warranty, etc.',
            type: 'textarea'
        },
        {
            id: 'additional_info',
            question: 'Any additional information you\'d like to include?',
            placeholder: 'Optional: Any other details that should be in the quotation',
            type: 'textarea'
        }
    ];

    const handleNextQuestion = () => {
        if (currentAnswer.trim()) {
            setAnswers({ ...answers, [questions[currentQuestionIndex].id]: currentAnswer });
            setCurrentAnswer('');

            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else {
                // All questions answered, generate quotation
                generateQuotation();
            }
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            const prevQuestionId = questions[currentQuestionIndex - 1].id;
            setCurrentAnswer(answers[prevQuestionId] || '');
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleSkipQuestion = () => {
        setCurrentAnswer('');
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            generateQuotation();
        }
    };

    const generateQuotation = async () => {
        setIsGenerating(true);
        setGenerationProgress(0);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setGenerationProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 300);

            // Call AI API to generate quotation
            const response = await fetch('/api/generate-quotation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ answers }),
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                throw new Error('Failed to generate quotation');
            }

            const data = await response.json();

            setGenerationProgress(100);

            // Parse the AI response and populate the quotation data
            if (data.quotation) {
                // Set company information
                setCompanyName(data.quotation.companyName || answers.company_name || 'Your Company');
                setCompanyAddress1(data.quotation.companyAddress1 || '');
                setCompanyAddress2(data.quotation.companyAddress2 || '');
                setCompanyPhone(data.quotation.companyPhone || '');

                // Set pages with AI-generated content
                if (data.quotation.pages && data.quotation.pages.length > 0) {
                    setPages(data.quotation.pages);
                }

                // Switch to AI-generated view
                setTimeout(() => {
                    setQuotationType('ai-generated');
                    setIsGenerating(false);
                }, 500);
            }
        } catch (error) {
            console.error('Error generating quotation:', error);
            setIsGenerating(false);
            alert('Failed to generate quotation. Please try again.');
        }
    };

    const resetQuestionnaire = () => {
        setCurrentQuestionIndex(0);
        setAnswers({});
        setCurrentAnswer('');
        setIsGenerating(false);
        setGenerationProgress(0);
    };

    // Loading State
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    <p className="text-muted-foreground">Loading workspace...</p>
                </div>
            </div>
        );
    }

    /* Selection Screen REMOVED */
    if (false) {
        return (
            <>
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
                                <div className="text-center max-w-3xl mx-auto">
                                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                                        Techno Commercial Quotation
                                    </h1>
                                    <p className="text-lg text-muted-foreground">
                                        Choose how you'd like to create your quotation
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Selection Cards */}
                        <section className="py-16">
                            <div className="container px-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                                    {/* Manual Quotation Card */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <Card className="relative overflow-hidden border-2 border-border/50 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl group cursor-pointer h-full"
                                            onClick={() => setQuotationType('manual')}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                            <div className="relative p-8 flex flex-col h-full">
                                                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                                                    <FileEdit className="w-8 h-8 text-white" />
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
                                            onClick={() => setQuotationType('automated')}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                            {/* AI Badge */}
                                            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-bold flex items-center gap-1">
                                                <Sparkles className="w-3 h-3" />
                                                AI Powered
                                            </div>

                                            <div className="relative p-8 flex flex-col h-full">
                                                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 mb-6 group-hover:scale-110 transition-transform">
                                                    <Zap className="w-8 h-8 text-white" />
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
                                                >
                                                    <Sparkles className="w-4 h-4 mr-2" />
                                                    Generate with AI
                                                </Button>
                                            </div>
                                        </Card>
                                    </motion.div>
                                </div>
                            </div>
                        </section>
                    </main>

                    <Footer />
                </div>
            </>
        );
    }

    // Automated Quotation Placeholder
    if (quotationType === 'automated') {
        return (
            <AutomatedQuotationQuestionnaire
                questions={questions}
                currentQuestionIndex={currentQuestionIndex}
                currentAnswer={currentAnswer}
                answers={answers}
                isGenerating={isGenerating}
                generationProgress={generationProgress}
                onAnswerChange={setCurrentAnswer}
                onNext={handleNextQuestion}
                onPrevious={handlePreviousQuestion}
                onSkip={handleSkipQuestion}
                onBack={() => {
                    resetQuestionnaire();
                    setQuotationType(null);
                }}
            />
        );
    }

    // Manual Quotation (existing functionality)
    return (
        <>
            <div className="no-print">
                <Navbar />
                <div className="bg-gradient-to-br from-emerald-500/10 via-background to-teal-500/10 py-6 border-b">
                    <div className="container px-4">
                        {/* Top Bar */}
                        <div className="flex items-center justify-between mb-6">
                            <Link href="/accounting/techno-quotation">
                                <Button variant="ghost" size="sm" className="hover:bg-emerald-50">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to List
                                </Button>
                            </Link>

                            {/* Auto-save Indicator - Compact & Modern */}
                            <div className="flex items-center gap-2">
                                {isSaving ? (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
                                        <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Saving...</span>
                                    </div>
                                ) : lastSaved ? (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Saved</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                        <CloudOff className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-xs font-medium text-gray-500">Unsaved</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quotation Title & Type */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <input
                                        type="text"
                                        value={mainTitle}
                                        onChange={(e) => setMainTitle(e.target.value)}
                                        className="text-3xl font-bold bg-transparent border-none outline-none focus:ring-2 focus:ring-emerald-500 rounded px-2 -ml-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
                                        placeholder="Quotation Title"
                                    />
                                    {quotationType === 'automated' || quotationType === 'ai-generated' ? (
                                        <div className="px-3 py-1 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-bold flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" />
                                            AI Generated
                                        </div>
                                    ) : (
                                        <div className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold flex items-center gap-1">
                                            <FileEdit className="w-3 h-3" />
                                            Manual
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Fully customizable quotation - Add/delete pages, sections, tables, columns, and rows as needed.
                                    {isProcessingOverflow && (
                                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">
                                            📄 Auto-creating page...
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 flex-wrap">
                            <Button
                                onClick={handlePrint}
                                size="lg"
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                            >
                                <Printer className="w-5 h-5 mr-2" />
                                Print Quotation
                            </Button>
                            <Button
                                onClick={addPage}
                                size="lg"
                                variant="outline"
                                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                            >
                                <PlusCircle className="w-5 h-5 mr-2" />
                                Add New Page
                            </Button>
                            <div className="flex flex-col gap-3 ml-4 p-4 border border-border rounded-lg bg-background">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-muted-foreground min-w-[80px]">
                                        Watermark:
                                    </label>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => setWatermarkType('text')}
                                            size="sm"
                                            variant={watermarkType === 'text' ? 'default' : 'outline'}
                                            className={watermarkType === 'text' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                                        >
                                            Text
                                        </Button>
                                        <Button
                                            onClick={() => setWatermarkType('logo')}
                                            size="sm"
                                            variant={watermarkType === 'logo' ? 'default' : 'outline'}
                                            className={watermarkType === 'logo' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                                        >
                                            Logo
                                        </Button>
                                    </div>
                                    {watermarkType === 'text' ? (
                                        <input
                                            type="text"
                                            value={watermarkText}
                                            onChange={(e) => setWatermarkText(e.target.value)}
                                            placeholder="Enter watermark text"
                                            className="px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <label
                                                htmlFor="watermark-logo-upload"
                                                className={`px-3 py-2 border border-border rounded-md text-sm transition-colors flex items-center gap-2 ${isUploadingWatermark
                                                        ? 'cursor-not-allowed bg-emerald-50 border-emerald-300 text-emerald-600'
                                                        : 'cursor-pointer hover:bg-accent'
                                                    }`}
                                            >
                                                {isUploadingWatermark ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    watermarkLogoUrl ? 'Change Logo' : 'Upload Logo'
                                                )}
                                            </label>
                                            <input
                                                id="watermark-logo-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleWatermarkLogoUpload}
                                                style={{ display: 'none' }}
                                                disabled={isUploadingWatermark}
                                            />
                                            {watermarkLogoUrl && !isUploadingWatermark && (
                                                <span className="text-xs text-emerald-600">✓ Logo uploaded</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Size Control */}
                                <div className="flex items-center gap-3">
                                    <label className="text-xs text-muted-foreground min-w-[80px]">
                                        Size: {watermarkSize}px
                                    </label>
                                    <input
                                        type="range"
                                        min="40"
                                        max="200"
                                        value={watermarkSize}
                                        onChange={(e) => setWatermarkSize(Number(e.target.value))}
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                    />
                                </div>

                                {/* Opacity Control */}
                                <div className="flex items-center gap-3">
                                    <label className="text-xs text-muted-foreground min-w-[80px]">
                                        Opacity: {Math.round(watermarkOpacity * 100)}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0.05"
                                        max="0.5"
                                        step="0.05"
                                        value={watermarkOpacity}
                                        onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                    />
                                </div>

                                {/* Color Mode Control */}
                                <div className="flex items-center gap-3">
                                    <label className="text-xs text-muted-foreground min-w-[80px]">
                                        Color Mode:
                                    </label>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => setWatermarkColorMode('original')}
                                            size="sm"
                                            variant={watermarkColorMode === 'original' ? 'default' : 'outline'}
                                            className={watermarkColorMode === 'original' ? 'bg-emerald-600 hover:bg-emerald-700 text-xs' : 'text-xs'}
                                        >
                                            Original
                                        </Button>
                                        <Button
                                            onClick={() => setWatermarkColorMode('grayscale')}
                                            size="sm"
                                            variant={watermarkColorMode === 'grayscale' ? 'default' : 'outline'}
                                            className={watermarkColorMode === 'grayscale' ? 'bg-emerald-600 hover:bg-emerald-700 text-xs' : 'text-xs'}
                                        >
                                            B&W
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quotation Pages */}
            <div className="quotation-container">
                {pages.map((page, pageIndex) => (
                    <div key={page.id} className="page">
                        {/* Watermark Overlay */}
                        {watermarkType === 'text' && watermarkText && (
                            <div
                                className="watermark-overlay watermark-text"
                                style={{
                                    fontSize: `${watermarkSize}px`,
                                    color: watermarkColorMode === 'grayscale'
                                        ? `rgba(0, 0, 0, ${watermarkOpacity})`
                                        : `rgba(16, 185, 129, ${watermarkOpacity})`,
                                    opacity: 1
                                } as React.CSSProperties}
                            >
                                {watermarkText}
                            </div>
                        )}
                        {watermarkType === 'logo' && watermarkLogoUrl && (
                            <div
                                className="watermark-overlay watermark-logo"
                                style={{
                                    width: `${watermarkSize * 5}px`,
                                    height: `${watermarkSize * 5}px`,
                                    maxWidth: `${watermarkSize * 5}px`,
                                    maxHeight: `${watermarkSize * 5}px`,
                                    opacity: watermarkOpacity,
                                    filter: watermarkColorMode === 'grayscale' ? 'grayscale(100%)' : 'none'
                                } as React.CSSProperties}
                            >
                                <img
                                    src={watermarkLogoUrl}
                                    alt="Watermark"
                                    style={{
                                        opacity: 1,
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        width: 'auto',
                                        height: 'auto'
                                    }}
                                />
                            </div>
                        )}

                        {/* Header */}
                        <div className="header">
                            <div className="logo-section">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Company Logo" className="logo-image" />
                                ) : (
                                    <div className="logo-circle" contentEditable suppressContentEditableWarning onBlur={(e) => setLogoLetter(e.currentTarget.textContent || 'G')}>
                                        {logoLetter}
                                    </div>
                                )}
                                <div>
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="editable-field company-name-field"
                                    />
                                    <div className="no-print" style={{ marginTop: '5px' }}>
                                        <label
                                            htmlFor="logo-upload"
                                            style={{
                                                cursor: isUploadingLogo ? 'not-allowed' : 'pointer',
                                                fontSize: '9px',
                                                color: isUploadingLogo ? '#10b981' : '#666',
                                                textDecoration: 'underline',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            {isUploadingLogo ? (
                                                <>
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    Uploading...
                                                </>
                                            ) : (
                                                'Upload Logo'
                                            )}
                                        </label>
                                        <input
                                            id="logo-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            style={{ display: 'none' }}
                                            disabled={isUploadingLogo}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="header-info">
                                <p><strong><input type="text" value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="editable-field" /></strong></p>
                                <p><input type="text" value={companyAddress1} onChange={(e) => setCompanyAddress1(e.target.value)} className="editable-field" /></p>
                                <p><input type="text" value={companyAddress2} onChange={(e) => setCompanyAddress2(e.target.value)} className="editable-field" /></p>
                                <p>Phone: <input type="text" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} className="editable-field" /></p>
                                <p><input type="text" value={companyDate} onChange={(e) => setCompanyDate(e.target.value)} className="editable-field" /></p>
                            </div>
                        </div>

                        {pageIndex === 0 && (
                            <h1 className="main-title">
                                <input
                                    type="text"
                                    value={mainTitle}
                                    onChange={(e) => setMainTitle(e.target.value)}
                                    className="editable-field main-title-field"
                                />
                            </h1>
                        )}

                        {/* Overflow Warning */}
                        <div className="no-print overflow-warning" id={`overflow-warning-${pageIndex}`} style={{ display: 'none' }}>
                            ⚠️ Page Full! Add a new page →
                        </div>

                        {/* Page Content Container */}
                        <div
                            className="page-content"
                            id={`page-content-${pageIndex}`}
                            ref={(el) => {
                                pageContentRefs.current[pageIndex] = el;
                            }}
                        >
                            {/* Page Controls */}
                            <div className="no-print page-controls">
                                <div className="control-buttons">
                                    <Button
                                        onClick={() => addSection(page.id, 'heading')}
                                        size="sm"
                                        variant="outline"
                                        className="control-btn"
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Heading
                                    </Button>
                                    <Button
                                        onClick={() => addSection(page.id, 'text')}
                                        size="sm"
                                        variant="outline"
                                        className="control-btn"
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Text
                                    </Button>
                                    <Button
                                        onClick={() => addSection(page.id, 'list')}
                                        size="sm"
                                        variant="outline"
                                        className="control-btn"
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        List
                                    </Button>
                                    <Button
                                        onClick={() => addSection(page.id, 'table')}
                                        size="sm"
                                        variant="outline"
                                        className="control-btn"
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Table
                                    </Button>
                                    {pages.length > 1 && (
                                        <Button
                                            onClick={() => deletePage(page.id)}
                                            size="sm"
                                            variant="destructive"
                                            className="control-btn"
                                        >
                                            <Trash2 className="w-3 h-3 mr-1" />
                                            Delete Page
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Sections */}
                            {page.sections.map((section) => (
                                <div key={section.id} className="section-wrapper">
                                    <div className="no-print section-controls">
                                        <Button
                                            onClick={() => deleteSection(page.id, section.id)}
                                            size="sm"
                                            variant="ghost"
                                            className="delete-section-btn"
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>

                                    {section.type === 'heading' && (
                                        <h2 className="section-title">
                                            <input
                                                type="text"
                                                value={section.heading || ''}
                                                onChange={(e) => updateSection(page.id, section.id, { heading: e.target.value })}
                                                className="editable-field section-title-field"
                                            />
                                        </h2>
                                    )}

                                    {section.type === 'text' && (
                                        <div className="text-section">
                                            {section.heading && (
                                                <p><strong>
                                                    <input
                                                        type="text"
                                                        value={section.heading}
                                                        onChange={(e) => updateSection(page.id, section.id, { heading: e.target.value })}
                                                        className="editable-field"
                                                        placeholder="Heading"
                                                    />:
                                                </strong></p>
                                            )}
                                            <textarea
                                                value={section.content || ''}
                                                onChange={(e) => updateSection(page.id, section.id, { content: e.target.value })}
                                                className="editable-field full-width"
                                                rows={3}
                                            />
                                        </div>
                                    )}

                                    {section.type === 'list' && (
                                        <div className="list-section">
                                            {section.heading && (
                                                <h3 className="section-heading">
                                                    <input
                                                        type="text"
                                                        value={section.heading}
                                                        onChange={(e) => updateSection(page.id, section.id, { heading: e.target.value })}
                                                        className="editable-field section-heading-field"
                                                    />
                                                </h3>
                                            )}
                                            <ul>
                                                {section.items?.map((item, index) => (
                                                    <li key={index} className="list-item-wrapper">
                                                        <input
                                                            type="text"
                                                            value={item}
                                                            onChange={(e) => updateListItem(page.id, section.id, index, e.target.value)}
                                                            className="editable-field full-width"
                                                        />
                                                        <button
                                                            className="no-print delete-item-btn"
                                                            onClick={() => deleteListItem(page.id, section.id, index)}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                            <Button
                                                onClick={() => addListItem(page.id, section.id)}
                                                size="sm"
                                                variant="outline"
                                                className="no-print mt-2"
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                Add Item
                                            </Button>
                                        </div>
                                    )}

                                    {section.type === 'table' && section.table && (
                                        <div className="table-section">
                                            {section.heading && (
                                                <h3 className="section-heading">
                                                    <input
                                                        type="text"
                                                        value={section.heading}
                                                        onChange={(e) => updateSection(page.id, section.id, { heading: e.target.value })}
                                                        className="editable-field section-heading-field"
                                                    />
                                                </h3>
                                            )}
                                            <div className="table-controls no-print">
                                                <Button
                                                    onClick={() => addColumn(page.id, section.id)}
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    Add Column
                                                </Button>
                                                <Button
                                                    onClick={() => addRow(page.id, section.id)}
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    Add Row
                                                </Button>
                                            </div>

                                            {/* Split columns into groups of 3 */}
                                            {(() => {
                                                const columns = section.table.columns;
                                                const columnGroups = [];
                                                const maxColumnsPerGroup = 3;

                                                for (let i = 0; i < columns.length; i += maxColumnsPerGroup) {
                                                    columnGroups.push(columns.slice(i, i + maxColumnsPerGroup));
                                                }

                                                return columnGroups.map((columnGroup, groupIndex) => (
                                                    <div key={groupIndex} className="table-group" style={{ marginBottom: groupIndex < columnGroups.length - 1 ? '20px' : '0' }}>
                                                        {groupIndex > 0 && (
                                                            <div className="table-continuation-label" style={{ fontSize: '9px', color: '#666', marginBottom: '5px', fontStyle: 'italic' }}>
                                                                Continued from above...
                                                            </div>
                                                        )}
                                                        <table className="data-table">
                                                            <thead>
                                                                <tr>
                                                                    {columnGroup.map((column) => (
                                                                        <th key={column.id}>
                                                                            <div className="th-content">
                                                                                <input
                                                                                    type="text"
                                                                                    value={column.name}
                                                                                    onChange={(e) => updateColumnName(page.id, section.id, column.id, e.target.value)}
                                                                                    className="editable-field table-header-field"
                                                                                />
                                                                                {section.table!.columns.length > 1 && (
                                                                                    <button
                                                                                        className="no-print delete-column-btn"
                                                                                        onClick={() => deleteColumn(page.id, section.id, column.id)}
                                                                                    >
                                                                                        <X className="w-3 h-3" />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {section.table.rows.map((row) => (
                                                                    <tr key={row.id}>
                                                                        {columnGroup.map((column) => (
                                                                            <td key={column.id}>
                                                                                <input
                                                                                    type="text"
                                                                                    value={row.cells[column.id] || ''}
                                                                                    onChange={(e) => updateCell(page.id, section.id, row.id, column.id, e.target.value)}
                                                                                    className="editable-field table-cell-field"
                                                                                />
                                                                            </td>
                                                                        ))}
                                                                        {groupIndex === 0 && (
                                                                            <td className="no-print" style={{ width: '40px', padding: '5px' }}>
                                                                                {section.table!.rows.length > 1 && (
                                                                                    <button
                                                                                        className="delete-row-btn"
                                                                                        onClick={() => deleteRow(page.id, section.id, row.id)}
                                                                                    >
                                                                                        <Trash2 className="w-3 h-3" />
                                                                                    </button>
                                                                                )}
                                                                            </td>
                                                                        )}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="footer">
                            <p><input type="text" value={footerLine1} onChange={(e) => setFooterLine1(e.target.value)} className="editable-field footer-field" /></p>
                            <p><input type="text" value={footerLine2} onChange={(e) => setFooterLine2(e.target.value)} className="editable-field footer-field" /></p>
                            <p><input type="text" value={footerLine3} onChange={(e) => setFooterLine3(e.target.value)} className="editable-field footer-field" /></p>
                        </div>
                    </div>
                ))}
            </div>


            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    
                    .page {
                        page-break-after: always;
                        page-break-inside: avoid;
                    }
                    
                    .page:last-child {
                        page-break-after: auto;
                    }
                }

                .quotation-container {
                    max-width: 210mm;
                    margin: 0 auto;
                    padding: 20px;
                    background: white;
                }

                .page {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 15mm;
                    margin: 0 auto 20px;
                    background: white;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    position: relative;
                    display: flex;
                    flex-direction: column;
                }

                /* Watermark Overlay */
                .watermark-overlay {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    user-select: none;
                    z-index: 1;
                }

                .watermark-text {
                    font-weight: bold;
                    text-transform: uppercase;
                    white-space: nowrap;
                    letter-spacing: 0.1em;
                }

                .watermark-logo {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .watermark-logo img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                /* Force light theme INSIDE the printable quotation pages so PDFs/print view stay consistent */
                .page, .page * {
                    color: #0f172a !important; /* dark text */
                }

                .page {
                    background: white !important; /* always light */
                }

                /* Inputs / editable fields inside the page should appear with light backgrounds */
                .page input,
                .page textarea,
                .page .editable-field,
                .page .table-cell-field,
                .page .table-header-field,
                .page .company-name-field,
                .page .section-title,
                .page .main-title {
                    background: white !important;
                    color: #0f172a !important;
                    border-color: #d1d5db !important;
                }

                /* Tables headers remain green with white text */
                .page .data-table th {
                    background: #10b981 !important;
                    color: #ffffff !important;
                }

                /* Subtle adjustments for footer / meta text */
                .page .footer {
                    color: #6b7280 !important;
                }

                /* Ensure interactive control areas (no-print) still follow theme, but printed pages remain light */
                .no-print .page-controls,
                .no-print .delete-section-btn,
                .no-print .delete-item-btn {
                    /* leave these to site theme; no override here */
                }

                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #10b981;
                    margin-bottom: 15px;
                    position: relative;
                    z-index: 2;
                }

                .logo-section {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .logo-circle {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #10b981, #14b8a6);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    font-weight: bold;
                }

                .logo-image {
                    width: 50px;
                    height: 50px;
                    object-fit: contain;
                }

                .company-name-field {
                    font-size: 14px;
                    font-weight: bold;
                    color: #10b981;
                }

                .header-info {
                    text-align: right;
                    font-size: 10px;
                }

                .header-info p {
                    margin: 2px 0;
                }

                .main-title {
                    text-align: center;
                    font-size: 18px;
                    font-weight: bold;
                    color: #10b981;
                    margin: 15px 0;
                    padding: 10px;
                    background: linear-gradient(135deg, #f0fdf4, #ccfbf1);
                    border-radius: 8px;
                    position: relative;
                    z-index: 2;
                }

                .main-title-field {
                    text-align: center;
                    width: 100%;
                    font-size: 18px;
                    font-weight: bold;
                    color: #10b981;
                }

                .page-content {
                    flex: 1;
                    overflow: visible;
                    position: relative;
                    z-index: 2;
                }

                .page-controls {
                    margin-bottom: 15px;
                    padding: 10px;
                    background: #f9fafb;
                    border-radius: 8px;
                }

                .control-buttons {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .control-btn {
                    font-size: 11px;
                    padding: 6px 12px;
                }

                .section-wrapper {
                    position: relative;
                    margin-bottom: 15px;
                }

                .section-controls {
                    position: absolute;
                    top: -10px;
                    right: -10px;
                    z-index: 10;
                }

                .delete-section-btn {
                    background: #fee2e2;
                    color: #dc2626;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    padding: 0;
                }

                .section-title {
                    font-size: 14px;
                    font-weight: bold;
                    color: #10b981;
                    margin: 10px 0;
                    padding: 8px;
                    background: #f0fdf4;
                    border-left: 4px solid #10b981;
                }

                .section-title-field {
                    width: 100%;
                    font-size: 14px;
                    font-weight: bold;
                    color: #10b981;
                    background: transparent;
                }

                .text-section {
                    margin: 10px 0;
                    font-size: 11px;
                }

                .list-section {
                    margin: 10px 0;
                }

                .section-heading {
                    font-size: 12px;
                    font-weight: bold;
                    margin-bottom: 8px;
                    color: #059669;
                }

                .section-heading-field {
                    width: 100%;
                    font-size: 12px;
                    font-weight: bold;
                    color: #059669;
                    background: transparent;
                }

                .list-section ul {
                    margin-left: 20px;
                    font-size: 11px;
                }

                .list-item-wrapper {
                    position: relative;
                    margin: 5px 0;
                }

                .delete-item-btn {
                    position: absolute;
                    right: -25px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: #fee2e2;
                    color: #dc2626;
                    border: none;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }

                .table-section {
                    margin: 10px 0;
                }

                .table-controls {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 10px;
                }

                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 10px;
                    margin-bottom: 10px;
                }

                .data-table th,
                .data-table td {
                    border: 1px solid #d1d5db;
                    padding: 6px;
                }

                .data-table th {
                    background: #10b981;
                    color: white;
                    font-weight: bold;
                }

                .th-content {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    position: relative;
                }

                .table-header-field {
                    flex: 1;
                    background: transparent;
                    color: white;
                    font-weight: bold;
                    text-align: center;
                }

                .delete-column-btn {
                    background: #fee2e2;
                    color: #dc2626;
                    border: none;
                    border-radius: 50%;
                    width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    flex-shrink: 0;
                }

                .table-cell-field {
                    width: 100%;
                    background: transparent;
                    text-align: left;
                }

                .delete-row-btn {
                    background: #fee2e2;
                    color: #dc2626;
                    border: none;
                    border-radius: 4px;
                    padding: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .footer {
                    margin-top: auto;
                    padding-top: 10px;
                    border-top: 2px solid #10b981;
                    font-size: 9px;
                    text-align: center;
                    color: #6b7280;
                    position: relative;
                    z-index: 2;
                }

                .footer p {
                    margin: 3px 0;
                }

                .footer-field {
                    width: 100%;
                    text-align: center;
                    font-size: 9px;
                    color: #6b7280;
                }

                .editable-field {
                    border: 1px solid transparent;
                    padding: 2px 4px;
                    border-radius: 3px;
                    transition: all 0.2s;
                    font-family: inherit;
                }

                .editable-field:hover {
                    border-color: #d1d5db;
                    background: #f9fafb;
                }

                .editable-field:focus {
                    outline: none;
                    border-color: #10b981;
                    background: white;
                }

                .full-width {
                    width: 100%;
                }

                .overflow-warning {
                    background: #fef3c7;
                    color: #92400e;
                    padding: 8px;
                    border-radius: 4px;
                    text-align: center;
                    font-size: 12px;
                    margin: 10px 0;
                    font-weight: bold;
                }

                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                    }

                    .quotation-container {
                        padding: 0;
                        max-width: none;
                    }

                    .page {
                        width: 210mm;
                        height: 297mm;
                        margin: 0;
                        padding: 15mm;
                        box-shadow: none;
                        page-break-after: always;
                    }

                    .page:last-child {
                        page-break-after: auto;
                    }

                    .editable-field {
                        border: none !important;
                        background: transparent !important;
                        padding: 0;
                    }

                    input, textarea {
                        border: none !important;
                        background: transparent !important;
                    }

                    /* Ensure watermark is visible in print */
                    .watermark-overlay {
                        display: block !important;
                        opacity: 1 !important;
                    }
                }
            `}</style>
        </>
    );
}
