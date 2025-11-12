"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import StructuredData from "@/components/structured-data"
import { ArrowRight, Monitor, Sparkles } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function LandingPageBuilder() {
  const [businessName, setBusinessName] = useState("")
  const [businessDescription, setBusinessDescription] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    console.log("Business Name:", businessName)
    console.log("Business Description:", businessDescription)
    // You can add your form submission logic here
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
              <div className="max-w-2xl mx-auto">
                <div className="bg-gradient-to-br from-background to-background/80 backdrop-blur-sm border border-border/50 rounded-3xl p-12 shadow-2xl">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-4">Create Your Landing Page</h2>
                    <p className="text-muted-foreground">
                      Fill out the details below and we'll generate a beautiful landing page for your business.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-3">
                      <label htmlFor="business-name" className="text-lg font-semibold text-foreground flex items-center">
                        <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
                        Business Name
                      </label>
                      <Input
                        id="business-name"
                        placeholder="Enter your business name"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full text-lg py-6 px-4 rounded-xl border-2 border-border/50 focus:border-primary/50 transition-colors"
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <label htmlFor="business-description" className="text-lg font-semibold text-foreground flex items-center">
                        <Monitor className="w-5 h-5 mr-2 text-cyan-500" />
                        Describe Your Business
                      </label>
                      <Textarea
                        id="business-description"
                        placeholder="Tell us about your business, what you do, who your target audience is, and what makes you unique..."
                        value={businessDescription}
                        onChange={(e) => setBusinessDescription(e.target.value)}
                        className="w-full text-lg py-6 px-4 rounded-xl border-2 border-border/50 focus:border-primary/50 transition-colors min-h-[160px] resize-none"
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        The more details you provide, the better we can customize your landing page.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <Button
                        type="submit"
                        size="lg"
                        className="flex-1 text-xl py-8 h-auto rounded-xl"
                      >
                        Create My Website
                        <ArrowRight className="ml-3 w-6 h-6" />
                      </Button>

                      <Link href="/get-started" className="flex-1">
                        <Button
                          variant="outline"
                          size="lg"
                          className="w-full text-xl py-8 h-auto rounded-xl"
                        >
                          Back to Features
                        </Button>
                      </Link>
                    </div>
                  </form>

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
