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
    Image as ImageIcon,
    ChevronUp,
    ChevronDown,
    Copy,
    GripVertical
} from "lucide-react"
import Link from "next/link"
import { useReactToPrint } from 'react-to-print'
import { useDebounce } from "@/hooks/use-debounce"
import Navbar from "@/components/navbar"

// Types
interface TableData {
    headers: string[]
    rows: string[][]
    style?: {
        headerBgColor: string
        headerTextColor: string
        borderColor: string
        borderWidth: number
        textColor: string
        alternateRowColor: string
        fontSize: number
    }
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
        lineHeight?: number
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
    headerValueColor: string

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
    watermarkType: 'text' | 'image'
    watermarkText: string
    watermarkColor: string
    watermarkImage: string
    watermarkOpacity: number
    watermarkRotation: number
    watermarkWidth: number
    watermarkHeight: number
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
    headerValueColor: "#2563eb",

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
            style: { fontSize: 11, fontWeight: 'normal', textAlign: 'left', lineHeight: 1.5, color: '#1a1a1a' }
        }
    ],

    footerLine1: "Your Products | Your Services | Your Solutions",
    footerLine2: "Additional Services | Customized Solutions",
    footerLine3: "Authorized Signatory: Your Name - Your Position",

    signatureName: "Authorized Signatory",
    signatureDesignation: "Manager",

    watermarkType: 'text',
    watermarkText: "COMPANY NAME",
    watermarkColor: '#1a1a1a',
    watermarkImage: "",
    watermarkOpacity: 0.08,
    watermarkRotation: 0,
    watermarkWidth: 400,
    watermarkHeight: 200
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
                        headerValueColor: q.companyDetails?.headerValueColor || defaultQuotationData.headerValueColor,
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
                        watermarkType: q.watermark?.type || defaultQuotationData.watermarkType,
                        watermarkText: q.watermark?.text || defaultQuotationData.watermarkText,
                        watermarkColor: q.watermark?.color || defaultQuotationData.watermarkColor,
                        watermarkImage: q.watermark?.image || defaultQuotationData.watermarkImage,
                        watermarkOpacity: q.watermark?.opacity ?? defaultQuotationData.watermarkOpacity,
                        watermarkRotation: q.watermark?.rotation ?? defaultQuotationData.watermarkRotation,
                        watermarkWidth: q.watermark?.width ?? defaultQuotationData.watermarkWidth,
                        watermarkHeight: q.watermark?.height ?? defaultQuotationData.watermarkHeight,
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
                        headerValueColor: debouncedData.headerValueColor,
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
                        type: debouncedData.watermarkType,
                        text: debouncedData.watermarkText,
                        color: debouncedData.watermarkColor,
                        image: debouncedData.watermarkImage,
                        opacity: debouncedData.watermarkOpacity,
                        rotation: debouncedData.watermarkRotation,
                        width: debouncedData.watermarkWidth,
                        height: debouncedData.watermarkHeight,
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
        const defaultTableStyle = {
            headerBgColor: '#f97316',
            headerTextColor: '#ffffff',
            borderColor: '#1a1a1a',
            borderWidth: 1,
            textColor: '#1a1a1a',
            alternateRowColor: '#f9fafb',
            fontSize: 10
        }

        const newBlock: ContentBlock = {
            id: Date.now().toString(),
            type,
            content: type === 'heading' ? 'New Heading' : 'New paragraph text...',
            items: type === 'list' ? ['Item 1'] : undefined,
            tableData: type === 'table' ? {
                headers: ['Column 1', 'Column 2'],
                rows: [['', '']],
                style: defaultTableStyle
            } : undefined,
            style: {
                fontSize: type === 'heading' ? 14 : 11,
                fontWeight: type === 'heading' ? 'bold' : 'normal',
                textAlign: 'left',
                lineHeight: 1.5,
                color: '#1a1a1a'
            }
        }
        setQuotationData(prev => ({
            ...prev,
            contentBlocks: [...prev.contentBlocks, newBlock]
        }))
        setSelectedBlockId(newBlock.id)
        setActiveTab('content')
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

    const moveBlockUp = (id: string) => {
        setQuotationData(prev => {
            const idx = prev.contentBlocks.findIndex(b => b.id === id)
            if (idx <= 0) return prev
            const blocks = [...prev.contentBlocks]
                ;[blocks[idx - 1], blocks[idx]] = [blocks[idx], blocks[idx - 1]]
            return { ...prev, contentBlocks: blocks }
        })
    }

    const moveBlockDown = (id: string) => {
        setQuotationData(prev => {
            const idx = prev.contentBlocks.findIndex(b => b.id === id)
            if (idx < 0 || idx >= prev.contentBlocks.length - 1) return prev
            const blocks = [...prev.contentBlocks]
                ;[blocks[idx], blocks[idx + 1]] = [blocks[idx + 1], blocks[idx]]
            return { ...prev, contentBlocks: blocks }
        })
    }

    const duplicateBlock = (id: string) => {
        setQuotationData(prev => {
            const idx = prev.contentBlocks.findIndex(b => b.id === id)
            if (idx < 0) return prev
            const block = prev.contentBlocks[idx]
            const newBlock = { ...block, id: Date.now().toString() }
            const blocks = [...prev.contentBlocks]
            blocks.splice(idx + 1, 0, newBlock)
            return { ...prev, contentBlocks: blocks }
        })
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
                    <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-purple-700 dark:text-purple-300">
                            <Plus className="w-4 h-4" /> Add Content Block
                        </h4>
                        <div className="grid grid-cols-4 gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addBlock('heading')}
                                className="flex flex-col h-auto py-3 gap-1 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                            >
                                <Type className="w-5 h-5" />
                                <span className="text-xs">Heading</span>
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addBlock('paragraph')}
                                className="flex flex-col h-auto py-3 gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                            >
                                <FileText className="w-5 h-5" />
                                <span className="text-xs">Paragraph</span>
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addBlock('list')}
                                className="flex flex-col h-auto py-3 gap-1 hover:bg-green-100 dark:hover:bg-green-900/30"
                            >
                                <List className="w-5 h-5" />
                                <span className="text-xs">List</span>
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addBlock('table')}
                                className="flex flex-col h-auto py-3 gap-1 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                            >
                                <Table className="w-5 h-5" />
                                <span className="text-xs">Table</span>
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
                                    <div>
                                        <Label>Header Value Color</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <input
                                                type="color"
                                                value={quotationData.headerValueColor}
                                                onChange={e => setQuotationData({ ...quotationData, headerValueColor: e.target.value })}
                                                className="w-10 h-10 rounded border cursor-pointer"
                                            />
                                            <Input
                                                value={quotationData.headerValueColor}
                                                onChange={e => setQuotationData({ ...quotationData, headerValueColor: e.target.value })}
                                                className="w-28"
                                                placeholder="#2563eb"
                                            />
                                            <span className="text-xs text-muted-foreground">GSTIN, Phone, Email colors</span>
                                        </div>
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
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-xs font-medium text-muted-foreground uppercase bg-muted px-2 py-1 rounded">
                                                {index + 1}. {block.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7"
                                                onClick={(e) => { e.stopPropagation(); moveBlockUp(block.id); }}
                                                disabled={index === 0}
                                                title="Move Up"
                                            >
                                                <ChevronUp className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7"
                                                onClick={(e) => { e.stopPropagation(); moveBlockDown(block.id); }}
                                                disabled={index === quotationData.contentBlocks.length - 1}
                                                title="Move Down"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7"
                                                onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}
                                                title="Duplicate"
                                            >
                                                <Copy className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
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
                                            <div className="border-l mx-1" />
                                            <Select
                                                value={String(block.style?.lineHeight || 1.5)}
                                                onValueChange={(v) => updateBlock(block.id, { style: { ...block.style, lineHeight: parseFloat(v) } })}
                                            >
                                                <SelectTrigger className="w-16 h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[1, 1.2, 1.4, 1.5, 1.6, 1.8, 2, 2.5].map(lh => (
                                                        <SelectItem key={lh} value={String(lh)}>{lh}x</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <input
                                                type="color"
                                                value={block.style?.color || '#1a1a1a'}
                                                onChange={e => updateBlock(block.id, { style: { ...block.style, color: e.target.value } })}
                                                className="w-8 h-8 rounded border cursor-pointer"
                                                title="Text Color"
                                            />
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
                                        <div className="space-y-3">
                                            {/* Table Style Controls */}
                                            <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                                                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Table Styling</h4>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <Label className="text-xs">Header Background</Label>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <input
                                                                type="color"
                                                                value={block.tableData.style?.headerBgColor || '#f97316'}
                                                                onChange={e => updateBlock(block.id, {
                                                                    tableData: {
                                                                        ...block.tableData!,
                                                                        style: { ...block.tableData!.style!, headerBgColor: e.target.value }
                                                                    }
                                                                })}
                                                                className="w-8 h-8 rounded border cursor-pointer"
                                                            />
                                                            <Input
                                                                value={block.tableData.style?.headerBgColor || '#f97316'}
                                                                onChange={e => updateBlock(block.id, {
                                                                    tableData: {
                                                                        ...block.tableData!,
                                                                        style: { ...block.tableData!.style!, headerBgColor: e.target.value }
                                                                    }
                                                                })}
                                                                className="h-8 w-24 text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Header Text Color</Label>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <input
                                                                type="color"
                                                                value={block.tableData.style?.headerTextColor || '#ffffff'}
                                                                onChange={e => updateBlock(block.id, {
                                                                    tableData: {
                                                                        ...block.tableData!,
                                                                        style: { ...block.tableData!.style!, headerTextColor: e.target.value }
                                                                    }
                                                                })}
                                                                className="w-8 h-8 rounded border cursor-pointer"
                                                            />
                                                            <Input
                                                                value={block.tableData.style?.headerTextColor || '#ffffff'}
                                                                onChange={e => updateBlock(block.id, {
                                                                    tableData: {
                                                                        ...block.tableData!,
                                                                        style: { ...block.tableData!.style!, headerTextColor: e.target.value }
                                                                    }
                                                                })}
                                                                className="h-8 w-24 text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <Label className="text-xs">Border Color</Label>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <input
                                                                type="color"
                                                                value={block.tableData.style?.borderColor || '#1a1a1a'}
                                                                onChange={e => updateBlock(block.id, {
                                                                    tableData: {
                                                                        ...block.tableData!,
                                                                        style: { ...block.tableData!.style!, borderColor: e.target.value }
                                                                    }
                                                                })}
                                                                className="w-8 h-8 rounded border cursor-pointer"
                                                            />
                                                            <Input
                                                                value={block.tableData.style?.borderColor || '#1a1a1a'}
                                                                onChange={e => updateBlock(block.id, {
                                                                    tableData: {
                                                                        ...block.tableData!,
                                                                        style: { ...block.tableData!.style!, borderColor: e.target.value }
                                                                    }
                                                                })}
                                                                className="h-8 w-24 text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Text Color</Label>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <input
                                                                type="color"
                                                                value={block.tableData.style?.textColor || '#1a1a1a'}
                                                                onChange={e => updateBlock(block.id, {
                                                                    tableData: {
                                                                        ...block.tableData!,
                                                                        style: { ...block.tableData!.style!, textColor: e.target.value }
                                                                    }
                                                                })}
                                                                className="w-8 h-8 rounded border cursor-pointer"
                                                            />
                                                            <Input
                                                                value={block.tableData.style?.textColor || '#1a1a1a'}
                                                                onChange={e => updateBlock(block.id, {
                                                                    tableData: {
                                                                        ...block.tableData!,
                                                                        style: { ...block.tableData!.style!, textColor: e.target.value }
                                                                    }
                                                                })}
                                                                className="h-8 w-24 text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <Label className="text-xs">Alt Row Color</Label>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <input
                                                                type="color"
                                                                value={block.tableData.style?.alternateRowColor || '#f9fafb'}
                                                                onChange={e => updateBlock(block.id, {
                                                                    tableData: {
                                                                        ...block.tableData!,
                                                                        style: { ...block.tableData!.style!, alternateRowColor: e.target.value }
                                                                    }
                                                                })}
                                                                className="w-8 h-8 rounded border cursor-pointer"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Border Width</Label>
                                                        <Select
                                                            value={String(block.tableData.style?.borderWidth || 1)}
                                                            onValueChange={v => updateBlock(block.id, {
                                                                tableData: {
                                                                    ...block.tableData!,
                                                                    style: { ...block.tableData!.style!, borderWidth: parseInt(v) }
                                                                }
                                                            })}
                                                        >
                                                            <SelectTrigger className="h-8 mt-1">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="1">1px</SelectItem>
                                                                <SelectItem value="2">2px</SelectItem>
                                                                <SelectItem value="3">3px</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Font Size</Label>
                                                        <Select
                                                            value={String(block.tableData.style?.fontSize || 10)}
                                                            onValueChange={v => updateBlock(block.id, {
                                                                tableData: {
                                                                    ...block.tableData!,
                                                                    style: { ...block.tableData!.style!, fontSize: parseInt(v) }
                                                                }
                                                            })}
                                                        >
                                                            <SelectTrigger className="h-8 mt-1">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="8">8px</SelectItem>
                                                                <SelectItem value="9">9px</SelectItem>
                                                                <SelectItem value="10">10px</SelectItem>
                                                                <SelectItem value="11">11px</SelectItem>
                                                                <SelectItem value="12">12px</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Add Column/Row Buttons */}
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => addTableColumn(block.id)}>
                                                    <Plus className="w-3 h-3 mr-1" /> Column
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => addTableRow(block.id)}>
                                                    <Plus className="w-3 h-3 mr-1" /> Row
                                                </Button>
                                            </div>

                                            {/* Table Editor */}
                                            <div className="overflow-x-auto border rounded-lg">
                                                <table className="w-full border-collapse text-sm">
                                                    <thead>
                                                        <tr>
                                                            {block.tableData.headers.map((header, ci) => (
                                                                <th
                                                                    key={ci}
                                                                    className="p-1"
                                                                    style={{
                                                                        backgroundColor: block.tableData!.style?.headerBgColor || '#f97316',
                                                                        border: `${block.tableData!.style?.borderWidth || 1}px solid ${block.tableData!.style?.borderColor || '#1a1a1a'}`,
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-1">
                                                                        <Input
                                                                            value={header}
                                                                            onChange={e => updateTableHeader(block.id, ci, e.target.value)}
                                                                            className="h-7 text-xs font-semibold bg-transparent border-0"
                                                                            style={{ color: block.tableData!.style?.headerTextColor || '#ffffff' }}
                                                                        />
                                                                        {block.tableData!.headers.length > 1 && (
                                                                            <Button
                                                                                size="icon"
                                                                                variant="ghost"
                                                                                className="h-6 w-6 shrink-0 text-white/80 hover:text-white hover:bg-white/20"
                                                                                onClick={() => deleteTableColumn(block.id, ci)}
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </th>
                                                            ))}
                                                            <th className="w-8 bg-muted"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {block.tableData.rows.map((row, ri) => (
                                                            <tr
                                                                key={ri}
                                                                style={{
                                                                    backgroundColor: ri % 2 === 1 ? (block.tableData!.style?.alternateRowColor || '#f9fafb') : 'transparent'
                                                                }}
                                                            >
                                                                {row.map((cell, ci) => (
                                                                    <td
                                                                        key={ci}
                                                                        className="p-1"
                                                                        style={{
                                                                            border: `${block.tableData!.style?.borderWidth || 1}px solid ${block.tableData!.style?.borderColor || '#1a1a1a'}`,
                                                                        }}
                                                                    >
                                                                        <Input
                                                                            value={cell}
                                                                            onChange={e => updateTableCell(block.id, ri, ci, e.target.value)}
                                                                            className="h-7 text-xs border-0 bg-transparent"
                                                                            style={{
                                                                                color: block.tableData!.style?.textColor || '#1a1a1a',
                                                                                fontSize: `${block.tableData!.style?.fontSize || 10}px`
                                                                            }}
                                                                        />
                                                                    </td>
                                                                ))}
                                                                <td className="p-1 w-8 bg-muted">
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
                                        <Label>Watermark Type</Label>
                                        <Select
                                            value={quotationData.watermarkType}
                                            onValueChange={(v: 'text' | 'image') => setQuotationData({ ...quotationData, watermarkType: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="text">Text</SelectItem>
                                                <SelectItem value="image">Image</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {quotationData.watermarkType === 'text' && (
                                        <div className="space-y-3">
                                            <div>
                                                <Label>Watermark Text</Label>
                                                <Input
                                                    value={quotationData.watermarkText}
                                                    onChange={e => setQuotationData({ ...quotationData, watermarkText: e.target.value })}
                                                    placeholder="Enter watermark text"
                                                />
                                            </div>
                                            <div>
                                                <Label>Text Color</Label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={quotationData.watermarkColor}
                                                        onChange={e => setQuotationData({ ...quotationData, watermarkColor: e.target.value })}
                                                        className="w-10 h-10 rounded border cursor-pointer"
                                                    />
                                                    <Input
                                                        value={quotationData.watermarkColor}
                                                        onChange={e => setQuotationData({ ...quotationData, watermarkColor: e.target.value })}
                                                        className="w-28"
                                                        placeholder="#000000"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {quotationData.watermarkType === 'image' && (
                                        <div>
                                            <Label>Watermark Image (Logo)</Label>
                                            <div className="flex items-center gap-3 mt-1">
                                                {quotationData.watermarkImage ? (
                                                    <img src={quotationData.watermarkImage} alt="Watermark" className="w-20 h-20 object-contain border rounded bg-gray-50" />
                                                ) : (
                                                    <div className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center bg-muted">
                                                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div className="flex flex-col gap-2">
                                                    <label className="cursor-pointer">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0]
                                                                if (file) {
                                                                    const reader = new FileReader()
                                                                    reader.onloadend = () => {
                                                                        setQuotationData({ ...quotationData, watermarkImage: reader.result as string })
                                                                    }
                                                                    reader.readAsDataURL(file)
                                                                }
                                                            }}
                                                            className="hidden"
                                                        />
                                                        <Button variant="outline" size="sm" asChild>
                                                            <span><Upload className="w-4 h-4 mr-1" /> Upload Logo</span>
                                                        </Button>
                                                    </label>
                                                    {quotationData.watermarkImage && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive"
                                                            onClick={() => setQuotationData({ ...quotationData, watermarkImage: '' })}
                                                        >
                                                            <Trash2 className="w-3 h-3 mr-1" /> Remove
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label>Width ({quotationData.watermarkWidth}px)</Label>
                                            <input
                                                type="range"
                                                min="100"
                                                max="800"
                                                step="10"
                                                value={quotationData.watermarkWidth}
                                                onChange={e => setQuotationData({ ...quotationData, watermarkWidth: parseInt(e.target.value) })}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <Label>Height ({quotationData.watermarkHeight}px)</Label>
                                            <input
                                                type="range"
                                                min="50"
                                                max="400"
                                                step="10"
                                                value={quotationData.watermarkHeight}
                                                onChange={e => setQuotationData({ ...quotationData, watermarkHeight: parseInt(e.target.value) })}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Rotation ({quotationData.watermarkRotation}°)</Label>
                                        <input
                                            type="range"
                                            min="-90"
                                            max="90"
                                            step="5"
                                            value={quotationData.watermarkRotation}
                                            onChange={e => setQuotationData({ ...quotationData, watermarkRotation: parseInt(e.target.value) })}
                                            className="w-full"
                                        />
                                    </div>

                                    <div>
                                        <Label>Opacity ({Math.round(quotationData.watermarkOpacity * 100)}%)</Label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="0.5"
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
                                style={{
                                    opacity: quotationData.watermarkOpacity,
                                    transform: `translate(-50%, -50%) rotate(${quotationData.watermarkRotation}deg)`,
                                    width: `${quotationData.watermarkWidth}px`,
                                    height: `${quotationData.watermarkHeight}px`,
                                }}
                            >
                                {quotationData.watermarkType === 'text' ? (
                                    <span style={{
                                        fontSize: `${quotationData.watermarkHeight * 0.4}px`,
                                        color: quotationData.watermarkColor,
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {quotationData.watermarkText}
                                    </span>
                                ) : quotationData.watermarkImage ? (
                                    <img
                                        src={quotationData.watermarkImage}
                                        alt="Watermark"
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                ) : null}
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
                                    <div className="header-info-row">
                                        <span className="info-label">GSTIN :</span>
                                        <span className="info-value" style={{ color: quotationData.headerValueColor }}>{quotationData.companyGSTIN}</span>
                                    </div>
                                    <div className="header-info-row">
                                        <span className="info-label">Contact :</span>
                                        <span className="info-value" style={{ color: quotationData.headerValueColor }}>{quotationData.companyPhone}</span>
                                    </div>
                                    <div className="header-info-row">
                                        <span className="info-label">Email :</span>
                                        <span className="info-value" style={{ color: quotationData.headerValueColor, textDecoration: 'underline' }}>{quotationData.companyEmail}</span>
                                    </div>
                                    <div className="header-info-row address-row">
                                        <span className="info-label">Factory :</span>
                                        <span className="info-value address-value">{quotationData.companyAddress}</span>
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
                                                    lineHeight: block.style?.lineHeight || 1.5,
                                                    color: block.style?.color || '#1a1a1a',
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
                                                    lineHeight: block.style?.lineHeight || 1.5,
                                                    color: block.style?.color || '#1a1a1a',
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
                                            <table
                                                className="block-table"
                                                style={{
                                                    borderCollapse: 'collapse',
                                                    width: '100%',
                                                    fontSize: `${block.tableData.style?.fontSize || 10}px`,
                                                }}
                                            >
                                                <thead>
                                                    <tr>
                                                        {block.tableData.headers.map((h, i) => (
                                                            <th
                                                                key={i}
                                                                style={{
                                                                    backgroundColor: block.tableData!.style?.headerBgColor || '#f97316',
                                                                    color: block.tableData!.style?.headerTextColor || '#ffffff',
                                                                    border: `${block.tableData!.style?.borderWidth || 1}px solid ${block.tableData!.style?.borderColor || '#1a1a1a'}`,
                                                                    padding: '6px 8px',
                                                                    textAlign: 'left',
                                                                    fontWeight: 'bold',
                                                                }}
                                                            >
                                                                {h}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {block.tableData.rows.map((row, ri) => (
                                                        <tr
                                                            key={ri}
                                                            style={{
                                                                backgroundColor: ri % 2 === 1 ? (block.tableData!.style?.alternateRowColor || '#f9fafb') : 'transparent',
                                                            }}
                                                        >
                                                            {row.map((cell, ci) => (
                                                                <td
                                                                    key={ci}
                                                                    style={{
                                                                        border: `${block.tableData!.style?.borderWidth || 1}px solid ${block.tableData!.style?.borderColor || '#1a1a1a'}`,
                                                                        color: block.tableData!.style?.textColor || '#1a1a1a',
                                                                        padding: '6px 8px',
                                                                    }}
                                                                >
                                                                    {cell}
                                                                </td>
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
                    font-weight: bold;
                    color: #1a1a1a;
                    pointer-events: none;
                    user-select: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 0;
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
                    flex-shrink: 0;
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
                    text-align: left;
                    font-size: 12px;
                    max-width: 30%;
                }
                
                .quotation-preview .header-info-row {
                    margin: 2px 0;
                    line-height: 1.5;
                }
                
                .quotation-preview .header-info-row .info-label {
                    font-weight: bold;
                    color: #1a1a1a;
                }
                
                .quotation-preview .header-info-row .info-value {
                    margin-left: 4px;
                }
                
                .quotation-preview .header-info-row.address-row {
                    display: block;
                }
                
                .quotation-preview .header-info-row.address-row .info-label {
                    display: inline;
                    margin-right: 4px;
                }
                
                .quotation-preview .header-info-row.address-row .address-value {
                    display: inline;
                    color: #1a1a1a;
                    margin-left: 0;
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
                    margin: 10px 0;
                }
                
                .quotation-preview .block-table th,
                .quotation-preview .block-table td {
                    text-align: left;
                }
                
                .quotation-preview .block-table th {
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
                        position: fixed !important;
                        top: 50% !important;
                        left: 50% !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        z-index: -1;
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
