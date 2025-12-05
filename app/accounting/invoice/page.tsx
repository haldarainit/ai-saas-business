"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { motion } from "framer-motion"
import { Download, Plus, Trash2, FileText, ArrowLeft, Calendar } from "lucide-react"
import Link from "next/link"

interface InvoiceItem {
    id: string
    description: string
    quantity: number
    rate: number
    amount: number
}

interface InvoiceData {
    // Company Info
    companyName: string
    companyAddress: string
    companyEmail: string
    companyPhone: string

    // Client Info
    clientName: string
    clientAddress: string
    clientEmail: string
    clientPhone: string

    // Invoice Details
    invoiceNumber: string
    invoiceDate: string
    dueDate: string

    // Items
    items: InvoiceItem[]

    // Additional
    notes: string
    taxRate: number
}

export default function InvoicePage() {
    const [invoiceData, setInvoiceData] = useState<InvoiceData>({
        companyName: "",
        companyAddress: "",
        companyEmail: "",
        companyPhone: "",
        clientName: "",
        clientAddress: "",
        clientEmail: "",
        clientPhone: "",
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [{ id: "1", description: "", quantity: 1, rate: 0, amount: 0 }],
        notes: "",
        taxRate: 0,
    })

    const addItem = () => {
        const newItem: InvoiceItem = {
            id: Date.now().toString(),
            description: "",
            quantity: 1,
            rate: 0,
            amount: 0,
        }
        setInvoiceData({ ...invoiceData, items: [...invoiceData.items, newItem] })
    }

    const removeItem = (id: string) => {
        if (invoiceData.items.length > 1) {
            setInvoiceData({
                ...invoiceData,
                items: invoiceData.items.filter(item => item.id !== id),
            })
        }
    }

    const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
        const updatedItems = invoiceData.items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value }
                updatedItem.amount = updatedItem.quantity * updatedItem.rate
                return updatedItem
            }
            return item
        })
        setInvoiceData({ ...invoiceData, items: updatedItems })
    }

    const calculateSubtotal = () => {
        return invoiceData.items.reduce((sum, item) => sum + item.amount, 0)
    }

    const calculateTax = () => {
        return (calculateSubtotal() * invoiceData.taxRate) / 100
    }

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax()
    }

    const downloadInvoice = () => {
        const invoiceContent = document.getElementById('invoice-preview')
        if (!invoiceContent) return

        // Create a new window for printing
        const printWindow = window.open('', '', 'height=800,width=800')
        if (!printWindow) return

        printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoiceData.invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #0891b2; }
            .company-info h1 { color: #0891b2; font-size: 32px; margin-bottom: 10px; }
            .company-info p { margin: 4px 0; color: #666; }
            .invoice-details { text-align: right; }
            .invoice-details h2 { color: #333; font-size: 24px; margin-bottom: 10px; }
            .invoice-details p { margin: 4px 0; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 14px; font-weight: bold; color: #0891b2; text-transform: uppercase; margin-bottom: 10px; }
            .client-info p { margin: 4px 0; color: #666; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            thead { background-color: #0891b2; color: white; }
            th { padding: 12px; text-align: left; font-weight: 600; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
            tbody tr:hover { background-color: #f9fafb; }
            .text-right { text-align: right; }
            .totals { margin-top: 30px; }
            .totals-table { width: 300px; margin-left: auto; }
            .totals-table tr { border: none; }
            .totals-table td { padding: 8px; border: none; }
            .total-row { font-size: 18px; font-weight: bold; background-color: #f0f9ff; }
            .total-row td { padding: 12px; color: #0891b2; }
            .notes { margin-top: 40px; padding: 20px; background-color: #f9fafb; border-left: 4px solid #0891b2; }
            .notes-title { font-weight: bold; margin-bottom: 8px; color: #0891b2; }
            .footer { margin-top: 60px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #666; font-size: 12px; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="company-info">
                <h1>${invoiceData.companyName || 'Your Company'}</h1>
                <p>${invoiceData.companyAddress || ''}</p>
                <p>${invoiceData.companyEmail || ''}</p>
                <p>${invoiceData.companyPhone || ''}</p>
              </div>
              <div class="invoice-details">
                <h2>INVOICE</h2>
                <p><strong>Invoice #:</strong> ${invoiceData.invoiceNumber}</p>
                <p><strong>Date:</strong> ${new Date(invoiceData.invoiceDate).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> ${new Date(invoiceData.dueDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Bill To:</div>
              <div class="client-info">
                <p><strong>${invoiceData.clientName || 'Client Name'}</strong></p>
                <p>${invoiceData.clientAddress || ''}</p>
                <p>${invoiceData.clientEmail || ''}</p>
                <p>${invoiceData.clientPhone || ''}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="text-right">Quantity</th>
                  <th class="text-right">Rate</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceData.items.map(item => `
                  <tr>
                    <td>${item.description || '-'}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">$${item.rate.toFixed(2)}</td>
                    <td class="text-right">$${item.amount.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals">
              <table class="totals-table">
                <tr>
                  <td>Subtotal:</td>
                  <td class="text-right">$${calculateSubtotal().toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Tax (${invoiceData.taxRate}%):</td>
                  <td class="text-right">$${calculateTax().toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                  <td>Total:</td>
                  <td class="text-right">$${calculateTotal().toFixed(2)}</td>
                </tr>
              </table>
            </div>

            ${invoiceData.notes ? `
              <div class="notes">
                <div class="notes-title">Notes:</div>
                <p>${invoiceData.notes}</p>
              </div>
            ` : ''}

            <div class="footer">
              <p>Thank you for your business!</p>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
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
                    <section className="relative py-12 bg-gradient-to-br from-cyan-500/10 via-background to-blue-500/10 border-b">
                        <div className="container px-4 md:px-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Link href="/accounting" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Accounting
                                    </Link>
                                    <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
                                        Invoice Generator
                                    </h1>
                                    <p className="text-muted-foreground text-lg">
                                        Create professional invoices in seconds
                                    </p>
                                </div>
                                <FileText className="w-16 h-16 text-cyan-500 opacity-50" />
                            </div>
                        </div>
                    </section>

                    {/* Main Content */}
                    <section className="py-12">
                        <div className="container px-4 md:px-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Form Section */}
                                <div className="space-y-6">
                                    {/* Company Information */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <Card className="p-6 border-2 border-border/50 hover:border-cyan-500/50 transition-colors">
                                            <h2 className="text-xl font-bold mb-4 flex items-center text-cyan-600">
                                                <div className="w-2 h-2 rounded-full bg-cyan-500 mr-3" />
                                                Your Company Information
                                            </h2>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="companyName">Company Name *</Label>
                                                    <Input
                                                        id="companyName"
                                                        placeholder="Acme Corporation"
                                                        value={invoiceData.companyName}
                                                        onChange={(e) => setInvoiceData({ ...invoiceData, companyName: e.target.value })}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="companyAddress">Address</Label>
                                                    <Textarea
                                                        id="companyAddress"
                                                        placeholder="123 Business St, Suite 100, City, State 12345"
                                                        value={invoiceData.companyAddress}
                                                        onChange={(e) => setInvoiceData({ ...invoiceData, companyAddress: e.target.value })}
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
                                                            value={invoiceData.companyEmail}
                                                            onChange={(e) => setInvoiceData({ ...invoiceData, companyEmail: e.target.value })}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="companyPhone">Phone</Label>
                                                        <Input
                                                            id="companyPhone"
                                                            placeholder="+1 (555) 123-4567"
                                                            value={invoiceData.companyPhone}
                                                            onChange={(e) => setInvoiceData({ ...invoiceData, companyPhone: e.target.value })}
                                                            className="mt-1"
                                                        />
                                                    </div>
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
                                        <Card className="p-6 border-2 border-border/50 hover:border-blue-500/50 transition-colors">
                                            <h2 className="text-xl font-bold mb-4 flex items-center text-blue-600">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
                                                Client Information
                                            </h2>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="clientName">Client Name *</Label>
                                                    <Input
                                                        id="clientName"
                                                        placeholder="Client Company Name"
                                                        value={invoiceData.clientName}
                                                        onChange={(e) => setInvoiceData({ ...invoiceData, clientName: e.target.value })}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="clientAddress">Address</Label>
                                                    <Textarea
                                                        id="clientAddress"
                                                        placeholder="456 Client Ave, City, State 67890"
                                                        value={invoiceData.clientAddress}
                                                        onChange={(e) => setInvoiceData({ ...invoiceData, clientAddress: e.target.value })}
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
                                                            value={invoiceData.clientEmail}
                                                            onChange={(e) => setInvoiceData({ ...invoiceData, clientEmail: e.target.value })}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="clientPhone">Phone</Label>
                                                        <Input
                                                            id="clientPhone"
                                                            placeholder="+1 (555) 987-6543"
                                                            value={invoiceData.clientPhone}
                                                            onChange={(e) => setInvoiceData({ ...invoiceData, clientPhone: e.target.value })}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>

                                    {/* Invoice Details */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <Card className="p-6 border-2 border-border/50 hover:border-emerald-500/50 transition-colors">
                                            <h2 className="text-xl font-bold mb-4 flex items-center text-emerald-600">
                                                <Calendar className="w-5 h-5 mr-3" />
                                                Invoice Details
                                            </h2>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <Label htmlFor="invoiceNumber">Invoice #</Label>
                                                    <Input
                                                        id="invoiceNumber"
                                                        value={invoiceData.invoiceNumber}
                                                        onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="invoiceDate">Invoice Date</Label>
                                                    <Input
                                                        id="invoiceDate"
                                                        type="date"
                                                        value={invoiceData.invoiceDate}
                                                        onChange={(e) => setInvoiceData({ ...invoiceData, invoiceDate: e.target.value })}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="dueDate">Due Date</Label>
                                                    <Input
                                                        id="dueDate"
                                                        type="date"
                                                        value={invoiceData.dueDate}
                                                        onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
                                                        className="mt-1"
                                                    />
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
                                                    Invoice Items
                                                </h2>
                                                <Button onClick={addItem} size="sm" variant="outline" className="gap-2">
                                                    <Plus className="w-4 h-4" />
                                                    Add Item
                                                </Button>
                                            </div>
                                            <div className="space-y-4">
                                                {invoiceData.items.map((item, index) => (
                                                    <div key={item.id} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
                                                            {invoiceData.items.length > 1 && (
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
                                                            <Label>Description</Label>
                                                            <Input
                                                                placeholder="Product or service description"
                                                                value={item.description}
                                                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                                className="mt-1"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-3">
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
                                                                <Label>Rate ($)</Label>
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={item.rate}
                                                                    onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
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

                                    {/* Additional Details */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <Card className="p-6 border-2 border-border/50">
                                            <h2 className="text-xl font-bold mb-4">Additional Details</h2>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                                                    <Input
                                                        id="taxRate"
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        value={invoiceData.taxRate}
                                                        onChange={(e) => setInvoiceData({ ...invoiceData, taxRate: parseFloat(e.target.value) || 0 })}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="notes">Notes / Terms</Label>
                                                    <Textarea
                                                        id="notes"
                                                        placeholder="Payment terms, thank you message, or additional notes..."
                                                        value={invoiceData.notes}
                                                        onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
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
                                        <Card className="p-8 border-2 border-border/50" id="invoice-preview">
                                            {/* Invoice Header */}
                                            <div className="flex justify-between items-start mb-8 pb-6 border-b-4 border-cyan-500">
                                                <div>
                                                    <h2 className="text-3xl font-bold text-cyan-600 mb-2">
                                                        {invoiceData.companyName || "Your Company"}
                                                    </h2>
                                                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                                                        {invoiceData.companyAddress}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">{invoiceData.companyEmail}</p>
                                                    <p className="text-sm text-muted-foreground">{invoiceData.companyPhone}</p>
                                                </div>
                                                <div className="text-right">
                                                    <h3 className="text-2xl font-bold mb-2">INVOICE</h3>
                                                    <p className="text-sm"><span className="font-semibold">Invoice #:</span> {invoiceData.invoiceNumber}</p>
                                                    <p className="text-sm"><span className="font-semibold">Date:</span> {new Date(invoiceData.invoiceDate).toLocaleDateString()}</p>
                                                    <p className="text-sm"><span className="font-semibold">Due:</span> {new Date(invoiceData.dueDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>

                                            {/* Bill To */}
                                            <div className="mb-8">
                                                <h4 className="text-sm font-bold text-cyan-600 uppercase mb-2">Bill To:</h4>
                                                <p className="font-semibold">{invoiceData.clientName || "Client Name"}</p>
                                                <p className="text-sm text-muted-foreground whitespace-pre-line">{invoiceData.clientAddress}</p>
                                                <p className="text-sm text-muted-foreground">{invoiceData.clientEmail}</p>
                                                <p className="text-sm text-muted-foreground">{invoiceData.clientPhone}</p>
                                            </div>

                                            {/* Items Table */}
                                            <div className="mb-6">
                                                <table className="w-full">
                                                    <thead className="bg-cyan-500 text-white">
                                                        <tr>
                                                            <th className="text-left p-3 text-sm font-semibold">Description</th>
                                                            <th className="text-right p-3 text-sm font-semibold">Qty</th>
                                                            <th className="text-right p-3 text-sm font-semibold">Rate</th>
                                                            <th className="text-right p-3 text-sm font-semibold">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {invoiceData.items.map((item, index) => (
                                                            <tr key={item.id} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                                                                <td className="p-3 text-sm">{item.description || '-'}</td>
                                                                <td className="p-3 text-sm text-right">{item.quantity}</td>
                                                                <td className="p-3 text-sm text-right">${item.rate.toFixed(2)}</td>
                                                                <td className="p-3 text-sm text-right font-semibold">${item.amount.toFixed(2)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Totals */}
                                            <div className="flex justify-end mb-6">
                                                <div className="w-64">
                                                    <div className="flex justify-between py-2 border-b">
                                                        <span className="text-sm">Subtotal:</span>
                                                        <span className="text-sm font-semibold">${calculateSubtotal().toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between py-2 border-b">
                                                        <span className="text-sm">Tax ({invoiceData.taxRate}%):</span>
                                                        <span className="text-sm font-semibold">${calculateTax().toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between py-3 bg-cyan-50 px-3 rounded-lg mt-2">
                                                        <span className="font-bold text-cyan-600">Total:</span>
                                                        <span className="font-bold text-lg text-cyan-600">${calculateTotal().toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Notes */}
                                            {invoiceData.notes && (
                                                <div className="mt-6 p-4 bg-muted/50 rounded-lg border-l-4 border-cyan-500">
                                                    <h4 className="font-semibold text-sm mb-2 text-cyan-600">Notes:</h4>
                                                    <p className="text-sm text-muted-foreground whitespace-pre-line">{invoiceData.notes}</p>
                                                </div>
                                            )}

                                            {/* Footer */}
                                            <div className="mt-8 pt-6 border-t text-center">
                                                <p className="text-xs text-muted-foreground">Thank you for your business!</p>
                                            </div>
                                        </Card>

                                        {/* Download Button */}
                                        <Button
                                            onClick={downloadInvoice}
                                            size="lg"
                                            className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <Download className="w-5 h-5 mr-2" />
                                            Download / Print Invoice
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
