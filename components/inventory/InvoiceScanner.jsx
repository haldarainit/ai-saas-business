'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Upload, FileText, Image, Sparkles, AlertTriangle, Check, X,
    Edit2, Trash2, Plus, Loader2, ScanLine, Eye, FileCheck, Save, Files, Receipt
} from 'lucide-react';

export default function InvoiceScanner({
    isOpen,
    onClose,
    inventoryType = 'trading', // 'trading' or 'manufacturing'
    onProductsConfirmed,
    existingCategories = []
}) {
    const [files, setFiles] = useState([]);
    const [filePreviews, setFilePreviews] = useState([]);
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [editingItemIndex, setEditingItemIndex] = useState(null);
    const [editFormData, setEditFormData] = useState(null);
    const [editedItems, setEditedItems] = useState([]);
    const fileInputRef = useRef(null);

    const unitOptions = ['pcs', 'kg', 'g', 'ltr', 'ml', 'meter', 'cm', 'sqft', 'sqm', 'unit', 'box', 'pack', 'set', 'pair', 'roll', 'bundle', 'dozen', 'ton', 'quintal'];

    // Comprehensive category options for trading inventory
    const tradingCategories = [
        'Uncategorized',
        // Plumbing & Sanitary
        'Plumbing', 'Sanitary Ware', 'Pipes & Fittings', 'Valves & Taps', 'Bathroom Accessories',
        // Electrical
        'Electrical', 'Wires & Cables', 'Switches & Sockets', 'Lighting', 'Electrical Fittings',
        // Construction & Building
        'Construction Materials', 'Cement & Concrete', 'Tiles & Flooring', 'Paints & Coatings', 'Adhesives & Sealants',
        // Hardware
        'Hardware', 'Fasteners', 'Tools & Equipment', 'Locks & Security', 'Door & Window Fittings',
        // Home & Living
        'Furniture', 'Home Decor', 'Kitchen & Dining', 'Storage & Organization',
        // Industrial
        'Industrial Supplies', 'Safety Equipment', 'Machinery Parts', 'Bearings & Belts',
        // General
        'Electronics', 'Automotive', 'Clothing & Textiles', 'Food & Beverages', 'Office Supplies',
        'Stationery', 'Packaging Materials', 'Chemicals', 'Agricultural', 'Medical Supplies',
        'Sports & Fitness', 'Toys & Games', 'Pet Supplies', 'Gardening',
        'Other'
    ];

    // Comprehensive category options for manufacturing inventory
    const manufacturingCategories = [
        'Uncategorized',
        // Raw Materials
        'Metals', 'Steel', 'Aluminum', 'Copper', 'Brass', 'Iron',
        'Plastics', 'Polymers', 'Rubber', 'PVC', 'CPVC', 'HDPE', 'ABS',
        // Building Materials
        'Cement', 'Sand & Aggregates', 'Bricks & Blocks', 'Tiles', 'Glass', 'Wood & Timber',
        // Chemicals & Paints
        'Chemicals', 'Solvents', 'Adhesives', 'Paints', 'Coatings', 'Lubricants',
        // Components
        'Electronics Components', 'Electrical Components', 'Mechanical Parts', 'Fasteners',
        'Bearings', 'Springs', 'Gaskets & Seals',
        // Textiles
        'Fabrics', 'Textiles', 'Threads & Yarns', 'Leather',
        // Others
        'Packaging', 'Consumables', 'Safety Gear', 'Tools', 'Hardware',
        'Plumbing Components', 'Pipe Fittings', 'Valves', 'Connectors',
        'Other'
    ];

    const categoryOptions = inventoryType === 'manufacturing' ? manufacturingCategories : tradingCategories;

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length > 0) {
            setFiles(prev => [...prev, ...selectedFiles]);
            setScanResult(null);
            setEditedItems([]);

            // Create previews for images
            selectedFiles.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setFilePreviews(prev => [...prev, { name: file.name, preview: reader.result }]);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files || []);
        if (droppedFiles.length > 0) {
            setFiles(prev => [...prev, ...droppedFiles]);
            setScanResult(null);
            setEditedItems([]);

            droppedFiles.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setFilePreviews(prev => [...prev, { name: file.name, preview: reader.result }]);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const removeFile = (index) => {
        const fileToRemove = files[index];
        setFiles(files.filter((_, i) => i !== index));
        setFilePreviews(filePreviews.filter(p => p.name !== fileToRemove.name));
    };

    const handleScan = async () => {
        if (files.length === 0) return;

        setScanning(true);
        setScanResult(null);

        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });
            formData.append('inventoryType', inventoryType);

            const response = await fetch('/api/inventory/scan-invoice', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const data = await response.json();

            // Check for quota/rate limit errors
            if (response.status === 429 || data.errorType === 'quota_exceeded') {
                setScanResult({
                    error: data.message || 'AI limit exhausted! Please try again later.',
                    errorType: 'quota_exceeded',
                    retryAfter: data.retryAfter || 60,
                    items: [],
                    filesProcessed: []
                });
                return;
            }

            if (data.items && data.items.length > 0) {
                // Validate and fix categories - ensure they match our category list
                const validatedItems = data.items.map(item => {
                    let category = item.category || 'Other';

                    // Check if category exists in our list
                    if (!categoryOptions.includes(category)) {
                        // Try to find a matching category (case-insensitive partial match)
                        const lowerCategory = category.toLowerCase();
                        const matchedCategory = categoryOptions.find(cat =>
                            cat.toLowerCase() === lowerCategory ||
                            cat.toLowerCase().includes(lowerCategory) ||
                            lowerCategory.includes(cat.toLowerCase())
                        );

                        if (matchedCategory) {
                            category = matchedCategory;
                        } else {
                            // Additional smart matching for common product types
                            if (lowerCategory.includes('pipe') || lowerCategory.includes('fitting') || lowerCategory.includes('elbow') || lowerCategory.includes('tee') || lowerCategory.includes('socket') || lowerCategory.includes('reducer')) {
                                category = categoryOptions.find(c => c.includes('Pipe') || c.includes('Plumbing')) || 'Plumbing';
                            } else if (lowerCategory.includes('tap') || lowerCategory.includes('valve') || lowerCategory.includes('cock') || lowerCategory.includes('faucet')) {
                                category = categoryOptions.find(c => c.includes('Valve') || c.includes('Tap')) || 'Valves & Taps';
                            } else if (lowerCategory.includes('commode') || lowerCategory.includes('basin') || lowerCategory.includes('toilet') || lowerCategory.includes('urinal')) {
                                category = categoryOptions.find(c => c.includes('Sanitary')) || 'Sanitary Ware';
                            } else if (lowerCategory.includes('solvent') || lowerCategory.includes('adhesive') || lowerCategory.includes('glue')) {
                                category = categoryOptions.find(c => c.includes('Adhesive') || c.includes('Solvent')) || 'Adhesives & Sealants';
                            } else if (lowerCategory.includes('wire') || lowerCategory.includes('cable')) {
                                category = categoryOptions.find(c => c.includes('Wire') || c.includes('Cable')) || 'Electrical';
                            } else if (lowerCategory.includes('paint') || lowerCategory.includes('primer') || lowerCategory.includes('coating')) {
                                category = categoryOptions.find(c => c.includes('Paint')) || 'Paints & Coatings';
                            } else if (lowerCategory.includes('brass')) {
                                category = categoryOptions.find(c => c === 'Brass') || 'Hardware';
                            } else if (lowerCategory.includes('copper')) {
                                category = categoryOptions.find(c => c === 'Copper') || 'Hardware';
                            } else {
                                category = 'Other';
                            }
                        }
                    }

                    return { ...item, category };
                });

                setScanResult(data);
                setEditedItems(validatedItems);
            } else {
                setScanResult({
                    error: data.message || 'No products found in the invoice(s)',
                    items: [],
                    filesProcessed: data.filesProcessed || []
                });
            }
        } catch (error) {
            console.error('Scan error:', error);
            setScanResult({
                error: 'Failed to scan invoice(s). Please try again.',
                items: []
            });
        } finally {
            setScanning(false);
        }
    };

    // Open edit form modal for an item
    const openEditForm = (index) => {
        setEditingItemIndex(index);
        setEditFormData({ ...editedItems[index] });
    };

    // Save edit form changes
    const saveEditForm = () => {
        if (editingItemIndex !== null && editFormData) {
            const updated = [...editedItems];
            // Recalculate costs with GST
            const basePrice = parseFloat(editFormData.basePrice) || 0;
            const gstPercentage = parseFloat(editFormData.gstPercentage) || 0;
            const gstAmount = basePrice * gstPercentage / 100;
            const quantity = parseFloat(editFormData.quantity) || 0;

            editFormData.gstAmount = gstAmount;

            if (inventoryType === 'manufacturing') {
                editFormData.costPerUnit = basePrice + gstAmount;
                editFormData.totalCost = editFormData.costPerUnit * quantity;
            } else {
                editFormData.costPrice = basePrice + gstAmount;
                editFormData.totalCost = editFormData.costPrice * quantity;
            }

            updated[editingItemIndex] = editFormData;
            setEditedItems(updated);
            setEditingItemIndex(null);
            setEditFormData(null);
        }
    };

    // Close edit form without saving
    const closeEditForm = () => {
        setEditingItemIndex(null);
        setEditFormData(null);
    };

    const handleItemRemove = (index) => {
        setEditedItems(editedItems.filter((_, i) => i !== index));
    };

    const handleConfirm = () => {
        if (editedItems.length > 0) {
            onProductsConfirmed(editedItems, scanResult?.supplier);
            handleClose();
        }
    };

    const handleClose = () => {
        setFiles([]);
        setFilePreviews([]);
        setScanResult(null);
        setEditedItems([]);
        setEditingItemIndex(null);
        setEditFormData(null);
        onClose();
    };

    const getConfidenceBadge = (confidence) => {
        switch (confidence) {
            case 'high':
                return <Badge className="bg-green-500/20 text-green-600 border-green-300">High</Badge>;
            case 'medium':
                return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-300">Medium</Badge>;
            case 'low':
                return <Badge className="bg-red-500/20 text-red-600 border-red-300">Low</Badge>;
            default:
                return <Badge variant="outline">Unknown</Badge>;
        }
    };

    return (
        <>
            {/* Main Scanner Dialog */}
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-[1100px] max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg">
                                <ScanLine className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <span className="text-xl">AI Invoice Scanner</span>
                                <Badge variant="outline" className="ml-2 text-xs">
                                    {inventoryType === 'manufacturing' ? 'Raw Materials' : 'Products'}
                                </Badge>
                            </div>
                        </DialogTitle>
                        <DialogDescription>
                            Upload invoices (PDF or Images) - supports multiple files & multi-page PDFs. GST/taxes are automatically included in costs.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-4 py-4">
                        {/* File Upload Section */}
                        {!scanResult && !scanning && (
                            <div className="space-y-4">
                                <div
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                                        ${files.length > 0 ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'}`}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        multiple
                                    />

                                    <div className="flex flex-col items-center gap-3">
                                        <div className={`p-4 rounded-full ${files.length > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted/50'}`}>
                                            <Files className={`h-10 w-10 ${files.length > 0 ? 'text-green-600' : 'text-muted-foreground'}`} />
                                        </div>
                                        <div>
                                            <p className="font-semibold">
                                                {files.length > 0 ? `${files.length} file(s) selected` : 'Drop your invoices here'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Click to add more • PDF, PNG, JPG, WEBP • Multi-page supported
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* File List */}
                                {files.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium text-sm">Selected Files</h4>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => { setFiles([]); setFilePreviews([]); }}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" /> Clear All
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {files.map((file, index) => {
                                                const preview = filePreviews.find(p => p.name === file.name);
                                                return (
                                                    <div
                                                        key={`${file.name}-${index}`}
                                                        className="relative group border rounded-lg p-3 bg-muted/30"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {preview ? (
                                                                <img src={preview.preview} alt="" className="w-10 h-10 object-cover rounded" />
                                                            ) : file.type === 'application/pdf' ? (
                                                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center">
                                                                    <FileText className="h-5 w-5 text-red-600" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
                                                                    <Image className="h-5 w-5 text-blue-600" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate">{file.name}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {(file.size / 1024).toFixed(1)} KB
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* GST Info Notice */}
                                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <Receipt className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-blue-700 dark:text-blue-300">GST/Tax Handling</p>
                                        <p className="text-sm text-blue-600 dark:text-blue-400">
                                            All costs will include GST/taxes automatically. Base price + GST = Final cost per unit.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Scanning Animation */}
                        {scanning && (
                            <div className="py-12 text-center">
                                <div className="relative inline-flex items-center justify-center">
                                    <div className="absolute inset-0 animate-ping rounded-full bg-violet-400/30" />
                                    <div className="relative p-6 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full">
                                        <Sparkles className="h-12 w-12 text-white animate-pulse" />
                                    </div>
                                </div>
                                <p className="mt-6 text-lg font-semibold">Analyzing {files.length} Invoice{files.length > 1 ? 's' : ''} with AI...</p>
                                <p className="text-sm text-muted-foreground">
                                    Extracting {inventoryType === 'manufacturing' ? 'raw materials' : 'products'}, calculating GST & totals
                                </p>
                                <div className="mt-4 space-y-2">
                                    <Skeleton className="h-10 w-full max-w-md mx-auto" />
                                    <Skeleton className="h-10 w-full max-w-md mx-auto" />
                                    <Skeleton className="h-10 w-full max-w-md mx-auto" />
                                </div>
                            </div>
                        )}

                        {/* Scan Results */}
                        {scanResult && !scanning && (
                            <div className="space-y-4">
                                {/* Files Processed Summary */}
                                {scanResult.filesProcessed && scanResult.filesProcessed.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {scanResult.filesProcessed.map((file, index) => (
                                            <Badge
                                                key={index}
                                                variant={file.status === 'success' ? 'default' : 'destructive'}
                                                className={file.status === 'success' ? 'bg-green-500' : ''}
                                            >
                                                {file.name} {file.status === 'success' ? `(${file.itemCount} items)` : '(failed)'}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Invoice Info Header */}
                                {scanResult.supplier && (
                                    <div className="p-4 rounded-lg border bg-muted/30">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Supplier</p>
                                                <p className="font-semibold">{scanResult.supplier.name || 'Unknown'}</p>
                                                {scanResult.supplier.gstin && (
                                                    <p className="text-sm font-mono text-muted-foreground">GSTIN: {scanResult.supplier.gstin}</p>
                                                )}
                                                {scanResult.supplier.contact && (
                                                    <p className="text-sm text-muted-foreground">{scanResult.supplier.contact}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                {scanResult.invoiceNumber && (
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Invoice #</p>
                                                        <p className="font-mono font-semibold">{scanResult.invoiceNumber}</p>
                                                    </div>
                                                )}
                                                {scanResult.invoiceDate && (
                                                    <p className="text-sm text-muted-foreground mt-1">{scanResult.invoiceDate}</p>
                                                )}
                                            </div>
                                        </div>
                                        {/* GST Summary - calculated from editedItems */}
                                        {editedItems.length > 0 && (
                                            <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">Subtotal</p>
                                                    <p className="font-semibold">₹{editedItems.reduce((sum, i) => sum + ((i.basePrice || 0) * (i.quantity || 0)), 0).toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Total GST</p>
                                                    <p className="font-semibold text-amber-600">₹{editedItems.reduce((sum, i) => sum + ((i.gstAmount || 0) * (i.quantity || 0)), 0).toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Grand Total</p>
                                                    <p className="font-semibold text-green-600">₹{editedItems.reduce((sum, i) => sum + (i.totalCost || 0), 0).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Error Message */}
                                {scanResult.error && editedItems.length === 0 && (
                                    <div className={`p-6 rounded-lg border text-center ${scanResult.errorType === 'quota_exceeded'
                                            ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/10'
                                            : 'border-red-200 bg-red-50 dark:bg-red-900/10'
                                        }`}>
                                        {scanResult.errorType === 'quota_exceeded' ? (
                                            <>
                                                <div className="relative inline-flex items-center justify-center mb-3">
                                                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <polyline points="12 6 12 12 16 14" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-lg text-amber-700 dark:text-amber-400 mb-1">
                                                    AI Limit Exhausted
                                                </p>
                                                <p className="text-amber-600 dark:text-amber-400 text-sm mb-3">
                                                    {scanResult.error}
                                                </p>
                                                <div className="flex items-center justify-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 rounded-lg px-4 py-2 inline-flex">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <line x1="12" y1="8" x2="12" y2="12" />
                                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                                    </svg>
                                                    Retry after {scanResult.retryAfter || 60} seconds
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle className="h-10 w-10 mx-auto text-red-500 mb-2" />
                                                <p className="font-semibold text-red-700 dark:text-red-400">{scanResult.error}</p>
                                            </>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-4"
                                            onClick={() => {
                                                setScanResult(null);
                                                setFiles([]);
                                                setFilePreviews([]);
                                            }}
                                        >
                                            {scanResult.errorType === 'quota_exceeded' ? 'Try Again Later' : 'Try Other Files'}
                                        </Button>
                                    </div>
                                )}

                                {/* Extracted Items Table */}
                                {editedItems.length > 0 && (
                                    <div className="rounded-lg border overflow-hidden">
                                        <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 px-4 py-3 border-b flex items-center justify-between">
                                            <h4 className="font-semibold flex items-center gap-2">
                                                <FileCheck className="h-4 w-4 text-violet-600" />
                                                Extracted {inventoryType === 'manufacturing' ? 'Raw Materials' : 'Products'}
                                                <Badge variant="secondary">{editedItems.length} items</Badge>
                                            </h4>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Sparkles className="h-4 w-4 text-violet-500" />
                                                Costs include GST
                                            </div>
                                        </div>

                                        <div className="max-h-[400px] overflow-y-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[180px]">Name</TableHead>
                                                        <TableHead>SKU</TableHead>
                                                        <TableHead className="text-center">Qty</TableHead>
                                                        <TableHead className="text-right">Base Price</TableHead>
                                                        <TableHead className="text-center">GST %</TableHead>
                                                        <TableHead className="text-right">Base Total</TableHead>
                                                        <TableHead className="text-right">GST Amount</TableHead>
                                                        <TableHead className="text-right">Total Price</TableHead>
                                                        {inventoryType === 'trading' && (
                                                            <TableHead className="text-right">Sell Price</TableHead>
                                                        )}
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {editedItems.map((item, index) => {
                                                        const baseTotal = (item.quantity || 0) * (item.basePrice || 0);
                                                        const totalGst = (item.quantity || 0) * (item.gstAmount || 0);
                                                        const totalPrice = baseTotal + totalGst;

                                                        return (
                                                            <TableRow
                                                                key={item.id}
                                                                className={item.needsReview ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}
                                                            >
                                                                <TableCell>
                                                                    <div>
                                                                        <p className="font-medium truncate max-w-[160px]">{item.name}</p>
                                                                        {item.hsnCode && (
                                                                            <p className="text-xs text-muted-foreground">HSN: {item.hsnCode}</p>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{item.sku}</code>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <span className="font-medium">{item.quantity} {item.unit}</span>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <span className="text-muted-foreground">₹{item.basePrice?.toFixed(2)}</span>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {item.gstPercentage || 0}%
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div>
                                                                        <span className="text-muted-foreground">₹{baseTotal.toFixed(2)}</span>
                                                                        <p className="text-[10px] text-muted-foreground/70">
                                                                            {item.quantity} × {item.basePrice?.toFixed(2)}
                                                                        </p>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <span className="font-medium text-amber-600">₹{totalGst.toFixed(2)}</span>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div>
                                                                        <span className="font-semibold text-green-600">₹{totalPrice.toFixed(2)}</span>
                                                                        <p className="text-[10px] text-green-600/70">
                                                                            {baseTotal.toFixed(2)} + {totalGst.toFixed(2)} GST
                                                                        </p>
                                                                    </div>
                                                                </TableCell>
                                                                {inventoryType === 'trading' && (
                                                                    <TableCell className="text-right">
                                                                        <span className="font-medium text-blue-600">
                                                                            ₹{item.sellingPrice?.toFixed(2)}
                                                                        </span>
                                                                    </TableCell>
                                                                )}
                                                                <TableCell className="text-right">
                                                                    <div className="flex justify-end gap-1">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-8 gap-1"
                                                                            onClick={() => openEditForm(index)}
                                                                        >
                                                                            <Edit2 className="h-3.5 w-3.5" />
                                                                            Edit
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                                            onClick={() => handleItemRemove(index)}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Total Summary */}
                                        <div className="px-4 py-4 bg-gradient-to-r from-muted/30 to-muted/50 border-t">
                                            <div className="flex justify-between items-start">
                                                <div className="text-sm text-muted-foreground">
                                                    {editedItems.filter(i => i.needsReview).length > 0 && (
                                                        <span className="flex items-center gap-1 text-yellow-600">
                                                            <AlertTriangle className="h-4 w-4" />
                                                            {editedItems.filter(i => i.needsReview).length} items need review
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-3 gap-6 text-right">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1">Base Total</p>
                                                        <p className="font-medium text-lg">
                                                            ₹{editedItems.reduce((sum, i) => sum + ((i.basePrice || 0) * (i.quantity || 0)), 0).toFixed(2)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1">Total GST</p>
                                                        <p className="font-medium text-lg text-amber-600">
                                                            ₹{editedItems.reduce((sum, i) => sum + ((i.gstAmount || 0) * (i.quantity || 0)), 0).toFixed(2)}
                                                        </p>
                                                    </div>
                                                    <div className="bg-green-100 dark:bg-green-900/30 rounded-lg px-3 py-1 -my-1">
                                                        <p className="text-xs text-green-700 dark:text-green-400 mb-1">Grand Total</p>
                                                        <p className="font-bold text-xl text-green-600">
                                                            ₹{editedItems.reduce((sum, i) => sum + (i.totalCost || 0), 0).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="border-t pt-4">
                        <div className="flex justify-between w-full">
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <div className="flex gap-2">
                                {!scanResult && files.length > 0 && !scanning && (
                                    <Button
                                        onClick={handleScan}
                                        className="bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600"
                                    >
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Scan {files.length} File{files.length > 1 ? 's' : ''} with AI
                                    </Button>
                                )}
                                {scanResult && editedItems.length > 0 && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setScanResult(null);
                                                setFiles([]);
                                                setFilePreviews([]);
                                                setEditedItems([]);
                                            }}
                                        >
                                            Scan More
                                        </Button>
                                        <Button
                                            onClick={handleConfirm}
                                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add {editedItems.length} {inventoryType === 'manufacturing' ? 'Materials' : 'Products'}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Item Form Dialog */}
            <Dialog open={editingItemIndex !== null} onOpenChange={closeEditForm}>
                <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit2 className="h-5 w-5 text-violet-600" />
                            Edit {inventoryType === 'manufacturing' ? 'Raw Material' : 'Product'}
                        </DialogTitle>
                        <DialogDescription>
                            Review and modify the extracted details. Costs include GST.
                        </DialogDescription>
                    </DialogHeader>

                    {editFormData && (
                        <div className="space-y-4 py-4">
                            {/* Name */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Name *</Label>
                                <Input
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className="col-span-3"
                                    placeholder="Enter product name"
                                />
                            </div>

                            {/* SKU */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">SKU *</Label>
                                <Input
                                    value={editFormData.sku}
                                    onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })}
                                    className="col-span-3"
                                    placeholder="Enter SKU code"
                                />
                            </div>

                            {/* HSN Code */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">HSN Code</Label>
                                <Input
                                    value={editFormData.hsnCode || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, hsnCode: e.target.value })}
                                    className="col-span-3"
                                    placeholder="HSN/SAC code (optional)"
                                />
                            </div>

                            {/* Description */}
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right pt-2">Description</Label>
                                <Textarea
                                    value={editFormData.description || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    className="col-span-3"
                                    placeholder="Enter description"
                                    rows={2}
                                />
                            </div>

                            {/* Category */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Category</Label>
                                <select
                                    value={editFormData.category}
                                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    {categoryOptions.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Unit */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Unit *</Label>
                                <select
                                    value={editFormData.unit}
                                    onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    {unitOptions.map(unit => (
                                        <option key={unit} value={unit}>{unit}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Quantity */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Quantity *</Label>
                                <Input
                                    type="number"
                                    value={editFormData.quantity}
                                    onChange={(e) => setEditFormData({ ...editFormData, quantity: parseFloat(e.target.value) || 0 })}
                                    className="col-span-3"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            {/* Pricing Section */}
                            <div className="border-t pt-4 mt-4">
                                <h4 className="font-medium mb-4 flex items-center gap-2">
                                    <Receipt className="h-4 w-4 text-violet-600" />
                                    Pricing & GST
                                </h4>

                                {/* Base Price */}
                                <div className="grid grid-cols-4 items-center gap-4 mb-4">
                                    <Label className="text-right">Base Price *</Label>
                                    <div className="col-span-3 relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                        <Input
                                            type="number"
                                            value={editFormData.basePrice || 0}
                                            onChange={(e) => {
                                                const base = parseFloat(e.target.value) || 0;
                                                const gstPct = editFormData.gstPercentage || 0;
                                                const gstAmt = base * gstPct / 100;
                                                setEditFormData({
                                                    ...editFormData,
                                                    basePrice: base,
                                                    gstAmount: gstAmt
                                                });
                                            }}
                                            className="pl-8"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                {/* GST Percentage */}
                                <div className="grid grid-cols-4 items-center gap-4 mb-4">
                                    <Label className="text-right">GST %</Label>
                                    <div className="col-span-3 flex gap-2">
                                        <select
                                            value={editFormData.gstPercentage || 0}
                                            onChange={(e) => {
                                                const gstPct = parseFloat(e.target.value) || 0;
                                                const base = editFormData.basePrice || 0;
                                                const gstAmt = base * gstPct / 100;
                                                setEditFormData({
                                                    ...editFormData,
                                                    gstPercentage: gstPct,
                                                    gstAmount: gstAmt
                                                });
                                            }}
                                            className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <option value={0}>0%</option>
                                            <option value={5}>5%</option>
                                            <option value={12}>12%</option>
                                            <option value={18}>18%</option>
                                            <option value={28}>28%</option>
                                        </select>
                                        <div className="flex-1 flex items-center justify-end text-sm">
                                            <span className="text-muted-foreground">GST Amount:</span>
                                            <span className="ml-2 font-medium text-amber-600">
                                                ₹{((editFormData.basePrice || 0) * (editFormData.gstPercentage || 0) / 100).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Final Cost (auto-calculated) */}
                                <div className="grid grid-cols-4 items-center gap-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <Label className="text-right font-semibold">Final Cost *</Label>
                                    <div className="col-span-3">
                                        <span className="text-xl font-bold text-green-600">
                                            ₹{((editFormData.basePrice || 0) + ((editFormData.basePrice || 0) * (editFormData.gstPercentage || 0) / 100)).toFixed(2)}
                                        </span>
                                        <span className="text-sm text-muted-foreground ml-2">per {editFormData.unit}</span>
                                        <p className="text-xs text-green-600 mt-1">
                                            (Base ₹{(editFormData.basePrice || 0).toFixed(2)} + GST ₹{((editFormData.basePrice || 0) * (editFormData.gstPercentage || 0) / 100).toFixed(2)})
                                        </p>
                                    </div>
                                </div>

                                {/* Selling Price (Trading only) */}
                                {inventoryType === 'trading' && (
                                    <div className="grid grid-cols-4 items-center gap-4 mt-4">
                                        <Label className="text-right">Selling Price *</Label>
                                        <div className="col-span-3 relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                            <Input
                                                type="number"
                                                value={editFormData.sellingPrice}
                                                onChange={(e) => setEditFormData({ ...editFormData, sellingPrice: parseFloat(e.target.value) || 0 })}
                                                className="pl-8"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Detailed Total Calculation Preview */}
                            <div className="pt-4 border-t space-y-3">
                                <h4 className="font-medium text-sm text-muted-foreground">Calculation Preview</h4>

                                {/* Base Total Row */}
                                <div className="grid grid-cols-4 items-center gap-4 p-3 bg-muted/30 rounded-lg">
                                    <Label className="text-right">Base Total</Label>
                                    <div className="col-span-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-semibold">
                                                {editFormData.quantity} × ₹{(editFormData.basePrice || 0).toFixed(2)}
                                            </span>
                                            <span className="text-muted-foreground">=</span>
                                        </div>
                                        <span className="text-lg font-bold">
                                            ₹{((editFormData.basePrice || 0) * (editFormData.quantity || 0)).toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* GST Amount Row */}
                                {(editFormData.gstPercentage || 0) > 0 && (
                                    <div className="grid grid-cols-4 items-center gap-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                        <Label className="text-right">GST ({editFormData.gstPercentage}%)</Label>
                                        <div className="col-span-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-semibold text-amber-700 dark:text-amber-400">
                                                    {editFormData.quantity} × ₹{((editFormData.basePrice || 0) * (editFormData.gstPercentage || 0) / 100).toFixed(2)}
                                                </span>
                                                <span className="text-muted-foreground">=</span>
                                            </div>
                                            <span className="text-lg font-bold text-amber-600">
                                                ₹{(((editFormData.basePrice || 0) * (editFormData.gstPercentage || 0) / 100) * (editFormData.quantity || 0)).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Grand Total Row */}
                                <div className="grid grid-cols-4 items-center gap-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg border border-green-200 dark:border-green-800">
                                    <Label className="text-right font-semibold text-green-700 dark:text-green-400">Total Value</Label>
                                    <div className="col-span-3">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-green-600">
                                                ₹{((editFormData.basePrice || 0) * (editFormData.quantity || 0)).toFixed(2)}
                                                {(editFormData.gstPercentage || 0) > 0 && (
                                                    <> + ₹{(((editFormData.basePrice || 0) * (editFormData.gstPercentage || 0) / 100) * (editFormData.quantity || 0)).toFixed(2)} GST</>
                                                )}
                                            </div>
                                            <span className="text-2xl font-bold text-green-600">
                                                ₹{(((editFormData.basePrice || 0) + ((editFormData.basePrice || 0) * (editFormData.gstPercentage || 0) / 100)) * (editFormData.quantity || 0)).toFixed(2)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-green-600/70 mt-1">
                                            {editFormData.quantity} {editFormData.unit} × ₹{((editFormData.basePrice || 0) + ((editFormData.basePrice || 0) * (editFormData.gstPercentage || 0) / 100)).toFixed(2)} per {editFormData.unit}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Confidence */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">AI Confidence</Label>
                                <div className="col-span-3">
                                    {getConfidenceBadge(editFormData.confidence)}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={closeEditForm}>
                            Cancel
                        </Button>
                        <Button onClick={saveEditForm} className="bg-gradient-to-r from-violet-500 to-purple-500 text-white">
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
