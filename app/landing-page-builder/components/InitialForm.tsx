"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Sparkles, ArrowRight } from "lucide-react"

interface BusinessDetails {
    businessName: string
    targetAudience: string
    businessDescription: string
    colorScheme: string
    logo: File | null
}

interface InitialFormProps {
    onSubmit: (details: BusinessDetails) => void
}

export default function InitialForm({ onSubmit }: InitialFormProps) {
    const [businessName, setBusinessName] = useState("")
    const [targetAudience, setTargetAudience] = useState("")
    const [businessDescription, setBusinessDescription] = useState("")
    const [colorScheme, setColorScheme] = useState("blue")
    const [logo, setLogo] = useState<File | null>(null)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit({
            businessName,
            targetAudience,
            businessDescription,
            colorScheme,
            logo,
        })
    }

    return (
        <div className="flex overflow-hidden bg-background">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 p-8 lg:p-12 xl:p-16 overflow-y-auto flex flex-col justify-center bg-background">
                <div className="max-w-xl mx-auto w-full py-8">
                    <div className="mb-8">
                        <div className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-sm font-medium text-primary mb-6">
                            <Sparkles className="w-4 h-4 mr-2" />
                            AI-Powered Builder
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight text-foreground">
                            Let's Build Your <br />
                            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Dream Website</span>
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Describe your business and we'll generate a production-ready React application for you in seconds.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Business Name */}
                        <div className="space-y-2">
                            <Label htmlFor="businessName" className="text-base font-medium">
                                Business Name
                            </Label>
                            <Input
                                id="businessName"
                                placeholder="e.g., TechStart Solutions"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                required
                                className="h-12 text-base"
                            />
                        </div>

                        {/* Target Audience */}
                        <div className="space-y-2">
                            <Label htmlFor="targetAudience" className="text-base font-medium">
                                Target Audience
                            </Label>
                            <Input
                                id="targetAudience"
                                placeholder="e.g., Small business owners, millennials"
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                                className="h-12 text-base"
                            />
                        </div>

                        {/* Business Description */}
                        <div className="space-y-2">
                            <Label htmlFor="businessDescription" className="text-base font-medium">
                                Business Description
                            </Label>
                            <Textarea
                                id="businessDescription"
                                placeholder="Describe your business, services, and unique value proposition..."
                                value={businessDescription}
                                onChange={(e) => setBusinessDescription(e.target.value)}
                                required
                                className="min-h-[140px] text-base resize-none p-4"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Color Scheme */}
                            <div className="space-y-2">
                                <Label htmlFor="colorScheme" className="text-base font-medium">
                                    Color Scheme
                                </Label>
                                <select
                                    id="colorScheme"
                                    value={colorScheme}
                                    onChange={(e) => setColorScheme(e.target.value)}
                                    className="w-full h-12 px-4 rounded-md border border-input bg-background text-base focus:border-ring focus:ring-ring outline-none"
                                >
                                    <option value="blue">Blue (Trust)</option>
                                    <option value="green">Green (Growth)</option>
                                    <option value="purple">Purple (Creative)</option>
                                    <option value="red">Red (Bold)</option>
                                    <option value="orange">Orange (Friendly)</option>
                                    <option value="teal">Teal (Modern)</option>
                                    <option value="slate">Slate (Minimal)</option>
                                </select>
                            </div>

                            {/* Logo Upload */}
                            <div className="space-y-2">
                                <Label htmlFor="logo" className="text-base font-medium">
                                    Logo (Optional)
                                </Label>
                                <div className="relative">
                                    <input
                                        id="logo"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setLogo(e.target.files?.[0] || null)}
                                        className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 h-12 pt-1.5 bg-background"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg transition-all duration-200 mt-4"
                        >
                            Start Building
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </form>
                </div>
            </div>

            {/* Right Side - Visuals */}
            <div className="hidden lg:block w-1/2 bg-muted relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-10 dark:opacity-5"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20"></div>

                <div className="relative h-full flex flex-col items-center justify-center p-12 text-center">
                    <div className="bg-card/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl max-w-lg border border-border">
                        <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6 mx-auto">
                            <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-4">
                            From Idea to Reality
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            "I just described my SaaS idea and within seconds I had a fully functional landing page. It's like magic!"
                        </p>
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
                            <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
