"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import StructuredData from "@/components/structured-data"
import { ArrowRight, Monitor, Sparkles, Download, Eye, Wand2, CheckCircle, AlertCircle, Target, Palette, Users } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function LandingPageBuilder() {
  const [businessName, setBusinessName] = useState("")
  const [businessDescription, setBusinessDescription] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [colorScheme, setColorScheme] = useState("blue")
  const [generatedHTML, setGeneratedHTML] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90))
    }, 200)

    try {
      const response = await fetch('/api/generate-landing-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName,
          businessDescription,
          targetAudience,
          colorScheme,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedHTML(data.html)
        setProgress(100)
        setSuccess(true)
        // Delay showing preview to allow success animation
        setTimeout(() => {
          setShowPreview(true)
          setSuccess(false)
        }, 1000)
      } else {
        setError(data.error || 'Failed to generate landing page')
        setProgress(0)
      }
    } catch (error) {
      console.error('Error generating landing page:', error)
      setError('An error occurred while generating your landing page. Please try again.')
      setProgress(0)
    } finally {
      clearInterval(progressInterval)
      setTimeout(() => setIsLoading(false), 1000)
    }
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
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(36,101,237,0.1),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,119,198,0.1),transparent_70%)]" />

            <div className="container relative px-4 md:px-6">
              <div className="text-center max-w-4xl mx-auto mb-16">
                <div className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary mb-8">
                  <Monitor className="w-4 h-4 mr-2" />
                  Landing Page Builder
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  Build Your Perfect
                  <span className="block bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                    Landing Page
                  </span>
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-12 leading-relaxed">
                  Tell us about your business and we'll create a stunning, high-converting landing page
                  tailored to your needs. No coding required.
                </p>
              </div>
            </div>
          </section>

          {/* Form Section */}
          <section className="py-24">
            <div className="container px-4 md:px-6">
              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-background to-background/80 backdrop-blur-sm border border-border/50 rounded-3xl p-8 md:p-12 shadow-2xl">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 px-4 py-2 text-sm font-medium text-blue-600 mb-6">
                      <Wand2 className="w-4 h-4 mr-2" />
                      AI-Powered Builder
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Create Your Landing Page</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                      Fill out the details below and our AI will create a stunning, conversion-optimized landing page
                      tailored to your business needs.
                    </p>
                  </div>

                  {/* Error Alert */}
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <p className="text-red-700 text-sm">{error}</p>
                      <button
                        onClick={() => setError("")}
                        className="ml-auto text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {/* Success Animation */}
                  {success && (
                    <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <CheckCircle className="w-8 h-8 text-green-500 animate-pulse" />
                        <span className="text-green-700 font-medium">Landing page generated successfully!</span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2 mb-2">
                        <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                      </div>
                      <p className="text-green-600 text-sm">Opening preview...</p>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {isLoading && !success && (
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Spinner className="w-5 h-5 text-blue-500" />
                        <span className="text-sm font-medium">Generating your landing page...</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        This usually takes 10-15 seconds
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Business Name */}
                      <div className="space-y-3">
                        <label htmlFor="business-name" className="text-lg font-semibold text-foreground flex items-center">
                          <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
                          Business Name
                        </label>
                        <Input
                          id="business-name"
                          placeholder="e.g., TechStart Solutions"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full text-lg py-6 px-4 rounded-xl border-2 border-border/50 focus:border-blue-500/50 transition-all duration-200 hover:border-blue-500/30"
                          required
                          disabled={isLoading}
                        />
                      </div>

                      {/* Target Audience */}
                      <div className="space-y-3">
                        <label htmlFor="target-audience" className="text-lg font-semibold text-foreground flex items-center">
                          <Users className="w-5 h-5 mr-2 text-green-500" />
                          Target Audience
                        </label>
                        <Input
                          id="target-audience"
                          placeholder="e.g., Small business owners, millennials"
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          className="w-full text-lg py-6 px-4 rounded-xl border-2 border-border/50 focus:border-green-500/50 transition-all duration-200 hover:border-green-500/30"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Business Description */}
                    <div className="space-y-3">
                      <label htmlFor="business-description" className="text-lg font-semibold text-foreground flex items-center">
                        <Monitor className="w-5 h-5 mr-2 text-purple-500" />
                        Business Description
                      </label>
                      <Textarea
                        id="business-description"
                        placeholder="Describe your business, what you do, your unique value proposition, and what makes you different from competitors. The more details you provide, the better your landing page will be!"
                        value={businessDescription}
                        onChange={(e) => setBusinessDescription(e.target.value)}
                        className="w-full text-lg py-6 px-4 rounded-xl border-2 border-border/50 focus:border-purple-500/50 transition-all duration-200 hover:border-purple-500/30 min-h-[140px] resize-none"
                        required
                        disabled={isLoading}
                      />
                      <p className="text-sm text-muted-foreground">
                        💡 Tip: Include your main services, target market, and key benefits
                      </p>
                    </div>

                    {/* Color Scheme */}
                    <div className="space-y-3">
                      <label htmlFor="color-scheme" className="text-lg font-semibold text-foreground flex items-center">
                        <Palette className="w-5 h-5 mr-2 text-orange-500" />
                        Preferred Color Scheme
                      </label>
                      <select
                        id="color-scheme"
                        value={colorScheme}
                        onChange={(e) => setColorScheme(e.target.value)}
                        className="w-full text-lg py-6 px-4 rounded-xl border-2 border-border/50 focus:border-orange-500/50 transition-all duration-200 hover:border-orange-500/30 bg-background"
                        disabled={isLoading}
                      >
                        <option value="blue">Blue (Professional & Trust)</option>
                        <option value="green">Green (Growth & Nature)</option>
                        <option value="purple">Purple (Creativity & Luxury)</option>
                        <option value="red">Red (Energy & Passion)</option>
                        <option value="orange">Orange (Friendly & Approachable)</option>
                        <option value="teal">Teal (Modern & Clean)</option>
                      </select>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                      <Button
                        type="submit"
                        size="lg"
                        className="flex-1 text-xl py-8 h-auto rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        disabled={isLoading || !businessName.trim() || !businessDescription.trim()}
                      >
                        {isLoading ? (
                          <>
                            <Spinner className="w-6 h-6 mr-3" />
                            Creating Your Website...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-6 h-6 mr-3" />
                            Generate Landing Page
                            <ArrowRight className="ml-3 w-6 h-6" />
                          </>
                        )}
                      </Button>

                      <Link href="/get-started" className="flex-1">
                        <Button
                          variant="outline"
                          size="lg"
                          className="w-full text-xl py-8 h-auto rounded-xl border-2 hover:bg-gray-50 transition-all duration-200"
                          disabled={isLoading}
                        >
                          Back to Features
                        </Button>
                      </Link>
                    </div>
                  </form>

                  {/* Preview Dialog */}
                  <Dialog open={showPreview} onOpenChange={setShowPreview}>
                    <DialogContent className="max-w-[2560px] h-[90vh] p-0">
                      <div className="flex flex-col h-full">
                        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Eye className="w-5 h-5 text-blue-500" />
                                Landing Page Preview
                              </DialogTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                Preview your AI-generated landing page below
                              </p>
                            </div>
                            <div className="flex gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newWindow = window.open('', '_blank')
                                  if (newWindow) {
                                    newWindow.document.write(generatedHTML)
                                    newWindow.document.close()
                                  }
                                }}
                                className="flex items-center gap-2"
                              >
                                <Monitor className="w-4 h-4" />
                                Open in New Tab
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const blob = new Blob([generatedHTML], { type: 'text/html' })
                                  const url = URL.createObjectURL(blob)
                                  const a = document.createElement('a')
                                  a.href = url
                                  a.download = `${businessName.replace(/\s+/g, '_')}_landing_page.html`
                                  document.body.appendChild(a)
                                  a.click()
                                  document.body.removeChild(a)
                                  URL.revokeObjectURL(url)
                                }}
                                className="flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                              >
                                <Download className="w-4 h-4" />
                                Download HTML
                              </Button>
                            </div>
                          </div>
                        </DialogHeader>
                        <div className="flex-1 p-4 bg-background">
                          <div className="bg-card rounded-lg shadow-lg h-full overflow-hidden border border-border">
                            <iframe
                              srcDoc={generatedHTML}
                              className="w-full h-full border-0 rounded-lg"
                              title="Landing Page Preview"
                              sandbox="allow-same-origin"
                            />
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Features Preview */}
                  <div className="mt-12 pt-8 border-t border-border/50">
                    <h3 className="text-lg font-semibold mb-4 text-center">What You'll Get</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                      <div className="space-y-2">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                          <Monitor className="w-6 h-6 text-blue-500" />
                        </div>
                        <h4 className="font-medium">Mobile Responsive</h4>
                        <p className="text-sm text-muted-foreground">Perfect on all devices</p>
                      </div>
                      <div className="space-y-2">
                        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                          <Sparkles className="w-6 h-6 text-green-500" />
                        </div>
                        <h4 className="font-medium">AI Optimized</h4>
                        <p className="text-sm text-muted-foreground">Conversion-focused design</p>
                      </div>
                      <div className="space-y-2">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto">
                          <ArrowRight className="w-6 h-6 text-purple-500" />
                        </div>
                        <h4 className="font-medium">Instant Results</h4>
                        <p className="text-sm text-muted-foreground">Ready in minutes</p>
                      </div>
                    </div>
                  </div>
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
