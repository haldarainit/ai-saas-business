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
    Edit2, Trash2, Plus, Loader2, ScanLine, Eye, FileCheck, Save
} from 'lucide-react';

export default function InvoiceScanner({
    isOpen,
    onClose,
    inventoryType = 'trading', // 'trading' or 'manufacturing'
    onProductsConfirmed,
    existingCategories = []
}) {
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [editingItemIndex, setEditingItemIndex] = useState(null);
    const [editFormData, setEditFormData] = useState(null);
    const [editedItems, setEditedItems] = useState([]);
    const fileInputRef = useRef(null);

    const unitOptions = ['pcs', 'kg', 'g', 'ltr', 'ml', 'meter', 'cm', 'sqft', 'sqm', 'unit', 'box', 'pack'];
    const categoryOptions = inventoryType === 'manufacturing'
        ? ['Uncategorized', 'Metals', 'Plastics', 'Polymers', 'Electronics', 'Chemicals', 'Glass', 'Wood', 'Textiles', 'Hardware', 'Packaging', 'Consumables', 'Other']
        : ['Uncategorized', 'Electronics', 'Clothing', 'Food', 'Furniture', 'Automotive', 'Industrial', 'Office Supplies', 'Hardware', 'Other'];

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setScanResult(null);
            setEditedItems([]);

            // Create preview for images
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFilePreview(reader.result);
                };
                reader.readAsDataURL(selectedFile);
            } else {
                setFilePreview(null);
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            setFile(droppedFile);
            setScanResult(null);
            setEditedItems([]);

            if (droppedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFilePreview(reader.result);
                };
                reader.readAsDataURL(droppedFile);
            } else {
                setFilePreview(null);
            }
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleScan = async () => {
        if (!file) return;

        setScanning(true);
        setScanResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('inventoryType', inventoryType);

            const response = await fetch('/api/inventory/scan-invoice', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const data = await response.json();

            if (data.items && data.items.length > 0) {
                setScanResult(data);
                setEditedItems(data.items);
            } else {
                setScanResult({
                    error: data.message || 'No products found in the invoice',
                    items: []
                });
            }
        } catch (error) {
            console.error('Scan error:', error);
            setScanResult({
                error: 'Failed to scan invoice. Please try again.',
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
            // Recalculate total cost
            if (inventoryType === 'manufacturing') {
                editFormData.totalCost = (parseFloat(editFormData.costPerUnit) || 0) * (parseFloat(editFormData.quantity) || 0);
            } else {
                editFormData.totalCost = (parseFloat(editFormData.costPrice) || 0) * (parseFloat(editFormData.quantity) || 0);
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
        setFile(null);
        setFilePreview(null);
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
                <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-hidden flex flex-col">
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
                            Upload an invoice (PDF or Image) and our AI will automatically extract {inventoryType === 'manufacturing' ? 'raw materials' : 'products'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-4 py-4">
                        {/* File Upload Section */}
                        {!scanResult && !scanning && (
                            <div
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                                    ${file ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'}`}
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
                                />

                                {file ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                                            {file.type === 'application/pdf'
                                                ? <FileText className="h-10 w-10 text-green-600" />
                                                : <Image className="h-10 w-10 text-green-600" />
                                            }
                                        </div>
                                        <div>
                                            <p className="font-semibold text-green-700 dark:text-green-400">{file.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1].toUpperCase()}
                                            </p>
                                        </div>
                                        {filePreview && (
                                            <div className="mt-2 max-w-xs max-h-48 overflow-hidden rounded-lg border">
                                                <img src={filePreview} alt="Preview" className="object-contain w-full h-full" />
                                            </div>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFile(null);
                                                setFilePreview(null);
                                            }}
                                        >
                                            <X className="h-4 w-4 mr-1" /> Change File
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-4 bg-muted/50 rounded-full">
                                            <Upload className="h-10 w-10 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">Drop your invoice here</p>
                                            <p className="text-sm text-muted-foreground">
                                                or click to browse • PDF, PNG, JPG, WEBP
                                            </p>
                                        </div>
                                    </div>
                                )}
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
                                <p className="mt-6 text-lg font-semibold">Analyzing Invoice with AI...</p>
                                <p className="text-sm text-muted-foreground">
                                    Extracting {inventoryType === 'manufacturing' ? 'raw materials' : 'products'} and details
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
                                {/* Invoice Info Header */}
                                {scanResult.supplier && (
                                    <div className="p-4 rounded-lg border bg-muted/30">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Supplier</p>
                                                <p className="font-semibold">{scanResult.supplier.name || 'Unknown'}</p>
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
                                    </div>
                                )}

                                {/* Error Message */}
                                {scanResult.error && editedItems.length === 0 && (
                                    <div className="p-6 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 text-center">
                                        <AlertTriangle className="h-10 w-10 mx-auto text-red-500 mb-2" />
                                        <p className="font-semibold text-red-700 dark:text-red-400">{scanResult.error}</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-3"
                                            onClick={() => {
                                                setScanResult(null);
                                                setFile(null);
                                                setFilePreview(null);
                                            }}
                                        >
                                            Try Another File
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
                                                Click Edit to review each item
                                            </div>
                                        </div>

                                        <div className="max-h-[350px] overflow-y-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[250px]">Name</TableHead>
                                                        <TableHead>SKU</TableHead>
                                                        <TableHead>Category</TableHead>
                                                        <TableHead className="text-center">Qty</TableHead>
                                                        <TableHead className="text-right">
                                                            {inventoryType === 'manufacturing' ? 'Cost/Unit' : 'Cost'}
                                                        </TableHead>
                                                        {inventoryType === 'trading' && (
                                                            <TableHead className="text-right">Sell Price</TableHead>
                                                        )}
                                                        <TableHead className="text-center">Status</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {editedItems.map((item, index) => (
                                                        <TableRow
                                                            key={item.id}
                                                            className={item.needsReview ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}
                                                        >
                                                            <TableCell>
                                                                <div>
                                                                    <p className="font-medium">{item.name}</p>
                                                                    {item.description && (
                                                                        <p className="text-xs text-muted-foreground truncate max-w-[230px]">
                                                                            {item.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{item.sku}</code>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="text-xs">{item.category}</Badge>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <span className="font-medium">{item.quantity} {item.unit}</span>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <span className="font-medium text-amber-600">
                                                                    ₹{(inventoryType === 'manufacturing' ? item.costPerUnit : item.costPrice)?.toFixed(2)}
                                                                </span>
                                                            </TableCell>
                                                            {inventoryType === 'trading' && (
                                                                <TableCell className="text-right">
                                                                    <span className="font-medium text-green-600">
                                                                        ₹{item.sellingPrice?.toFixed(2)}
                                                                    </span>
                                                                </TableCell>
                                                            )}
                                                            <TableCell className="text-center">
                                                                {getConfidenceBadge(item.confidence)}
                                                            </TableCell>
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
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Total Summary */}
                                        <div className="px-4 py-3 bg-muted/30 border-t flex justify-between items-center">
                                            <div className="text-sm text-muted-foreground">
                                                {editedItems.filter(i => i.needsReview).length > 0 && (
                                                    <span className="flex items-center gap-1 text-yellow-600">
                                                        <AlertTriangle className="h-4 w-4" />
                                                        {editedItems.filter(i => i.needsReview).length} items need review
                                                    </span>
                                                )}
                                            </div>
                                            <div className="font-semibold">
                                                Total: ₹{editedItems.reduce((sum, i) => sum + (i.totalCost || 0), 0).toFixed(2)}
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
                                {!scanResult && file && !scanning && (
                                    <Button
                                        onClick={handleScan}
                                        className="bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600"
                                    >
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Scan with AI
                                    </Button>
                                )}
                                {scanResult && editedItems.length > 0 && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setScanResult(null);
                                                setFile(null);
                                                setFilePreview(null);
                                                setEditedItems([]);
                                            }}
                                        >
                                            Scan Another
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
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit2 className="h-5 w-5 text-violet-600" />
                            Edit {inventoryType === 'manufacturing' ? 'Raw Material' : 'Product'}
                        </DialogTitle>
                        <DialogDescription>
                            Review and modify the extracted details before adding to inventory
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

                            {/* Cost Per Unit (Manufacturing) or Cost Price (Trading) */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">{inventoryType === 'manufacturing' ? 'Cost/Unit *' : 'Cost Price *'}</Label>
                                <div className="col-span-3 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                    <Input
                                        type="number"
                                        value={inventoryType === 'manufacturing' ? editFormData.costPerUnit : editFormData.costPrice}
                                        onChange={(e) => setEditFormData({
                                            ...editFormData,
                                            [inventoryType === 'manufacturing' ? 'costPerUnit' : 'costPrice']: parseFloat(e.target.value) || 0
                                        })}
                                        className="pl-8"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            {/* Selling Price (Trading only) */}
                            {inventoryType === 'trading' && (
                                <div className="grid grid-cols-4 items-center gap-4">
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

                            {/* Confidence Indicator */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">AI Confidence</Label>
                                <div className="col-span-3">
                                    {getConfidenceBadge(editFormData.confidence)}
                                    <span className="ml-2 text-sm text-muted-foreground">
                                        {editFormData.confidence === 'low' && '- Please verify all fields'}
                                        {editFormData.confidence === 'medium' && '- Some fields may need review'}
                                        {editFormData.confidence === 'high' && '- Data looks accurate'}
                                    </span>
                                </div>
                            </div>

                            {/* Cost Summary */}
                            <div className="grid grid-cols-4 items-center gap-4 pt-2 border-t">
                                <Label className="text-right font-semibold">Total Cost</Label>
                                <div className="col-span-3">
                                    <span className="text-lg font-bold text-violet-600">
                                        ₹{((inventoryType === 'manufacturing' ? editFormData.costPerUnit : editFormData.costPrice) * editFormData.quantity).toFixed(2)}
                                    </span>
                                    <span className="text-sm text-muted-foreground ml-2">
                                        ({editFormData.quantity} × ₹{(inventoryType === 'manufacturing' ? editFormData.costPerUnit : editFormData.costPrice)?.toFixed(2)})
                                    </span>
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
