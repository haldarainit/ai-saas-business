"use client"

import { useState, useMemo, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Navbar from "@/components/navbar"
import { Plus, Trash2, ArrowLeft, Building2, Banknote, Printer } from "lucide-react"
import Link from "next/link"
import { useReactToPrint } from 'react-to-print';

interface InvoiceItem {
    id: string
    description: string
    hsnsac: string
    quantity: number
    rate: number
    discount: number
    taxRate: number // GST Rate % (total)
    cgstPercent: number // CGST %
    sgstPercent: number // SGST %
    cgst: number // Editable CGST amount
    sgst: number // Editable SGST amount
    totalGst: number // Editable Total GST amount
}

interface InvoiceData {
    // Meta
    title: string

    // Visibility toggles
    showBankDetails: boolean
    showTerms: boolean
    showJurisdiction: boolean
    showDeclaration: boolean
    showDiscount: boolean
    showTaxColumns: boolean

    // Company Info
    companyName: string
    companyAddress: string
    companyCity: string
    companyState: string
    companyPincode: string
    companyEmail: string
    companyPhone: string
    companyGSTIN: string
    companyPAN: string
    companyStateCode: string
    companyLogo: string

    // Client Info (Bill To)
    clientName: string
    clientAddress: string
    clientCity: string
    clientState: string
    clientPincode: string
    clientEmail: string
    clientPhone: string
    clientGSTIN: string
    clientStateCode: string

    // Ship To (Optional)
    shipToName: string
    shipToAddress: string
    shipToCity: string
    shipToState: string
    shipToPincode: string
    sameAsBillTo: boolean

    // Invoice Details
    invoiceNumber: string
    invoiceDate: string
    dueDate: string
    poNumber: string
    poDate: string
    placeOfSupply: string
    reverseCharge: string

    // Items
    items: InvoiceItem[]

    // Additional Charges
    shippingCharges: number
    otherCharges: number

    // Tax Settings
    taxType: "GST" | "IGST" | "None"
    gstDisplayMode: "simple" | "split" | "detailed" // simple = Total GST only, split = CGST+SGST, detailed = CGST+SGST+Total

    // Bank Details
    bankName: string
    accountNumber: string
    ifscCode: string
    branch: string
    upiId: string

    // Terms & Conditions
    notes: string
    termsConditions: string
    jurisdictionText: string

    // Footer
    authorizedSignatory: string
    declarationText: string

    // Invoice Style
    currency: string
    currencySymbol: string
}

const defaultInvoiceData: InvoiceData = {
    title: "TAX INVOICE",
    showBankDetails: true,
    showTerms: true,
    showJurisdiction: true,
    showDeclaration: false,
    showDiscount: true,
    showTaxColumns: true,
    companyName: "",
    companyAddress: "",
    companyCity: "",
    companyState: "",
    companyPincode: "",
    companyEmail: "",
    companyPhone: "",
    companyGSTIN: "",
    companyPAN: "",
    companyStateCode: "",
    companyLogo: "",

    clientName: "",
    clientAddress: "",
    clientCity: "",
    clientState: "",
    clientPincode: "",
    clientEmail: "",
    clientPhone: "",
    clientGSTIN: "",
    clientStateCode: "",

    shipToName: "",
    shipToAddress: "",
    shipToCity: "",
    shipToState: "",
    shipToPincode: "",
    sameAsBillTo: true,

    invoiceNumber: "INV-2025-0001",
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    poNumber: "",
    poDate: "",
    placeOfSupply: "",
    reverseCharge: "No",

    items: [{ id: "1", description: "", hsnsac: "", quantity: 1, rate: 0, discount: 0, taxRate: 18, cgstPercent: 9, sgstPercent: 9, cgst: 0, sgst: 0, totalGst: 0 }],

    shippingCharges: 0,
    otherCharges: 0,

    taxType: "GST",
    gstDisplayMode: "split",

    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    upiId: "",

    notes: "",
    termsConditions: "1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if the payment is not made within the stipulated time.",
    jurisdictionText: "Subject to Bhubaneswar Jurisdiction. This is a Computer Generated Invoice.",

    authorizedSignatory: "",
    declarationText: "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",

    currency: "INR",
    currencySymbol: "₹",
}

export default function InvoicePage() {
    const [invoiceData, setInvoiceData] = useState<InvoiceData>(defaultInvoiceData)
    const [activeTab, setActiveTab] = useState("company")
    const printRef = useRef<HTMLDivElement>(null)

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: invoiceData.invoiceNumber,
    });

    // --- Calculations (Memoized to prevent re-renders) ---
    const calculations = useMemo(() => {
        let totalTaxable = 0
        let totalCGST = 0
        let totalSGST = 0
        let totalIGST = 0
        let totalAmount = 0
        let totalDiscount = 0

        const itemDetails = invoiceData.items.map(item => {
            const subtotal = item.quantity * item.rate
            const discountAmount = (subtotal * item.discount) / 100
            const taxableValue = subtotal - discountAmount

            // Use editable GST values from item
            let cgst = item.cgst || 0
            let sgst = item.sgst || 0
            let igst = 0
            let totalGst = item.totalGst || 0

            if (invoiceData.taxType === "IGST") {
                igst = (taxableValue * item.taxRate) / 100
            }

            // Calculate item total based on GST mode
            let itemTotal = taxableValue
            if (invoiceData.taxType === "GST") {
                if (invoiceData.gstDisplayMode === "simple") {
                    itemTotal = taxableValue + totalGst
                } else {
                    itemTotal = taxableValue + cgst + sgst
                }
            } else if (invoiceData.taxType === "IGST") {
                itemTotal = taxableValue + igst
            }

            totalTaxable += taxableValue
            totalCGST += cgst
            totalSGST += sgst
            totalIGST += igst
            totalAmount += itemTotal
            totalDiscount += discountAmount

            return {
                ...item,
                subtotal,
                discountAmount,
                taxableValue,
                cgst,
                sgst,
                igst,
                totalGst,
                itemTotal
            }
        })

        const finalTotal = totalAmount + invoiceData.shippingCharges + invoiceData.otherCharges
        const roundedTotal = Math.round(finalTotal)
        const roundOff = roundedTotal - finalTotal

        const hasDiscount = totalDiscount > 0

        return {
            itemDetails,
            totalTaxable,
            totalCGST,
            totalSGST,
            totalIGST,
            totalAmount,
            totalDiscount,
            roundOff,
            grandTotal: roundedTotal,
            hasDiscount
        }
    }, [invoiceData.items, invoiceData.taxType, invoiceData.shippingCharges, invoiceData.otherCharges])


    // --- Handlers ---
    const addItem = () => {
        const newItem: InvoiceItem = {
            id: Date.now().toString(),
            description: "",
            hsnsac: "",
            quantity: 1,
            rate: 0,
            discount: 0,
            taxRate: 18,
            cgstPercent: 9,
            sgstPercent: 9,
            cgst: 0,
            sgst: 0,
            totalGst: 0,
        }
        setInvoiceData(prev => ({ ...prev, items: [...prev.items, newItem] }))
    }

    const removeItem = (id: string) => {
        if (invoiceData.items.length > 1) {
            setInvoiceData(prev => ({
                ...prev,
                items: prev.items.filter(item => item.id !== id),
            }))
        }
    }

    const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
        setInvoiceData(prev => ({
            ...prev,
            items: prev.items.map(item => {
                if (item.id !== id) return item

                const updated = { ...item, [field]: value }
                const subtotal = updated.quantity * updated.rate
                const discountAmount = (subtotal * updated.discount) / 100
                const taxableValue = subtotal - discountAmount

                // Complete auto-calculation for GST fields
                if (invoiceData.taxType === "GST") {
                    if (field === 'taxRate') {
                        // When Tax % changes: split equally to CGST% and SGST%, then calculate amounts
                        updated.cgstPercent = value / 2
                        updated.sgstPercent = value / 2
                        updated.cgst = (taxableValue * updated.cgstPercent) / 100
                        updated.sgst = (taxableValue * updated.sgstPercent) / 100
                        updated.totalGst = updated.cgst + updated.sgst
                    } else if (field === 'cgstPercent') {
                        // When CGST % changes: calculate CGST amount, update Tax% (CGST% + SGST%)
                        updated.cgst = (taxableValue * value) / 100
                        updated.totalGst = updated.cgst + updated.sgst
                        updated.taxRate = parseFloat((value + updated.sgstPercent).toFixed(2))
                    } else if (field === 'sgstPercent') {
                        // When SGST % changes: calculate SGST amount, update Tax% (CGST% + SGST%)
                        updated.sgst = (taxableValue * value) / 100
                        updated.totalGst = updated.cgst + updated.sgst
                        updated.taxRate = parseFloat((updated.cgstPercent + value).toFixed(2))
                    } else if (field === 'cgst') {
                        // When CGST amount changes: calculate CGST%, update Tax%
                        const cgstPercent = taxableValue > 0 ? (value / taxableValue) * 100 : 0
                        updated.cgstPercent = parseFloat(cgstPercent.toFixed(2))
                        updated.totalGst = value + updated.sgst
                        updated.taxRate = parseFloat((updated.cgstPercent + updated.sgstPercent).toFixed(2))
                    } else if (field === 'sgst') {
                        // When SGST amount changes: calculate SGST%, update Tax%
                        const sgstPercent = taxableValue > 0 ? (value / taxableValue) * 100 : 0
                        updated.sgstPercent = parseFloat(sgstPercent.toFixed(2))
                        updated.totalGst = updated.cgst + value
                        updated.taxRate = parseFloat((updated.cgstPercent + updated.sgstPercent).toFixed(2))
                    } else if (field === 'totalGst') {
                        // When Total GST changes: split equally to CGST and SGST, calculate percentages and Tax%
                        updated.cgst = value / 2
                        updated.sgst = value / 2
                        if (taxableValue > 0) {
                            const gstPercent = (value / taxableValue) * 100
                            updated.cgstPercent = parseFloat((gstPercent / 2).toFixed(2))
                            updated.sgstPercent = updated.cgstPercent
                            updated.taxRate = parseFloat(gstPercent.toFixed(2))
                        }
                    } else if (field === 'quantity' || field === 'rate' || field === 'discount') {
                        // When quantity, rate, or discount changes: recalculate all GST amounts based on percentages
                        updated.cgst = (taxableValue * updated.cgstPercent) / 100
                        updated.sgst = (taxableValue * updated.sgstPercent) / 100
                        updated.totalGst = updated.cgst + updated.sgst
                    }
                }

                return updated
            })
        }))
    }

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setInvoiceData(prev => ({ ...prev, companyLogo: reader.result as string }))
            }
            reader.readAsDataURL(file)
        }
    }

    // --- Components ---
    const convertNumberToWords = (amount: number) => {
        return `INR ${amount.toLocaleString('en-IN')} Only`
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />

            {/* Header / Toolbar */}
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b shadow-sm px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/accounting" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-semibold">New Invoice</h1>
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
                <div className="lg:col-span-5 space-y-6 overflow-y-auto h-[calc(100vh-140px)] pr-2 scrollbar-thin">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-4 w-full mb-4">
                            <TabsTrigger value="company">Seller</TabsTrigger>
                            <TabsTrigger value="client">Buyer</TabsTrigger>
                            <TabsTrigger value="items">Items</TabsTrigger>
                            <TabsTrigger value="extra">Details</TabsTrigger>
                        </TabsList>

                        {/* Seller (Company) Info */}
                        <TabsContent value="company" className="space-y-4">
                            <Card className="p-4 border-l-4 border-l-cyan-500">
                                <h3 className="font-semibold text-lg mb-4 flex items-center"><Building2 className="w-4 h-4 mr-2" /> Seller Details</h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <Label>Company Name</Label>
                                            <Input value={invoiceData.companyName} onChange={e => setInvoiceData({ ...invoiceData, companyName: e.target.value })} placeholder="Your Business Name" />
                                        </div>
                                        <div>
                                            <Label>Logo</Label>
                                            <Input type="file" onChange={handleLogoUpload} className="text-xs" />
                                        </div>
                                        <div>
                                            <Label>Phone</Label>
                                            <Input value={invoiceData.companyPhone} onChange={e => setInvoiceData({ ...invoiceData, companyPhone: e.target.value })} placeholder="+91..." />
                                        </div>
                                        <div className="col-span-2">
                                            <Label>Address</Label>
                                            <Textarea value={invoiceData.companyAddress} onChange={e => setInvoiceData({ ...invoiceData, companyAddress: e.target.value })} placeholder="Street Address" rows={2} />
                                        </div>
                                        <div>
                                            <Label>City</Label>
                                            <Input value={invoiceData.companyCity} onChange={e => setInvoiceData({ ...invoiceData, companyCity: e.target.value })} />
                                        </div>
                                        <div>
                                            <Label>State</Label>
                                            <Input value={invoiceData.companyState} onChange={e => setInvoiceData({ ...invoiceData, companyState: e.target.value })} />
                                        </div>
                                        <div>
                                            <Label>GSTIN</Label>
                                            <Input value={invoiceData.companyGSTIN} onChange={e => setInvoiceData({ ...invoiceData, companyGSTIN: e.target.value })} placeholder="22AAAAA0000A1Z5" />
                                        </div>
                                        <div>
                                            <Label>PAN</Label>
                                            <Input value={invoiceData.companyPAN} onChange={e => setInvoiceData({ ...invoiceData, companyPAN: e.target.value })} placeholder="ABCDE1234F" />
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4 border-l-4 border-l-orange-500">
                                <h3 className="font-semibold text-lg mb-4 flex items-center"><Banknote className="w-4 h-4 mr-2" /> Bank Details</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <Label>Bank Name</Label>
                                        <Input value={invoiceData.bankName} onChange={e => setInvoiceData({ ...invoiceData, bankName: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Account No.</Label>
                                        <Input value={invoiceData.accountNumber} onChange={e => setInvoiceData({ ...invoiceData, accountNumber: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>IFSC Code</Label>
                                        <Input value={invoiceData.ifscCode} onChange={e => setInvoiceData({ ...invoiceData, ifscCode: e.target.value })} />
                                    </div>
                                    <div className="col-span-2">
                                        <Label>Signatory Name</Label>
                                        <Input value={invoiceData.authorizedSignatory} onChange={e => setInvoiceData({ ...invoiceData, authorizedSignatory: e.target.value })} placeholder="For Authorized Signatory" />
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>

                        {/* Buyer (Client) Info */}
                        <TabsContent value="client" className="space-y-4">
                            <Card className="p-4 border-l-4 border-l-blue-500">
                                <h3 className="font-semibold text-lg mb-4">Buyer (Bill To)</h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <Label>Client Name</Label>
                                            <Input value={invoiceData.clientName} onChange={e => setInvoiceData({ ...invoiceData, clientName: e.target.value })} placeholder="Client Business Name" />
                                        </div>
                                        <div className="col-span-2">
                                            <Label>Address</Label>
                                            <Textarea value={invoiceData.clientAddress} onChange={e => setInvoiceData({ ...invoiceData, clientAddress: e.target.value })} placeholder="Client Address" rows={2} />
                                        </div>
                                        <div>
                                            <Label>City</Label>
                                            <Input value={invoiceData.clientCity} onChange={e => setInvoiceData({ ...invoiceData, clientCity: e.target.value })} />
                                        </div>
                                        <div>
                                            <Label>State</Label>
                                            <Input value={invoiceData.clientState} onChange={e => setInvoiceData({ ...invoiceData, clientState: e.target.value })} />
                                        </div>
                                        <div>
                                            <Label>GSTIN</Label>
                                            <Input value={invoiceData.clientGSTIN} onChange={e => setInvoiceData({ ...invoiceData, clientGSTIN: e.target.value })} />
                                        </div>
                                        <div>
                                            <Label>State Code</Label>
                                            <Input value={invoiceData.clientStateCode} onChange={e => setInvoiceData({ ...invoiceData, clientStateCode: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div className="flex items-center space-x-2 my-4">
                                <input type="checkbox" id="sameInfo" checked={invoiceData.sameAsBillTo} onChange={e => setInvoiceData({ ...invoiceData, sameAsBillTo: e.target.checked })} className="rounded border-gray-300" />
                                <Label htmlFor="sameInfo">Ship to same address as Bill to</Label>
                            </div>

                            {!invoiceData.sameAsBillTo && (
                                <Card className="p-4 border-l-4 border-l-indigo-500">
                                    <h3 className="font-semibold text-lg mb-4">Consignee (Ship To)</h3>
                                    <div className="space-y-3">
                                        <div className="col-span-2">
                                            <Label>Name</Label>
                                            <Input value={invoiceData.shipToName} onChange={e => setInvoiceData({ ...invoiceData, shipToName: e.target.value })} />
                                        </div>
                                        <div className="col-span-2">
                                            <Label>Address</Label>
                                            <Textarea value={invoiceData.shipToAddress} onChange={e => setInvoiceData({ ...invoiceData, shipToAddress: e.target.value })} rows={2} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label>City</Label>
                                                <Input value={invoiceData.shipToCity} onChange={e => setInvoiceData({ ...invoiceData, shipToCity: e.target.value })} />
                                            </div>
                                            <div>
                                                <Label>State</Label>
                                                <Input value={invoiceData.shipToState} onChange={e => setInvoiceData({ ...invoiceData, shipToState: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </TabsContent>

                        {/* Items */}
                        <TabsContent value="items" className="space-y-4">
                            <Card className="p-4 border-l-4 border-l-purple-500">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-lg">Items</h3>
                                    <div className="flex items-center gap-2">
                                        <Label>Tax Type:</Label>
                                        <Select value={invoiceData.taxType} onValueChange={(v: any) => setInvoiceData({ ...invoiceData, taxType: v })}>
                                            <SelectTrigger className="w-[100px] h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="GST">GST</SelectItem>
                                                <SelectItem value="IGST">IGST</SelectItem>
                                                <SelectItem value="None">None</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {invoiceData.taxType === "GST" && (
                                        <div className="flex items-center gap-2">
                                            <Label className="text-sm whitespace-nowrap">GST Mode:</Label>
                                            <Select value={invoiceData.gstDisplayMode} onValueChange={(v: any) => setInvoiceData({ ...invoiceData, gstDisplayMode: v })}>
                                                <SelectTrigger className="w-[180px] h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="simple">Total GST Only</SelectItem>
                                                    <SelectItem value="split">CGST + SGST</SelectItem>
                                                    <SelectItem value="detailed">CGST + SGST + Total</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    {invoiceData.items.map((item, index) => (
                                        <div key={item.id} className="p-3 bg-muted/30 rounded border relative group">
                                            <div className="grid grid-cols-12 gap-2 mb-2">
                                                <div className="col-span-12 md:col-span-5">
                                                    <Label className="text-xs">Description</Label>
                                                    <Input className="h-8 text-sm" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Item name" />
                                                </div>
                                                <div className="col-span-4 md:col-span-2">
                                                    <Label className="text-xs">HSN/SAC</Label>
                                                    <Input className="h-8 text-sm" value={item.hsnsac} onChange={e => updateItem(item.id, 'hsnsac', e.target.value)} />
                                                </div>
                                                <div className="col-span-4 md:col-span-2">
                                                    <Label className="text-xs">Qty</Label>
                                                    <Input className="h-8 text-sm" type="number" min="0" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} />
                                                </div>
                                                <div className="col-span-4 md:col-span-3">
                                                    <Label className="text-xs">Rate</Label>
                                                    <Input className="h-8 text-sm" type="number" min="0" value={item.rate} onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-12 gap-2">
                                                <div className="col-span-6 md:col-span-3">
                                                    <Label className="text-xs">Discount %</Label>
                                                    <Input className="h-8 text-sm" type="number" min="0" value={item.discount} onChange={e => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)} />
                                                </div>
                                                <div className="col-span-6 md:col-span-3">
                                                    <Label className="text-xs">Tax % (Total)</Label>
                                                    <Input className="h-8 text-sm" type="number" min="0" value={item.taxRate} onChange={e => updateItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)} />
                                                </div>

                                                {/* GST Fields based on mode */}
                                                {invoiceData.taxType === "GST" && invoiceData.gstDisplayMode === "simple" && (
                                                    <div className="col-span-6 md:col-span-3">
                                                        <Label className="text-xs">Total GST (₹)</Label>
                                                        <Input className="h-8 text-sm" type="number" min="0" value={item.totalGst} onChange={e => updateItem(item.id, 'totalGst', parseFloat(e.target.value) || 0)} />
                                                    </div>
                                                )}

                                                {invoiceData.taxType === "GST" && (invoiceData.gstDisplayMode === "split" || invoiceData.gstDisplayMode === "detailed") && (
                                                    <>
                                                        <div className="col-span-6 md:col-span-2">
                                                            <Label className="text-xs">CGST %</Label>
                                                            <Input className="h-8 text-sm" type="number" min="0" step="0.01" value={item.cgstPercent} onChange={e => updateItem(item.id, 'cgstPercent', parseFloat(e.target.value) || 0)} />
                                                        </div>
                                                        <div className="col-span-6 md:col-span-2">
                                                            <Label className="text-xs">CGST (₹)</Label>
                                                            <Input className="h-8 text-sm" type="number" min="0" value={item.cgst} onChange={e => updateItem(item.id, 'cgst', parseFloat(e.target.value) || 0)} />
                                                        </div>
                                                        <div className="col-span-6 md:col-span-2">
                                                            <Label className="text-xs">SGST %</Label>
                                                            <Input className="h-8 text-sm" type="number" min="0" step="0.01" value={item.sgstPercent} onChange={e => updateItem(item.id, 'sgstPercent', parseFloat(e.target.value) || 0)} />
                                                        </div>
                                                        <div className="col-span-6 md:col-span-2">
                                                            <Label className="text-xs">SGST (₹)</Label>
                                                            <Input className="h-8 text-sm" type="number" min="0" value={item.sgst} onChange={e => updateItem(item.id, 'sgst', parseFloat(e.target.value) || 0)} />
                                                        </div>
                                                    </>
                                                )}

                                                {invoiceData.taxType === "GST" && invoiceData.gstDisplayMode === "detailed" && (
                                                    <div className="col-span-6 md:col-span-2">
                                                        <Label className="text-xs">Total GST (₹)</Label>
                                                        <Input className="h-8 text-sm" type="number" min="0" value={item.totalGst} onChange={e => updateItem(item.id, 'totalGst', parseFloat(e.target.value) || 0)} />
                                                    </div>
                                                )}
                                            </div>

                                            {invoiceData.items.length > 1 && (
                                                <Button size="icon" variant="ghost" className="absolute -top-2 -right-2 h-6 w-6 text-destructive hover:text-destructive/90 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeItem(item.id)}>
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button onClick={addItem} variant="outline" className="w-full border-dashed gap-2"><Plus className="w-4 h-4" /> Add Line Item</Button>
                                </div>
                            </Card>
                        </TabsContent>

                        {/* Extra Details */}
                        <TabsContent value="extra" className="space-y-4">
                            <Card className="p-4 border-l-4 border-l-green-500">
                                <h3 className="font-semibold text-lg mb-4">Invoice Meta</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <Label>Document Title</Label>
                                        <Input value={invoiceData.title} onChange={e => setInvoiceData({ ...invoiceData, title: e.target.value })} placeholder="TAX INVOICE" />
                                    </div>
                                    <div>
                                        <Label>Invoice No.</Label>
                                        <Input value={invoiceData.invoiceNumber} onChange={e => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Date</Label>
                                        <Input type="date" value={invoiceData.invoiceDate} onChange={e => setInvoiceData({ ...invoiceData, invoiceDate: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Due Date</Label>
                                        <Input type="date" value={invoiceData.dueDate} onChange={e => setInvoiceData({ ...invoiceData, dueDate: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>PO No.</Label>
                                        <Input value={invoiceData.poNumber} onChange={e => setInvoiceData({ ...invoiceData, poNumber: e.target.value })} />
                                    </div>
                                    <div className="col-span-2">
                                        <Label>Jurisdiction Text</Label>
                                        <Input value={invoiceData.jurisdictionText} onChange={e => setInvoiceData({ ...invoiceData, jurisdictionText: e.target.value })} placeholder="Subject to City Jurisdiction. This is a Computer Generated Invoice." />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4 border-l-4 border-l-indigo-500">
                                <h3 className="font-semibold text-lg mb-4">Customize Invoice Sections</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" id="showBank" checked={invoiceData.showBankDetails} onChange={e => setInvoiceData({ ...invoiceData, showBankDetails: e.target.checked })} className="rounded" />
                                        <Label htmlFor="showBank" className="font-normal cursor-pointer">Show Bank Details</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" id="showTerms" checked={invoiceData.showTerms} onChange={e => setInvoiceData({ ...invoiceData, showTerms: e.target.checked })} className="rounded" />
                                        <Label htmlFor="showTerms" className="font-normal cursor-pointer">Show Terms & Conditions</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" id="showJurisdiction" checked={invoiceData.showJurisdiction} onChange={e => setInvoiceData({ ...invoiceData, showJurisdiction: e.target.checked })} className="rounded" />
                                        <Label htmlFor="showJurisdiction" className="font-normal cursor-pointer">Show Jurisdiction Footer</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" id="showDiscount" checked={invoiceData.showDiscount} onChange={e => setInvoiceData({ ...invoiceData, showDiscount: e.target.checked })} className="rounded" />
                                        <Label htmlFor="showDiscount" className="font-normal cursor-pointer">Show Discount Column</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" id="showTaxColumns" checked={invoiceData.showTaxColumns} onChange={e => setInvoiceData({ ...invoiceData, showTaxColumns: e.target.checked })} className="rounded" />
                                        <Label htmlFor="showTaxColumns" className="font-normal cursor-pointer">Show Tax Columns (CGST/SGST/IGST)</Label>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4 border-l-4 border-l-gray-500">
                                <h3 className="font-semibold text-lg mb-4">Terms & Conditions</h3>
                                <Textarea value={invoiceData.termsConditions} onChange={e => setInvoiceData({ ...invoiceData, termsConditions: e.target.value })} rows={4} />
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Preview / Print Panel (Right Side) */}
                <div className="lg:col-span-7 bg-muted/40 p-6 rounded-xl overflow-y-auto h-[calc(100vh-140px)] border border-border">
                    <div className="flex flex-col items-center gap-6 pb-6">

                        {/* The Actual Invoice Sheet - FORCE WHITE BACKGROUND AND BLACK TEXT for print consistency */}
                        <div className="bg-white text-black shadow-2xl w-[210mm] p-[15mm] text-xs font-sans leading-tight print:w-full print:shadow-none print:m-0 print:p-0" ref={printRef}>

                            {/* Print Only Styles */}
                            <style type="text/css" media="print">
                                {`
                                @page { 
                                    size: A4; 
                                    margin: 15mm 15mm 20mm 15mm;
                                    @bottom-right {
                                        content: "Page " counter(page) " of " counter(pages);
                                        font-size: 9px;
                                        color: #94a3b8;
                                    }
                                }
                                body { 
                                    -webkit-print-color-adjust: exact;
                                    print-color-adjust: exact; 
                                }
                                
                                /* Page break controls */
                                .page-break {
                                    page-break-after: always;
                                    break-after: page;
                                }
                                .avoid-break {
                                    page-break-inside: avoid;
                                    break-inside: avoid;
                                }
                                
                                /* Prevent table headers from breaking */
                                table, .invoice-table {
                                    page-break-inside: auto;
                                }
                                thead, .table-header {
                                    display: table-header-group;
                                    page-break-inside: avoid;
                                    page-break-after: avoid;
                                }
                                tr, .table-row {
                                    page-break-inside: avoid;
                                    page-break-after: auto;
                                }
                                
                                /* Hide header sections on pages after first */
                                .invoice-header,
                                .company-buyer-section,
                                .consignee-section {
                                    page-break-after: avoid;
                                }
                                
                                
                                /* Keep totals section together */
                                .totals-section,
                                .footer-section {
                                    page-break-inside: avoid;
                                    page-break-before: auto;
                                }
                                
                                /* Table cell text wrapping */
                                table td, table th {
                                    word-wrap: break-word;
                                    word-break: break-word;
                                    overflow-wrap: break-word;
                                }
                                
                                @media print {
                                    html, body {
                                        height: 100%;
                                        margin: 0;
                                        padding: 0;
                                    }
                                }
                            `}
                            </style>

                            {/* Invoice Header */}
                            <div className="invoice-header text-center font-bold text-xl mb-4 border-b pb-2 uppercase tracking-wide">
                                {invoiceData.title}
                            </div>

                            {/* Top Section: Company & Buyer */}
                            <div className="company-buyer-section grid grid-cols-2 border border-slate-300">
                                {/* Seller Details (Left) */}
                                <div className="p-3 border-r border-slate-300">
                                    <div className="font-bold text-base mb-1">{invoiceData.companyName || "Seller Name"}</div>
                                    <div className="whitespace-pre-line text-slate-600 mb-2">{invoiceData.companyAddress}</div>
                                    <div className="grid grid-cols-[60px_1fr] gap-y-0.5">
                                        <span className="font-semibold text-slate-500">GSTIN:</span>
                                        <span>{invoiceData.companyGSTIN}</span>
                                        <span className="font-semibold text-slate-500">State:</span>
                                        <span>{invoiceData.companyState}</span>
                                        <span className="font-semibold text-slate-500">Email:</span>
                                        <span>{invoiceData.companyEmail}</span>
                                    </div>
                                </div>

                                {/* Invoice Meta (Right) */}
                                <div className="p-0">
                                    <div className="grid grid-cols-2 border-b border-slate-300">
                                        <div className="p-2 border-r border-slate-300">
                                            <div className="text-[10px] text-slate-500 font-semibold uppercase">Invoice No.</div>
                                            <div className="font-bold">{invoiceData.invoiceNumber}</div>
                                        </div>
                                        <div className="p-2">
                                            <div className="text-[10px] text-slate-500 font-semibold uppercase">Date</div>
                                            <div className="font-bold">{new Date(invoiceData.invoiceDate).toLocaleDateString('en-IN')}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 border-b border-slate-300">
                                        <div className="p-2">
                                            <div className="text-[10px] text-slate-500 font-semibold uppercase">Buyer's Order No.</div>
                                            <div className="font-bold">{invoiceData.poNumber}</div>
                                        </div>
                                    </div>
                                    <div className="p-2">
                                        <div className="text-[10px] text-slate-500 font-semibold uppercase">Mode/Terms of Payment</div>
                                        <div className="">{invoiceData.dueDate ? `Due by ${new Date(invoiceData.dueDate).toLocaleDateString('en-IN')}` : 'Immediate'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Consignee / Buyer Section */}
                            <div className="consignee-section grid grid-cols-2 border-x border-b border-slate-300">
                                <div className="p-3 border-r border-slate-300">
                                    <div className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Bill To (Buyer)</div>
                                    <div className="font-bold text-sm mb-1">{invoiceData.clientName || "Buyer Name"}</div>
                                    <div className="whitespace-pre-line text-slate-600 mb-2">{invoiceData.clientAddress}</div>
                                    <div className="grid grid-cols-[50px_1fr] gap-y-0.5">
                                        <span className="font-semibold text-slate-500">GSTIN:</span>
                                        <span>{invoiceData.clientGSTIN}</span>
                                        <span className="font-semibold text-slate-500">State:</span>
                                        <span>{invoiceData.clientState}</span>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <div className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Ship To (Consignee)</div>
                                    <div className="font-bold text-sm mb-1">{invoiceData.sameAsBillTo ? (invoiceData.clientName || "Buyer Name") : (invoiceData.shipToName || "Consignee Name")}</div>
                                    <div className="whitespace-pre-line text-slate-600 mb-2">{invoiceData.sameAsBillTo ? invoiceData.clientAddress : invoiceData.shipToAddress}</div>
                                    <div className="grid grid-cols-[50px_1fr] gap-y-0.5">
                                        <span className="font-semibold text-slate-500">State:</span>
                                        <span>{invoiceData.sameAsBillTo ? invoiceData.clientState : invoiceData.shipToState}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Item Table */}
                            <table className="invoice-table mt-4 w-full border-collapse border border-slate-300 text-xs">
                                <thead className="table-header">
                                    <tr className="bg-slate-100">
                                        <th className="p-2 border-r border-b border-slate-300 text-center font-bold w-[40px]">Sl.<br />No.</th>
                                        <th className="p-2 border-r border-b border-slate-300 text-left font-bold min-w-[150px]">Description of Goods</th>
                                        <th className="p-2 border-r border-b border-slate-300 text-center font-bold w-[70px]">HSN/SAC</th>
                                        <th className="p-2 border-r border-b border-slate-300 text-center font-bold w-[50px]">Quantity</th>
                                        <th className="p-2 border-r border-b border-slate-300 text-center font-bold w-[60px]">Rate</th>
                                        {(invoiceData.showDiscount && calculations.hasDiscount) && (
                                            <>
                                                <th className="p-2 border-r border-b border-slate-300 text-center font-bold w-[45px]">Disc.<br />%</th>
                                                <th className="p-2 border-r border-b border-slate-300 text-center font-bold w-[60px]">Disc.<br />Amt</th>
                                            </>
                                        )}
                                        <th className="p-2 border-r border-b border-slate-300 text-center font-bold w-[70px]">Taxable<br />Value</th>
                                        {invoiceData.showTaxColumns && invoiceData.taxType !== "None" && (
                                            <>
                                                <th className="p-2 border-r border-b border-slate-300 text-center font-bold w-[40px]">GST<br />%</th>
                                                {invoiceData.taxType === "GST" && (
                                                    <>
                                                        {/* Simple Mode: Only GST */}
                                                        {invoiceData.gstDisplayMode === "simple" && (
                                                            <th className="p-2 border-r border-b border-slate-300 text-center font-bold w-[60px]">GST<br />(₹)</th>
                                                        )}

                                                        {/* Split Mode: CGST % and SGST % only */}
                                                        {(invoiceData.gstDisplayMode === "split" || invoiceData.gstDisplayMode === "detailed") && (
                                                            <>
                                                                <th className="p-2 border-r border-b border-slate-300 text-center font-bold w-[50px]">CGST<br />%</th>
                                                                <th className="p-2 border-r border-b border-slate-300 text-center font-bold w-[50px]">SGST<br />%</th>
                                                            </>
                                                        )}

                                                        {/* Detailed Mode: Also show GST Total */}
                                                        {invoiceData.gstDisplayMode === "detailed" && (
                                                            <th className="p-2 border-r border-b border-slate-300 text-center font-bold w-[60px]">GST<br />Total (₹)</th>
                                                        )}
                                                    </>
                                                )}
                                                {invoiceData.taxType === "IGST" && (
                                                    <th className="p-2 border-r border-b border-slate-300 text-center font-bold w-[60px]">IGST<br />(₹)</th>
                                                )}
                                            </>
                                        )}
                                        <th className="p-2 border-b border-slate-300 text-right font-bold w-[80px]">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {calculations.itemDetails.map((item, index) => (
                                        <tr key={item.id} className="table-row border-b border-slate-200">
                                            <td className="p-2 border-r border-slate-300 text-center align-top">{index + 1}</td>
                                            <td className="p-2 border-r border-slate-300 text-left font-medium align-top break-words" style={{ wordWrap: 'break-word', whiteSpace: 'normal', maxWidth: '200px' }}>{item.description}</td>
                                            <td className="p-2 border-r border-slate-300 text-center align-top">{item.hsnsac}</td>
                                            <td className="p-2 border-r border-slate-300 text-center align-top">{item.quantity}</td>
                                            <td className="p-2 border-r border-slate-300 text-center align-top">{item.rate.toFixed(2)}</td>
                                            {(invoiceData.showDiscount && calculations.hasDiscount) && (
                                                <>
                                                    <td className="p-2 border-r border-slate-300 text-center align-top">{item.discount}%</td>
                                                    <td className="p-2 border-r border-slate-300 text-center align-top">{item.discountAmount.toFixed(2)}</td>
                                                </>
                                            )}
                                            <td className="p-2 border-r border-slate-300 text-center align-top">{item.taxableValue.toFixed(2)}</td>
                                            {invoiceData.showTaxColumns && invoiceData.taxType !== "None" && (
                                                <>
                                                    <td className="p-2 border-r border-slate-300 text-center align-top">{item.taxRate}%</td>
                                                    {invoiceData.taxType === "GST" && (
                                                        <>
                                                            {/* Simple Mode: Only Total GST */}
                                                            {invoiceData.gstDisplayMode === "simple" && (
                                                                <td className="p-2 border-r border-slate-300 text-center align-top">{item.totalGst.toFixed(2)}</td>
                                                            )}

                                                            {/* Split Mode: CGST % and SGST % only */}
                                                            {(invoiceData.gstDisplayMode === "split" || invoiceData.gstDisplayMode === "detailed") && (
                                                                <>
                                                                    <td className="p-2 border-r border-slate-300 text-center align-top">{item.cgstPercent}%</td>
                                                                    <td className="p-2 border-r border-slate-300 text-center align-top">{item.sgstPercent}%</td>
                                                                </>
                                                            )}

                                                            {/* Detailed Mode: Also show Total GST */}
                                                            {invoiceData.gstDisplayMode === "detailed" && (
                                                                <td className="p-2 border-r border-slate-300 text-center align-top">{item.totalGst.toFixed(2)}</td>
                                                            )}
                                                        </>
                                                    )}
                                                    {invoiceData.taxType === "IGST" && (
                                                        <td className="p-2 border-r border-slate-300 text-center align-top">{item.igst.toFixed(2)}</td>
                                                    )}
                                                </>
                                            )}
                                            <td className="p-2 text-right font-semibold align-top">{item.itemTotal.toFixed(2)}</td>
                                        </tr>
                                    ))}

                                    {/* Blank filler rows */}
                                    {invoiceData.items.length < 5 && Array.from({ length: 5 - invoiceData.items.length }).map((_, i) => (
                                        <tr key={`fill-${i}`} className="border-b border-slate-200 h-10">
                                            <td className="p-2 border-r border-slate-300"></td>
                                            <td className="p-2 border-r border-slate-300"></td>
                                            <td className="p-2 border-r border-slate-300"></td>
                                            <td className="p-2 border-r border-slate-300"></td>
                                            <td className="p-2 border-r border-slate-300"></td>
                                            {(invoiceData.showDiscount && calculations.hasDiscount) && (
                                                <>
                                                    <td className="p-2 border-r border-slate-300"></td>
                                                    <td className="p-2 border-r border-slate-300"></td>
                                                </>
                                            )}
                                            <td className="p-2 border-r border-slate-300"></td>
                                            {invoiceData.showTaxColumns && invoiceData.taxType !== "None" && (
                                                <>
                                                    <td className="p-2 border-r border-slate-300"></td>
                                                    {invoiceData.taxType === "GST" && (
                                                        <>
                                                            {invoiceData.gstDisplayMode === "simple" && (
                                                                <td className="p-2 border-r border-slate-300"></td>
                                                            )}
                                                            {(invoiceData.gstDisplayMode === "split" || invoiceData.gstDisplayMode === "detailed") && (
                                                                <>
                                                                    <td className="p-2 border-r border-slate-300"></td>
                                                                    <td className="p-2 border-r border-slate-300"></td>
                                                                </>
                                                            )}
                                                            {invoiceData.gstDisplayMode === "detailed" && (
                                                                <td className="p-2 border-r border-slate-300"></td>
                                                            )}
                                                        </>
                                                    )}
                                                    {invoiceData.taxType === "IGST" && (
                                                        <td className="p-2 border-r border-slate-300"></td>
                                                    )}
                                                </>
                                            )}
                                            <td className="p-2"></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals Section */}
                            <div className="totals-section border-x border-b border-slate-300">
                                <div className="flex justify-end">
                                    <div className="w-[300px] border-l border-slate-300">
                                        {/* Tax Breakdowns */}
                                        <div className="flex justify-between p-2 border-b border-slate-200 text-slate-600">
                                            <span>Total Taxable Value</span>
                                            <span>{calculations.totalTaxable.toFixed(2)}</span>
                                        </div>

                                        {calculations.totalCGST > 0 && (
                                            <div className="flex justify-between p-2 border-b border-slate-200 text-slate-600">
                                                <span>CGST</span>
                                                <span>{calculations.totalCGST.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {calculations.totalSGST > 0 && (
                                            <div className="flex justify-between p-2 border-b border-slate-200 text-slate-600">
                                                <span>SGST</span>
                                                <span>{calculations.totalSGST.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {calculations.totalIGST > 0 && (
                                            <div className="flex justify-between p-2 border-b border-slate-200 text-slate-600">
                                                <span>IGST</span>
                                                <span>{calculations.totalIGST.toFixed(2)}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between p-2 border-b border-slate-200 text-slate-600">
                                            <span>Round Off</span>
                                            <span>{calculations.roundOff.toFixed(2)}</span>
                                        </div>

                                        <div className="flex justify-between p-2 bg-slate-100 font-bold text-base">
                                            <span>Grand Total</span>
                                            <span>{invoiceData.currencySymbol} {calculations.grandTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Amount in Words */}
                                <div className="border-t border-slate-300 p-2 text-sm italic border-b">
                                    <span className="font-semibold not-italic">Amount in Words:</span> {convertNumberToWords(calculations.grandTotal)}
                                </div>

                                {/* Tax Summary Table (Simplified) */}
                                {invoiceData.taxType !== "None" && (
                                    <div className="grid grid-cols-[100px_1fr_1fr_1fr] border-b border-slate-300 text-center text-[10px]">
                                        <div className="p-1 font-bold border-r border-slate-300">HSN/SAC</div>
                                        <div className="p-1 font-bold border-r border-slate-300">Taxable Value</div>
                                        <div className="p-1 font-bold border-r border-slate-300">{invoiceData.taxType === "IGST" ? "IGST" : "CGST + SGST"}</div>
                                        <div className="p-1 font-bold">Total Tax</div>

                                        {/* Row */}
                                        <div className="p-1 border-r border-slate-300 border-t">-</div>
                                        <div className="p-1 border-r border-slate-300 border-t">{calculations.totalTaxable.toFixed(2)}</div>
                                        <div className="p-1 border-r border-slate-300 border-t">{(calculations.totalCGST + calculations.totalSGST + calculations.totalIGST).toFixed(2)}</div>
                                        <div className="p-1 border-t">{(calculations.totalCGST + calculations.totalSGST + calculations.totalIGST).toFixed(2)}</div>
                                    </div>
                                )}

                            </div>

                            {/* Footer Section */}
                            <div className="footer-section grid grid-cols-2 mt-4 gap-4">
                                <div>
                                    {invoiceData.showBankDetails && invoiceData.bankName && (
                                        <>
                                            <div className="font-semibold underline mb-1 text-xs">Bank Details</div>
                                            <div className="text-xs space-y-0.5">
                                                <p>Bank Name: <span className="font-semibold">{invoiceData.bankName}</span></p>
                                                <p>A/c No.: <span className="font-semibold">{invoiceData.accountNumber}</span></p>
                                                <p>Branch & IFS Code: <span className="font-semibold">{invoiceData.branch} {invoiceData.ifscCode}</span></p>
                                            </div>
                                        </>
                                    )}
                                    {invoiceData.showTerms && invoiceData.termsConditions && (
                                        <div className={(invoiceData.showBankDetails && invoiceData.bankName) ? "mt-4" : ""}>
                                            <div className="font-semibold underline mb-1 text-xs">Terms & Conditions</div>
                                            <div className="text-[10px] whitespace-pre-wrap text-slate-600">{invoiceData.termsConditions}</div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col justify-between items-end text-center">
                                    <div className="text-xs mb-10">
                                        For <span className="font-bold">{invoiceData.companyName}</span>
                                    </div>
                                    <div className="text-[10px] border-t border-slate-400 px-4 pt-1">
                                        {invoiceData.authorizedSignatory || "Authorized Signatory"}
                                    </div>
                                </div>
                            </div>

                            {invoiceData.showJurisdiction && (
                                <div className="mt-8 text-[9px] text-center text-slate-400 border-t border-slate-200 pt-2">
                                    {invoiceData.jurisdictionText}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
