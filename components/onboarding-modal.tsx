"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    ArrowLeft,
    ArrowRight,
    Loader2,
    Sparkles,
} from "lucide-react"

interface OnboardingModalProps {
    isOpen: boolean
    onClose: () => void
}

interface FormData {
    fullName: string
    companyName: string
    companyWebsite: string
    noWebsite: boolean
    companySize: string
    industry: string
    industryOther: string
    primaryMarket: string
    role: string
    roleOther: string
    challenges: string[]
}

const industries = [
    "Retail",
    "Manufacturing",
    "Services",
    "EdTech",
    "Healthcare",
    "Real Estate",
    "Agency / Consulting",
    "SaaS / Software",
    "E-commerce",
    "Finance",
    "Other",
]

const companySizes = [
    { value: "solo", label: "Solo" },
    { value: "2-10", label: "2–10" },
    { value: "11-50", label: "11–50" },
    { value: "51-200", label: "51–200" },
    { value: "200+", label: "200+" },
]

const markets = [
    { value: "local", label: "Local" },
    { value: "pan-india", label: "PAN India" },
    { value: "international", label: "International" },
]

const roles = [
    "Founder / CEO",
    "Business Owner",
    "Manager",
    "Marketing",
    "Sales",
    "Operations",
    "Developer",
    "Other",
]

const challenges = [
    { id: "manual", label: "Manual tasks" },
    { id: "leads", label: "Lead tracking" },
    { id: "invoicing", label: "Invoicing" },
    { id: "inventory", label: "Inventory" },
    { id: "reporting", label: "Analytics" },
    { id: "hr", label: "HR / Payroll" },
]

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState<FormData>({
        fullName: "",
        companyName: "",
        companyWebsite: "",
        noWebsite: false,
        companySize: "",
        industry: "",
        industryOther: "",
        primaryMarket: "",
        role: "",
        roleOther: "",
        challenges: [],
    })

    const totalSteps = 2

    const handleNext = () => {
        if (step < totalSteps) setStep(step + 1)
    }

    const handleBack = () => {
        if (step > 1) setStep(step - 1)
    }

    const toggleChallenge = (challengeId: string) => {
        setFormData(prev => ({
            ...prev,
            challenges: prev.challenges.includes(challengeId)
                ? prev.challenges.filter(c => c !== challengeId)
                : [...prev.challenges, challengeId]
        }))
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const response = await fetch("/api/onboarding", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    companyName: formData.companyName,
                    companyWebsite: formData.noWebsite ? "No website" : formData.companyWebsite,
                    companySize: companySizes.find(s => s.value === formData.companySize)?.label || formData.companySize,
                    industry: formData.industry === "Other" ? formData.industryOther : formData.industry,
                    primaryMarket: markets.find(m => m.value === formData.primaryMarket)?.label || formData.primaryMarket,
                    role: formData.role === "Other" ? formData.roleOther : formData.role,
                    challenges: formData.challenges.map(c => challenges.find(ch => ch.id === c)?.label || c),
                }),
            })

            if (response.ok) {
                // Database has been updated by the API, just close and redirect
                onClose()
                router.push("/get-started")
            }
        } catch (error) {
            console.error("Error submitting onboarding:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const isStep1Valid = formData.fullName.trim() !== "" && formData.companySize !== "" &&
        formData.industry !== "" && (formData.industry !== "Other" || formData.industryOther.trim() !== "")
    const isStep2Valid = formData.primaryMarket !== "" && formData.role !== "" &&
        (formData.role !== "Other" || formData.roleOther.trim() !== "") && formData.challenges.length > 0

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 overflow-hidden bg-gradient-to-b from-background to-muted/20" showCloseButton={false}>
                {/* Visually hidden title for accessibility */}
                <DialogTitle className="sr-only">Welcome to Business AI - Onboarding</DialogTitle>

                {/* Compact Header */}
                <div className="bg-gradient-to-r from-primary via-primary to-primary/80 px-5 py-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Welcome to Business AI</h2>
                            <p className="text-xs text-white/80">Quick setup • Step {step} of {totalSteps}</p>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="px-5 pt-3">
                    <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: `${(step / totalSteps) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                {/* Form Content */}
                <div className="px-5 py-4 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Basic Info + Company Details */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                {/* Row 1: Name and Company */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="fullName" className="text-sm font-medium">
                                            Full Name <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="fullName"
                                            placeholder="Your name"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            className="h-10"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="companyName" className="text-sm font-medium">
                                            Company Name
                                        </Label>
                                        <Input
                                            id="companyName"
                                            placeholder="Your company"
                                            value={formData.companyName}
                                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                            className="h-10"
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Website */}
                                {!formData.noWebsite && (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="companyWebsite" className="text-sm font-medium">
                                            Company Website
                                        </Label>
                                        <Input
                                            id="companyWebsite"
                                            placeholder="https://yourcompany.com"
                                            value={formData.companyWebsite}
                                            onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                                            className="h-10"
                                        />
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="noWebsite"
                                        checked={formData.noWebsite}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, noWebsite: checked as boolean, companyWebsite: "" })
                                        }
                                    />
                                    <Label htmlFor="noWebsite" className="text-xs text-muted-foreground cursor-pointer">
                                        No website yet
                                    </Label>
                                </div>

                                {/* Company Size - Horizontal */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        Company Size <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="flex flex-wrap gap-2">
                                        {companySizes.map((size) => (
                                            <button
                                                key={size.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, companySize: size.value })}
                                                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${formData.companySize === size.value
                                                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                                                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                                                    }`}
                                            >
                                                {size.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Industry Dropdown */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium">
                                            Industry <span className="text-destructive">*</span>
                                        </Label>
                                        <Select
                                            value={formData.industry}
                                            onValueChange={(value) => setFormData({ ...formData, industry: value })}
                                        >
                                            <SelectTrigger className="h-10">
                                                <SelectValue placeholder="Select industry" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {industries.map((ind) => (
                                                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {formData.industry === "Other" && (
                                        <div className="space-y-1.5">
                                            <Label htmlFor="industryOther" className="text-sm font-medium">
                                                Specify Industry
                                            </Label>
                                            <Input
                                                id="industryOther"
                                                placeholder="Your industry"
                                                value={formData.industryOther}
                                                onChange={(e) => setFormData({ ...formData, industryOther: e.target.value })}
                                                className="h-10"
                                            />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Market, Role & Challenges */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                {/* Primary Market - Horizontal */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        Primary Market <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="flex gap-2">
                                        {markets.map((market) => (
                                            <button
                                                key={market.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, primaryMarket: market.value })}
                                                className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${formData.primaryMarket === market.value
                                                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                                                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                                                    }`}
                                            >
                                                {market.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Role */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium">
                                            Your Role <span className="text-destructive">*</span>
                                        </Label>
                                        <Select
                                            value={formData.role}
                                            onValueChange={(value) => setFormData({ ...formData, role: value })}
                                        >
                                            <SelectTrigger className="h-10">
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map((role) => (
                                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {formData.role === "Other" && (
                                        <div className="space-y-1.5">
                                            <Label htmlFor="roleOther" className="text-sm font-medium">
                                                Specify Role
                                            </Label>
                                            <Input
                                                id="roleOther"
                                                placeholder="Your role"
                                                value={formData.roleOther}
                                                onChange={(e) => setFormData({ ...formData, roleOther: e.target.value })}
                                                className="h-10"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Challenges - Horizontal Grid */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        Biggest Challenges <span className="text-destructive">*</span>
                                        <span className="text-xs text-muted-foreground ml-2">(Select all that apply)</span>
                                    </Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {challenges.map((challenge) => (
                                            <div
                                                key={challenge.id}
                                                onClick={() => toggleChallenge(challenge.id)}
                                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all cursor-pointer ${formData.challenges.includes(challenge.id)
                                                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                                                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                                                    }`}
                                            >
                                                <Checkbox
                                                    checked={formData.challenges.includes(challenge.id)}
                                                    className="pointer-events-none h-4 w-4"
                                                />
                                                <span className="font-medium">{challenge.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between px-5 py-4 border-t bg-muted/30">
                    {step > 1 ? (
                        <Button variant="outline" onClick={handleBack} className="gap-2 h-10">
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                    ) : (
                        <div />
                    )}
                    {step < totalSteps ? (
                        <Button
                            onClick={handleNext}
                            disabled={step === 1 && !isStep1Valid}
                            className="gap-2 h-10 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                        >
                            Continue
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={!isStep2Valid || isSubmitting}
                            className="gap-2 h-10 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary min-w-[140px]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Get Started
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
