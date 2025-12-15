"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import StructuredData from "@/components/structured-data"
import { ArrowRight, MessageSquare, AlertCircle, CheckCircle, Copy, Download, Users, Target, Palette, Clock, Trash2, Eye, EyeOff, BarChart3, Sparkles, Zap, TrendingUp, Printer, FileText } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function SalesScriptGenerator() {
  const [salesScriptForm, setSalesScriptForm] = useState({
    prospectName: '',
    prospectCompany: '',
    prospectRole: '',
    yourProduct: '',
    yourCompany: '',
    keyBenefits: '',
    objectionHandling: '',
    tone: 'professional, confident, consultative'
  })
  const [generatedScript, setGeneratedScript] = useState('')
  const [isGeneratingScript, setIsGeneratingScript] = useState(false)
  const [scriptError, setScriptError] = useState('')
  const [scriptSuccess, setScriptSuccess] = useState(false)
  const [scriptHistory, setScriptHistory] = useState([])
  const [showHistory, setShowHistory] = useState(true)
  const [showPreview, setShowPreview] = useState(true)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [scriptStats, setScriptStats] = useState({ wordCount: 0, characterCount: 0, readingTime: 0 })
  const [parsedScript, setParsedScript] = useState(null)

  // Load script history on component mount
  useEffect(() => {
    loadScriptHistory()
  }, [])

  // Calculate script statistics and parse script sections
  useEffect(() => {
    if (generatedScript) {
      const words = generatedScript.split(/\s+/).filter(word => word.length > 0).length
      const characters = generatedScript.length
      const readingTime = Math.ceil(words / 200) // Average reading speed: 200 words per minute
      setScriptStats({ wordCount: words, characterCount: characters, readingTime })
      
      // Parse script into sections
      const parsed = parseScriptSections(generatedScript)
      setParsedScript(parsed)
    } else {
      setScriptStats({ wordCount: 0, characterCount: 0, readingTime: 0 })
      setParsedScript(null)
    }
  }, [generatedScript])

  const loadScriptHistory = async () => {
    setIsLoadingHistory(true)
    setHistoryError('')
    try {
      const response = await fetch('/api/sales-script-history?limit=10')
      const data = await response.json()
      if (data.success) {
        setScriptHistory(data.scripts)
      } else {
        setHistoryError('Failed to load history')
      }
    } catch (error) {
      console.error('Error loading history:', error)
      setHistoryError('Failed to load history')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const saveToHistory = async (script: string, formData: any) => {
    try {
      const response = await fetch('/api/sales-script-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script,
          formData,
          label: `Script for ${formData.prospectName || 'Unknown'}`
        }),
      })
      const data = await response.json()
      if (data.success) {
        loadScriptHistory() // Refresh history
      }
    } catch (error) {
      console.error('Error saving to history:', error)
    }
  }

  const loadFromHistory = (historyItem: any) => {
    setSalesScriptForm(historyItem.formData)
    setGeneratedScript(historyItem.script)
    setScriptSuccess(true)
  }

  const deleteFromHistory = async (scriptId: string) => {
    try {
      const response = await fetch(`/api/sales-script-history?scriptId=${scriptId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        loadScriptHistory() // Refresh history
      }
    } catch (error) {
      console.error('Error deleting from history:', error)
    }
  }

  const parseScriptSections = (script: string) => {
    if (!script) return null
    
    const sections = []
    const lines = script.split('\n').filter(line => line.trim())
    let currentTopic = null
    let currentSubsection = null
    let subsectionContent = []
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Check for numbered topic (e.g., "1. INTRODUCTION")
      const topicMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/)
      if (topicMatch) {
        // Save previous topic if exists
        if (currentTopic && currentSubsection && subsectionContent.length > 0) {
          currentTopic.subsections[currentSubsection] = subsectionContent.join('\n').trim()
          subsectionContent = []
        }
        if (currentTopic) {
          sections.push(currentTopic)
        }
        
        // Start new topic
        currentTopic = {
          number: topicMatch[1],
          title: topicMatch[2],
          subsections: {}
        }
        currentSubsection = null
        continue
      }
      
      // Check for subsection (Visuals: or Dialogue:)
      const subsectionMatch = trimmedLine.match(/^(Visuals|Dialogue):\s*(.*)$/)
      if (subsectionMatch && currentTopic) {
        // Save previous subsection if exists
        if (currentSubsection && subsectionContent.length > 0) {
          currentTopic.subsections[currentSubsection] = subsectionContent.join('\n').trim()
        }
        
        // Start new subsection
        currentSubsection = subsectionMatch[1]
        subsectionContent = []
        
        // Add content after the colon if present
        if (subsectionMatch[2]) {
          subsectionContent.push(subsectionMatch[2])
        }
        continue
      }
      
      // Add content to current subsection
      if (currentTopic && currentSubsection) {
        subsectionContent.push(trimmedLine)
      }
    }
    
    // Save the last topic and subsection
    if (currentTopic) {
      if (currentSubsection && subsectionContent.length > 0) {
        currentTopic.subsections[currentSubsection] = subsectionContent.join('\n').trim()
      }
      sections.push(currentTopic)
    }
    
    return sections.length > 0 ? sections : null
  }

  const handleGenerateScript = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGeneratingScript(true)
    setScriptError('')
    setScriptSuccess(false)

    try {
      const response = await fetch('/api/generate-sales-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salesScriptForm),
      })

      const data = await response.json()
      console.log('Frontend received data:', data)

      if (data.success) {
        console.log('Script content received:', data.script)
        setGeneratedScript(data.script)
        setScriptSuccess(true)
        // Auto-save to history
        await saveToHistory(data.script, salesScriptForm)
      } else {
        setScriptError(data.error || 'Failed to generate sales script')
      }
    } catch (error) {
      console.error('Error generating sales script:', error)
      setScriptError('An error occurred while generating your sales script. Please try again.')
    } finally {
      setIsGeneratingScript(false)
    }
  }

  const handleCopyScript = () => {
    navigator.clipboard.writeText(generatedScript)
  }

  const handleDownloadScript = () => {
    const blob = new Blob([generatedScript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales_script_${salesScriptForm.prospectName}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePrintScript = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const scriptContent = generatePrintContent()
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sales Script - ${salesScriptForm.prospectName}</title>
          <style>
            ${generatePrintStyles()}
          </style>
        </head>
        <body>
          ${scriptContent}
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
  }

  const handleDownloadPDF = async () => {
    try {
      // For PDF generation, we'll use the browser's print to PDF functionality
      // as a workaround since we don't have a dedicated PDF library
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        const scriptContent = generatePrintContent()
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Sales Script - ${salesScriptForm.prospectName}</title>
            <style>
              ${generatePrintStyles()}
              @page {
                size: A4;
                margin: 1cm;
              }
            </style>
          </head>
          <body>
            ${scriptContent}
          </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        
        // Trigger print dialog where user can choose "Save as PDF"
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      // Fallback to regular download
      handleDownloadScript()
    }
  }

  const generatePrintContent = () => {
    const header = `
      <div class="header">
        <h1>Sales Script</h1>
        <div class="metadata">
          <p><strong>Prospect:</strong> ${salesScriptForm.prospectName}</p>
          <p><strong>Company:</strong> ${salesScriptForm.prospectCompany || 'N/A'}</p>
          <p><strong>Role:</strong> ${salesScriptForm.prospectRole || 'N/A'}</p>
          <p><strong>Your Product:</strong> ${salesScriptForm.yourProduct}</p>
          <p><strong>Your Company:</strong> ${salesScriptForm.yourCompany}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    `

    let scriptContent = ''
    if (parsedScript && parsedScript.length > 0) {
      scriptContent = parsedScript.map((topic, index) => `
        <div class="topic">
          <h2>${topic.number}. ${topic.title.toUpperCase()}</h2>
          ${Object.entries(topic.subsections).map(([subsectionType, content]) => `
            <div class="subsection">
              <h3>${subsectionType}:</h3>
              <div class="content">${content || `[${subsectionType} content will appear here...]`}</div>
            </div>
          `).join('')}
        </div>
      `).join('')
    } else {
      scriptContent = `<div class="raw-script"><pre>${generatedScript}</pre></div>`
    }

    const footer = `
      <div class="footer">
        <p>Generated by AI Sales Script Generator</p>
        <p>Word Count: ${scriptStats.wordCount} | Reading Time: ${scriptStats.readingTime} minutes</p>
      </div>
    `

    return header + scriptContent + footer
  }

  const generatePrintStyles = () => {
    return `
      * {
        font-family: 'Arial', sans-serif;
        line-height: 1.6;
        color: #333;
      }
      body {
        margin: 0;
        padding: 20px;
        background: white;
      }
      .header {
        border-bottom: 2px solid #333;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      .header h1 {
        margin: 0 0 20px 0;
        font-size: 28px;
        color: #000;
      }
      .metadata p {
        margin: 5px 0;
        font-size: 14px;
      }
      .topic {
        margin-bottom: 30px;
        page-break-inside: avoid;
      }
      .topic h2 {
        margin: 0 0 15px 0;
        font-size: 20px;
        color: #000;
        border-bottom: 1px solid #ccc;
        padding-bottom: 5px;
      }
      .subsection {
        margin-bottom: 15px;
      }
      .subsection h3 {
        margin: 0 0 10px 0;
        font-size: 16px;
        color: #555;
        font-weight: 600;
      }
      .content {
        background: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
        white-space: pre-wrap;
        font-size: 14px;
        border-left: 4px solid #007acc;
      }
      .raw-script pre {
        white-space: pre-wrap;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        background: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
        border-left: 4px solid #007acc;
      }
      .footer {
        border-top: 1px solid #ccc;
        padding-top: 20px;
        margin-top: 40px;
        text-align: center;
        font-size: 12px;
        color: #666;
      }
      @media print {
        body { margin: 0; }
        .topic { page-break-inside: avoid; }
        .header { page-break-after: avoid; }
      }
    `
  }

  return (
    <>
      <StructuredData />
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative py-24 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.1),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(236,72,153,0.1),transparent_70%)]" />

            <div className="container relative px-4 md:px-6">
              <div className="text-center max-w-4xl mx-auto">
                <div className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary mb-8 animate-pulse">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Sales Script Generator
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  Create Winning
                  <span className="block bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent animate-gradient">
                    Sales Scripts
                  </span>
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-12 leading-relaxed">
                  Generate personalized, conversion-focused sales scripts that help you close more deals.
                  AI analyzes your prospect data and creates compelling dialogue tailored to your needs.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="text-lg px-8 py-6 h-auto hover:scale-105 transition-transform duration-200"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    <Clock className="mr-2 w-5 h-5" />
                    {showHistory ? 'Hide' : 'Show'} History
                  </Button>
                  <Link href="/sales-ai">
                    <Button size="lg" className="text-lg px-8 py-6 h-auto hover:scale-105 transition-transform duration-200">
                      Back to Sales AI
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Main Content with History Sidebar */}
          <div className="container px-4 md:px-6 py-8">
            <div className="flex gap-8 max-w-7xl mx-auto">
              {/* History Sidebar */}
              {showHistory && (
                <div className="w-80 flex-shrink-0">
                  <Card className="p-6 bg-background/80 backdrop-blur-sm border border-border/50 sticky top-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        Script History
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadScriptHistory}
                        disabled={isLoadingHistory}
                        className="h-8 w-8 p-0"
                      >
                        {isLoadingHistory ? (
                          <Spinner className="w-4 h-4" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {historyError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {historyError}
                      </div>
                    )}

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {scriptHistory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No scripts generated yet</p>
                        </div>
                      ) : (
                        scriptHistory.map((item: any) => (
                          <div
                            key={item._id}
                            className="p-3 bg-muted/30 rounded-lg border border-border/30 hover:bg-muted/50 hover:border-border/50 transition-all duration-200 cursor-pointer group"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{item.label}</h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                    {item.version}
                                  </span>
                                  <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => loadFromHistory(item)}
                                  className="h-6 w-6 p-0 hover:bg-blue-100"
                                >
                                  <Eye className="w-3 h-3 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteFromHistory(item._id)}
                                  className="h-6 w-6 p-0 hover:bg-red-100"
                                >
                                  <Trash2 className="w-3 h-3 text-red-600" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {item.formData.prospectName && `For: ${item.formData.prospectName}`}
                              {item.formData.yourProduct && ` • ${item.formData.yourProduct}`}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {/* Main Form Content */}
              <div className="flex-1">
                <Card className="p-8 md:p-12 bg-background/80 backdrop-blur-sm border border-border/50">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-4">Generate Your Sales Script</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                      Fill in the details below and our AI will create a personalized sales script
                      tailored to your prospect and your offering.
                    </p>
                  </div>

                  {/* Error Alert */}
                  {scriptError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <p className="text-red-700 text-sm">{scriptError}</p>
                      <button
                        onClick={() => setScriptError("")}
                        className="ml-auto text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {/* Success Alert */}
                  {scriptSuccess && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <p className="text-green-700 text-sm font-medium">Sales script generated successfully!</p>
                    </div>
                  )}

                  <form onSubmit={handleGenerateScript} className="space-y-8">
                    {/* Prospect Information */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Users className="w-6 h-6 text-blue-500" />
                        <h3 className="text-xl font-semibold text-foreground">Prospect Information</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="prospectName" className="text-sm font-medium">Prospect Name *</label>
                          <Input
                            id="prospectName"
                            placeholder="John Smith"
                            value={salesScriptForm.prospectName}
                            onChange={(e) => setSalesScriptForm({...salesScriptForm, prospectName: e.target.value})}
                            required
                            disabled={isGeneratingScript}
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="prospectCompany" className="text-sm font-medium">Company</label>
                          <Input
                            id="prospectCompany"
                            placeholder="TechCorp Inc."
                            value={salesScriptForm.prospectCompany}
                            onChange={(e) => setSalesScriptForm({...salesScriptForm, prospectCompany: e.target.value})}
                            disabled={isGeneratingScript}
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="prospectRole" className="text-sm font-medium">Role</label>
                          <Input
                            id="prospectRole"
                            placeholder="CTO"
                            value={salesScriptForm.prospectRole}
                            onChange={(e) => setSalesScriptForm({...salesScriptForm, prospectRole: e.target.value})}
                            disabled={isGeneratingScript}
                            className="h-12"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Your Offering */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Target className="w-6 h-6 text-green-500" />
                        <h3 className="text-xl font-semibold text-foreground">Your Offering</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="yourProduct" className="text-sm font-medium">Product/Service *</label>
                          <Input
                            id="yourProduct"
                            placeholder="AI-powered CRM platform"
                            value={salesScriptForm.yourProduct}
                            onChange={(e) => setSalesScriptForm({...salesScriptForm, yourProduct: e.target.value})}
                            required
                            disabled={isGeneratingScript}
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="yourCompany" className="text-sm font-medium">Your Company *</label>
                          <Input
                            id="yourCompany"
                            placeholder="SalesTech Solutions"
                            value={salesScriptForm.yourCompany}
                            onChange={(e) => setSalesScriptForm({...salesScriptForm, yourCompany: e.target.value})}
                            required
                            disabled={isGeneratingScript}
                            className="h-12"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Palette className="w-6 h-6 text-purple-500" />
                        <h3 className="text-xl font-semibold text-foreground">Additional Details</h3>
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label htmlFor="keyBenefits" className="text-sm font-medium">Key Benefits</label>
                          <Textarea
                            id="keyBenefits"
                            placeholder="e.g., 40% increase in sales productivity, automated follow-ups, real-time analytics"
                            value={salesScriptForm.keyBenefits}
                            onChange={(e) => setSalesScriptForm({...salesScriptForm, keyBenefits: e.target.value})}
                            disabled={isGeneratingScript}
                            rows={3}
                            className="resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="objectionHandling" className="text-sm font-medium">Common Objections</label>
                          <Textarea
                            id="objectionHandling"
                            placeholder="e.g., budget concerns, current vendor satisfaction, implementation timeline"
                            value={salesScriptForm.objectionHandling}
                            onChange={(e) => setSalesScriptForm({...salesScriptForm, objectionHandling: e.target.value})}
                            disabled={isGeneratingScript}
                            rows={3}
                            className="resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="tone" className="text-sm font-medium">Desired Tone</label>
                          <Input
                            id="tone"
                            placeholder="professional, confident, consultative"
                            value={salesScriptForm.tone}
                            onChange={(e) => setSalesScriptForm({...salesScriptForm, tone: e.target.value})}
                            disabled={isGeneratingScript}
                            className="h-12"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 h-14 text-lg"
                      disabled={isGeneratingScript || !salesScriptForm.prospectName || !salesScriptForm.yourProduct || !salesScriptForm.yourCompany}
                    >
                      {isGeneratingScript ? (
                        <>
                          <Spinner className="w-5 h-5 mr-3" />
                          Generating Sales Script...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-5 h-5 mr-3" />
                          Generate Sales Script
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Generated Script Display */}
                  {generatedScript && (
                    <div className="mt-12 space-y-6">
                      {/* Success Banner */}
                      <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 animate-pulse" />
                        <div className="relative flex items-center justify-between p-6 bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-950/20 dark:to-blue-950/20 backdrop-blur-sm border border-green-200/50 dark:border-green-800/50 rounded-xl">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                              <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-foreground bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                                Sales Script Generated!
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                Your personalized sales script is ready to use
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowPreview(!showPreview)}
                              className="flex items-center gap-2 bg-background/80 hover:bg-background border-border/50 hover:border-purple-500/50 transition-all duration-200 hover:shadow-md"
                            >
                              {showPreview ? <EyeOff className="w-4 h-4 text-purple-500" /> : <Eye className="w-4 h-4 text-purple-500" />}
                              <span className="hidden sm:inline">{showPreview ? 'Hide' : 'Show'}</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCopyScript}
                              className="flex items-center gap-2 bg-background/80 hover:bg-background border-border/50 hover:border-primary/50 transition-all duration-200 hover:shadow-md"
                            >
                              <Copy className="w-4 h-4 text-blue-500" />
                              <span className="hidden sm:inline">Copy</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDownloadScript}
                              className="flex items-center gap-2 bg-background/80 hover:bg-background border-border/50 hover:border-green-500/50 transition-all duration-200 hover:shadow-md"
                            >
                              <Download className="w-4 h-4 text-green-500" />
                              <span className="hidden sm:inline">Download</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePrintScript}
                              className="flex items-center gap-2 bg-background/80 hover:bg-background border-border/50 hover:border-orange-500/50 transition-all duration-200 hover:shadow-md"
                            >
                              <Printer className="w-4 h-4 text-orange-500" />
                              <span className="hidden sm:inline">Print</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDownloadPDF}
                              className="flex items-center gap-2 bg-background/80 hover:bg-background border-border/50 hover:border-red-500/50 transition-all duration-200 hover:shadow-md"
                            >
                              <FileText className="w-4 h-4 text-red-500" />
                              <span className="hidden sm:inline">PDF</span>
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Script Statistics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 p-4 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                              <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Word Count</p>
                              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{scriptStats.wordCount}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 p-4 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                              <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Characters</p>
                              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{scriptStats.characterCount}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 p-4 rounded-lg border border-green-200/50 dark:border-green-800/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                              <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Reading Time</p>
                              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{scriptStats.readingTime}m</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Script Display */}
                      {showPreview && (
                        <div className="relative group">
                          {/* Decorative elements */}
                          <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-60 group-hover:opacity-80 transition-opacity duration-300 animate-pulse" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-300 animate-pulse" />
                          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-gradient-to-br from-green-400 to-teal-500 rounded-full opacity-50 group-hover:opacity-70 transition-opacity duration-300 animate-pulse" />

                          <div className="relative bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm border border-border/60 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                            {/* Header with code indicator */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-gradient-to-r from-muted/30 to-muted/10">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm animate-pulse"></div>
                                  <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm animate-pulse delay-75"></div>
                                  <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm animate-pulse delay-150"></div>
                                </div>
                                <span className="text-sm font-medium text-muted-foreground">Sales Script</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MessageSquare className="w-3 h-3" />
                                <span>Structured Content</span>
                              </div>
                            </div>

                            {/* Structured Content */}
                            <div className="p-6 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                              {parsedScript && parsedScript.length > 0 ? (
                                <div className="space-y-8">
                                  {parsedScript.map((topic, index) => (
                                    <div key={index} className="space-y-4">
                                      {/* Topic Header */}
                                      <div className="text-xl font-bold text-foreground mb-4">
                                        {topic.number}. {topic.title.toUpperCase()}
                                      </div>
                                      
                                      {/* Subsections */}
                                      {Object.entries(topic.subsections).map(([subsectionType, content]) => (
                                        <div key={subsectionType} className="ml-6 space-y-2">
                                          {/* Subsection Title */}
                                          <div className="text-lg font-semibold text-muted-foreground">
                                            {subsectionType}:
                                          </div>
                                          
                                          {/* Subsection Content */}
                                          <div className="ml-6 text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-black/50 p-4 rounded-lg border border-border/30">
                                            {content || `[${subsectionType} content will appear here...]`}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <pre className="whitespace-pre-wrap text-sm font-mono text-foreground leading-relaxed selection:bg-primary/20 selection:text-primary-foreground">
                                  {generatedScript}
                                </pre>
                              )}
                            </div>

                            {/* Footer with stats */}
                            <div className="px-6 py-3 border-t border-border/40 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-2">
                                <Target className="w-3 h-3" />
                                Ready for use
                              </span>
                              <span className="flex items-center gap-2">
                                <Users className="w-3 h-3" />
                                Structured script
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Enhanced Usage Tips */}
                      <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Target className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-yellow-500" />
                              Pro Tips for Success
                            </h4>
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                                <p className="text-sm text-muted-foreground">Practice the script to sound natural and confident when delivering</p>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                                <p className="text-sm text-muted-foreground">Customize the content based on your prospect's specific needs and pain points</p>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                                <p className="text-sm text-muted-foreground">Use the objection handling points to address common concerns proactively</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
