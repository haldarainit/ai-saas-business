"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    ArrowLeft,
    Printer,
    Cloud,
    CloudOff,
    Building2,
    Plus,
    Trash2,
    Upload,
    Bold,
    Italic,
    Underline,
    AlignLeft,
    AlignCenter,
    AlignRight,
    List,
    ListOrdered,
    Table,
    Type,
    FileText,
    Loader2,
    Image as ImageIcon
} from "lucide-react"
import Link from "next/link"
import { useReactToPrint } from 'react-to-print'
import { useDebounce } from "@/hooks/use-debounce"
import Navbar from "@/components/navbar"

// Types
interface TableData {
    headers: string[]
    rows: string[][]
}

interface ContentBlock {
    id: string
    type: 'heading' | 'paragraph' | 'list' | 'table' | 'image'
    content: string
    items?: string[]
    tableData?: TableData
    imageUrl?: string
    style?: {
        fontSize?: number
        fontWeight?: 'normal' | 'bold'
        fontStyle?: 'normal' | 'italic'
        textDecoration?: 'none' | 'underline'
        textAlign?: 'left' | 'center' | 'right'
        color?: string
    }
}

interface QuotationData {
    title: string
    refNo: string
    date: string

    // Company Details
    companyName: string
    companyLogo: string
    companyGSTIN: string
    companyPhone: string
    companyEmail: string
    companyAddress: string

    // Client Details
    clientName: string
    clientDesignation: string
    clientCompany: string
    clientAddress: string

    // Subject
    subject: string
    greeting: string

    // Content blocks
    contentBlocks: ContentBlock[]

    // Footer
    footerLine1: string
    footerLine2: string
    footerLine3: string

    // Signature
    signatureName: string
    signatureDesignation: string

    // Watermark
    watermarkText: string
    watermarkOpacity: number
}

const defaultQuotationData: QuotationData = {
    title: "TECHNO-COMMERCIAL QUOTATION",
    refNo: "QT/2025/001",
    date: new Date().toISOString().split('T')[0],

    companyName: "Your Company Name",
    companyLogo: "",
    companyGSTIN: "22AAJCP7742A1ZP",
    companyPhone: "+91-8349873989",
    companyEmail: "info@company.com",
    companyAddress: "Plot No. 173, Engineering Park, Hathkhoj, Bhilai, 490026",

    clientName: "",
    clientDesignation: "",
    clientCompany: "",
    clientAddress: "",

    subject: "Offer for Supply of Equipment",
    greeting: "Dear Sir,",

    contentBlocks: [
        {
            id: "1",
            type: "paragraph",
            content: "We thank you for the opportunity to submit our techno-commercial quotation.",
            style: { fontSize: 11, fontWeight: 'normal', textAlign: 'left' }
        }
    ],

    footerLine1: "Your Products | Your Services | Your Solutions",
    footerLine2: "Additional Services | Customized Solutions",
    footerLine3: "Authorized Signatory: Your Name - Your Position",

    signatureName: "Authorized Signatory",
    signatureDesignation: "Manager",

    watermarkText: "CONFIDENTIAL",
    watermarkOpacity: 0.08
}

export default function QuotationPage() {
    const params = useParams()
    const router = useRouter()
    const printRef = useRef<HTMLDivElement>(null)

    const [quotationData, setQuotationData] = useState<QuotationData>(defaultQuotationData)
    const [activeTab, setActiveTab] = useState("company")
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)

    // Fetch quotation data
    useEffect(() => {
        const fetchQuotation = async () => {
            try {
                const res = await fetch(`/api/techno-quotation/${params.id}`)
                if (!res.ok) {
                    router.push('/accounting/techno-quotation')
                    return
                }
                const data = await res.json()
                if (data.quotation) {
                    const q = data.quotation
                    setQuotationData({
                        ...defaultQuotationData,
                        title: q.title || defaultQuotationData.title,
                        refNo: q.refNo || defaultQuotationData.refNo,
                        date: q.date || defaultQuotationData.date,
                        companyName: q.companyDetails?.name || defaultQuotationData.companyName,
                        companyLogo: q.companyDetails?.logo || "",
                        companyGSTIN: q.companyDetails?.gstin || defaultQuotationData.companyGSTIN,
                        companyPhone: q.companyDetails?.phone || defaultQuotationData.companyPhone,
                        companyEmail: q.companyDetails?.email || defaultQuotationData.companyEmail,
                        companyAddress: q.companyDetails?.address || defaultQuotationData.companyAddress,
                        clientName: q.clientDetails?.name || "",
                        clientDesignation: q.clientDetails?.designation || "",
                        clientCompany: q.clientDetails?.company || "",
                        clientAddress: q.clientDetails?.address || "",
                        subject: q.subject || defaultQuotationData.subject,
                        greeting: q.greeting || defaultQuotationData.greeting,
                        contentBlocks: q.contentBlocks || defaultQuotationData.contentBlocks,
                        footerLine1: q.footer?.line1 || defaultQuotationData.footerLine1,
                        footerLine2: q.footer?.line2 || defaultQuotationData.footerLine2,
                        footerLine3: q.footer?.line3 || defaultQuotationData.footerLine3,
                        signatureName: q.signature?.name || defaultQuotationData.signatureName,
                        signatureDesignation: q.signature?.designation || defaultQuotationData.signatureDesignation,
                        watermarkText: q.watermark?.text || defaultQuotationData.watermarkText,
                        watermarkOpacity: q.watermark?.opacity || defaultQuotationData.watermarkOpacity,
                    })
                    setLastSaved(new Date())
                }
            } catch (error) {
                console.error("Error loading quotation:", error)
            } finally {
                setIsLoading(false)
            }
        }

        if (params.id) {
            fetchQuotation()
        }
    }, [params.id, router])

    // Auto-save
    const debouncedData = useDebounce(quotationData, 2000)

    useEffect(() => {
        if (!isLoading && lastSaved) {
            setHasChanges(true)
        }
    }, [quotationData, isLoading])

    useEffect(() => {
        if (isLoading || !hasChanges) return

        const saveQuotation = async () => {
            setIsSaving(true)
            try {
                const payload = {
                    title: debouncedData.title,
                    refNo: debouncedData.refNo,
                    date: debouncedData.date,
                    companyDetails: {
                        name: debouncedData.companyName,
                        logo: debouncedData.companyLogo,
                        gstin: debouncedData.companyGSTIN,
                        phone: debouncedData.companyPhone,
                        email: debouncedData.companyEmail,
                        address: debouncedData.companyAddress,
                    },
                    clientDetails: {
                        name: debouncedData.clientName,
                        designation: debouncedData.clientDesignation,
                        company: debouncedData.clientCompany,
                        address: debouncedData.clientAddress,
                    },
                    subject: debouncedData.subject,
                    greeting: debouncedData.greeting,
                    contentBlocks: debouncedData.contentBlocks,
                    footer: {
                        line1: debouncedData.footerLine1,
                        line2: debouncedData.footerLine2,
                        line3: debouncedData.footerLine3,
                    },
                    signature: {
                        name: debouncedData.signatureName,
                        designation: debouncedData.signatureDesignation,
                    },
                    watermark: {
                        text: debouncedData.watermarkText,
                        opacity: debouncedData.watermarkOpacity,
                    }
                }

                await fetch(`/api/techno-quotation/${params.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                setLastSaved(new Date())
                setHasChanges(false)
            } catch (error) {
                console.error("Error saving:", error)
            } finally {
                setIsSaving(false)
            }
        }

        saveQuotation()
    }, [debouncedData, params.id, isLoading, hasChanges])

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: quotationData.refNo,
    })

    // Content block handlers
    const addBlock = (type: ContentBlock['type']) => {
        const newBlock: ContentBlock = {
            id: Date.now().toString(),
            type,
            content: type === 'heading' ? 'New Heading' : 'New paragraph text...',
            items: type === 'list' ? ['Item 1'] : undefined,
            tableData: type === 'table' ? { headers: ['Column 1', 'Column 2'], rows: [['', '']] } : undefined,
            style: { fontSize: type === 'heading' ? 14 : 11, fontWeight: type === 'heading' ? 'bold' : 'normal', textAlign: 'left' }
        }
        setQuotationData(prev => ({
            ...prev,
            contentBlocks: [...prev.contentBlocks, newBlock]
        }))
        setSelectedBlockId(newBlock.id)
    }

    const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
        setQuotationData(prev => ({
            ...prev,
            contentBlocks: prev.contentBlocks.map(block =>
                block.id === id ? { ...block, ...updates } : block
            )
        }))
    }

    const deleteBlock = (id: string) => {
        setQuotationData(prev => ({
            ...prev,
            contentBlocks: prev.contentBlocks.filter(block => block.id !== id)
        }))
        if (selectedBlockId === id) setSelectedBlockId(null)
    }

    const addListItem = (blockId: string) => {
        setQuotationData(prev => ({
            ...prev,
            contentBlocks: prev.contentBlocks.map(block =>
                block.id === blockId && block.items
                    ? { ...block, items: [...block.items, ''] }
                    : block
            )
        }))
    }

    const updateListItem = (blockId: string, index: number, value: string) => {
        setQuotationData(prev => ({
            ...prev,
            contentBlocks: prev.contentBlocks.map(block =>
                block.id === blockId && block.items
                    ? { ...block, items: block.items.map((item, i) => i === index ? value : item) }
                    : block
            )
        }))
    }

    const deleteListItem = (blockId: string, index: number) => {
        setQuotationData(prev => ({
            ...prev,
            contentBlocks: prev.contentBlocks.map(block =>
                block.id === blockId && block.items && block.items.length > 1
                    ? { ...block, items: block.items.filter((_, i) => i !== index) }
                    : block
            )
        }))
    }

    const addTableRow = (blockId: string) => {
        setQuotationData(prev => ({
            ...prev,
            contentBlocks: prev.contentBlocks.map(block =>
                block.id === blockId && block.tableData
                    ? {
                        ...block,
                        tableData: {
                            ...block.tableData,
                            rows: [...block.tableData.rows, new Array(block.tableData.headers.length).fill('')]
                        }
                    }
                    : block
            )
        }))
    }

    const addTableColumn = (blockId: string) => {
        setQuotationData(prev => ({
            ...prev,
            contentBlocks: prev.contentBlocks.map(block =>
                block.id === blockId && block.tableData
                    ? {
                        ...block,
                        tableData: {
                            headers: [...block.tableData.headers, 'New Column'],
                            rows: block.tableData.rows.map(row => [...row, ''])
                        }
                    }
                    : block
            )
        }))
    }

    const updateTableCell = (blockId: string, rowIndex: number, colIndex: number, value: string) => {
        setQuotationData(prev => ({
            ...prev,
            contentBlocks: prev.contentBlocks.map(block =>
                block.id === blockId && block.tableData
                    ? {
                        ...block,
                        tableData: {
                            ...block.tableData,
                            rows: block.tableData.rows.map((row, ri) =>
                                ri === rowIndex
                                    ? row.map((cell, ci) => ci === colIndex ? value : cell)
                                    : row
                            )
                        }
                    }
                    : block
            )
        }))
    }

    const updateTableHeader = (blockId: string, colIndex: number, value: string) => {
        setQuotationData(prev => ({
            ...prev,
            contentBlocks: prev.contentBlocks.map(block =>
                block.id === blockId && block.tableData
                    ? {
                        ...block,
                        tableData: {
                            ...block.tableData,
                            headers: block.tableData.headers.map((h, i) => i === colIndex ? value : h)
                        }
                    }
                    : block
            )
        }))
    }

    const deleteTableRow = (blockId: string, rowIndex: number) => {
        setQuotationData(prev => ({
            ...prev,
            contentBlocks: prev.contentBlocks.map(block =>
                block.id === blockId && block.tableData && block.tableData.rows.length > 1
                    ? {
                        ...block,
                        tableData: {
                            ...block.tableData,
                            rows: block.tableData.rows.filter((_, i) => i !== rowIndex)
                        }
                    }
                    : block
            )
        }))
    }

    const deleteTableColumn = (blockId: string, colIndex: number) => {
        setQuotationData(prev => ({
            ...prev,
            contentBlocks: prev.contentBlocks.map(block =>
                block.id === blockId && block.tableData && block.tableData.headers.length > 1
                    ? {
                        ...block,
                        tableData: {
                            headers: block.tableData.headers.filter((_, i) => i !== colIndex),
                            rows: block.tableData.rows.map(row => row.filter((_, i) => i !== colIndex))
                        }
                    }
                    : block
            )
        }))
    }

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setQuotationData(prev => ({ ...prev, companyLogo: reader.result as string }))
            }
            reader.readAsDataURL(file)
        }
    }

    const selectedBlock = quotationData.contentBlocks.find(b => b.id === selectedBlockId)

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />

            {/* Header Toolbar */}
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b shadow-sm px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/accounting/techno-quotation" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-semibold">
                            {isLoading ? "Loading..." : quotationData.refNo || "New Quotation"}
                        </h1>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            {isSaving ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                            ) : hasChanges ? (
                                <><CloudOff className="w-3 h-3" /> Unsaved changes...</>
                            ) : (
                                <><Cloud className="w-3 h-3" /> Saved</>
                            )}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => handlePrint()}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2"
                    >
                        <Printer className="w-4 h-4" />
                        Print / Download PDF
                    </Button>
                </div>
            </div>

            <div className="flex-1 container mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Editor Panel (Left Side) */}
                <div className="lg:col-span-5 space-y-4 overflow-y-auto h-[calc(100vh-140px)] pr-2 scrollbar-thin">

                    {/* Add Content Buttons */}
                    <Card className="p-3">
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => addBlock('heading')} className="gap-1">
                                <Type className="w-4 h-4" /> Heading
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => addBlock('paragraph')} className="gap-1">
                                <FileText className="w-4 h-4" /> Paragraph
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => addBlock('list')} className="gap-1">
                                <List className="w-4 h-4" /> List
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => addBlock('table')} className="gap-1">
                                <Table className="w-4 h-4" /> Table
                            </Button>
                        </div>
                    </Card>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-4 w-full mb-4">
                            <TabsTrigger value="company">Company</TabsTrigger>
                            <TabsTrigger value="client">Client</TabsTrigger>
                            <TabsTrigger value="content">Content</TabsTrigger>
                            <TabsTrigger value="footer">Footer</TabsTrigger>
                        </TabsList>

                        {/* Company Tab */}
                        <TabsContent value="company" className="space-y-4">
                            <Card className="p-4 border-l-4 border-l-cyan-500">
                                <h3 className="font-semibold text-lg mb-4 flex items-center">
                                    <Building2 className="w-4 h-4 mr-2" /> Company Details
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <Label>Company Logo</Label>
                                        <div className="flex items-center gap-3 mt-1">
                                            {quotationData.companyLogo ? (
                                                <img src={quotationData.companyLogo} alt="Logo" className="w-16 h-16 object-contain border rounded" />
                                            ) : (
                                                <div className="w-16 h-16 border rounded flex items-center justify-center bg-muted">
                                                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                            )}
                                            <label className="cursor-pointer">
                                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                                <Button variant="outline" size="sm" asChild>
                                                    <span><Upload className="w-4 h-4 mr-1" /> Upload</span>
                                                </Button>
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Company Name</Label>
                                        <Input
                                            value={quotationData.companyName}
                                            onChange={e => setQuotationData({ ...quotationData, companyName: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label>GSTIN</Label>
                                            <Input
                                                value={quotationData.companyGSTIN}
                                                onChange={e => setQuotationData({ ...quotationData, companyGSTIN: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Phone</Label>
                                            <Input
                                                value={quotationData.companyPhone}
                                                onChange={e => setQuotationData({ ...quotationData, companyPhone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Email</Label>
                                        <Input
                                            value={quotationData.companyEmail}
                                            onChange={e => setQuotationData({ ...quotationData, companyEmail: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Address</Label>
                                        <Textarea
                                            value={quotationData.companyAddress}
                                            onChange={e => setQuotationData({ ...quotationData, companyAddress: e.target.value })}
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4 border-l-4 border-l-orange-500">
                                <h3 className="font-semibold text-lg mb-4">Document Info</h3>
                                <div className="space-y-3">
                                    <div>
                                        <Label>Document Title</Label>
                                        <Input
                                            value={quotationData.title}
                                            onChange={e => setQuotationData({ ...quotationData, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label>Reference No.</Label>
                                            <Input
                                                value={quotationData.refNo}
                                                onChange={e => setQuotationData({ ...quotationData, refNo: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Date</Label>
                                            <Input
                                                type="date"
                                                value={quotationData.date}
                                                onChange={e => setQuotationData({ ...quotationData, date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>

                        {/* Client Tab */}
                        <TabsContent value="client" className="space-y-4">
                            <Card className="p-4 border-l-4 border-l-blue-500">
                                <h3 className="font-semibold text-lg mb-4">Client Details</h3>
                                <div className="space-y-3">
                                    <div>
                                        <Label>To (Company/Organization)</Label>
                                        <Input
                                            value={quotationData.clientCompany}
                                            onChange={e => setQuotationData({ ...quotationData, clientCompany: e.target.value })}
                                            placeholder="Client Company Name"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label>Contact Person</Label>
                                            <Input
                                                value={quotationData.clientName}
                                                onChange={e => setQuotationData({ ...quotationData, clientName: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Designation</Label>
                                            <Input
                                                value={quotationData.clientDesignation}
                                                onChange={e => setQuotationData({ ...quotationData, clientDesignation: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Address</Label>
                                        <Textarea
                                            value={quotationData.clientAddress}
                                            onChange={e => setQuotationData({ ...quotationData, clientAddress: e.target.value })}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4 border-l-4 border-l-green-500">
                                <h3 className="font-semibold text-lg mb-4">Subject & Greeting</h3>
                                <div className="space-y-3">
                                    <div>
                                        <Label>Subject Line</Label>
                                        <Input
                                            value={quotationData.subject}
                                            onChange={e => setQuotationData({ ...quotationData, subject: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Greeting</Label>
                                        <Input
                                            value={quotationData.greeting}
                                            onChange={e => setQuotationData({ ...quotationData, greeting: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>

                        {/* Content Tab */}
                        <TabsContent value="content" className="space-y-4">
                            {quotationData.contentBlocks.map((block, index) => (
                                <Card
                                    key={block.id}
                                    className={`p-4 border-l-4 ${selectedBlockId === block.id ? 'border-l-purple-500 ring-2 ring-purple-200' : 'border-l-gray-300'}`}
                                    onClick={() => setSelectedBlockId(block.id)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-xs font-medium text-muted-foreground uppercase">
                                            {block.type}
                                        </span>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6 text-destructive"
                                            onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>

                                    {/* Style Controls */}
                                    {selectedBlockId === block.id && (block.type === 'heading' || block.type === 'paragraph') && (
                                        <div className="flex flex-wrap gap-2 mb-3 p-2 bg-muted/50 rounded">
                                            <Select
                                                value={String(block.style?.fontSize || 11)}
                                                onValueChange={(v) => updateBlock(block.id, { style: { ...block.style, fontSize: parseInt(v) } })}
                                            >
                                                <SelectTrigger className="w-20 h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24].map(size => (
                                                        <SelectItem key={size} value={String(size)}>{size}px</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                size="icon"
                                                variant={block.style?.fontWeight === 'bold' ? 'default' : 'outline'}
                                                className="h-8 w-8"
                                                onClick={() => updateBlock(block.id, { style: { ...block.style, fontWeight: block.style?.fontWeight === 'bold' ? 'normal' : 'bold' } })}
                                            >
                                                <Bold className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant={block.style?.fontStyle === 'italic' ? 'default' : 'outline'}
                                                className="h-8 w-8"
                                                onClick={() => updateBlock(block.id, { style: { ...block.style, fontStyle: block.style?.fontStyle === 'italic' ? 'normal' : 'italic' } })}
                                            >
                                                <Italic className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant={block.style?.textDecoration === 'underline' ? 'default' : 'outline'}
                                                className="h-8 w-8"
                                                onClick={() => updateBlock(block.id, { style: { ...block.style, textDecoration: block.style?.textDecoration === 'underline' ? 'none' : 'underline' } })}
                                            >
                                                <Underline className="w-4 h-4" />
                                            </Button>
                                            <div className="border-l mx-1" />
                                            <Button
                                                size="icon"
                                                variant={block.style?.textAlign === 'left' ? 'default' : 'outline'}
                                                className="h-8 w-8"
                                                onClick={() => updateBlock(block.id, { style: { ...block.style, textAlign: 'left' } })}
                                            >
                                                <AlignLeft className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant={block.style?.textAlign === 'center' ? 'default' : 'outline'}
                                                className="h-8 w-8"
                                                onClick={() => updateBlock(block.id, { style: { ...block.style, textAlign: 'center' } })}
                                            >
                                                <AlignCenter className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant={block.style?.textAlign === 'right' ? 'default' : 'outline'}
                                                className="h-8 w-8"
                                                onClick={() => updateBlock(block.id, { style: { ...block.style, textAlign: 'right' } })}
                                            >
                                                <AlignRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}

                                    {/* Content Editor based on type */}
                                    {(block.type === 'heading' || block.type === 'paragraph') && (
                                        <Textarea
                                            value={block.content}
                                            onChange={e => updateBlock(block.id, { content: e.target.value })}
                                            rows={block.type === 'heading' ? 1 : 3}
                                            className="resize-none"
                                        />
                                    )}

                                    {block.type === 'list' && block.items && (
                                        <div className="space-y-2">
                                            {block.items.map((item, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <span className="mt-2 text-muted-foreground">•</span>
                                                    <Input
                                                        value={item}
                                                        onChange={e => updateListItem(block.id, idx, e.target.value)}
                                                        className="flex-1"
                                                    />
                                                    {block.items!.length > 1 && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-destructive"
                                                            onClick={() => deleteListItem(block.id, idx)}
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full border-dashed"
                                                onClick={() => addListItem(block.id)}
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> Add Item
                                            </Button>
                                        </div>
                                    )}

                                    {block.type === 'table' && block.tableData && (
                                        <div className="space-y-2">
                                            <div className="flex gap-2 mb-2">
                                                <Button size="sm" variant="outline" onClick={() => addTableColumn(block.id)}>
                                                    <Plus className="w-3 h-3 mr-1" /> Column
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => addTableRow(block.id)}>
                                                    <Plus className="w-3 h-3 mr-1" /> Row
                                                </Button>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse text-sm">
                                                    <thead>
                                                        <tr>
                                                            {block.tableData.headers.map((header, ci) => (
                                                                <th key={ci} className="border p-1 bg-muted">
                                                                    <div className="flex items-center gap-1">
                                                                        <Input
                                                                            value={header}
                                                                            onChange={e => updateTableHeader(block.id, ci, e.target.value)}
                                                                            className="h-7 text-xs font-semibold"
                                                                        />
                                                                        {block.tableData!.headers.length > 1 && (
                                                                            <Button
                                                                                size="icon"
                                                                                variant="ghost"
                                                                                className="h-6 w-6 text-destructive shrink-0"
                                                                                onClick={() => deleteTableColumn(block.id, ci)}
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </th>
                                                            ))}
                                                            <th className="w-8"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {block.tableData.rows.map((row, ri) => (
                                                            <tr key={ri}>
                                                                {row.map((cell, ci) => (
                                                                    <td key={ci} className="border p-1">
                                                                        <Input
                                                                            value={cell}
                                                                            onChange={e => updateTableCell(block.id, ri, ci, e.target.value)}
                                                                            className="h-7 text-xs"
                                                                        />
                                                                    </td>
                                                                ))}
                                                                <td className="border p-1 w-8">
                                                                    {block.tableData!.rows.length > 1 && (
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="h-6 w-6 text-destructive"
                                                                            onClick={() => deleteTableRow(block.id, ri)}
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </Button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            ))}

                            {quotationData.contentBlocks.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No content blocks yet. Add headings, paragraphs, lists, or tables using the buttons above.</p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Footer Tab */}
                        <TabsContent value="footer" className="space-y-4">
                            <Card className="p-4 border-l-4 border-l-indigo-500">
                                <h3 className="font-semibold text-lg mb-4">Footer Lines</h3>
                                <div className="space-y-3">
                                    <div>
                                        <Label>Line 1</Label>
                                        <Input
                                            value={quotationData.footerLine1}
                                            onChange={e => setQuotationData({ ...quotationData, footerLine1: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Line 2</Label>
                                        <Input
                                            value={quotationData.footerLine2}
                                            onChange={e => setQuotationData({ ...quotationData, footerLine2: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Line 3</Label>
                                        <Input
                                            value={quotationData.footerLine3}
                                            onChange={e => setQuotationData({ ...quotationData, footerLine3: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4 border-l-4 border-l-pink-500">
                                <h3 className="font-semibold text-lg mb-4">Signature</h3>
                                <div className="space-y-3">
                                    <div>
                                        <Label>Signatory Name</Label>
                                        <Input
                                            value={quotationData.signatureName}
                                            onChange={e => setQuotationData({ ...quotationData, signatureName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Designation</Label>
                                        <Input
                                            value={quotationData.signatureDesignation}
                                            onChange={e => setQuotationData({ ...quotationData, signatureDesignation: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4 border-l-4 border-l-yellow-500">
                                <h3 className="font-semibold text-lg mb-4">Watermark</h3>
                                <div className="space-y-3">
                                    <div>
                                        <Label>Watermark Text</Label>
                                        <Input
                                            value={quotationData.watermarkText}
                                            onChange={e => setQuotationData({ ...quotationData, watermarkText: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Opacity ({Math.round(quotationData.watermarkOpacity * 100)}%)</Label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="0.3"
                                            step="0.01"
                                            value={quotationData.watermarkOpacity}
                                            onChange={e => setQuotationData({ ...quotationData, watermarkOpacity: parseFloat(e.target.value) })}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Preview Panel (Right Side) */}
                <div className="lg:col-span-7 overflow-y-auto h-[calc(100vh-140px)] bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
                    <div ref={printRef} className="quotation-preview">
                        <div className="page">
                            {/* Watermark */}
                            <div
                                className="watermark"
                                style={{ opacity: quotationData.watermarkOpacity }}
                            >
                                {quotationData.watermarkText}
                            </div>

                            {/* Header */}
                            <div className="header">
                                <div className="header-left">
                                    {quotationData.companyLogo ? (
                                        <img src={quotationData.companyLogo} alt="Logo" className="company-logo" />
                                    ) : (
                                        <div className="logo-placeholder">LOGO</div>
                                    )}
                                    <div className="company-name">{quotationData.companyName}</div>
                                </div>
                                <div className="header-right">
                                    <div className="header-row">
                                        <span className="label">GSTIN :</span>
                                        <span className="value">{quotationData.companyGSTIN}</span>
                                    </div>
                                    <div className="header-row">
                                        <span className="label">Contact :</span>
                                        <span className="value">{quotationData.companyPhone}</span>
                                    </div>
                                    <div className="header-row">
                                        <span className="label">Email :</span>
                                        <span className="value">{quotationData.companyEmail}</span>
                                    </div>
                                    <div className="header-row">
                                        <span className="label">Factory :</span>
                                        <span className="value">{quotationData.companyAddress}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Title */}
                            <h1 className="document-title">{quotationData.title}</h1>

                            {/* Reference & Date */}
                            <div className="ref-section">
                                <p><strong>Ref No.:</strong> {quotationData.refNo}</p>
                                <p><strong>Date:</strong> {new Date(quotationData.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            </div>

                            {/* To Section */}
                            <div className="to-section">
                                <p><strong>To</strong></p>
                                <p><strong>{quotationData.clientCompany}</strong></p>
                                {quotationData.clientName && <p>{quotationData.clientName}{quotationData.clientDesignation && `, ${quotationData.clientDesignation}`}</p>}
                                {quotationData.clientAddress && <p style={{ whiteSpace: 'pre-line' }}>{quotationData.clientAddress}</p>}
                            </div>

                            {/* Subject */}
                            <div className="subject-section">
                                <p><strong>Sub:</strong> {quotationData.subject}</p>
                                <p>{quotationData.greeting}</p>
                            </div>

                            {/* Content Blocks */}
                            <div className="content-section">
                                {quotationData.contentBlocks.map((block) => (
                                    <div key={block.id} className="content-block">
                                        {block.type === 'heading' && (
                                            <h2
                                                className="block-heading"
                                                style={{
                                                    fontSize: `${block.style?.fontSize || 14}px`,
                                                    fontWeight: block.style?.fontWeight || 'bold',
                                                    fontStyle: block.style?.fontStyle || 'normal',
                                                    textDecoration: block.style?.textDecoration || 'underline',
                                                    textAlign: block.style?.textAlign || 'left',
                                                }}
                                            >
                                                {block.content}
                                            </h2>
                                        )}

                                        {block.type === 'paragraph' && (
                                            <p
                                                className="block-paragraph"
                                                style={{
                                                    fontSize: `${block.style?.fontSize || 11}px`,
                                                    fontWeight: block.style?.fontWeight || 'normal',
                                                    fontStyle: block.style?.fontStyle || 'normal',
                                                    textDecoration: block.style?.textDecoration || 'none',
                                                    textAlign: block.style?.textAlign || 'left',
                                                }}
                                            >
                                                {block.content}
                                            </p>
                                        )}

                                        {block.type === 'list' && block.items && (
                                            <ul className="block-list">
                                                {block.items.map((item, idx) => (
                                                    <li key={idx}>{item}</li>
                                                ))}
                                            </ul>
                                        )}

                                        {block.type === 'table' && block.tableData && (
                                            <table className="block-table">
                                                <thead>
                                                    <tr>
                                                        {block.tableData.headers.map((h, i) => (
                                                            <th key={i}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {block.tableData.rows.map((row, ri) => (
                                                        <tr key={ri}>
                                                            {row.map((cell, ci) => (
                                                                <td key={ci}>{cell}</td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Signature */}
                            <div className="signature-section">
                                <p><strong>For {quotationData.companyName}</strong></p>
                                <p><strong>{quotationData.signatureName}</strong></p>
                                <p>{quotationData.signatureDesignation}</p>
                            </div>

                            {/* Footer */}
                            <div className="footer">
                                <p>{quotationData.footerLine1}</p>
                                <p>{quotationData.footerLine2}</p>
                                <p>{quotationData.footerLine3}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                /* Preview Styles */
                .quotation-preview {
                    font-family: 'Times New Roman', serif;
                    color: #1a1a1a;
                }
                
                .quotation-preview .page {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 15mm;
                    margin: 0 auto;
                    background: white;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    position: relative;
                }
                
                .quotation-preview .watermark {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-30deg);
                    font-size: 80px;
                    font-weight: bold;
                    color: #1a1a1a;
                    pointer-events: none;
                    user-select: none;
                    white-space: nowrap;
                }
                
                .quotation-preview .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-bottom: 2px solid #f97316;
                    padding-bottom: 15px;
                    margin-bottom: 15px;
                }
                
                .quotation-preview .header-left {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                
                .quotation-preview .company-logo {
                    width: 80px;
                    height: 80px;
                    object-fit: contain;
                }
                
                .quotation-preview .logo-placeholder {
                    width: 80px;
                    height: 80px;
                    background: #e5e7eb;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    color: #6b7280;
                    border-radius: 8px;
                }
                
                .quotation-preview .company-name {
                    font-size: 20px;
                    font-weight: bold;
                    color: #1a1a1a;
                }
                
                .quotation-preview .header-right {
                    text-align: right;
                    font-size: 10px;
                }
                
                .quotation-preview .header-row {
                    margin: 2px 0;
                }
                
                .quotation-preview .header-row .label {
                    font-weight: bold;
                    color: #1a1a1a;
                }
                
                .quotation-preview .header-row .value {
                    color: #2563eb;
                }
                
                .quotation-preview .document-title {
                    font-size: 16px;
                    font-weight: bold;
                    text-decoration: underline;
                    margin: 15px 0;
                    text-align: left;
                }
                
                .quotation-preview .ref-section {
                    font-size: 11px;
                    margin-bottom: 10px;
                }
                
                .quotation-preview .ref-section p {
                    margin: 2px 0;
                }
                
                .quotation-preview .to-section {
                    font-size: 11px;
                    margin-bottom: 10px;
                }
                
                .quotation-preview .to-section p {
                    margin: 2px 0;
                }
                
                .quotation-preview .subject-section {
                    font-size: 11px;
                    margin-bottom: 15px;
                }
                
                .quotation-preview .subject-section p {
                    margin: 4px 0;
                }
                
                .quotation-preview .content-section {
                    margin-bottom: 20px;
                }
                
                .quotation-preview .content-block {
                    margin: 8px 0;
                }
                
                .quotation-preview .block-heading {
                    margin: 10px 0 5px 0;
                }
                
                .quotation-preview .block-paragraph {
                    margin: 5px 0;
                    text-align: justify;
                    line-height: 1.5;
                }
                
                .quotation-preview .block-list {
                    margin: 5px 0 5px 20px;
                    padding-left: 0;
                }
                
                .quotation-preview .block-list li {
                    margin: 3px 0;
                    font-size: 11px;
                }
                
                .quotation-preview .block-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 10px;
                    margin: 10px 0;
                }
                
                .quotation-preview .block-table th,
                .quotation-preview .block-table td {
                    border: 1px solid #1a1a1a;
                    padding: 5px 8px;
                    text-align: left;
                }
                
                .quotation-preview .block-table th {
                    background: #f97316;
                    color: white;
                    font-weight: bold;
                }
                
                .quotation-preview .signature-section {
                    margin-top: 30px;
                    font-size: 11px;
                }
                
                .quotation-preview .signature-section p {
                    margin: 2px 0;
                }
                
                .quotation-preview .footer {
                    position: absolute;
                    bottom: 15mm;
                    left: 15mm;
                    right: 15mm;
                    border-top: 2px solid #f97316;
                    padding-top: 10px;
                    font-size: 9px;
                    text-align: center;
                    color: #2563eb;
                }
                
                .quotation-preview .footer p {
                    margin: 2px 0;
                }
                
                /* Print Styles */
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    
                    body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    .quotation-preview .page {
                        width: 100%;
                        min-height: 100vh;
                        padding: 15mm;
                        margin: 0;
                        box-shadow: none;
                        page-break-after: always;
                    }
                    
                    .quotation-preview .watermark {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    .quotation-preview .header {
                        border-bottom-color: #f97316 !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                    
                    .quotation-preview .block-table th {
                        background: #f97316 !important;
                        color: white !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                    
                    .quotation-preview .footer {
                        border-top-color: #f97316 !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    )
}
