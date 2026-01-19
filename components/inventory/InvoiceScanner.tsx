'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
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

// Type definitions
interface SupplierInfo {
    name?: string;
    gstin?: string;
    contact?: string;
    invoiceNumber?: string;
    invoiceDate?: string | null;
}

interface ScannedItem {
    id?: string;
    name: string;
    sku: string;
    hsnCode?: string;
    description?: string;
    category: string;
    unit: string;
    quantity: number;
    basePrice: number;
    gstPercentage: number;
    gstAmount: number;
    costPrice?: number;
    costPerUnit?: number;
    sellingPrice?: number;
    totalCost: number;
    confidence?: 'high' | 'medium' | 'low';
    needsReview?: boolean;
}

interface ScanResult {
    items: ScannedItem[];
    supplier?: SupplierInfo;
    invoiceNumber?: string;
    invoiceDate?: string;
    filesProcessed?: Array<{ name: string; status: string; itemCount?: number }>;
    error?: string;
    errorType?: string;
    retryAfter?: number;
    message?: string;
}

interface FilePreview {
    name: string;
    preview: string;
}

interface InvoiceScannerProps {
    isOpen: boolean;
    onClose: () => void;
    inventoryType?: 'trading' | 'manufacturing';
    onProductsConfirmed: (items: ScannedItem[], supplierInfo: SupplierInfo) => void;
    existingCategories?: string[];
}

export default function InvoiceScanner({
    isOpen,
    onClose,
    inventoryType = 'trading',
    onProductsConfirmed,
    existingCategories = []
}: InvoiceScannerProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
    const [scanning, setScanning] = useState<boolean>(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [editFormData, setEditFormData] = useState<ScannedItem | null>(null);
    const [editedItems, setEditedItems] = useState<ScannedItem[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const unitOptions: string[] = ['pcs', 'kg', 'g', 'ltr', 'ml', 'meter', 'cm', 'sqft', 'sqm', 'unit', 'box', 'pack', 'set', 'pair', 'roll', 'bundle', 'dozen', 'ton', 'quintal', 'nos', 'mt', 'bag', 'carton', 'sheet', 'feet', 'inch'];

    const tradingCategories: string[] = [
        'Uncategorized',
        'Plumbing', 'Sanitary Ware', 'Pipes & Fittings', 'Valves & Taps', 'Bathroom Accessories',
        'Electrical', 'Wires & Cables', 'Switches & Sockets', 'Lighting', 'Electrical Fittings',
        'Construction Materials', 'Cement & Concrete', 'Tiles & Flooring', 'Paints & Coatings', 'Adhesives & Sealants',
        'Hardware', 'Fasteners', 'Tools & Equipment', 'Locks & Security', 'Door & Window Fittings',
        'Furniture', 'Home Decor', 'Kitchen & Dining', 'Storage & Organization',
        'Industrial Supplies', 'Safety Equipment', 'Machinery Parts', 'Bearings & Belts',
        'Electronics', 'Automotive', 'Clothing & Textiles', 'Food & Beverages', 'Office Supplies',
        'Stationery', 'Packaging Materials', 'Chemicals', 'Agricultural', 'Medical Supplies',
        'Sports & Fitness', 'Toys & Games', 'Pet Supplies', 'Gardening',
        'Other'
    ];

    const manufacturingCategories: string[] = [
        'Uncategorized',
        'Metals', 'Steel', 'Aluminum', 'Copper', 'Brass', 'Iron',
        'Plastics', 'Polymers', 'Rubber', 'PVC', 'CPVC', 'HDPE', 'ABS',
        'Cement', 'Sand & Aggregates', 'Bricks & Blocks', 'Tiles', 'Glass', 'Wood & Timber',
        'Chemicals', 'Solvents', 'Adhesives', 'Paints', 'Coatings', 'Lubricants',
        'Electronics Components', 'Electrical Components', 'Mechanical Parts', 'Fasteners',
        'Bearings', 'Springs', 'Gaskets & Seals',
        'Fabrics', 'Textiles', 'Threads & Yarns', 'Leather',
        'Packaging', 'Consumables', 'Safety Gear', 'Tools', 'Hardware',
        'Plumbing Components', 'Pipe Fittings', 'Valves', 'Connectors',
        'Other'
    ];

    const categoryOptions = inventoryType === 'manufacturing' ? manufacturingCategories : tradingCategories;

    const normalizeUnit = (unit: string | undefined): string => {
        if (!unit) return 'pcs';
        const lowerUnit = unit.toLowerCase().trim();

        const unitMap: Record<string, string> = {
            'pcs': 'pcs', 'pc': 'pcs', 'piece': 'pcs', 'pieces': 'pcs',
            'no': 'nos', 'nos': 'nos', 'no.': 'nos', 'nos.': 'nos', 'number': 'nos', 'numbers': 'nos',
            'kg': 'kg', 'kgs': 'kg', 'kilogram': 'kg', 'kilograms': 'kg',
            'g': 'g', 'gm': 'g', 'gms': 'g', 'gram': 'g', 'grams': 'g',
            'ltr': 'ltr', 'l': 'ltr', 'litre': 'ltr', 'liter': 'ltr', 'litres': 'ltr', 'liters': 'ltr',
            'ml': 'ml', 'milliliter': 'ml', 'millilitre': 'ml',
            'meter': 'meter', 'mtr': 'meter', 'm': 'meter', 'meters': 'meter', 'mtrs': 'meter',
            'cm': 'cm', 'centimeter': 'cm', 'centimetre': 'cm',
            'sqft': 'sqft', 'sq ft': 'sqft', 'sq.ft': 'sqft', 'square feet': 'sqft',
            'sqm': 'sqm', 'sq m': 'sqm', 'sq.m': 'sqm', 'square meter': 'sqm',
            'unit': 'unit', 'units': 'unit',
            'box': 'box', 'boxes': 'box',
            'pack': 'pack', 'pkt': 'pack', 'packet': 'pack', 'packets': 'pack', 'packs': 'pack',
            'set': 'set', 'sets': 'set',
            'pair': 'pair', 'pairs': 'pair', 'pr': 'pair',
            'roll': 'roll', 'rolls': 'roll',
            'bundle': 'bundle', 'bundles': 'bundle',
            'dozen': 'dozen', 'dz': 'dozen', 'dzn': 'dozen',
            'ton': 'ton', 'tons': 'ton', 'tonne': 'ton', 'tonnes': 'ton',
            'quintal': 'quintal', 'quintals': 'quintal', 'qtl': 'quintal',
            'mt': 'mt', 'metric ton': 'mt', 'metric tons': 'mt',
            'bag': 'bag', 'bags': 'bag',
            'carton': 'carton', 'cartons': 'carton', 'ctn': 'carton',
            'sheet': 'sheet', 'sheets': 'sheet',
            'feet': 'feet', 'ft': 'feet', 'foot': 'feet',
            'inch': 'inch', 'inches': 'inch', 'in': 'inch'
        };

        return unitMap[lowerUnit] || (unitOptions.includes(lowerUnit) ? lowerUnit : 'pcs');
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length > 0) {
            setFiles(prev => [...prev, ...selectedFiles]);
            setScanResult(null);
            setEditedItems([]);

            selectedFiles.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setFilePreviews(prev => [...prev, { name: file.name, preview: reader.result as string }]);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
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
                        setFilePreviews(prev => [...prev, { name: file.name, preview: reader.result as string }]);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const removeFile = (index: number) => {
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
                const validatedItems = data.items.map((item: ScannedItem) => {
                    let category = item.category || 'Other';

                    if (!categoryOptions.includes(category)) {
                        const lowerCategory = category.toLowerCase();
                        const matchedCategory = categoryOptions.find(cat =>
                            cat.toLowerCase() === lowerCategory ||
                            cat.toLowerCase().includes(lowerCategory) ||
                            lowerCategory.includes(cat.toLowerCase())
                        );

                        if (matchedCategory) {
                            category = matchedCategory;
                        } else {
                            if (lowerCategory.includes('pipe') || lowerCategory.includes('fitting')) {
                                category = categoryOptions.find(c => c.includes('Pipe') || c.includes('Plumbing')) || 'Plumbing';
                            } else if (lowerCategory.includes('tap') || lowerCategory.includes('valve')) {
                                category = categoryOptions.find(c => c.includes('Valve') || c.includes('Tap')) || 'Valves & Taps';
                            } else {
                                category = 'Other';
                            }
                        }
                    }

                    const normalizedUnit = normalizeUnit(item.unit);
                    return { ...item, category, unit: normalizedUnit };
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

    const openEditForm = (index: number) => {
        setEditingItemIndex(index);
        setEditFormData({ ...editedItems[index] });
    };

    const saveEditForm = () => {
        if (editingItemIndex !== null && editFormData) {
            const updated = [...editedItems];
            const basePrice = parseFloat(String(editFormData.basePrice)) || 0;
            const gstPercentage = parseFloat(String(editFormData.gstPercentage)) || 0;
            const gstAmount = basePrice * gstPercentage / 100;
            const quantity = parseFloat(String(editFormData.quantity)) || 0;
            const normalizedUnit = normalizeUnit(editFormData.unit);

            const updatedItem: ScannedItem = {
                ...editFormData,
                gstAmount: gstAmount,
                unit: normalizedUnit,
                quantity: quantity,
                basePrice: basePrice,
                gstPercentage: gstPercentage,
                totalCost: 0
            };

            if (inventoryType === 'manufacturing') {
                updatedItem.costPerUnit = basePrice + gstAmount;
                updatedItem.totalCost = updatedItem.costPerUnit * quantity;
            } else {
                updatedItem.costPrice = basePrice + gstAmount;
                updatedItem.totalCost = updatedItem.costPrice * quantity;
                updatedItem.sellingPrice = parseFloat(String(editFormData.sellingPrice)) || (updatedItem.costPrice * 1.25);
            }

            updated[editingItemIndex] = updatedItem;
            setEditedItems(updated);
            setEditingItemIndex(null);
            setEditFormData(null);
        }
    };

    const closeEditForm = () => {
        setEditingItemIndex(null);
        setEditFormData(null);
    };

    const handleItemRemove = (index: number) => {
        setEditedItems(editedItems.filter((_, i) => i !== index));
    };

    const handleConfirm = () => {
        if (editedItems.length > 0) {
            const supplierInfo: SupplierInfo = {
                ...scanResult?.supplier,
                invoiceNumber: scanResult?.invoiceNumber || '',
                invoiceDate: scanResult?.invoiceDate || null
            };
            onProductsConfirmed(editedItems, supplierInfo);
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

    const getConfidenceBadge = (confidence: string | undefined) => {
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

                        {/* Results section - truncated for brevity, same JSX as original */}
                        {scanResult && !scanning && editedItems.length > 0 && (
                            <div className="space-y-4">
                                <div className="rounded-lg border overflow-hidden">
                                    <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 px-4 py-3 border-b flex items-center justify-between">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <FileCheck className="h-4 w-4 text-violet-600" />
                                            Extracted {inventoryType === 'manufacturing' ? 'Raw Materials' : 'Products'}
                                            <Badge variant="secondary">{editedItems.length} items</Badge>
                                        </h4>
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
                                                    <TableHead className="text-right">Total</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {editedItems.map((item, index) => (
                                                    <TableRow key={item.id || index}>
                                                        <TableCell>
                                                            <p className="font-medium truncate max-w-[160px]">{item.name}</p>
                                                        </TableCell>
                                                        <TableCell>
                                                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{item.sku}</code>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <span className="font-medium">{item.quantity} {item.unit}</span>
                                                        </TableCell>
                                                        <TableCell className="text-right">₹{item.basePrice?.toFixed(2)}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant="outline" className="text-xs">{item.gstPercentage || 0}%</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold text-green-600">
                                                            ₹{item.totalCost?.toFixed(2)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <Button variant="outline" size="sm" className="h-8" onClick={() => openEditForm(index)}>
                                                                    <Edit2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleItemRemove(index)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="border-t pt-4">
                        <div className="flex justify-between w-full">
                            <Button variant="outline" onClick={handleClose}>Cancel</Button>
                            <div className="flex gap-2">
                                {!scanResult && files.length > 0 && !scanning && (
                                    <Button onClick={handleScan} className="bg-gradient-to-r from-violet-500 to-purple-500 text-white">
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Scan {files.length} File{files.length > 1 ? 's' : ''} with AI
                                    </Button>
                                )}
                                {scanResult && editedItems.length > 0 && (
                                    <Button onClick={handleConfirm} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add {editedItems.length} {inventoryType === 'manufacturing' ? 'Materials' : 'Products'}
                                    </Button>
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
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Name *</Label>
                                <Input
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">SKU *</Label>
                                <Input
                                    value={editFormData.sku}
                                    onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Quantity *</Label>
                                <Input
                                    type="number"
                                    value={editFormData.quantity}
                                    onChange={(e) => setEditFormData({ ...editFormData, quantity: parseFloat(e.target.value) || 0 })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Base Price *</Label>
                                <Input
                                    type="number"
                                    value={editFormData.basePrice || 0}
                                    onChange={(e) => setEditFormData({ ...editFormData, basePrice: parseFloat(e.target.value) || 0 })}
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={closeEditForm}>Cancel</Button>
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
