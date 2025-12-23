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
    GripVertical,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    X
} from "lucide-react"
import Link from "next/link"
import { useReactToPrint } from 'react-to-print'
import { useDebounce } from "@/hooks/use-debounce"
import Navbar from "@/components/navbar"

// Rich Text Style Interface
interface RichTextStyle {
    fontSize?: number
    fontWeight?: 'normal' | 'bold'
    fontStyle?: 'normal' | 'italic'
    textDecoration?: 'none' | 'underline'
    textAlign?: 'left' | 'center' | 'right'
    color?: string
}

const defaultRichTextStyle: RichTextStyle = {
    fontSize: 11,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'left',
    color: '#1a1a1a'
}

// Rich Text Field Editor Component
interface RichTextFieldEditorProps {
    label: string
    value: string
    onChange: (value: string) => void
    style?: RichTextStyle
    onStyleChange: (style: RichTextStyle) => void
    multiline?: boolean
    rows?: number
    placeholder?: string
    type?: 'text' | 'date'
}

function RichTextFieldEditor({
    label,
    value,
    onChange,
    style = defaultRichTextStyle,
    onStyleChange,
    multiline = false,
    rows = 2,
    placeholder,
    type = 'text'
}: RichTextFieldEditorProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Close toolbar when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            // Check if click is inside container
            if (containerRef.current && containerRef.current.contains(target)) {
                return
            }
            // Check if click is inside a Radix UI portal (Select dropdown, Popover, etc.)
            // Radix portals have data-radix-* attributes
            if (target.closest('[data-radix-popper-content-wrapper]') ||
                target.closest('[role="listbox"]') ||
                target.closest('[data-radix-select-viewport]')) {
                return
            }
            setIsExpanded(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const updateStyle = (updates: Partial<RichTextStyle>) => {
        onStyleChange({ ...style, ...updates })
    }

    return (
        <div ref={containerRef} className="space-y-1">
            <div className="flex items-center justify-between">
                <Label className="text-sm">{label}</Label>
                <div className="flex items-center gap-1">
                    {/* Active style indicators */}
                    <div className="flex items-center gap-0.5">
                        {style.fontWeight === 'bold' && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">B</span>
                        )}
                        {style.fontStyle === 'italic' && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs italic bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">I</span>
                        )}
                        {style.textDecoration === 'underline' && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs underline bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">U</span>
                        )}
                        {style.fontSize && style.fontSize !== 11 && (
                            <span className="inline-flex items-center justify-center h-5 px-1 text-[10px] bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded">{style.fontSize}px</span>
                        )}
                        {style.color && style.color !== '#1a1a1a' && (
                            <span
                                className="inline-flex items-center justify-center w-5 h-5 rounded border"
                                style={{ backgroundColor: style.color }}
                                title={`Color: ${style.color}`}
                            />
                        )}
                    </div>
                    <Button
                        size="sm"
                        variant={isExpanded ? "default" : "ghost"}
                        className="h-6 px-2 text-xs"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <Type className="w-3 h-3 mr-1" />
                        Format
                    </Button>
                </div>
            </div>

            {/* Rich Text Toolbar */}
            {isExpanded && (
                <div className="flex flex-wrap gap-1 p-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-purple-200 dark:border-purple-800 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Font Size */}
                    <Select
                        value={String(style.fontSize || 11)}
                        onValueChange={(v) => updateStyle({ fontSize: parseInt(v) })}
                    >
                        <SelectTrigger className="w-16 h-7 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24].map(size => (
                                <SelectItem key={size} value={String(size)}>{size}px</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="w-px h-7 bg-gray-300 dark:bg-gray-600" />

                    {/* Bold */}
                    <Button
                        size="icon"
                        variant={style.fontWeight === 'bold' ? 'default' : 'outline'}
                        className="h-7 w-7"
                        onClick={() => updateStyle({ fontWeight: style.fontWeight === 'bold' ? 'normal' : 'bold' })}
                        title="Bold"
                    >
                        <Bold className="w-3.5 h-3.5" />
                    </Button>

                    {/* Italic */}
                    <Button
                        size="icon"
                        variant={style.fontStyle === 'italic' ? 'default' : 'outline'}
                        className="h-7 w-7"
                        onClick={() => updateStyle({ fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' })}
                        title="Italic"
                    >
                        <Italic className="w-3.5 h-3.5" />
                    </Button>

                    {/* Underline */}
                    <Button
                        size="icon"
                        variant={style.textDecoration === 'underline' ? 'default' : 'outline'}
                        className="h-7 w-7"
                        onClick={() => updateStyle({ textDecoration: style.textDecoration === 'underline' ? 'none' : 'underline' })}
                        title="Underline"
                    >
                        <Underline className="w-3.5 h-3.5" />
                    </Button>

                    <div className="w-px h-7 bg-gray-300 dark:bg-gray-600" />

                    {/* Align Left */}
                    <Button
                        size="icon"
                        variant={style.textAlign === 'left' ? 'default' : 'outline'}
                        className="h-7 w-7"
                        onClick={() => updateStyle({ textAlign: 'left' })}
                        title="Align Left"
                    >
                        <AlignLeft className="w-3.5 h-3.5" />
                    </Button>

                    {/* Align Center */}
                    <Button
                        size="icon"
                        variant={style.textAlign === 'center' ? 'default' : 'outline'}
                        className="h-7 w-7"
                        onClick={() => updateStyle({ textAlign: 'center' })}
                        title="Align Center"
                    >
                        <AlignCenter className="w-3.5 h-3.5" />
                    </Button>

                    {/* Align Right */}
                    <Button
                        size="icon"
                        variant={style.textAlign === 'right' ? 'default' : 'outline'}
                        className="h-7 w-7"
                        onClick={() => updateStyle({ textAlign: 'right' })}
                        title="Align Right"
                    >
                        <AlignRight className="w-3.5 h-3.5" />
                    </Button>

                    <div className="w-px h-7 bg-gray-300 dark:bg-gray-600" />

                    {/* Color Picker */}
                    <div className="flex items-center gap-1">
                        <label className="relative w-8 h-7 rounded border cursor-pointer overflow-hidden" title="Text Color">
                            <input
                                type="color"
                                value={style.color || '#1a1a1a'}
                                onChange={e => updateStyle({ color: e.target.value })}
                                className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                            />
                            <div
                                className="w-full h-full rounded"
                                style={{ backgroundColor: style.color || '#1a1a1a' }}
                            />
                        </label>
                        <span className="text-[10px] text-muted-foreground">Color</span>
                    </div>

                    {/* Close Button */}
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 ml-auto"
                        onClick={() => setIsExpanded(false)}
                        title="Close Toolbar"
                    >
                        <X className="w-3.5 h-3.5" />
                    </Button>
                </div>
            )}

            {/* Input Field - Normal appearance, formatting only shows in preview */}
            <div className="rich-text-input-wrapper">
                {multiline ? (
                    <textarea
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        rows={rows}
                        placeholder={placeholder}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                    />
                ) : type === 'date' ? (
                    <input
                        type="date"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                    />
                ) : (
                    <input
                        type="text"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                    />
                )}
            </div>
        </div>
    )
}

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
    titleStyle: RichTextStyle
    refNo: string
    refNoStyle: RichTextStyle
    date: string
    dateStyle: RichTextStyle

    // Company Details
    companyName: string
    companyNameStyle: RichTextStyle
    companyLogo: string
    companyLogoWidth: number
    companyLogoHeight: number
    companyGSTIN: string
    companyGSTINStyle: RichTextStyle
    companyPhone: string
    companyPhoneStyle: RichTextStyle
    companyEmail: string
    companyEmailStyle: RichTextStyle
    companyAddress: string
    companyAddressStyle: RichTextStyle
    headerValueColor: string
    headerLineColor: string

    // Client Details
    clientName: string
    clientNameStyle: RichTextStyle
    clientDesignation: string
    clientDesignationStyle: RichTextStyle
    clientCompany: string
    clientCompanyStyle: RichTextStyle
    clientAddress: string
    clientAddressStyle: RichTextStyle

    // Subject
    subject: string
    subjectStyle: RichTextStyle
    greeting: string
    greetingStyle: RichTextStyle

    // Content blocks
    contentBlocks: ContentBlock[]

    // Footer
    footerLine1: string
    footerLine1Style: RichTextStyle
    footerLine2: string
    footerLine2Style: RichTextStyle
    footerLine3: string
    footerLine3Style: RichTextStyle
    footerLineColor: string
    footerTextColor: string
    // Signature
    signatureName: string
    signatureNameStyle: RichTextStyle
    signatureDesignation: string
    signatureDesignationStyle: RichTextStyle

    // Watermark
    watermarkType: 'text' | 'image'
    watermarkText: string
    watermarkColor: string
    watermarkImage: string
    watermarkOpacity: number
    watermarkRotation: number
    watermarkWidth: number
    watermarkHeight: number

    // Default Font
    defaultFontFamily: string
}

const defaultQuotationData: QuotationData = {
    title: "TECHNO-COMMERCIAL QUOTATION",
    titleStyle: { fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'underline', textAlign: 'left', color: '#1a1a1a' },
    refNo: "QT/2025/001",
    refNoStyle: { fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', color: '#1a1a1a' },
    date: new Date().toISOString().split('T')[0],
    dateStyle: { fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', color: '#1a1a1a' },

    companyName: "Your Company Name",
    companyNameStyle: { fontSize: 20, fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', color: '#1a1a1a' },
    companyLogo: "",
    companyLogoWidth: 80,
    companyLogoHeight: 80,
    companyGSTIN: "22AAJCP7742A1ZP",
    companyGSTINStyle: { fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', color: '#000000' },
    companyPhone: "+91-8349873989",
    companyPhoneStyle: { fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', color: '#000000' },
    companyEmail: "info@company.com",
    companyEmailStyle: { fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'underline', textAlign: 'left', color: '#000000' },
    companyAddress: "Plot No. 173, Engineering Park, Hathkhoj, Bhilai, 490026",
    companyAddressStyle: { fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', color: '#1a1a1a' },
    headerValueColor: "#000000",
    headerLineColor: "#000000",

    clientName: "",
    clientNameStyle: { fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', color: '#1a1a1a' },
    clientDesignation: "",
    clientDesignationStyle: { fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', color: '#1a1a1a' },
    clientCompany: "",
    clientCompanyStyle: { fontSize: 11, fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', color: '#1a1a1a' },
    clientAddress: "",
    clientAddressStyle: { fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', color: '#1a1a1a' },

    subject: "Offer for Supply of Equipment",
    subjectStyle: { fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', color: '#1a1a1a' },
    greeting: "Dear Sir,",
    greetingStyle: { fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', color: '#1a1a1a' },

    contentBlocks: [
        {
            id: "1",
            type: "paragraph",
            content: "We thank you for the opportunity to submit our techno-commercial quotation.",
            style: { fontSize: 11, fontWeight: 'normal', textAlign: 'left', lineHeight: 1.5, color: '#1a1a1a' }
        }
    ],

    footerLine1: "Your Products | Your Services | Your Solutions",
    footerLine1Style: { fontSize: 9, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center', color: '#000000' },
    footerLine2: "Additional Services | Customized Solutions",
    footerLine2Style: { fontSize: 9, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center', color: '#000000' },
    footerLine3: "Authorized Signatory: Your Name - Your Position",
    footerLine3Style: { fontSize: 9, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center', color: '#000000' },
    footerLineColor: "#000000",
    footerTextColor: "#000000",

    signatureName: "Authorized Signatory",
    signatureNameStyle: { fontSize: 11, fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', color: '#1a1a1a' },
    signatureDesignation: "Manager",
    signatureDesignationStyle: { fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', color: '#1a1a1a' },

    watermarkType: 'text',
    watermarkText: "COMPANY NAME",
    watermarkColor: '#1a1a1a',
    watermarkImage: "",
    watermarkOpacity: 0.08,
    watermarkRotation: 0,
    watermarkWidth: 400,
    watermarkHeight: 200,

    defaultFontFamily: "Times New Roman"
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
    const [previewZoom, setPreviewZoom] = useState(0.9)
    const [isUploadingLogo, setIsUploadingLogo] = useState(false)

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

                // DEBUG: Log the raw response
                console.log('=== QUOTATION DATA LOADED ===')
                console.log('Raw API response:', data)

                if (data.quotation) {
                    const q = data.quotation

                    // DEBUG: Log specific fields
                    console.log('--- Company Details ---')
                    console.log('Logo URL:', q.companyDetails?.logo || 'NOT SET')
                    console.log('Logo Width:', q.companyDetails?.logoWidth || 'NOT SET')
                    console.log('Logo Height:', q.companyDetails?.logoHeight || 'NOT SET')
                    console.log('Company Name:', q.companyDetails?.name || 'NOT SET')
                    console.log('Name Style:', q.companyDetails?.nameStyle || 'NOT SET')
                    console.log('GSTIN:', q.companyDetails?.gstin || 'NOT SET')
                    console.log('Header Value Color:', q.companyDetails?.headerValueColor || 'NOT SET')

                    console.log('--- Title & Styles ---')
                    console.log('Title:', q.title || 'NOT SET')
                    console.log('Title Style:', q.titleStyle || 'NOT SET')

                    console.log('--- Content Blocks ---')
                    console.log('Content Blocks Count:', q.contentBlocks?.length || 0)

                    console.log('--- Footer ---')
                    console.log('Footer Line1:', q.footer?.line1 || 'NOT SET')
                    console.log('Footer Text Color:', q.footer?.textColor || 'NOT SET')

                    console.log('=== END QUOTATION DATA ===')

                    setQuotationData({
                        ...defaultQuotationData,
                        title: q.title || defaultQuotationData.title,
                        titleStyle: q.titleStyle || defaultQuotationData.titleStyle,
                        refNo: q.refNo || defaultQuotationData.refNo,
                        refNoStyle: q.refNoStyle || defaultQuotationData.refNoStyle,
                        date: q.date || defaultQuotationData.date,
                        dateStyle: q.dateStyle || defaultQuotationData.dateStyle,
                        companyName: q.companyDetails?.name || defaultQuotationData.companyName,
                        companyNameStyle: q.companyDetails?.nameStyle || defaultQuotationData.companyNameStyle,
                        companyLogo: q.companyDetails?.logo || "",
                        companyLogoWidth: q.companyDetails?.logoWidth || defaultQuotationData.companyLogoWidth,
                        companyLogoHeight: q.companyDetails?.logoHeight || defaultQuotationData.companyLogoHeight,
                        companyGSTIN: q.companyDetails?.gstin || defaultQuotationData.companyGSTIN,
                        companyGSTINStyle: q.companyDetails?.gstinStyle || defaultQuotationData.companyGSTINStyle,
                        companyPhone: q.companyDetails?.phone || defaultQuotationData.companyPhone,
                        companyPhoneStyle: q.companyDetails?.phoneStyle || defaultQuotationData.companyPhoneStyle,
                        companyEmail: q.companyDetails?.email || defaultQuotationData.companyEmail,
                        companyEmailStyle: q.companyDetails?.emailStyle || defaultQuotationData.companyEmailStyle,
                        companyAddress: q.companyDetails?.address || defaultQuotationData.companyAddress,
                        companyAddressStyle: q.companyDetails?.addressStyle || defaultQuotationData.companyAddressStyle,
                        headerValueColor: q.companyDetails?.headerValueColor || defaultQuotationData.headerValueColor,
                        headerLineColor: q.companyDetails?.headerLineColor || defaultQuotationData.headerLineColor,
                        clientName: q.clientDetails?.name || "",
                        clientNameStyle: q.clientDetails?.nameStyle || defaultQuotationData.clientNameStyle,
                        clientDesignation: q.clientDetails?.designation || "",
                        clientDesignationStyle: q.clientDetails?.designationStyle || defaultQuotationData.clientDesignationStyle,
                        clientCompany: q.clientDetails?.company || "",
                        clientCompanyStyle: q.clientDetails?.companyStyle || defaultQuotationData.clientCompanyStyle,
                        clientAddress: q.clientDetails?.address || "",
                        clientAddressStyle: q.clientDetails?.addressStyle || defaultQuotationData.clientAddressStyle,
                        subject: q.subject || defaultQuotationData.subject,
                        subjectStyle: q.subjectStyle || defaultQuotationData.subjectStyle,
                        greeting: q.greeting || defaultQuotationData.greeting,
                        greetingStyle: q.greetingStyle || defaultQuotationData.greetingStyle,
                        contentBlocks: q.contentBlocks || defaultQuotationData.contentBlocks,
                        footerLine1: q.footer?.line1 || defaultQuotationData.footerLine1,
                        footerLine1Style: q.footer?.line1Style || defaultQuotationData.footerLine1Style,
                        footerLine2: q.footer?.line2 || defaultQuotationData.footerLine2,
                        footerLine2Style: q.footer?.line2Style || defaultQuotationData.footerLine2Style,
                        footerLine3: q.footer?.line3 || defaultQuotationData.footerLine3,
                        footerLine3Style: q.footer?.line3Style || defaultQuotationData.footerLine3Style,
                        footerLineColor: q.footer?.lineColor || defaultQuotationData.footerLineColor,
                        footerTextColor: q.footer?.textColor || defaultQuotationData.footerTextColor,
                        signatureName: q.signature?.name || defaultQuotationData.signatureName,
                        signatureNameStyle: q.signature?.nameStyle || defaultQuotationData.signatureNameStyle,
                        signatureDesignation: q.signature?.designation || defaultQuotationData.signatureDesignation,
                        signatureDesignationStyle: q.signature?.designationStyle || defaultQuotationData.signatureDesignationStyle,
                        watermarkType: q.watermark?.type || defaultQuotationData.watermarkType,
                        watermarkText: q.watermark?.text || defaultQuotationData.watermarkText,
                        watermarkColor: q.watermark?.color || defaultQuotationData.watermarkColor,
                        watermarkImage: q.watermark?.image || defaultQuotationData.watermarkImage,
                        watermarkOpacity: q.watermark?.opacity ?? defaultQuotationData.watermarkOpacity,
                        watermarkRotation: q.watermark?.rotation ?? defaultQuotationData.watermarkRotation,
                        watermarkWidth: q.watermark?.width ?? defaultQuotationData.watermarkWidth,
                        watermarkHeight: q.watermark?.height ?? defaultQuotationData.watermarkHeight,
                        defaultFontFamily: q.defaultFontFamily || defaultQuotationData.defaultFontFamily,
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

    // Auto-save with enhanced tracking
    const debouncedData = useDebounce(quotationData, 1000) // Reduced to 1 second for faster saves
    const previousDataRef = useRef<string>('')
    const lastManualSaveTimeRef = useRef<number>(0) // Track manual save time to prevent autosave conflicts
    const [saveError, setSaveError] = useState<string | null>(null)

    // Track changes by comparing with previous data
    useEffect(() => {
        if (!isLoading && lastSaved) {
            const currentDataString = JSON.stringify(quotationData)
            if (currentDataString !== previousDataRef.current) {
                setHasChanges(true)
                setSaveError(null)
            }
        }
    }, [quotationData, isLoading, lastSaved])

    // Auto-save effect
    useEffect(() => {
        if (isLoading || !hasChanges) return

        // SKIP autosave if a manual save happened recently (within 2 seconds)
        // This prevents stale debounced data from overwriting fresh manual saves (like logo upload)
        if (Date.now() - lastManualSaveTimeRef.current < 2000) {
            console.log('Skipping autosave due to recent manual save')
            return
        }

        const saveQuotation = async () => {
            const currentDataString = JSON.stringify(debouncedData)

            // Skip if data hasn't actually changed
            if (currentDataString === previousDataRef.current) {
                setHasChanges(false)
                return
            }

            setIsSaving(true)
            setSaveError(null)

            // DEBUG: Log what we're about to save
            console.log('=== AUTOSAVE TRIGGERED ===')
            console.log('Saving logo URL:', debouncedData.companyLogo || 'EMPTY')
            console.log('Saving title:', debouncedData.title)
            console.log('Saving headerValueColor:', debouncedData.headerValueColor)

            try {
                const payload = {
                    title: debouncedData.title,
                    titleStyle: debouncedData.titleStyle,
                    refNo: debouncedData.refNo,
                    refNoStyle: debouncedData.refNoStyle,
                    date: debouncedData.date,
                    dateStyle: debouncedData.dateStyle,
                    companyDetails: {
                        name: debouncedData.companyName,
                        nameStyle: debouncedData.companyNameStyle,
                        logo: debouncedData.companyLogo,
                        logoWidth: debouncedData.companyLogoWidth,
                        logoHeight: debouncedData.companyLogoHeight,
                        gstin: debouncedData.companyGSTIN,
                        gstinStyle: debouncedData.companyGSTINStyle,
                        phone: debouncedData.companyPhone,
                        phoneStyle: debouncedData.companyPhoneStyle,
                        email: debouncedData.companyEmail,
                        emailStyle: debouncedData.companyEmailStyle,
                        address: debouncedData.companyAddress,
                        addressStyle: debouncedData.companyAddressStyle,
                        headerValueColor: debouncedData.headerValueColor,
                        headerLineColor: debouncedData.headerLineColor,
                    },
                    clientDetails: {
                        name: debouncedData.clientName,
                        nameStyle: debouncedData.clientNameStyle,
                        designation: debouncedData.clientDesignation,
                        designationStyle: debouncedData.clientDesignationStyle,
                        company: debouncedData.clientCompany,
                        companyStyle: debouncedData.clientCompanyStyle,
                        address: debouncedData.clientAddress,
                        addressStyle: debouncedData.clientAddressStyle,
                    },
                    subject: debouncedData.subject,
                    subjectStyle: debouncedData.subjectStyle,
                    greeting: debouncedData.greeting,
                    greetingStyle: debouncedData.greetingStyle,
                    contentBlocks: debouncedData.contentBlocks,
                    footer: {
                        line1: debouncedData.footerLine1,
                        line1Style: debouncedData.footerLine1Style,
                        line2: debouncedData.footerLine2,
                        line2Style: debouncedData.footerLine2Style,
                        line3: debouncedData.footerLine3,
                        line3Style: debouncedData.footerLine3Style,
                        lineColor: debouncedData.footerLineColor,
                        textColor: debouncedData.footerTextColor,
                    },
                    signature: {
                        name: debouncedData.signatureName,
                        nameStyle: debouncedData.signatureNameStyle,
                        designation: debouncedData.signatureDesignation,
                        designationStyle: debouncedData.signatureDesignationStyle,
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
                    },
                    defaultFontFamily: debouncedData.defaultFontFamily,
                }

                const response = await fetch(`/api/techno-quotation/${params.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })

                if (!response.ok) {
                    throw new Error('Failed to save')
                }

                // Update the reference after successful save
                previousDataRef.current = currentDataString
                setLastSaved(new Date())
                setHasChanges(false)
            } catch (error) {
                console.error("Error saving:", error)
                setSaveError('Failed to save. Will retry...')
                // Keep hasChanges true so it retries on next debounce
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
            headerBgColor: 'transparent',
            headerTextColor: '#000000',
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

    // Upload logo to Cloudinary via API
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Show upload animation
            setIsUploadingLogo(true)

            try {
                // Create form data for upload API
                const formData = new FormData()
                formData.append('file', file)

                // Upload via our API endpoint (uses Cloudinary on server-side)
                const response = await fetch('/api/upload-file', {
                    method: 'POST',
                    body: formData
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data.success && data.file?.url) {
                        const newLogoUrl = data.file.url
                        console.log('Logo uploaded successfully:', newLogoUrl)

                        // Update state
                        const updatedData = {
                            ...quotationData,
                            companyLogo: newLogoUrl
                        }
                        setQuotationData(updatedData)

                        // IMMEDIATELY save to database (bypass debounce)
                        // This prevents the debounced autosave from overwriting with empty logo
                        console.log('Immediately saving logo to database...')
                        const savePayload = {
                            title: updatedData.title,
                            titleStyle: updatedData.titleStyle,
                            refNo: updatedData.refNo,
                            refNoStyle: updatedData.refNoStyle,
                            date: updatedData.date,
                            dateStyle: updatedData.dateStyle,
                            companyDetails: {
                                name: updatedData.companyName,
                                nameStyle: updatedData.companyNameStyle,
                                logo: newLogoUrl, // Use the new logo URL directly
                                logoWidth: updatedData.companyLogoWidth,
                                logoHeight: updatedData.companyLogoHeight,
                                gstin: updatedData.companyGSTIN,
                                gstinStyle: updatedData.companyGSTINStyle,
                                phone: updatedData.companyPhone,
                                phoneStyle: updatedData.companyPhoneStyle,
                                email: updatedData.companyEmail,
                                emailStyle: updatedData.companyEmailStyle,
                                address: updatedData.companyAddress,
                                addressStyle: updatedData.companyAddressStyle,
                                headerValueColor: updatedData.headerValueColor,
                                headerLineColor: updatedData.headerLineColor,
                            },
                            clientDetails: {
                                name: updatedData.clientName,
                                nameStyle: updatedData.clientNameStyle,
                                designation: updatedData.clientDesignation,
                                designationStyle: updatedData.clientDesignationStyle,
                                company: updatedData.clientCompany,
                                companyStyle: updatedData.clientCompanyStyle,
                                address: updatedData.clientAddress,
                                addressStyle: updatedData.clientAddressStyle,
                            },
                            subject: updatedData.subject,
                            subjectStyle: updatedData.subjectStyle,
                            greeting: updatedData.greeting,
                            greetingStyle: updatedData.greetingStyle,
                            contentBlocks: updatedData.contentBlocks,
                            footer: {
                                line1: updatedData.footerLine1,
                                line1Style: updatedData.footerLine1Style,
                                line2: updatedData.footerLine2,
                                line2Style: updatedData.footerLine2Style,
                                line3: updatedData.footerLine3,
                                line3Style: updatedData.footerLine3Style,
                                lineColor: updatedData.footerLineColor,
                                textColor: updatedData.footerTextColor,
                            },
                            signature: {
                                name: updatedData.signatureName,
                                nameStyle: updatedData.signatureNameStyle,
                                designation: updatedData.signatureDesignation,
                                designationStyle: updatedData.signatureDesignationStyle,
                            },
                            watermark: {
                                type: updatedData.watermarkType,
                                text: updatedData.watermarkText,
                                color: updatedData.watermarkColor,
                                image: updatedData.watermarkImage,
                                opacity: updatedData.watermarkOpacity,
                                rotation: updatedData.watermarkRotation,
                                width: updatedData.watermarkWidth,
                                height: updatedData.watermarkHeight,
                            },
                            defaultFontFamily: updatedData.defaultFontFamily,
                        }

                        const saveResponse = await fetch(`/api/techno-quotation/${params.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(savePayload)
                        })

                        if (saveResponse.ok) {
                            console.log('Logo saved to database successfully!')
                            // Update the previousDataRef so autosave doesn't overwrite
                            previousDataRef.current = JSON.stringify(updatedData)
                            lastManualSaveTimeRef.current = Date.now() // PROTECT against immediate autosave overwrite
                            setLastSaved(new Date())
                            setHasChanges(false)
                        } else {
                            console.error('Failed to save logo to database')
                        }
                    } else {
                        throw new Error('Upload response invalid')
                    }
                } else {
                    throw new Error('Upload failed')
                }
            } catch (error) {
                // Fallback to base64 if API upload fails
                console.warn('Using base64 fallback for logo:', error)
                const reader = new FileReader()
                reader.onloadend = () => {
                    setQuotationData(prev => ({ ...prev, companyLogo: reader.result as string }))
                    setIsUploadingLogo(false)
                }
                reader.readAsDataURL(file)
                return // Don't set isUploadingLogo to false here, let reader.onloadend do it
            }
            setIsUploadingLogo(false)
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
                                <><Loader2 className="w-3 h-3 animate-spin text-blue-500" /> Saving changes...</>
                            ) : saveError ? (
                                <span className="text-red-500 flex items-center gap-1">
                                    <CloudOff className="w-3 h-3" /> {saveError}
                                </span>
                            ) : hasChanges ? (
                                <><CloudOff className="w-3 h-3 text-yellow-500" /> Unsaved changes...</>
                            ) : (
                                <>
                                    <Cloud className="w-3 h-3 text-green-500" />
                                    All changes saved
                                    {lastSaved && (
                                        <span className="text-muted-foreground ml-1">
                                            · {lastSaved.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </>
                            )}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Manual Save Button - saves immediately */}
                    {hasChanges && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                                setIsSaving(true)
                                try {
                                    const payload = {
                                        title: quotationData.title,
                                        titleStyle: quotationData.titleStyle,
                                        refNo: quotationData.refNo,
                                        refNoStyle: quotationData.refNoStyle,
                                        date: quotationData.date,
                                        dateStyle: quotationData.dateStyle,
                                        companyDetails: {
                                            name: quotationData.companyName,
                                            nameStyle: quotationData.companyNameStyle,
                                            logo: quotationData.companyLogo,
                                            logoWidth: quotationData.companyLogoWidth,
                                            logoHeight: quotationData.companyLogoHeight,
                                            gstin: quotationData.companyGSTIN,
                                            gstinStyle: quotationData.companyGSTINStyle,
                                            phone: quotationData.companyPhone,
                                            phoneStyle: quotationData.companyPhoneStyle,
                                            email: quotationData.companyEmail,
                                            emailStyle: quotationData.companyEmailStyle,
                                            address: quotationData.companyAddress,
                                            addressStyle: quotationData.companyAddressStyle,
                                            headerValueColor: quotationData.headerValueColor,
                                            headerLineColor: quotationData.headerLineColor,
                                        },
                                        clientDetails: {
                                            name: quotationData.clientName,
                                            nameStyle: quotationData.clientNameStyle,
                                            designation: quotationData.clientDesignation,
                                            designationStyle: quotationData.clientDesignationStyle,
                                            company: quotationData.clientCompany,
                                            companyStyle: quotationData.clientCompanyStyle,
                                            address: quotationData.clientAddress,
                                            addressStyle: quotationData.clientAddressStyle,
                                        },
                                        subject: quotationData.subject,
                                        subjectStyle: quotationData.subjectStyle,
                                        greeting: quotationData.greeting,
                                        greetingStyle: quotationData.greetingStyle,
                                        contentBlocks: quotationData.contentBlocks,
                                        footer: {
                                            line1: quotationData.footerLine1,
                                            line1Style: quotationData.footerLine1Style,
                                            line2: quotationData.footerLine2,
                                            line2Style: quotationData.footerLine2Style,
                                            line3: quotationData.footerLine3,
                                            line3Style: quotationData.footerLine3Style,
                                            lineColor: quotationData.footerLineColor,
                                            textColor: quotationData.footerTextColor,
                                        },
                                        signature: {
                                            name: quotationData.signatureName,
                                            nameStyle: quotationData.signatureNameStyle,
                                            designation: quotationData.signatureDesignation,
                                            designationStyle: quotationData.signatureDesignationStyle,
                                        },
                                        watermark: {
                                            type: quotationData.watermarkType,
                                            text: quotationData.watermarkText,
                                            color: quotationData.watermarkColor,
                                            image: quotationData.watermarkImage,
                                            opacity: quotationData.watermarkOpacity,
                                            rotation: quotationData.watermarkRotation,
                                            width: quotationData.watermarkWidth,
                                            height: quotationData.watermarkHeight,
                                        },
                                        defaultFontFamily: quotationData.defaultFontFamily,
                                    }
                                    const response = await fetch(`/api/techno-quotation/${params.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(payload)
                                    })
                                    if (response.ok) {
                                        previousDataRef.current = JSON.stringify(quotationData)
                                        lastManualSaveTimeRef.current = Date.now() // PROTECT against immediate autosave overwrite
                                        setLastSaved(new Date())
                                        setHasChanges(false)
                                        setSaveError(null)
                                    }
                                } catch (error) {
                                    console.error("Error saving:", error)
                                } finally {
                                    setIsSaving(false)
                                }
                            }}
                            disabled={isSaving}
                            className="gap-1"
                        >
                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Cloud className="w-3 h-3" />}
                            Save Now
                        </Button>
                    )}
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
                                            {isUploadingLogo ? (
                                                <div className="w-16 h-16 border rounded flex flex-col items-center justify-center bg-muted animate-pulse">
                                                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                                    <span className="text-[10px] text-muted-foreground mt-1">Uploading...</span>
                                                </div>
                                            ) : quotationData.companyLogo ? (
                                                <img src={quotationData.companyLogo} alt="Logo" className="w-16 h-16 object-contain border rounded" />
                                            ) : (
                                                <div className="w-16 h-16 border rounded flex items-center justify-center bg-muted">
                                                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                            )}
                                            <label className={`cursor-pointer ${isUploadingLogo ? 'pointer-events-none opacity-50' : ''}`}>
                                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={isUploadingLogo} />
                                                <Button variant="outline" size="sm" asChild disabled={isUploadingLogo}>
                                                    <span>
                                                        {isUploadingLogo ? (
                                                            <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Uploading...</>
                                                        ) : (
                                                            <><Upload className="w-4 h-4 mr-1" /> Upload</>
                                                        )}
                                                    </span>
                                                </Button>
                                            </label>
                                            {quotationData.companyLogo && !isUploadingLogo && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setQuotationData({ ...quotationData, companyLogo: '' })}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-1" /> Remove
                                                </Button>
                                            )}
                                        </div>
                                        {quotationData.companyLogo && (
                                            <div className="grid grid-cols-2 gap-3 mt-3">
                                                <div>
                                                    <Label className="text-xs">Logo Width (px)</Label>
                                                    <Input
                                                        type="number"
                                                        min={20}
                                                        max={200}
                                                        value={quotationData.companyLogoWidth}
                                                        onChange={e => setQuotationData({ ...quotationData, companyLogoWidth: parseInt(e.target.value) || 80 })}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Logo Height (px)</Label>
                                                    <Input
                                                        type="number"
                                                        min={20}
                                                        max={200}
                                                        value={quotationData.companyLogoHeight}
                                                        onChange={e => setQuotationData({ ...quotationData, companyLogoHeight: parseInt(e.target.value) || 80 })}
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <RichTextFieldEditor
                                        label="Company Name"
                                        value={quotationData.companyName}
                                        onChange={v => setQuotationData({ ...quotationData, companyName: v })}
                                        style={quotationData.companyNameStyle}
                                        onStyleChange={s => setQuotationData({ ...quotationData, companyNameStyle: s })}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <RichTextFieldEditor
                                            label="GSTIN"
                                            value={quotationData.companyGSTIN}
                                            onChange={v => setQuotationData({ ...quotationData, companyGSTIN: v })}
                                            style={quotationData.companyGSTINStyle}
                                            onStyleChange={s => setQuotationData({ ...quotationData, companyGSTINStyle: s })}
                                        />
                                        <RichTextFieldEditor
                                            label="Phone"
                                            value={quotationData.companyPhone}
                                            onChange={v => setQuotationData({ ...quotationData, companyPhone: v })}
                                            style={quotationData.companyPhoneStyle}
                                            onStyleChange={s => setQuotationData({ ...quotationData, companyPhoneStyle: s })}
                                        />
                                    </div>
                                    <RichTextFieldEditor
                                        label="Email"
                                        value={quotationData.companyEmail}
                                        onChange={v => setQuotationData({ ...quotationData, companyEmail: v })}
                                        style={quotationData.companyEmailStyle}
                                        onStyleChange={s => setQuotationData({ ...quotationData, companyEmailStyle: s })}
                                    />
                                    <RichTextFieldEditor
                                        label="Address"
                                        value={quotationData.companyAddress}
                                        onChange={v => setQuotationData({ ...quotationData, companyAddress: v })}
                                        style={quotationData.companyAddressStyle}
                                        onStyleChange={s => setQuotationData({ ...quotationData, companyAddressStyle: s })}
                                        multiline
                                        rows={2}
                                    />
                                    <div>
                                        <Label>Header Value Color</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <input
                                                type="color"
                                                value={quotationData.headerValueColor}
                                                onChange={e => {
                                                    const newColor = e.target.value;
                                                    setQuotationData({
                                                        ...quotationData,
                                                        headerValueColor: newColor,
                                                        companyGSTINStyle: { ...quotationData.companyGSTINStyle, color: newColor },
                                                        companyPhoneStyle: { ...quotationData.companyPhoneStyle, color: newColor },
                                                        companyEmailStyle: { ...quotationData.companyEmailStyle, color: newColor },
                                                    });
                                                }}
                                                className="w-10 h-10 rounded border cursor-pointer"
                                            />
                                            <Input
                                                value={quotationData.headerValueColor}
                                                onChange={e => {
                                                    const newColor = e.target.value;
                                                    setQuotationData({
                                                        ...quotationData,
                                                        headerValueColor: newColor,
                                                        companyGSTINStyle: { ...quotationData.companyGSTINStyle, color: newColor },
                                                        companyPhoneStyle: { ...quotationData.companyPhoneStyle, color: newColor },
                                                        companyEmailStyle: { ...quotationData.companyEmailStyle, color: newColor },
                                                    });
                                                }}
                                                className="w-28"
                                                placeholder="#000000"
                                            />
                                            <span className="text-xs text-muted-foreground">GSTIN, Phone, Email colors</span>
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Header Line Color</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <input
                                                type="color"
                                                value={quotationData.headerLineColor}
                                                onChange={e => setQuotationData({ ...quotationData, headerLineColor: e.target.value })}
                                                className="w-10 h-10 rounded border cursor-pointer"
                                            />
                                            <Input
                                                value={quotationData.headerLineColor}
                                                onChange={e => setQuotationData({ ...quotationData, headerLineColor: e.target.value })}
                                                className="w-28"
                                                placeholder="#000000"
                                            />
                                            <span className="text-xs text-muted-foreground">Header bottom border</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4 border-l-4 border-l-orange-500">
                                <h3 className="font-semibold text-lg mb-4">Document Info</h3>
                                <div className="space-y-3">
                                    <RichTextFieldEditor
                                        label="Document Title"
                                        value={quotationData.title}
                                        onChange={v => setQuotationData({ ...quotationData, title: v })}
                                        style={quotationData.titleStyle}
                                        onStyleChange={s => setQuotationData({ ...quotationData, titleStyle: s })}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <RichTextFieldEditor
                                            label="Reference No."
                                            value={quotationData.refNo}
                                            onChange={v => setQuotationData({ ...quotationData, refNo: v })}
                                            style={quotationData.refNoStyle}
                                            onStyleChange={s => setQuotationData({ ...quotationData, refNoStyle: s })}
                                        />
                                        <RichTextFieldEditor
                                            label="Date"
                                            value={quotationData.date}
                                            onChange={v => setQuotationData({ ...quotationData, date: v })}
                                            style={quotationData.dateStyle}
                                            onStyleChange={s => setQuotationData({ ...quotationData, dateStyle: s })}
                                            type="date"
                                        />
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>

                        {/* Client Tab */}
                        <TabsContent value="client" className="space-y-4">
                            <Card className="p-4 border-l-4 border-l-blue-500">
                                <h3 className="font-semibold text-lg mb-4">Client Details</h3>
                                <div className="space-y-3">
                                    <RichTextFieldEditor
                                        label="To (Company/Organization)"
                                        value={quotationData.clientCompany}
                                        onChange={v => setQuotationData({ ...quotationData, clientCompany: v })}
                                        style={quotationData.clientCompanyStyle}
                                        onStyleChange={s => setQuotationData({ ...quotationData, clientCompanyStyle: s })}
                                        placeholder="Client Company Name"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <RichTextFieldEditor
                                            label="Contact Person"
                                            value={quotationData.clientName}
                                            onChange={v => setQuotationData({ ...quotationData, clientName: v })}
                                            style={quotationData.clientNameStyle}
                                            onStyleChange={s => setQuotationData({ ...quotationData, clientNameStyle: s })}
                                        />
                                        <RichTextFieldEditor
                                            label="Designation"
                                            value={quotationData.clientDesignation}
                                            onChange={v => setQuotationData({ ...quotationData, clientDesignation: v })}
                                            style={quotationData.clientDesignationStyle}
                                            onStyleChange={s => setQuotationData({ ...quotationData, clientDesignationStyle: s })}
                                        />
                                    </div>
                                    <RichTextFieldEditor
                                        label="Address"
                                        value={quotationData.clientAddress}
                                        onChange={v => setQuotationData({ ...quotationData, clientAddress: v })}
                                        style={quotationData.clientAddressStyle}
                                        onStyleChange={s => setQuotationData({ ...quotationData, clientAddressStyle: s })}
                                        multiline
                                        rows={3}
                                    />
                                </div>
                            </Card>

                            <Card className="p-4 border-l-4 border-l-green-500">
                                <h3 className="font-semibold text-lg mb-4">Subject & Greeting</h3>
                                <div className="space-y-3">
                                    <RichTextFieldEditor
                                        label="Subject Line"
                                        value={quotationData.subject}
                                        onChange={v => setQuotationData({ ...quotationData, subject: v })}
                                        style={quotationData.subjectStyle}
                                        onStyleChange={s => setQuotationData({ ...quotationData, subjectStyle: s })}
                                    />
                                    <RichTextFieldEditor
                                        label="Greeting"
                                        value={quotationData.greeting}
                                        onChange={v => setQuotationData({ ...quotationData, greeting: v })}
                                        style={quotationData.greetingStyle}
                                        onStyleChange={s => setQuotationData({ ...quotationData, greetingStyle: s })}
                                    />
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

                                            {/* Table Editor - Plain inputs, styling only in preview */}
                                            <div className="overflow-x-auto border rounded-lg">
                                                <table className="w-full border-collapse text-sm">
                                                    <thead>
                                                        <tr className="bg-muted">
                                                            {block.tableData.headers.map((header, ci) => (
                                                                <th
                                                                    key={ci}
                                                                    className="p-1 border border-border"
                                                                >
                                                                    <div className="flex items-center gap-1">
                                                                        <Input
                                                                            value={header}
                                                                            onChange={e => updateTableHeader(block.id, ci, e.target.value)}
                                                                            className="h-7 text-xs font-semibold"
                                                                            placeholder="Header"
                                                                        />
                                                                        {block.tableData!.headers.length > 1 && (
                                                                            <Button
                                                                                size="icon"
                                                                                variant="ghost"
                                                                                className="h-6 w-6 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                                onClick={() => deleteTableColumn(block.id, ci)}
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </th>
                                                            ))}
                                                            <th className="w-8 bg-muted border border-border"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {block.tableData.rows.map((row, ri) => (
                                                            <tr key={ri}>
                                                                {row.map((cell, ci) => (
                                                                    <td
                                                                        key={ci}
                                                                        className="p-1 border border-border"
                                                                    >
                                                                        <Input
                                                                            value={cell}
                                                                            onChange={e => updateTableCell(block.id, ri, ci, e.target.value)}
                                                                            className="h-7 text-xs"
                                                                            placeholder="Enter data"
                                                                        />
                                                                    </td>
                                                                ))}
                                                                <td className="p-1 w-8 bg-muted border border-border">
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
                                    <RichTextFieldEditor
                                        label="Line 1"
                                        value={quotationData.footerLine1}
                                        onChange={v => setQuotationData({ ...quotationData, footerLine1: v })}
                                        style={quotationData.footerLine1Style}
                                        onStyleChange={s => setQuotationData({ ...quotationData, footerLine1Style: s })}
                                    />
                                    <RichTextFieldEditor
                                        label="Line 2"
                                        value={quotationData.footerLine2}
                                        onChange={v => setQuotationData({ ...quotationData, footerLine2: v })}
                                        style={quotationData.footerLine2Style}
                                        onStyleChange={s => setQuotationData({ ...quotationData, footerLine2Style: s })}
                                    />
                                    <RichTextFieldEditor
                                        label="Line 3"
                                        value={quotationData.footerLine3}
                                        onChange={v => setQuotationData({ ...quotationData, footerLine3: v })}
                                        style={quotationData.footerLine3Style}
                                        onStyleChange={s => setQuotationData({ ...quotationData, footerLine3Style: s })}
                                    />
                                    <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                                        <div>
                                            <Label>Footer Line Color</Label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <input
                                                    type="color"
                                                    value={quotationData.footerLineColor}
                                                    onChange={e => setQuotationData({ ...quotationData, footerLineColor: e.target.value })}
                                                    className="w-10 h-10 rounded border cursor-pointer"
                                                />
                                                <Input
                                                    value={quotationData.footerLineColor}
                                                    onChange={e => setQuotationData({ ...quotationData, footerLineColor: e.target.value })}
                                                    className="w-24"
                                                    placeholder="#000000"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Footer Text Color</Label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <input
                                                    type="color"
                                                    value={quotationData.footerTextColor}
                                                    onChange={e => {
                                                        const newColor = e.target.value;
                                                        setQuotationData({
                                                            ...quotationData,
                                                            footerTextColor: newColor,
                                                            footerLine1Style: { ...quotationData.footerLine1Style, color: newColor },
                                                            footerLine2Style: { ...quotationData.footerLine2Style, color: newColor },
                                                            footerLine3Style: { ...quotationData.footerLine3Style, color: newColor },
                                                        });
                                                    }}
                                                    className="w-10 h-10 rounded border cursor-pointer"
                                                />
                                                <Input
                                                    value={quotationData.footerTextColor}
                                                    onChange={e => {
                                                        const newColor = e.target.value;
                                                        setQuotationData({
                                                            ...quotationData,
                                                            footerTextColor: newColor,
                                                            footerLine1Style: { ...quotationData.footerLine1Style, color: newColor },
                                                            footerLine2Style: { ...quotationData.footerLine2Style, color: newColor },
                                                            footerLine3Style: { ...quotationData.footerLine3Style, color: newColor },
                                                        });
                                                    }}
                                                    className="w-24"
                                                    placeholder="#000000"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4 border-l-4 border-l-emerald-500">
                                <h3 className="font-semibold text-lg mb-4">Default Font Style</h3>
                                <div className="space-y-3">
                                    <div>
                                        <Label>Font Family</Label>
                                        <Select
                                            value={quotationData.defaultFontFamily}
                                            onValueChange={(v) => setQuotationData({ ...quotationData, defaultFontFamily: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                                                <SelectItem value="Arial">Arial</SelectItem>
                                                <SelectItem value="Georgia">Georgia</SelectItem>
                                                <SelectItem value="Verdana">Verdana</SelectItem>
                                                <SelectItem value="Tahoma">Tahoma</SelectItem>
                                                <SelectItem value="Courier New">Courier New</SelectItem>
                                                <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
                                                <SelectItem value="Calibri">Calibri</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <span className="text-xs text-muted-foreground mt-1 block">Applied to entire document</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4 border-l-4 border-l-pink-500">
                                <h3 className="font-semibold text-lg mb-4">Signature</h3>
                                <div className="space-y-3">
                                    <RichTextFieldEditor
                                        label="Signatory Name"
                                        value={quotationData.signatureName}
                                        onChange={v => setQuotationData({ ...quotationData, signatureName: v })}
                                        style={quotationData.signatureNameStyle}
                                        onStyleChange={s => setQuotationData({ ...quotationData, signatureNameStyle: s })}
                                    />
                                    <RichTextFieldEditor
                                        label="Designation"
                                        value={quotationData.signatureDesignation}
                                        onChange={v => setQuotationData({ ...quotationData, signatureDesignation: v })}
                                        style={quotationData.signatureDesignationStyle}
                                        onStyleChange={s => setQuotationData({ ...quotationData, signatureDesignationStyle: s })}
                                    />
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
                <div className="lg:col-span-7 flex flex-col h-[calc(100vh-140px)] bg-gray-100 dark:bg-gray-900 rounded-lg">
                    {/* Zoom Controls */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-t-lg">
                        <span className="text-xs font-medium text-muted-foreground">Preview</span>
                        <div className="flex items-center gap-1">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => setPreviewZoom(prev => Math.max(0.3, prev - 0.1))}
                                disabled={previewZoom <= 0.3}
                            >
                                <ZoomOut className="w-4 h-4" />
                            </Button>
                            <div className="w-14 text-center text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
                                {Math.round(previewZoom * 100)}%
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => setPreviewZoom(prev => Math.min(1.5, prev + 0.1))}
                                disabled={previewZoom >= 1.5}
                            >
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => setPreviewZoom(0.7)}
                                title="Reset Zoom"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>

                    {/* Scrollable Preview Area */}
                    <div className="flex-1 overflow-auto preview-scrollbar p-4">
                        <div
                            className="preview-zoom-container"
                            style={{
                                transform: `scale(${previewZoom})`,
                                width: `${100 / previewZoom}%`,
                                marginLeft: `${-(100 / previewZoom - 100) / 2}%`
                            }}
                        >
                            <div ref={printRef} className="quotation-preview" style={{ fontFamily: `'${quotationData.defaultFontFamily}', serif` }}>
                                <div className="page">
                                    {/* Watermark */}
                                    <div
                                        className="watermark"
                                        style={{
                                            transform: `translate(-50%, -50%) rotate(${quotationData.watermarkRotation}deg)`,
                                            width: `${quotationData.watermarkWidth}px`,
                                            height: `${quotationData.watermarkHeight}px`,
                                        }}
                                    >
                                        {quotationData.watermarkType === 'text' ? (
                                            (() => {
                                                // Convert hex color to rgba with opacity for print compatibility
                                                const hexToRgba = (hex: string, opacity: number) => {
                                                    const r = parseInt(hex.slice(1, 3), 16);
                                                    const g = parseInt(hex.slice(3, 5), 16);
                                                    const b = parseInt(hex.slice(5, 7), 16);
                                                    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
                                                };
                                                return (
                                                    <span style={{
                                                        fontSize: `${quotationData.watermarkHeight * 0.4}px`,
                                                        color: hexToRgba(quotationData.watermarkColor, quotationData.watermarkOpacity),
                                                        fontWeight: 'bold',
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        {quotationData.watermarkText}
                                                    </span>
                                                );
                                            })()
                                        ) : quotationData.watermarkImage ? (
                                            <img
                                                src={quotationData.watermarkImage}
                                                alt="Watermark"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'contain',
                                                    opacity: quotationData.watermarkOpacity,
                                                }}
                                            />
                                        ) : null}
                                    </div>

                                    {/* Header */}
                                    <div className="header" style={{ borderBottomColor: quotationData.headerLineColor }}>
                                        <div className="header-left">
                                            {quotationData.companyLogo ? (
                                                <img
                                                    src={quotationData.companyLogo}
                                                    alt="Logo"
                                                    className="company-logo"
                                                    style={{
                                                        width: `${quotationData.companyLogoWidth}px`,
                                                        height: `${quotationData.companyLogoHeight}px`,
                                                    }}
                                                />
                                            ) : (
                                                <div className="logo-placeholder">LOGO</div>
                                            )}
                                            <div
                                                className="company-name"
                                                style={{
                                                    fontSize: `${quotationData.companyNameStyle?.fontSize || 20}px`,
                                                    fontWeight: quotationData.companyNameStyle?.fontWeight || 'bold',
                                                    fontStyle: quotationData.companyNameStyle?.fontStyle || 'normal',
                                                    textDecoration: quotationData.companyNameStyle?.textDecoration || 'none',
                                                    textAlign: quotationData.companyNameStyle?.textAlign || 'left',
                                                    color: quotationData.companyNameStyle?.color || '#1a1a1a',
                                                }}
                                            >
                                                {quotationData.companyName}
                                            </div>
                                        </div>
                                        <div className="header-right">
                                            <div className="header-info-row">
                                                <span className="info-label">GSTIN :</span>
                                                <span
                                                    className="info-value"
                                                    style={{
                                                        fontSize: `${quotationData.companyGSTINStyle?.fontSize || 12}px`,
                                                        fontWeight: quotationData.companyGSTINStyle?.fontWeight || 'normal',
                                                        fontStyle: quotationData.companyGSTINStyle?.fontStyle || 'normal',
                                                        textDecoration: quotationData.companyGSTINStyle?.textDecoration || 'none',
                                                        color: quotationData.companyGSTINStyle?.color || quotationData.headerValueColor
                                                    }}
                                                >
                                                    {quotationData.companyGSTIN}
                                                </span>
                                            </div>
                                            <div className="header-info-row">
                                                <span className="info-label">Contact :</span>
                                                <span
                                                    className="info-value"
                                                    style={{
                                                        fontSize: `${quotationData.companyPhoneStyle?.fontSize || 12}px`,
                                                        fontWeight: quotationData.companyPhoneStyle?.fontWeight || 'normal',
                                                        fontStyle: quotationData.companyPhoneStyle?.fontStyle || 'normal',
                                                        textDecoration: quotationData.companyPhoneStyle?.textDecoration || 'none',
                                                        color: quotationData.companyPhoneStyle?.color || quotationData.headerValueColor
                                                    }}
                                                >
                                                    {quotationData.companyPhone}
                                                </span>
                                            </div>
                                            <div className="header-info-row">
                                                <span className="info-label">Email :</span>
                                                <span
                                                    className="info-value"
                                                    style={{
                                                        fontSize: `${quotationData.companyEmailStyle?.fontSize || 12}px`,
                                                        fontWeight: quotationData.companyEmailStyle?.fontWeight || 'normal',
                                                        fontStyle: quotationData.companyEmailStyle?.fontStyle || 'normal',
                                                        textDecoration: quotationData.companyEmailStyle?.textDecoration || 'underline',
                                                        color: quotationData.companyEmailStyle?.color || quotationData.headerValueColor
                                                    }}
                                                >
                                                    {quotationData.companyEmail}
                                                </span>
                                            </div>
                                            <div className="header-info-row address-row">
                                                <span className="info-label">Address :</span>
                                                <span
                                                    className="info-value address-value"
                                                    style={{
                                                        fontSize: `${quotationData.companyAddressStyle?.fontSize || 12}px`,
                                                        fontWeight: quotationData.companyAddressStyle?.fontWeight || 'normal',
                                                        fontStyle: quotationData.companyAddressStyle?.fontStyle || 'normal',
                                                        textDecoration: quotationData.companyAddressStyle?.textDecoration || 'none',
                                                        color: quotationData.companyAddressStyle?.color || '#1a1a1a',
                                                    }}
                                                >
                                                    {quotationData.companyAddress}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h1
                                        className="document-title"
                                        style={{
                                            fontSize: `${quotationData.titleStyle?.fontSize || 16}px`,
                                            fontWeight: quotationData.titleStyle?.fontWeight || 'bold',
                                            fontStyle: quotationData.titleStyle?.fontStyle || 'normal',
                                            textDecoration: quotationData.titleStyle?.textDecoration || 'underline',
                                            textAlign: quotationData.titleStyle?.textAlign || 'left',
                                            color: quotationData.titleStyle?.color || '#1a1a1a',
                                        }}
                                    >
                                        {quotationData.title}
                                    </h1>

                                    {/* Reference & Date */}
                                    <div className="ref-section">
                                        <p style={{
                                            fontSize: `${quotationData.refNoStyle?.fontSize || 11}px`,
                                            fontWeight: quotationData.refNoStyle?.fontWeight || 'normal',
                                            fontStyle: quotationData.refNoStyle?.fontStyle || 'normal',
                                            textDecoration: quotationData.refNoStyle?.textDecoration || 'none',
                                            color: quotationData.refNoStyle?.color || '#1a1a1a',
                                        }}>
                                            <strong>Ref No.:</strong> {quotationData.refNo}
                                        </p>
                                        <p style={{
                                            fontSize: `${quotationData.dateStyle?.fontSize || 11}px`,
                                            fontWeight: quotationData.dateStyle?.fontWeight || 'normal',
                                            fontStyle: quotationData.dateStyle?.fontStyle || 'normal',
                                            textDecoration: quotationData.dateStyle?.textDecoration || 'none',
                                            color: quotationData.dateStyle?.color || '#1a1a1a',
                                        }}>
                                            <strong>Date:</strong> {new Date(quotationData.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>

                                    {/* To Section */}
                                    <div className="to-section">
                                        <p><strong>To</strong></p>
                                        <p style={{
                                            fontSize: `${quotationData.clientCompanyStyle?.fontSize || 11}px`,
                                            fontWeight: quotationData.clientCompanyStyle?.fontWeight || 'bold',
                                            fontStyle: quotationData.clientCompanyStyle?.fontStyle || 'normal',
                                            textDecoration: quotationData.clientCompanyStyle?.textDecoration || 'none',
                                            color: quotationData.clientCompanyStyle?.color || '#1a1a1a',
                                        }}>
                                            {quotationData.clientCompany}
                                        </p>
                                        {quotationData.clientName && (
                                            <p style={{
                                                fontSize: `${quotationData.clientNameStyle?.fontSize || 11}px`,
                                                fontWeight: quotationData.clientNameStyle?.fontWeight || 'normal',
                                                fontStyle: quotationData.clientNameStyle?.fontStyle || 'normal',
                                                textDecoration: quotationData.clientNameStyle?.textDecoration || 'none',
                                                color: quotationData.clientNameStyle?.color || '#1a1a1a',
                                            }}>
                                                {quotationData.clientName}
                                                {quotationData.clientDesignation && (
                                                    <span style={{
                                                        fontSize: `${quotationData.clientDesignationStyle?.fontSize || 11}px`,
                                                        fontWeight: quotationData.clientDesignationStyle?.fontWeight || 'normal',
                                                        fontStyle: quotationData.clientDesignationStyle?.fontStyle || 'normal',
                                                        textDecoration: quotationData.clientDesignationStyle?.textDecoration || 'none',
                                                        color: quotationData.clientDesignationStyle?.color || '#1a1a1a',
                                                    }}>
                                                        , {quotationData.clientDesignation}
                                                    </span>
                                                )}
                                            </p>
                                        )}
                                        {quotationData.clientAddress && (
                                            <p style={{
                                                whiteSpace: 'pre-line',
                                                fontSize: `${quotationData.clientAddressStyle?.fontSize || 11}px`,
                                                fontWeight: quotationData.clientAddressStyle?.fontWeight || 'normal',
                                                fontStyle: quotationData.clientAddressStyle?.fontStyle || 'normal',
                                                textDecoration: quotationData.clientAddressStyle?.textDecoration || 'none',
                                                color: quotationData.clientAddressStyle?.color || '#1a1a1a',
                                            }}>
                                                {quotationData.clientAddress}
                                            </p>
                                        )}
                                    </div>

                                    {/* Subject */}
                                    <div className="subject-section">
                                        <p style={{
                                            fontSize: `${quotationData.subjectStyle?.fontSize || 11}px`,
                                            fontWeight: quotationData.subjectStyle?.fontWeight || 'normal',
                                            fontStyle: quotationData.subjectStyle?.fontStyle || 'normal',
                                            textDecoration: quotationData.subjectStyle?.textDecoration || 'none',
                                            color: quotationData.subjectStyle?.color || '#1a1a1a',
                                        }}>
                                            <strong>Sub:</strong> {quotationData.subject}
                                        </p>
                                        <p style={{
                                            fontSize: `${quotationData.greetingStyle?.fontSize || 11}px`,
                                            fontWeight: quotationData.greetingStyle?.fontWeight || 'normal',
                                            fontStyle: quotationData.greetingStyle?.fontStyle || 'normal',
                                            textDecoration: quotationData.greetingStyle?.textDecoration || 'none',
                                            color: quotationData.greetingStyle?.color || '#1a1a1a',
                                        }}>
                                            {quotationData.greeting}
                                        </p>
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
                                                                            backgroundColor: block.tableData!.style?.headerBgColor || 'transparent',
                                                                            color: block.tableData!.style?.headerTextColor || '#000000',
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
                                        <p style={{
                                            fontSize: `${quotationData.signatureNameStyle?.fontSize || 11}px`,
                                            fontWeight: quotationData.signatureNameStyle?.fontWeight || 'bold',
                                            fontStyle: quotationData.signatureNameStyle?.fontStyle || 'normal',
                                            textDecoration: quotationData.signatureNameStyle?.textDecoration || 'none',
                                            color: quotationData.signatureNameStyle?.color || '#1a1a1a',
                                        }}>
                                            {quotationData.signatureName}
                                        </p>
                                        <p style={{
                                            fontSize: `${quotationData.signatureDesignationStyle?.fontSize || 11}px`,
                                            fontWeight: quotationData.signatureDesignationStyle?.fontWeight || 'normal',
                                            fontStyle: quotationData.signatureDesignationStyle?.fontStyle || 'normal',
                                            textDecoration: quotationData.signatureDesignationStyle?.textDecoration || 'none',
                                            color: quotationData.signatureDesignationStyle?.color || '#1a1a1a',
                                        }}>
                                            {quotationData.signatureDesignation}
                                        </p>
                                    </div>

                                    {/* Footer */}
                                    <div className="footer" style={{ borderTopColor: quotationData.footerLineColor }}>
                                        <p style={{
                                            fontSize: `${quotationData.footerLine1Style?.fontSize || 9}px`,
                                            fontWeight: quotationData.footerLine1Style?.fontWeight || 'normal',
                                            fontStyle: quotationData.footerLine1Style?.fontStyle || 'normal',
                                            textDecoration: quotationData.footerLine1Style?.textDecoration || 'none',
                                            textAlign: quotationData.footerLine1Style?.textAlign || 'center',
                                            color: quotationData.footerLine1Style?.color || quotationData.footerTextColor,
                                        }}>
                                            {quotationData.footerLine1}
                                        </p>
                                        <p style={{
                                            fontSize: `${quotationData.footerLine2Style?.fontSize || 9}px`,
                                            fontWeight: quotationData.footerLine2Style?.fontWeight || 'normal',
                                            fontStyle: quotationData.footerLine2Style?.fontStyle || 'normal',
                                            textDecoration: quotationData.footerLine2Style?.textDecoration || 'none',
                                            textAlign: quotationData.footerLine2Style?.textAlign || 'center',
                                            color: quotationData.footerLine2Style?.color || quotationData.footerTextColor,
                                        }}>
                                            {quotationData.footerLine2}
                                        </p>
                                        <p style={{
                                            fontSize: `${quotationData.footerLine3Style?.fontSize || 9}px`,
                                            fontWeight: quotationData.footerLine3Style?.fontWeight || 'normal',
                                            fontStyle: quotationData.footerLine3Style?.fontStyle || 'normal',
                                            textDecoration: quotationData.footerLine3Style?.textDecoration || 'none',
                                            textAlign: quotationData.footerLine3Style?.textAlign || 'center',
                                            color: quotationData.footerLine3Style?.color || quotationData.footerTextColor,
                                        }}>
                                            {quotationData.footerLine3}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                /* Custom Compact Scrollbar */
                .preview-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(155, 155, 155, 0.5) transparent;
                }
                
                .preview-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                
                .preview-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                    border-radius: 10px;
                }
                
                .preview-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(155, 155, 155, 0.5);
                    border-radius: 10px;
                    border: 2px solid transparent;
                    background-clip: content-box;
                }
                
                .preview-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(155, 155, 155, 0.8);
                    border: 2px solid transparent;
                    background-clip: content-box;
                }
                
                .preview-scrollbar::-webkit-scrollbar-corner {
                    background: transparent;
                }
                
                /* Zoom Container for Preview */
                .preview-zoom-container {
                    transform-origin: top center;
                    transition: transform 0.2s ease-out;
                }
                
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
                    border-bottom: 2px solid #000000;
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
                    /* Font size, weight, color controlled by inline styles */
                }
                
                .quotation-preview .header-right {
                    text-align: left;
                    /* font-size controlled by inline styles */
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
                    /* Font size, weight, decoration, align controlled by inline styles */
                    margin: 15px 0;
                }
                
                .quotation-preview .ref-section {
                    /* font-size controlled by inline styles */
                    margin-bottom: 10px;
                }
                
                .quotation-preview .ref-section p {
                    margin: 2px 0;
                }
                
                .quotation-preview .to-section {
                    /* font-size controlled by inline styles */
                    margin-bottom: 10px;
                }
                
                .quotation-preview .to-section p {
                    margin: 2px 0;
                }
                
                .quotation-preview .subject-section {
                    /* font-size controlled by inline styles */
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
                    /* Font size, weight, decoration, align controlled by inline styles */
                }
                
                .quotation-preview .block-paragraph {
                    margin: 5px 0;
                    /* text-align controlled by inline styles */
                    /* line-height controlled by inline styles */
                }
                
                .quotation-preview .block-list {
                    margin: 5px 0 5px 20px;
                    padding-left: 0;
                }
                
                .quotation-preview .block-list li {
                    margin: 3px 0;
                    /* font-size controlled by inline styles */
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
                    /* font-size controlled by inline styles */
                }
                
                .quotation-preview .signature-section p {
                    margin: 2px 0;
                }
                
                .quotation-preview .footer {
                    position: absolute;
                    bottom: 15mm;
                    left: 15mm;
                    right: 15mm;
                    border-top: 2px solid #000000;
                    padding-top: 10px;
                    /* font-size, text-align, color controlled by inline styles */
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
                    
                    .preview-zoom-container {
                        transform: none !important;
                        width: 100% !important;
                        margin-left: 0 !important;
                    }
                    
                    .quotation-preview .page {
                        width: 100%;
                        min-height: 100vh;
                        padding: 10mm 8mm; /* Reduced: 10mm top/bottom, 8mm left/right */
                        margin: 0;
                        box-shadow: none;
                        page-break-after: always;
                    }
                    
                    .quotation-preview .watermark {
                        position: absolute !important;
                        top: 50% !important;
                        left: 50% !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        z-index: 0 !important;
                        display: flex !important;
                        visibility: visible !important;
                        opacity: inherit !important;
                    }
                    
                    .quotation-preview .watermark span,
                    .quotation-preview .watermark img {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        visibility: visible !important;
                    }
                    
                    .quotation-preview .header {
                        display: flex !important;
                        justify-content: space-between !important;
                        align-items: flex-start !important;
                        flex-wrap: nowrap !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    .quotation-preview .header-left {
                        display: flex !important;
                        align-items: center !important;
                        gap: 15px !important;
                        flex-shrink: 0 !important;
                    }
                    
                    .quotation-preview .header-right {
                        max-width: 35% !important;
                        min-width: 180px !important;
                        flex-shrink: 0 !important;
                    }
                    
                    .quotation-preview .header-info-row {
                        white-space: nowrap !important;
                    }
                    
                    .quotation-preview .header-info-row.address-row {
                        white-space: normal !important;
                    }
                    
                    .quotation-preview .header-info-row.address-row .address-value {
                        display: inline !important;
                        white-space: normal !important;
                    }
                    
                    .quotation-preview .block-table th {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    .quotation-preview .footer {
                        left: 8mm;  /* Match reduced padding */
                        right: 8mm; /* Match reduced padding */
                        bottom: 10mm;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    )
}
