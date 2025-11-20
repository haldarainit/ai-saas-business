"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import StructuredData from "@/components/structured-data"
import { ArrowRight, MessageSquare, AlertCircle, CheckCircle, Copy, Download, Users, Target, Palette } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

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

      if (data.success) {
        setGeneratedScript(data.script)
        setScriptSuccess(true)
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
                <div className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary mb-8">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Sales Script Generator
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  Create Winning
                  <span className="block bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
                    Sales Scripts
                  </span>
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-12 leading-relaxed">
                  Generate personalized, conversion-focused sales scripts that help you close more deals.
                  AI analyzes your prospect data and creates compelling dialogue tailored to your needs.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto">
                    <Target className="mr-2 w-5 h-5" />
                    How It Works
                  </Button>
                  <Link href="/sales-ai">
                    <Button size="lg" className="text-lg px-8 py-6 h-auto">
                      Back to Sales AI
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Form Section */}
          <section className="py-24 bg-muted/30">
            <div className="container px-4 md:px-6">
              <div className="max-w-4xl mx-auto">
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
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
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
                          <div className="flex gap-2">
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
                          </div>
                        </div>
                      </div>

                      {/* Script Display */}
                      <div className="relative group">
                        {/* Decorative elements */}
                        <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-gradient-to-br from-green-400 to-teal-500 rounded-full opacity-50 group-hover:opacity-70 transition-opacity duration-300" />

                        <div className="relative bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm border border-border/60 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                          {/* Header with code indicator */}
                          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-gradient-to-r from-muted/30 to-muted/10">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                                <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                              </div>
                              <span className="text-sm font-medium text-muted-foreground">Sales Script</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MessageSquare className="w-3 h-3" />
                              <span>Generated Content</span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-6 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                            <pre className="whitespace-pre-wrap text-sm font-mono text-foreground leading-relaxed selection:bg-primary/20 selection:text-primary-foreground">
                              {generatedScript}
                            </pre>
                          </div>

                          {/* Footer with stats */}
                          <div className="px-6 py-3 border-t border-border/40 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <Target className="w-3 h-3" />
                              Ready for use
                            </span>
                            <span className="flex items-center gap-2">
                              <Users className="w-3 h-3" />
                              Personalized script
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Usage Tips */}
                      <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 p-4 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Target className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-foreground mb-1">Pro Tips for Success</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li>• Practice the script to sound natural and confident</li>
                              <li>• Customize the content based on your prospect's specific needs</li>
                              <li>• Use the objection handling points to address common concerns</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  )
}
