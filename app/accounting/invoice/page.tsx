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
import { motion } from "framer-motion"
import { Plus, Trash2, ArrowLeft, Building2, Banknote, Printer, Settings, Sun, Moon } from "lucide-react"
import Link from "next/link"
import { useReactToPrint } from 'react-to-print';
import { useTheme } from "next-themes"

interface InvoiceItem {
    id: string
    description: string
    hsnsac: string
    quantity: number
    rate: number
    discount: number
    taxRate: number // GST Rate %
}

interface InvoiceData {
    // Meta
    title: string

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

    // Bank Details
    bankName: string
    accountNumber: string
    ifscCode: string
    branch: string
    upiId: string

    // Terms & Conditions
    notes: string
    termsConditions: string
    jurisdictionCity: string

    // Footer
    authorizedSignatory: string
    declarationText: string

    // Invoice Style
    currency: string
    currencySymbol: string
}

const defaultInvoiceData: InvoiceData = {
    title: "TAX INVOICE",
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

    invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    poNumber: "",
    poDate: "",
    placeOfSupply: "",
    reverseCharge: "No",

    items: [{ id: "1", description: "", hsnsac: "", quantity: 1, rate: 0, discount: 0, taxRate: 18 }],

    shippingCharges: 0,
    otherCharges: 0,

    taxType: "GST",

    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    upiId: "",

    notes: "",
    termsConditions: "1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if the payment is not made within the stipulated time.",
    jurisdictionCity: "Bhubaneswar",

    authorizedSignatory: "",
    declarationText: "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",

    currency: "INR",
    currencySymbol: "₹",
}

export default function InvoicePage() {
    const [invoiceData, setInvoiceData] = useState<InvoiceData>(defaultInvoiceData)
    const [activeTab, setActiveTab] = useState("company")
    const printRef = useRef<HTMLDivElement>(null)
    const { theme, setTheme } = useTheme()

    const handlePrint = useReactToPrint({
        // @ts-ignore
        content: () => printRef.current,
        documentTitle: invoiceData.invoiceNumber,
    });

    // --- Calculations (Memoized to prevent re-renders) ---
    const calculations = useMemo(() => {
        let totalTaxable = 0
        let totalCGST = 0
        let totalSGST = 0
        let totalIGST = 0
        let totalAmount = 0

        const itemDetails = invoiceData.items.map(item => {
            const subtotal = item.quantity * item.rate
            const discountAmount = (subtotal * item.discount) / 100
            const taxableValue = subtotal - discountAmount

            let cgst = 0
            let sgst = 0
            let igst = 0

            if (invoiceData.taxType === "GST") {
                cgst = (taxableValue * (item.taxRate / 2)) / 100
                sgst = (taxableValue * (item.taxRate / 2)) / 100
            } else if (invoiceData.taxType === "IGST") {
                igst = (taxableValue * item.taxRate) / 100
            }

            const itemTotal = taxableValue + cgst + sgst + igst

            totalTaxable += taxableValue
            totalCGST += cgst
            totalSGST += sgst
            totalIGST += igst
            totalAmount += itemTotal

            return {
                ...item,
                subtotal,
                discountAmount,
                taxableValue,
                cgst,
                sgst,
                igst,
                itemTotal
            }
        })

        const finalTotal = totalAmount + invoiceData.shippingCharges + invoiceData.otherCharges
        const roundedTotal = Math.round(finalTotal)
        const roundOff = roundedTotal - finalTotal

        return {
            itemDetails,
            totalTaxable,
            totalCGST,
            totalSGST,
            totalIGST,
            totalAmount,
            roundOff,
            grandTotal: roundedTotal
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
            items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
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
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="mr-2"
                    >
                        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </Button>

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
                                                    <Label className="text-xs">Tax %</Label>
                                                    <Input className="h-8 text-sm" type="number" min="0" value={item.taxRate} onChange={e => updateItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)} />
                                                </div>
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
                                        <Label>Jurisdiction City</Label>
                                        <Input value={invoiceData.jurisdictionCity} onChange={e => setInvoiceData({ ...invoiceData, jurisdictionCity: e.target.value })} placeholder="City name for legal jurisdiction" />
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
                <div className="lg:col-span-7 bg-muted/40 p-4 rounded-xl overflow-auto h-[calc(100vh-140px)] flex justify-center border border-border">

                    {/* The Actual Invoice Sheet - FORCE WHITE BACKGROUND AND BLACK TEXT for print consistency */}
                    <div className="bg-white text-black shadow-2xl w-[210mm] min-h-[297mm] p-[10mm] text-xs font-sans leading-tight print:w-full print:shadow-none print:m-0 print:p-0" ref={printRef}>

                        {/* Print Only Styles */}
                        <style type="text/css" media="print">
                            {`
                                @page { size: A4; margin: 10mm; }
                                body { -webkit-print-color-adjust: exact; }
                            `}
                        </style>

                        {/* Invoice Header */}
                        <div className="text-center font-bold text-xl mb-4 border-b pb-2 uppercase tracking-wide">
                            {invoiceData.title}
                        </div>

                        {/* Top Section: Company & Buyer */}
                        <div className="grid grid-cols-2 border border-slate-300">
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
                        <div className="grid grid-cols-2 border-x border-b border-slate-300">
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
                        <div className="mt-4 border border-slate-300">
                            {/* Table Header */}
                            <div className="grid grid-cols-[40px_1fr_80px_60px_60px_80px_40px_100px] bg-slate-100 border-b border-slate-300 font-bold text-center">
                                <div className="p-2 border-r border-slate-300">SI</div>
                                <div className="p-2 border-r border-slate-300 text-left">Description of Goods</div>
                                <div className="p-2 border-r border-slate-300">HSN/SAC</div>
                                <div className="p-2 border-r border-slate-300">Qty</div>
                                <div className="p-2 border-r border-slate-300">Rate</div>
                                <div className="p-2 border-r border-slate-300">Taxable</div>
                                <div className="p-2 border-r border-slate-300">%</div>
                                <div className="p-2 text-right">Amount</div>
                            </div>

                            {/* Table Rows */}
                            {calculations.itemDetails.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-[40px_1fr_80px_60px_60px_80px_40px_100px] border-b border-slate-200 text-center last:border-b-0">
                                    <div className="p-2 border-r border-slate-300">{index + 1}</div>
                                    <div className="p-2 border-r border-slate-300 text-left font-medium">{item.description}</div>
                                    <div className="p-2 border-r border-slate-300">{item.hsnsac}</div>
                                    <div className="p-2 border-r border-slate-300">{item.quantity}</div>
                                    <div className="p-2 border-r border-slate-300">{item.rate.toFixed(2)}</div>
                                    <div className="p-2 border-r border-slate-300">{item.taxableValue.toFixed(2)}</div>
                                    <div className="p-2 border-r border-slate-300">{item.taxRate}%</div>
                                    <div className="p-2 text-right font-semibold">{item.itemTotal.toFixed(2)}</div>
                                </div>
                            ))}

                            {/* Blank filler rows to ensure height if needed */}
                            {invoiceData.items.length < 5 && Array.from({ length: 5 - invoiceData.items.length }).map((_, i) => (
                                <div key={`fill-${i}`} className="grid grid-cols-[40px_1fr_80px_60px_60px_80px_40px_100px] border-b border-slate-200 text-center last:border-b-0 h-10">
                                    <div className="p-2 border-r border-slate-300"></div>
                                    <div className="p-2 border-r border-slate-300"></div>
                                    <div className="p-2 border-r border-slate-300"></div>
                                    <div className="p-2 border-r border-slate-300"></div>
                                    <div className="p-2 border-r border-slate-300"></div>
                                    <div className="p-2 border-r border-slate-300"></div>
                                    <div className="p-2 border-r border-slate-300"></div>
                                    <div className="p-2 text-right"></div>
                                </div>
                            ))}
                        </div>

                        {/* Totals Section */}
                        <div className="border-x border-b border-slate-300">
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
                        <div className="grid grid-cols-2 mt-4 gap-4">
                            <div>
                                {invoiceData.bankName && (
                                    <>
                                        <div className="font-semibold underline mb-1 text-xs">Bank Details</div>
                                        <div className="text-xs space-y-0.5">
                                            <p>Bank Name: <span className="font-semibold">{invoiceData.bankName}</span></p>
                                            <p>A/c No.: <span className="font-semibold">{invoiceData.accountNumber}</span></p>
                                            <p>Branch & IFS Code: <span className="font-semibold">{invoiceData.branch} {invoiceData.ifscCode}</span></p>
                                        </div>
                                    </>
                                )}
                                <div className="mt-4">
                                    <div className="font-semibold underline mb-1 text-xs">Terms & Conditions</div>
                                    <div className="text-[10px] whitespace-pre-wrap text-slate-600">{invoiceData.termsConditions}</div>
                                </div>
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

                        <div className="mt-8 text-[9px] text-center text-slate-400 border-t border-slate-200 pt-2">
                            Subject to {invoiceData.jurisdictionCity || "City"} Jurisdiction. This is a Computer Generated Invoice.
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
