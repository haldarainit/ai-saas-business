'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Printer, ArrowLeft, Plus, Trash2, PlusCircle, X } from "lucide-react";
import Link from "next/link";

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
    // Company Information & Logo
    const [logoUrl, setLogoUrl] = useState('');
    const [logoLetter, setLogoLetter] = useState('G');
    const [companyName, setCompanyName] = useState('GREEN ENERGY PVT. LTD');
    const [companyId, setCompanyId] = useState('GREEN - 2RAAGPV24KEP');
    const [companyAddress1, setCompanyAddress1] = useState('Malad - 400 064');
    const [companyAddress2, setCompanyAddress2] = useState('Mumbai, Maharashtra, India');
    const [companyPhone, setCompanyPhone] = useState('+91 99205 21473');
    const [companyDate, setCompanyDate] = useState('Thursday, March 06th');

    // Main Title
    const [mainTitle, setMainTitle] = useState('TECHNO COMMERCIAL QUOTATION');

    // Footer Content
    const [footerLine1, setFooterLine1] = useState('Solar Solutions | Owner & VP and Power Plans | Water Heater | Street Lights | Home Lighting');
    const [footerLine2, setFooterLine2] = useState('LED Lighting Solutions | Inverters | Commercial | Industrial | Customized solution');
    const [footerLine3, setFooterLine3] = useState('Authorized Submitter: SANTOSH - M.D. - SCADA / PDD');

    // Dynamic Pages State
    const [pages, setPages] = useState<Page[]>([
        {
            id: 'page-1',
            sections: [
                {
                    id: 'section-1',
                    type: 'heading',
                    heading: 'Reference Information'
                },
                {
                    id: 'section-2',
                    type: 'text',
                    heading: 'Ref No',
                    content: 'PTP/305/DAAN/2025-26/0181'
                },
                {
                    id: 'section-3',
                    type: 'text',
                    heading: 'Date',
                    content: '04/05/2025'
                },
                {
                    id: 'section-4',
                    type: 'heading',
                    heading: 'Customer Details'
                },
                {
                    id: 'section-5',
                    type: 'text',
                    heading: 'Customer Name',
                    content: 'The Head Plant - SAIL'
                },
                {
                    id: 'section-6',
                    type: 'text',
                    heading: 'Address',
                    content: 'DSM, CSTL & SMRH, Bhilai, Chhattisgarh'
                }
            ]
        }
    ]);

    // Auto-pagination: detect overflow and create new pages
    const pageContentRefs = React.useRef<(HTMLDivElement | null)[]>([]);
    const [isProcessingOverflow, setIsProcessingOverflow] = React.useState(false);

    React.useEffect(() => {
        if (isProcessingOverflow) return;

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
    }, [pages, isProcessingOverflow]);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
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

    return (
        <>
            <div className="no-print">
                <Navbar />
                <div className="bg-gradient-to-br from-emerald-500/10 via-background to-teal-500/10 py-8">
                    <div className="container px-4">
                        <Link href="/accounting" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Accounting
                        </Link>
                        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                            Dynamic Techno Commercial Quotation
                        </h1>
                        <p className="text-muted-foreground mb-4">
                            Fully customizable quotation - Add/delete pages, sections, tables, columns, and rows as needed.
                            {isProcessingOverflow && (
                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">
                                    📄 Auto-creating page...
                                </span>
                            )}
                        </p>
                        <div className="flex gap-3">
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
                        </div>
                    </div>
                </div>
            </div>

            {/* Quotation Pages */}
            <div className="quotation-container">
                {pages.map((page, pageIndex) => (
                    <div key={page.id} className="page">
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
                                        <label htmlFor="logo-upload" style={{ cursor: 'pointer', fontSize: '9px', color: '#666', textDecoration: 'underline' }}>
                                            Upload Logo
                                        </label>
                                        <input
                                            id="logo-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            style={{ display: 'none' }}
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
                                                                                        className="no-print delete-col-btn"
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
                                                                                <div className="td-content">
                                                                                    <input
                                                                                        type="text"
                                                                                        value={row.cells[column.id] || ''}
                                                                                        onChange={(e) => updateCell(page.id, section.id, row.id, column.id, e.target.value)}
                                                                                        className="editable-field full-width"
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                        ))}
                                                                        {groupIndex === 0 && section.table!.rows.length > 1 && (
                                                                            <td className="no-print delete-row-cell">
                                                                                <button
                                                                                    className="delete-row-btn"
                                                                                    onClick={() => deleteRow(page.id, section.id, row.id)}
                                                                                >
                                                                                    <Trash2 className="w-3 h-3" />
                                                                                </button>
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
                            <p>Page {pageIndex + 1} of {pages.length}</p>
                            <p>
                                <input
                                    type="text"
                                    value={footerLine1}
                                    onChange={(e) => setFooterLine1(e.target.value)}
                                    className="editable-field full-width footer-field"
                                />
                                <br />
                                <input
                                    type="text"
                                    value={footerLine2}
                                    onChange={(e) => setFooterLine2(e.target.value)}
                                    className="editable-field full-width footer-field"
                                />
                                <br />
                                <input
                                    type="text"
                                    value={footerLine3}
                                    onChange={(e) => setFooterLine3(e.target.value)}
                                    className="editable-field full-width footer-field"
                                />
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .quotation-container {
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            width: 210mm !important;
          }
          
          .page {
            page-break-after: always !important;
            page-break-inside: avoid !important;
            margin: 0 !important;
            padding: 15mm 20mm 25mm 20mm !important;
            box-shadow: none !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            background: white !important;
            position: relative !important;
            overflow: hidden !important;
          }
          
          .page:last-child {
            page-break-after: auto !important;
          }
          
          .editable-field,
          .company-name-field,
          .main-title-field,
          .section-title-field,
          .section-heading-field,
          .table-header-field,
          .footer-field {
            border: none !important;
            background: transparent !important;
            outline: none !important;
          }
          
          .header {
            margin-bottom: 12px !important;
            padding-bottom: 10px !important;
          }
          
          .main-title {
            margin: 15px 0 !important;
            font-size: 16px !important;
          }
          
          .section-title {
            margin: 12px 0 !important;
            font-size: 14px !important;
          }
          
          .section-heading {
            margin: 10px 0 8px 0 !important;
            font-size: 12px !important;
          }
          
          .data-table {
            margin: 10px 0 !important;
            font-size: 9px !important;
          }
          
          .data-table th,
          .data-table td {
            padding: 5px !important;
            word-wrap: break-word !important;
          }
          
          .footer {
            position: absolute !important;
            bottom: 10mm !important;
            left: 20mm !important;
            right: 20mm !important;
            font-size: 7px !important;
            line-height: 1.3 !important;
            padding-top: 8px !important;
          }
          
          ul {
            margin: 5px 0 !important;
            padding-left: 18px !important;
          }
          
          li {
            margin: 3px 0 !important;
          }
          
          p {
            margin: 5px 0 !important;
          }
          
          .mt-2 {
            margin-top: 8px !important;
          }
        }

        @media screen {
          .quotation-container {
            max-width: 210mm;
            margin: 20px auto;
            background: #f5f5f5;
            padding: 20px;
          }
        }

        .page {
          width: 210mm;
          height: 297mm;
          max-height: 297mm;
          min-height: 297mm;
          padding: 20mm;
          padding-bottom: 35mm;
          background: white;
          margin-bottom: 20px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          position: relative;
          font-family: Arial, sans-serif;
          font-size: 11px;
          line-height: 1.6;
          color: #000;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .page-content {
          flex: 1;
          overflow: hidden;
          padding-right: 5px;
        }

        .overflow-warning {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #fef3c7;
          border: 2px solid #fbbf24;
          color: #92400e;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: bold;
          z-index: 100;
          box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .section-wrapper {
          transition: all 0.3s ease;
          margin-bottom: 15px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #4CAF50;
          padding-bottom: 15px;
          margin-bottom: 20px;
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
          background: linear-gradient(135deg, #4CAF50, #45a049);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: bold;
        }

        .company-name {
          font-size: 14px;
          font-weight: bold;
          color: #4CAF50;
        }

        .header-info {
          text-align: right;
          font-size: 9px;
          line-height: 1.4;
        }

        .main-title {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          text-decoration: underline;
          margin: 25px 0;
        }

        .section-title {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          text-decoration: underline;
          margin: 20px 0;
        }

        .section-heading {
          font-size: 13px;
          font-weight: bold;
          margin: 15px 0 10px 0;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 10px;
          table-layout: fixed;
        }

        .data-table th,
        .data-table td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
          word-wrap: break-word;
          width: auto;
        }

        .data-table th {
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
        }

        .editable-field {
          border: 1px dashed #ccc;
          background: #fafafa;
          padding: 4px 6px;
          font-family: Arial, sans-serif;
          font-size: inherit;
          width: auto;
          min-width: 60px;
        }

        .editable-field:focus {
          outline: 2px solid #4CAF50;
          background: white;
        }

        .editable-field.full-width {
          width: 100%;
        }

        .logo-image {
          width: 50px;
          height: 50px;
          object-fit: contain;
          border-radius: 50%;
        }

        .company-name-field {
          font-size: 14px;
          font-weight: bold;
          color: #4CAF50;
          border: 1px dashed #ccc;
          background: #fafafa;
          padding: 4px 6px;
        }

        .company-name-field:focus {
          outline: 2px solid #4CAF50;
          background: white;
        }

        .main-title-field {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          width: 100%;
          border: 1px dashed #ccc;
          background: #fafafa;
          padding: 8px;
        }

        .main-title-field:focus {
          outline: 2px solid #4CAF50;
          background: white;
        }

        .section-title-field {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          width: 100%;
          border: 1px dashed #ccc;
          background: #fafafa;
          padding: 6px;
        }

        .section-title-field:focus {
          outline: 2px solid #4CAF50;
          background: white;
        }

        .section-heading-field {
          font-size: 13px;
          font-weight: bold;
          width: auto;
          min-width: 200px;
          border: 1px dashed #ccc;
          background: #fafafa;
          padding: 4px 6px;
        }

        .section-heading-field:focus {
          outline: 2px solid #4CAF50;
          background: white;
        }

        .table-header-field {
          font-weight: bold;
          text-align: center;
          width: 100%;
          border: 1px dashed #ccc;
          background: #f0f0f0;
          padding: 4px;
          font-size: 10px;
        }

        .table-header-field:focus {
          outline: 2px solid #4CAF50;
          background: white;
        }

        .footer {
          position: absolute;
          bottom: 15mm;
          left: 20mm;
          right: 20mm;
          border-top: 1px solid #ccc;
          padding-top: 10px;
          font-size: 8px;
          text-align: center;
          line-height: 1.4;
        }

        .footer-field {
          font-size: 8px;
          line-height: 1.4;
          text-align: center;
          border: 1px dashed #ccc;
          background: #fafafa;
          padding: 2px 4px;
        }

        .footer-field:focus {
          outline: 2px solid #4CAF50;
          background: white;
        }

        .page-controls {
          background: #f0f9ff;
          border: 2px dashed #0ea5e9;
          border-radius: 8px;
          padding: 12px;
          margin: 15px 0;
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
          margin: 15px 0;
        }

        .section-controls {
          position: absolute;
          top: -10px;
          right: -10px;
          z-index: 10;
        }

        .delete-section-btn {
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .delete-section-btn:hover {
          background: #dc2626;
        }

        .table-controls {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }

        .th-content {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .delete-col-btn {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }

        .delete-col-btn:hover {
          background: #dc2626;
        }

        .td-content {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .delete-row-cell {
          border: none !important;
          background: transparent !important;
          padding: 4px !important;
          width: 30px;
        }

        .delete-row-btn {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .delete-row-btn:hover {
          background: #dc2626;
        }

        .list-item-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .delete-item-btn {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }

        .delete-item-btn:hover {
          background: #dc2626;
        }

        .mt-2 {
          margin-top: 8px;
        }

        .text-section {
          margin: 15px 0;
        }

        .list-section {
          margin: 15px 0;
        }

        .table-section {
          margin: 15px 0;
        }
      `}</style>

            <div className="no-print">
                <Footer />
            </div>
        </>
    );
}
