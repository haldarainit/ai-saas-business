"use client"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { motion } from "framer-motion"
import { Download, Plus, Trash2, FileText, ArrowLeft, Calendar, Upload, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface QuotationItem {
    id: string
    description: string
    specifications: string
    quantity: number
    unitPrice: number
    discount: number
    amount: number
}

interface QuotationData {
    // Company Info
    companyName: string
    companyAddress: string
    companyEmail: string
    companyPhone: string
    companyWebsite: string
    companyLogo: string

    // Client Info
    clientName: string
    clientCompany: string
    clientAddress: string
    clientEmail: string
    clientPhone: string

    // Quotation Details
    quotationNumber: string
    quotationDate: string
    validUntil: string
    projectName: string

    // Items
    items: QuotationItem[]

    // Additional
    terms: string
    notes: string
    taxRate: number

    // Payment & Delivery
    paymentTerms: string
    deliveryTime: string
}

export default function QuotationPage() {
    const logoInputRef = useRef<HTMLInputElement>(null)

    const [quotationData, setQuotationData] = useState<QuotationData>({
        companyName: "",
        companyAddress: "",
        companyEmail: "",
        companyPhone: "",
        companyWebsite: "",
        companyLogo: "",
        clientName: "",
        clientCompany: "",
        clientAddress: "",
        clientEmail: "",
        clientPhone: "",
        quotationNumber: `QT-${Date.now().toString().slice(-6)}`,
        quotationDate: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        projectName: "",
        items: [{ id: "1", description: "", specifications: "", quantity: 1, unitPrice: 0, discount: 0, amount: 0 }],
        terms: "1. Prices are valid for 30 days from the date of quotation.\n2. Payment terms: 50% advance, 50% upon completion.\n3. Delivery time may vary based on project requirements.\n4. All prices are exclusive of taxes unless stated otherwise.",
        notes: "",
        taxRate: 0,
        paymentTerms: "50% Advance, 50% on Completion",
        deliveryTime: "2-4 weeks",
    })

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setQuotationData({ ...quotationData, companyLogo: reader.result as string })
            }
            reader.readAsDataURL(file)
        }
    }

    const addItem = () => {
        const newItem: QuotationItem = {
            id: Date.now().toString(),
            description: "",
            specifications: "",
            quantity: 1,
            unitPrice: 0,
            discount: 0,
            amount: 0,
        }
        setQuotationData({ ...quotationData, items: [...quotationData.items, newItem] })
    }

    const removeItem = (id: string) => {
        if (quotationData.items.length > 1) {
            setQuotationData({
                ...quotationData,
                items: quotationData.items.filter(item => item.id !== id),
            })
        }
    }

    const updateItem = (id: string, field: keyof QuotationItem, value: string | number) => {
        const updatedItems = quotationData.items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value }
                const subtotal = updatedItem.quantity * updatedItem.unitPrice
                const discountAmount = (subtotal * updatedItem.discount) / 100
                updatedItem.amount = subtotal - discountAmount
                return updatedItem
            }
            return item
        })
        setQuotationData({ ...quotationData, items: updatedItems })
    }

    const calculateSubtotal = () => {
        return quotationData.items.reduce((sum, item) => sum + item.amount, 0)
    }

    const calculateTax = () => {
        return (calculateSubtotal() * quotationData.taxRate) / 100
    }

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax()
    }

    const downloadQuotation = () => {
        const printWindow = window.open('', '', 'height=900,width=800')
        if (!printWindow) return

        printWindow.document.write(`
      <html>
        <head>
          <title>Quotation ${quotationData.quotationNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 40px; 
              color: #1f2937; 
              background: #fff;
              position: relative;
            }
            
            /* Watermark */
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 120px;
              font-weight: bold;
              color: rgba(16, 185, 129, 0.08);
              z-index: 0;
              pointer-events: none;
              white-space: nowrap;
            }
            
            .content {
              position: relative;
              z-index: 1;
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            
            /* Header with Logo */
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 4px solid #10b981;
            }
            
            .logo-section {
              flex: 1;
            }
            
            .company-logo {
              max-width: 180px;
              max-height: 80px;
              margin-bottom: 15px;
              object-fit: contain;
            }
            
            .company-info h1 {
              color: #10b981;
              font-size: 28px;
              margin-bottom: 8px;
              font-weight: 700;
            }
            
            .company-info p {
              margin: 3px 0;
              color: #6b7280;
              font-size: 13px;
            }
            
            .quotation-badge {
              text-align: right;
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
              padding: 20px 25px;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            }
            
            .quotation-badge h2 {
              font-size: 32px;
              margin-bottom: 12px;
              font-weight: 700;
              letter-spacing: 1px;
            }
            
            .quotation-badge p {
              margin: 5px 0;
              font-size: 13px;
              opacity: 0.95;
            }
            
            /* Project & Client Info */
            .info-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 35px;
            }
            
            .info-box {
              background: #f9fafb;
              padding: 20px;
              border-radius: 10px;
              border-left: 4px solid #10b981;
            }
            
            .info-title {
              font-size: 12px;
              font-weight: 700;
              color: #10b981;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 12px;
            }
            
            .info-box p {
              margin: 6px 0;
              color: #374151;
              font-size: 14px;
              line-height: 1.6;
            }
            
            .info-box strong {
              color: #1f2937;
              font-weight: 600;
            }
            
            /* Project Name Banner */
            .project-banner {
              background: linear-gradient(135deg, #ecfdf5, #d1fae5);
              padding: 18px 24px;
              border-radius: 10px;
              margin-bottom: 30px;
              border-left: 5px solid #10b981;
            }
            
            .project-banner h3 {
              color: #065f46;
              font-size: 18px;
              font-weight: 700;
            }
            
            /* Items Table */
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 25px 0;
              box-shadow: 0 2px 8px rgba(0,0,0,0.08);
              border-radius: 8px;
              overflow: hidden;
            }
            
            thead {
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
            }
            
            th {
              padding: 14px 12px;
              text-align: left;
              font-weight: 600;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            td {
              padding: 14px 12px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 13px;
            }
            
            tbody tr {
              background: white;
              transition: background 0.2s;
            }
            
            tbody tr:nth-child(even) {
              background: #f9fafb;
            }
            
            tbody tr:hover {
              background: #f0fdf4;
            }
            
            .item-description {
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 4px;
            }
            
            .item-specs {
              font-size: 11px;
              color: #6b7280;
              font-style: italic;
            }
            
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            
            /* Totals Section */
            .totals-section {
              margin-top: 30px;
              display: flex;
              justify-content: flex-end;
            }
            
            .totals-table {
              width: 350px;
              background: #f9fafb;
              padding: 20px;
              border-radius: 10px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            }
            
            .totals-table tr {
              border: none;
            }
            
            .totals-table td {
              padding: 10px 0;
              border: none;
              font-size: 14px;
            }
            
            .totals-table .subtotal-row td {
              border-top: 1px solid #d1d5db;
              padding-top: 12px;
            }
            
            .total-row {
              font-size: 20px;
              font-weight: 700;
              background: linear-gradient(135deg, #10b981, #059669);
              color: white !important;
              margin-top: 10px;
            }
            
            .total-row td {
              padding: 16px 20px !important;
              border-radius: 8px;
            }
            
            /* Terms & Notes */
            .terms-section, .notes-section {
              margin-top: 35px;
              padding: 20px;
              background: #f9fafb;
              border-left: 5px solid #10b981;
              border-radius: 8px;
            }
            
            .section-title {
              font-weight: 700;
              margin-bottom: 12px;
              color: #10b981;
              font-size: 15px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .terms-section p, .notes-section p {
              margin: 8px 0;
              color: #4b5563;
              line-height: 1.7;
              font-size: 13px;
              white-space: pre-line;
            }
            
            /* Payment & Delivery Info */
            .payment-delivery {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-top: 30px;
            }
            
            .info-card {
              background: white;
              border: 2px solid #10b981;
              padding: 18px;
              border-radius: 10px;
            }
            
            .info-card h4 {
              color: #10b981;
              font-size: 14px;
              font-weight: 700;
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            
            .info-card p {
              color: #374151;
              font-size: 14px;
            }
            
            /* Signature Section */
            .signature-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-top: 60px;
              padding-top: 30px;
              border-top: 2px solid #e5e7eb;
            }
            
            .signature-box {
              text-align: center;
            }
            
            .signature-line {
              border-top: 2px solid #1f2937;
              margin-top: 60px;
              padding-top: 10px;
              font-weight: 600;
              color: #374151;
            }
            
            .signature-label {
              font-size: 12px;
              color: #6b7280;
              margin-top: 5px;
            }
            
            /* Footer */
            .footer {
              margin-top: 50px;
              padding-top: 25px;
              border-top: 3px solid #10b981;
              text-align: center;
            }
            
            .footer-message {
              font-size: 16px;
              font-weight: 600;
              color: #10b981;
              margin-bottom: 8px;
            }
            
            .footer-note {
              font-size: 11px;
              color: #9ca3af;
            }
            
            /* Print Styles */
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
              .watermark { opacity: 0.05; }
            }
          </style>
        </head>
        <body>
          <!-- Watermark -->
          <div class="watermark">QUOTATION</div>
          
          <div class="content">
            <!-- Header -->
            <div class="header">
              <div class="logo-section">
                ${quotationData.companyLogo ? `
                  <img src="${quotationData.companyLogo}" alt="Company Logo" class="company-logo" />
                ` : ''}
                <div class="company-info">
                  <h1>${quotationData.companyName || 'Your Company Name'}</h1>
                  <p>${quotationData.companyAddress || ''}</p>
                  <p>${quotationData.companyEmail || ''} ${quotationData.companyPhone ? '| ' + quotationData.companyPhone : ''}</p>
                  ${quotationData.companyWebsite ? `<p>${quotationData.companyWebsite}</p>` : ''}
                </div>
              </div>
              
              <div class="quotation-badge">
                <h2>QUOTATION</h2>
                <p><strong>Quote #:</strong> ${quotationData.quotationNumber}</p>
                <p><strong>Date:</strong> ${new Date(quotationData.quotationDate).toLocaleDateString()}</p>
                <p><strong>Valid Until:</strong> ${new Date(quotationData.validUntil).toLocaleDateString()}</p>
              </div>
            </div>

            <!-- Project Name -->
            ${quotationData.projectName ? `
              <div class="project-banner">
                <h3>Project: ${quotationData.projectName}</h3>
              </div>
            ` : ''}

            <!-- Client & Project Info -->
            <div class="info-section">
              <div class="info-box">
                <div class="info-title">Prepared For:</div>
                <p><strong>${quotationData.clientName || 'Client Name'}</strong></p>
                ${quotationData.clientCompany ? `<p>${quotationData.clientCompany}</p>` : ''}
                <p>${quotationData.clientAddress || ''}</p>
                <p>${quotationData.clientEmail || ''}</p>
                <p>${quotationData.clientPhone || ''}</p>
              </div>
              
              <div class="info-box">
                <div class="info-title">Project Details:</div>
                <p><strong>Payment Terms:</strong> ${quotationData.paymentTerms}</p>
                <p><strong>Delivery Time:</strong> ${quotationData.deliveryTime}</p>
                <p><strong>Quote Valid:</strong> ${Math.ceil((new Date(quotationData.validUntil).getTime() - new Date(quotationData.quotationDate).getTime()) / (1000 * 60 * 60 * 24))} days</p>
              </div>
            </div>

            <!-- Items Table -->
            <table>
              <thead>
                <tr>
                  <th style="width: 5%;">#</th>
                  <th style="width: 35%;">Description</th>
                  <th class="text-center" style="width: 10%;">Qty</th>
                  <th class="text-right" style="width: 15%;">Unit Price</th>
                  <th class="text-center" style="width: 10%;">Discount</th>
                  <th class="text-right" style="width: 15%;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${quotationData.items.map((item, index) => `
                  <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>
                      <div class="item-description">${item.description || '-'}</div>
                      ${item.specifications ? `<div class="item-specs">${item.specifications}</div>` : ''}
                    </td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">$${item.unitPrice.toFixed(2)}</td>
                    <td class="text-center">${item.discount}%</td>
                    <td class="text-right"><strong>$${item.amount.toFixed(2)}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Totals -->
            <div class="totals-section">
              <table class="totals-table">
                <tr class="subtotal-row">
                  <td>Subtotal:</td>
                  <td class="text-right"><strong>$${calculateSubtotal().toFixed(2)}</strong></td>
                </tr>
                <tr>
                  <td>Tax (${quotationData.taxRate}%):</td>
                  <td class="text-right"><strong>$${calculateTax().toFixed(2)}</strong></td>
                </tr>
                <tr class="total-row">
                  <td colspan="2" style="text-align: center;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span>TOTAL AMOUNT:</span>
                      <span>$${calculateTotal().toFixed(2)}</span>
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Terms & Conditions -->
            ${quotationData.terms ? `
              <div class="terms-section">
                <div class="section-title">Terms & Conditions</div>
                <p>${quotationData.terms}</p>
              </div>
            ` : ''}

            <!-- Additional Notes -->
            ${quotationData.notes ? `
              <div class="notes-section">
                <div class="section-title">Additional Notes</div>
                <p>${quotationData.notes}</p>
              </div>
            ` : ''}

            <!-- Signature Section -->
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-line">Authorized Signature</div>
                <div class="signature-label">${quotationData.companyName || 'Company Name'}</div>
              </div>
              <div class="signature-box">
                <div class="signature-line">Client Acceptance</div>
                <div class="signature-label">${quotationData.clientName || 'Client Name'}</div>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p class="footer-message">Thank you for considering our quotation!</p>
              <p class="footer-note">This is a computer-generated quotation. Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </body>
      </html>
    `)

        printWindow.document.close()
        printWindow.focus()

        setTimeout(() => {
            printWindow.print()
            printWindow.close()
        }, 250)
    }

    return (
        <>
            <div className="flex min-h-screen flex-col">
                <Navbar />

                <main className="flex-1 bg-muted/30">
                    {/* Header */}
                    <section className="relative py-12 bg-gradient-to-br from-emerald-500/10 via-background to-teal-500/10 border-b">
                        <div className="container px-4 md:px-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Link href="/accounting" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Accounting
                                    </Link>
                                    <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                                        Quotation Generator
                                    </h1>
                                    <p className="text-muted-foreground text-lg">
                                        Create professional quotations with logo and watermark
                                    </p>
                                </div>
                                <FileText className="w-16 h-16 text-emerald-500 opacity-50" />
                            </div>
                        </div>
                    </section>

                    {/* Main Content */}
                    <section className="py-12">
                        <div className="container px-4 md:px-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Form Section */}
                                <div className="space-y-6">
                                    {/* Company Information with Logo */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <Card className="p-6 border-2 border-border/50 hover:border-emerald-500/50 transition-colors">
                                            <h2 className="text-xl font-bold mb-4 flex items-center text-emerald-600">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 mr-3" />
                                                Your Company Information
                                            </h2>

                                            {/* Logo Upload */}
                                            <div className="mb-6">
                                                <Label htmlFor="logo">Company Logo</Label>
                                                <div className="mt-2 flex items-center gap-4">
                                                    {quotationData.companyLogo ? (
                                                        <div className="relative w-32 h-32 border-2 border-emerald-500 rounded-lg overflow-hidden">
                                                            <Image
                                                                src={quotationData.companyLogo}
                                                                alt="Company Logo"
                                                                fill
                                                                className="object-contain p-2"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-32 h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center bg-muted/30">
                                                            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <input
                                                            ref={logoInputRef}
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleLogoUpload}
                                                            className="hidden"
                                                            id="logo-upload"
                                                        />
                                                        <Button
                                                            onClick={() => logoInputRef.current?.click()}
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-2"
                                                        >
                                                            <Upload className="w-4 h-4" />
                                                            Upload Logo
                                                        </Button>
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            PNG, JPG up to 2MB
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="companyName">Company Name *</Label>
                                                    <Input
                                                        id="companyName"
                                                        placeholder="Acme Corporation"
                                                        value={quotationData.companyName}
                                                        onChange={(e) => setQuotationData({ ...quotationData, companyName: e.target.value })}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="companyAddress">Address</Label>
                                                    <Textarea
                                                        id="companyAddress"
                                                        placeholder="123 Business St, Suite 100, City, State 12345"
                                                        value={quotationData.companyAddress}
                                                        onChange={(e) => setQuotationData({ ...quotationData, companyAddress: e.target.value })}
                                                        className="mt-1"
                                                        rows={2}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="companyEmail">Email</Label>
                                                        <Input
                                                            id="companyEmail"
                                                            type="email"
                                                            placeholder="info@company.com"
                                                            value={quotationData.companyEmail}
                                                            onChange={(e) => setQuotationData({ ...quotationData, companyEmail: e.target.value })}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="companyPhone">Phone</Label>
                                                        <Input
                                                            id="companyPhone"
                                                            placeholder="+1 (555) 123-4567"
                                                            value={quotationData.companyPhone}
                                                            onChange={(e) => setQuotationData({ ...quotationData, companyPhone: e.target.value })}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label htmlFor="companyWebsite">Website</Label>
                                                    <Input
                                                        id="companyWebsite"
                                                        placeholder="www.company.com"
                                                        value={quotationData.companyWebsite}
                                                        onChange={(e) => setQuotationData({ ...quotationData, companyWebsite: e.target.value })}
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>

                                    {/* Client Information */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <Card className="p-6 border-2 border-border/50 hover:border-teal-500/50 transition-colors">
                                            <h2 className="text-xl font-bold mb-4 flex items-center text-teal-600">
                                                <div className="w-2 h-2 rounded-full bg-teal-500 mr-3" />
                                                Client Information
                                            </h2>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="clientName">Contact Person *</Label>
                                                        <Input
                                                            id="clientName"
                                                            placeholder="John Doe"
                                                            value={quotationData.clientName}
                                                            onChange={(e) => setQuotationData({ ...quotationData, clientName: e.target.value })}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="clientCompany">Company Name</Label>
                                                        <Input
                                                            id="clientCompany"
                                                            placeholder="Client Corp"
                                                            value={quotationData.clientCompany}
                                                            onChange={(e) => setQuotationData({ ...quotationData, clientCompany: e.target.value })}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label htmlFor="clientAddress">Address</Label>
                                                    <Textarea
                                                        id="clientAddress"
                                                        placeholder="456 Client Ave, City, State 67890"
                                                        value={quotationData.clientAddress}
                                                        onChange={(e) => setQuotationData({ ...quotationData, clientAddress: e.target.value })}
                                                        className="mt-1"
                                                        rows={2}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="clientEmail">Email</Label>
                                                        <Input
                                                            id="clientEmail"
                                                            type="email"
                                                            placeholder="client@email.com"
                                                            value={quotationData.clientEmail}
                                                            onChange={(e) => setQuotationData({ ...quotationData, clientEmail: e.target.value })}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="clientPhone">Phone</Label>
                                                        <Input
                                                            id="clientPhone"
                                                            placeholder="+1 (555) 987-6543"
                                                            value={quotationData.clientPhone}
                                                            onChange={(e) => setQuotationData({ ...quotationData, clientPhone: e.target.value })}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>

                                    {/* Quotation Details */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <Card className="p-6 border-2 border-border/50 hover:border-blue-500/50 transition-colors">
                                            <h2 className="text-xl font-bold mb-4 flex items-center text-blue-600">
                                                <Calendar className="w-5 h-5 mr-3" />
                                                Quotation Details
                                            </h2>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="quotationNumber">Quote Number</Label>
                                                        <Input
                                                            id="quotationNumber"
                                                            value={quotationData.quotationNumber}
                                                            onChange={(e) => setQuotationData({ ...quotationData, quotationNumber: e.target.value })}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="projectName">Project Name</Label>
                                                        <Input
                                                            id="projectName"
                                                            placeholder="Website Development"
                                                            value={quotationData.projectName}
                                                            onChange={(e) => setQuotationData({ ...quotationData, projectName: e.target.value })}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="quotationDate">Quote Date</Label>
                                                        <Input
                                                            id="quotationDate"
                                                            type="date"
                                                            value={quotationData.quotationDate}
                                                            onChange={(e) => setQuotationData({ ...quotationData, quotationDate: e.target.value })}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="validUntil">Valid Until</Label>
                                                        <Input
                                                            id="validUntil"
                                                            type="date"
                                                            value={quotationData.validUntil}
                                                            onChange={(e) => setQuotationData({ ...quotationData, validUntil: e.target.value })}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="paymentTerms">Payment Terms</Label>
                                                        <Input
                                                            id="paymentTerms"
                                                            placeholder="50% Advance, 50% on Completion"
                                                            value={quotationData.paymentTerms}
                                                            onChange={(e) => setQuotationData({ ...quotationData, paymentTerms: e.target.value })}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="deliveryTime">Delivery Time</Label>
                                                        <Input
                                                            id="deliveryTime"
                                                            placeholder="2-4 weeks"
                                                            value={quotationData.deliveryTime}
                                                            onChange={(e) => setQuotationData({ ...quotationData, deliveryTime: e.target.value })}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>

                                    {/* Items */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        <Card className="p-6 border-2 border-border/50 hover:border-purple-500/50 transition-colors">
                                            <div className="flex items-center justify-between mb-4">
                                                <h2 className="text-xl font-bold flex items-center text-purple-600">
                                                    <div className="w-2 h-2 rounded-full bg-purple-500 mr-3" />
                                                    Quotation Items
                                                </h2>
                                                <Button onClick={addItem} size="sm" variant="outline" className="gap-2">
                                                    <Plus className="w-4 h-4" />
                                                    Add Item
                                                </Button>
                                            </div>
                                            <div className="space-y-4">
                                                {quotationData.items.map((item, index) => (
                                                    <div key={item.id} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
                                                            {quotationData.items.length > 1 && (
                                                                <Button
                                                                    onClick={() => removeItem(item.id)}
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <Label>Description *</Label>
                                                            <Input
                                                                placeholder="Product or service name"
                                                                value={item.description}
                                                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                                className="mt-1"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label>Specifications / Details</Label>
                                                            <Textarea
                                                                placeholder="Technical specs, features, or additional details..."
                                                                value={item.specifications}
                                                                onChange={(e) => updateItem(item.id, 'specifications', e.target.value)}
                                                                className="mt-1"
                                                                rows={2}
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-3">
                                                            <div>
                                                                <Label>Quantity</Label>
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    value={item.quantity}
                                                                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                                    className="mt-1"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Unit Price ($)</Label>
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={item.unitPrice}
                                                                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                                    className="mt-1"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Discount (%)</Label>
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    value={item.discount}
                                                                    onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                                                    className="mt-1"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Amount</Label>
                                                                <Input
                                                                    value={`$${item.amount.toFixed(2)}`}
                                                                    disabled
                                                                    className="mt-1 bg-muted"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    </motion.div>

                                    {/* Terms & Additional */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <Card className="p-6 border-2 border-border/50">
                                            <h2 className="text-xl font-bold mb-4">Terms & Additional Info</h2>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                                                    <Input
                                                        id="taxRate"
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        value={quotationData.taxRate}
                                                        onChange={(e) => setQuotationData({ ...quotationData, taxRate: parseFloat(e.target.value) || 0 })}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="terms">Terms & Conditions</Label>
                                                    <Textarea
                                                        id="terms"
                                                        placeholder="Payment terms, delivery conditions, warranties..."
                                                        value={quotationData.terms}
                                                        onChange={(e) => setQuotationData({ ...quotationData, terms: e.target.value })}
                                                        className="mt-1"
                                                        rows={4}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="notes">Additional Notes</Label>
                                                    <Textarea
                                                        id="notes"
                                                        placeholder="Special instructions, thank you message, or other notes..."
                                                        value={quotationData.notes}
                                                        onChange={(e) => setQuotationData({ ...quotationData, notes: e.target.value })}
                                                        className="mt-1"
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                </div>

                                {/* Preview Section */}
                                <div className="lg:sticky lg:top-4 h-fit">
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <Card className="p-8 border-2 border-border/50 relative overflow-hidden">
                                            {/* Watermark Preview */}
                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-[-45deg] text-8xl font-bold text-emerald-500/5 pointer-events-none select-none whitespace-nowrap z-0">
                                                QUOTATION
                                            </div>

                                            <div className="relative z-10">
                                                {/* Header */}
                                                <div className="flex justify-between items-start mb-8 pb-6 border-b-4 border-emerald-500">
                                                    <div>
                                                        {quotationData.companyLogo && (
                                                            <div className="relative w-32 h-16 mb-3">
                                                                <Image
                                                                    src={quotationData.companyLogo}
                                                                    alt="Logo"
                                                                    fill
                                                                    className="object-contain object-left"
                                                                />
                                                            </div>
                                                        )}
                                                        <h2 className="text-2xl font-bold text-emerald-600 mb-2">
                                                            {quotationData.companyName || "Your Company"}
                                                        </h2>
                                                        <p className="text-xs text-muted-foreground whitespace-pre-line">
                                                            {quotationData.companyAddress}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">{quotationData.companyEmail}</p>
                                                        <p className="text-xs text-muted-foreground">{quotationData.companyPhone}</p>
                                                        {quotationData.companyWebsite && (
                                                            <p className="text-xs text-muted-foreground">{quotationData.companyWebsite}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right bg-gradient-to-br from-emerald-500 to-teal-500 text-white p-4 rounded-lg">
                                                        <h3 className="text-xl font-bold mb-2">QUOTATION</h3>
                                                        <p className="text-xs"><span className="font-semibold">Quote #:</span> {quotationData.quotationNumber}</p>
                                                        <p className="text-xs"><span className="font-semibold">Date:</span> {new Date(quotationData.quotationDate).toLocaleDateString()}</p>
                                                        <p className="text-xs"><span className="font-semibold">Valid:</span> {new Date(quotationData.validUntil).toLocaleDateString()}</p>
                                                    </div>
                                                </div>

                                                {/* Project Name */}
                                                {quotationData.projectName && (
                                                    <div className="mb-6 p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-500">
                                                        <h4 className="font-bold text-emerald-700">Project: {quotationData.projectName}</h4>
                                                    </div>
                                                )}

                                                {/* Client Info */}
                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                    <div className="p-3 bg-muted/50 rounded-lg">
                                                        <h4 className="text-xs font-bold text-emerald-600 uppercase mb-2">Prepared For:</h4>
                                                        <p className="text-sm font-semibold">{quotationData.clientName || "Client Name"}</p>
                                                        {quotationData.clientCompany && <p className="text-xs">{quotationData.clientCompany}</p>}
                                                        <p className="text-xs text-muted-foreground">{quotationData.clientAddress}</p>
                                                        <p className="text-xs text-muted-foreground">{quotationData.clientEmail}</p>
                                                    </div>
                                                    <div className="p-3 bg-muted/50 rounded-lg">
                                                        <h4 className="text-xs font-bold text-emerald-600 uppercase mb-2">Details:</h4>
                                                        <p className="text-xs"><strong>Payment:</strong> {quotationData.paymentTerms}</p>
                                                        <p className="text-xs"><strong>Delivery:</strong> {quotationData.deliveryTime}</p>
                                                    </div>
                                                </div>

                                                {/* Items */}
                                                <div className="mb-4">
                                                    <table className="w-full text-xs">
                                                        <thead className="bg-emerald-500 text-white">
                                                            <tr>
                                                                <th className="text-left p-2">#</th>
                                                                <th className="text-left p-2">Description</th>
                                                                <th className="text-right p-2">Qty</th>
                                                                <th className="text-right p-2">Price</th>
                                                                <th className="text-right p-2">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {quotationData.items.map((item, index) => (
                                                                <tr key={item.id} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                                                                    <td className="p-2">{index + 1}</td>
                                                                    <td className="p-2">
                                                                        <div className="font-semibold">{item.description || '-'}</div>
                                                                        {item.specifications && (
                                                                            <div className="text-[10px] text-muted-foreground italic">{item.specifications}</div>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-2 text-right">{item.quantity}</td>
                                                                    <td className="p-2 text-right">${item.unitPrice.toFixed(2)}</td>
                                                                    <td className="p-2 text-right font-semibold">${item.amount.toFixed(2)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Totals */}
                                                <div className="flex justify-end mb-6">
                                                    <div className="w-48 bg-muted/50 p-3 rounded-lg">
                                                        <div className="flex justify-between py-1 text-xs">
                                                            <span>Subtotal:</span>
                                                            <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between py-1 text-xs border-b">
                                                            <span>Tax ({quotationData.taxRate}%):</span>
                                                            <span className="font-semibold">${calculateTax().toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between py-2 bg-emerald-500 text-white px-2 rounded mt-2 font-bold">
                                                            <span>TOTAL:</span>
                                                            <span>${calculateTotal().toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Terms */}
                                                {quotationData.terms && (
                                                    <div className="mt-4 p-3 bg-muted/50 rounded-lg border-l-4 border-emerald-500">
                                                        <h4 className="font-semibold text-xs mb-2 text-emerald-600">Terms & Conditions:</h4>
                                                        <p className="text-[10px] text-muted-foreground whitespace-pre-line">{quotationData.terms}</p>
                                                    </div>
                                                )}

                                                {/* Footer */}
                                                <div className="mt-6 pt-4 border-t text-center">
                                                    <p className="text-xs font-semibold text-emerald-600">Thank you for considering our quotation!</p>
                                                </div>
                                            </div>
                                        </Card>

                                        {/* Download Button */}
                                        <Button
                                            onClick={downloadQuotation}
                                            size="lg"
                                            className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <Download className="w-5 h-5 mr-2" />
                                            Download / Print Quotation
                                        </Button>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <Footer />
            </div>
        </>
    )
}
