"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

// Data from existing onboarding
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

export default function OnboardingPage() {
    const router = useRouter()
    const { user, loading: authLoading, refreshUser } = useAuth()
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isChecking, setIsChecking] = useState(true)
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

    // Check if user has already completed onboarding
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                // Not logged in, redirect to home
                router.push("/")
            } else if (user.onboardingCompleted) {
                // Already completed onboarding, redirect to get-started
                router.push("/get-started")
            } else {
                // User needs to complete onboarding
                setIsChecking(false)
                // Pre-fill name if available
                if (user.name) {
                    setFormData(prev => ({ ...prev, fullName: user.name || "" }))
                }
            }
        }
    }, [user, authLoading, router])

    // Show loading while checking auth status
    if (authLoading || isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    const totalSteps = 4

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
                // Refresh user data to update onboardingCompleted status
                await refreshUser()
                router.push("/get-started")
            }
        } catch (error) {
            console.error("Error submitting onboarding:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Validation
    const isStep1Valid = formData.fullName.trim() !== ""
    const isStep2Valid = formData.companySize !== "" && formData.industry !== "" &&
        (formData.industry !== "Other" || formData.industryOther.trim() !== "")
    const isStep3Valid = formData.primaryMarket !== "" && formData.role !== "" &&
        (formData.role !== "Other" || formData.roleOther.trim() !== "")
    const isStep4Valid = formData.challenges.length > 0

    const canProceed = () => {
        switch (step) {
            case 1: return isStep1Valid
            case 2: return isStep2Valid
            case 3: return isStep3Valid
            case 4: return isStep4Valid
            default: return false
        }
    }

    // Animation variants
    const pageVariants = {
        initial: { opacity: 0, x: 50 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -50 }
    }

    return (
        <div className="min-h-screen bg-background dark:bg-[#0a0d14] flex">
            {/* Left Side - Form Content */}
            <div className="flex-1 flex flex-col px-8 lg:px-16 py-8">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <Image
                        src="/logo.png"
                        alt="Business AI"
                        width={60}
                        height={60}
                        className="dark:brightness-0 dark:invert"
                    />
                </motion.div>

                {/* Form Content Area */}
                <div className="flex-1 flex flex-col justify-center max-w-xl">
                    {/* Step Indicator */}
                    <motion.p
                        key={`step-indicator-${step}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-muted-foreground text-sm tracking-wider mb-6"
                    >
                        {step === 1 ? "" : `STEP ${step - 1} OF ${totalSteps - 1}`}
                    </motion.p>

                    <AnimatePresence mode="wait">
                        {/* Step 1: Welcome */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h1 className="text-3xl font-semibold text-foreground mb-2">
                                        Welcome to Business AI
                                    </h1>
                                    <p className="text-muted-foreground">
                                        Let&apos;s personalize your experience
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-foreground text-sm">
                                            Full name <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Your name"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-foreground text-sm">
                                            Company name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Acme Corp"
                                            value={formData.companyName}
                                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                            className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>

                                    {!formData.noWebsite && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-2"
                                        >
                                            <label className="text-foreground text-sm">
                                                Company website
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g., acme.com"
                                                value={formData.companyWebsite}
                                                onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                                                className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                                            />
                                            <p className="text-muted-foreground text-xs">
                                                This helps us personalize your workspace.
                                            </p>
                                        </motion.div>
                                    )}

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.noWebsite}
                                            onChange={(e) => setFormData({ ...formData, noWebsite: e.target.checked, companyWebsite: "" })}
                                            className="w-4 h-4 rounded border-border bg-muted text-primary focus:ring-0 focus:ring-offset-0"
                                        />
                                        <span className="text-muted-foreground text-sm">No company website</span>
                                    </label>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Company Details */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h1 className="text-3xl font-semibold text-foreground mb-2">
                                        Tell us about your company
                                    </h1>
                                    <p className="text-muted-foreground">
                                        This helps us recommend the right tools for you.
                                    </p>
                                </div>

                                {/* Company Size */}
                                <div className="space-y-3">
                                    <label className="text-foreground text-sm">
                                        Company size <span className="text-red-400">*</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {companySizes.map((size) => (
                                            <motion.button
                                                key={size.value}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setFormData({ ...formData, companySize: size.value })}
                                                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${formData.companySize === size.value
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border text-muted-foreground hover:border-primary/50"
                                                    }`}
                                            >
                                                {size.label}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Industry */}
                                <div className="space-y-3">
                                    <label className="text-foreground text-sm">
                                        Industry <span className="text-red-400">*</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {industries.map((ind) => (
                                            <motion.button
                                                key={ind}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setFormData({ ...formData, industry: ind })}
                                                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${formData.industry === ind
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border text-muted-foreground hover:border-primary/50"
                                                    }`}
                                            >
                                                {ind}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Other Industry Input */}
                                {formData.industry === "Other" && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="space-y-2"
                                    >
                                        <label className="text-foreground text-sm">
                                            Specify your industry
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Your industry"
                                            value={formData.industryOther}
                                            onChange={(e) => setFormData({ ...formData, industryOther: e.target.value })}
                                            className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {/* Step 3: Role & Market */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h1 className="text-3xl font-semibold text-foreground mb-2">
                                        Which best describes your role?
                                    </h1>
                                    <p className="text-muted-foreground">
                                        This helps highlight what&apos;s most useful for you.
                                    </p>
                                </div>

                                {/* Role Selection */}
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {roles.map((role) => (
                                            <motion.button
                                                key={role}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setFormData({ ...formData, role })}
                                                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${formData.role === role
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border text-muted-foreground hover:border-primary/50"
                                                    }`}
                                            >
                                                {role}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Other Role Input */}
                                {formData.role === "Other" && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="space-y-2"
                                    >
                                        <input
                                            type="text"
                                            placeholder="Specify your role"
                                            value={formData.roleOther}
                                            onChange={(e) => setFormData({ ...formData, roleOther: e.target.value })}
                                            className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </motion.div>
                                )}

                                {/* Primary Market */}
                                <div className="space-y-3 pt-4">
                                    <label className="text-foreground text-sm">
                                        Primary market <span className="text-red-400">*</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {markets.map((market) => (
                                            <motion.button
                                                key={market.value}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setFormData({ ...formData, primaryMarket: market.value })}
                                                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${formData.primaryMarket === market.value
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border text-muted-foreground hover:border-primary/50"
                                                    }`}
                                            >
                                                {market.label}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 4: Challenges */}
                        {step === 4 && (
                            <motion.div
                                key="step4"
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h1 className="text-3xl font-semibold text-foreground mb-2">
                                        Which goals do you want to focus on?
                                    </h1>
                                    <p className="text-muted-foreground">
                                        What you pick helps set you up for success. Select all that apply.
                                    </p>
                                </div>

                                {/* Challenges Selection */}
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {challenges.map((challenge) => (
                                            <motion.button
                                                key={challenge.id}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => toggleChallenge(challenge.id)}
                                                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${formData.challenges.includes(challenge.id)
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border text-muted-foreground hover:border-primary/50"
                                                    }`}
                                            >
                                                {challenge.label}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-3 mt-10"
                    >
                        {step > 1 && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleBack}
                                className="px-6 py-3 text-foreground border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back
                            </motion.button>
                        )}

                        {step < totalSteps ? (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleNext}
                                disabled={!canProceed()}
                                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${canProceed()
                                    ? "bg-muted text-foreground hover:bg-muted/80"
                                    : "bg-muted/50 text-muted-foreground cursor-not-allowed"
                                    }`}
                            >
                                Continue
                                <ChevronRight className="w-4 h-4" />
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmit}
                                disabled={!canProceed() || isSubmitting}
                                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${canProceed() && !isSubmitting
                                    ? "bg-primary text-white hover:bg-primary/90"
                                    : "bg-muted/50 text-muted-foreground cursor-not-allowed"
                                    }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Setting up...
                                    </>
                                ) : (
                                    <>
                                        Submit
                                    </>
                                )}
                            </motion.button>
                        )}

                    </motion.div>
                </div>
            </div>

            {/* Right Side - SaaS Style Illustration */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="hidden lg:flex w-[40%] items-center justify-center p-8 relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-900/50 dark:to-blue-900/20"
            >
                <div className="relative w-full h-full max-w-md max-h-[500px] flex items-center justify-center">

                    {/* Background Circle Decoration with Content */}
                    <div className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-slate-100 to-blue-100/80 dark:from-slate-800/80 dark:to-blue-900/50 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center overflow-hidden">
                        {/* Grid pattern inside circle */}
                        <div className="absolute inset-0 opacity-20">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <defs>
                                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-400 dark:text-slate-500" />
                                    </pattern>
                                </defs>
                                <rect width="100" height="100" fill="url(#grid)" />
                            </svg>
                        </div>
                        {/* Center content - Service icons */}
                        <div className="grid grid-cols-3 gap-4 p-8">
                            <motion.div
                                className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl shadow-lg flex items-center justify-center"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <span className="text-xl">📊</span>
                            </motion.div>
                            <motion.div
                                className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl shadow-lg flex items-center justify-center"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                            >
                                <span className="text-xl">📧</span>
                            </motion.div>
                            <motion.div
                                className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl shadow-lg flex items-center justify-center"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                            >
                                <span className="text-xl">📈</span>
                            </motion.div>
                            <motion.div
                                className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl shadow-lg flex items-center justify-center"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
                            >
                                <span className="text-xl">🎯</span>
                            </motion.div>
                            <motion.div
                                className="w-12 h-12 bg-primary/20 dark:bg-primary/30 rounded-xl shadow-lg flex items-center justify-center border-2 border-primary"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <span className="text-xl">⚡</span>
                            </motion.div>
                            <motion.div
                                className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl shadow-lg flex items-center justify-center"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                            >
                                <span className="text-xl">📝</span>
                            </motion.div>
                            <motion.div
                                className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl shadow-lg flex items-center justify-center"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            >
                                <span className="text-xl">👥</span>
                            </motion.div>
                            <motion.div
                                className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl shadow-lg flex items-center justify-center"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                            >
                                <span className="text-xl">📅</span>
                            </motion.div>
                            <motion.div
                                className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl shadow-lg flex items-center justify-center"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
                            >
                                <span className="text-xl">💼</span>
                            </motion.div>
                        </div>
                    </div>

                    {/* Animated Gear - Top Left */}
                    <motion.div
                        className="absolute -top-4 left-4"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                            <path d="M30 18a12 12 0 100 24 12 12 0 000-24zm0 20a8 8 0 110-16 8 8 0 010 16z" fill="#f97316" />
                            <path d="M30 10l2 6h-4l2-6zm0 34l-2-6h4l-2 6zm14-14l-6-2v4l6-2zm-28 0l6 2v-4l-6 2zm22-12l-4 5-3-3 5-4 2 2zm-16 16l4-5 3 3-5 4-2-2zm16 0l-2-2-5 4 3 3 4-5zm-16-16l2 2 5-4-3-3-4 5z" fill="#f97316" />
                        </svg>
                    </motion.div>

                    {/* Animated Gear - Right */}
                    <motion.div
                        className="absolute top-20 right-8"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    >
                        <svg width="45" height="45" viewBox="0 0 60 60" fill="none">
                            <path d="M30 18a12 12 0 100 24 12 12 0 000-24zm0 20a8 8 0 110-16 8 8 0 010 16z" fill="#eab308" />
                            <path d="M30 10l2 6h-4l2-6zm0 34l-2-6h4l-2 6zm14-14l-6-2v4l6-2zm-28 0l6 2v-4l-6 2zm22-12l-4 5-3-3 5-4 2 2zm-16 16l4-5 3 3-5 4-2-2zm16 0l-2-2-5 4 3 3 4-5zm-16-16l2 2 5-4-3-3-4 5z" fill="#eab308" />
                        </svg>
                    </motion.div>

                    {/* Cloud with SaaS text - Floating */}
                    <motion.div
                        className="absolute -top-2 left-1/2 -translate-x-1/2"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <div className="relative">
                            <svg width="140" height="80" viewBox="0 0 140 80" fill="none">
                                <ellipse cx="70" cy="50" rx="55" ry="25" fill="white" stroke="#1e3a5f" strokeWidth="2" />
                                <ellipse cx="45" cy="40" rx="25" ry="20" fill="white" stroke="#1e3a5f" strokeWidth="2" />
                                <ellipse cx="95" cy="40" rx="25" ry="20" fill="white" stroke="#1e3a5f" strokeWidth="2" />
                                <ellipse cx="70" cy="35" rx="30" ry="22" fill="white" stroke="#1e3a5f" strokeWidth="2" />
                            </svg>
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 text-xl font-bold text-[#1e3a5f]">SaaS</span>
                        </div>
                    </motion.div>

                    {/* Arrow from cloud */}
                    <motion.div
                        className="absolute top-16 left-1/2 -translate-x-1/2"
                        animate={{ y: [0, 5, 0], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <svg width="30" height="40" viewBox="0 0 30 40" fill="none">
                            <path d="M15 0v30M5 20l10 15 10-15" stroke="#3b82f6" strokeWidth="3" fill="none" />
                        </svg>
                    </motion.div>

                    {/* Browser Window */}
                    <motion.div
                        className="absolute top-24 left-1/2 -translate-x-1/2"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    >
                        <div className="bg-white dark:bg-slate-800 rounded-lg border-2 border-[#1e3a5f] shadow-xl overflow-hidden w-48">
                            {/* Browser Header */}
                            <div className="bg-[#3b82f6] px-3 py-2 flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                            </div>
                            {/* Browser Content */}
                            <div className="p-3 bg-white dark:bg-slate-800">
                                <div className="flex items-start gap-2">
                                    {/* Folder Icon */}
                                    <div className="w-12 h-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-t-sm rounded-b-md relative">
                                        <div className="absolute -top-1.5 left-0 w-6 h-2 bg-amber-400 rounded-t-md" />
                                    </div>
                                    {/* Document Lines */}
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded w-full" />
                                        <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded w-4/5" />
                                        <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded w-3/5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Person on Laptop */}
                    <motion.div
                        className="absolute bottom-8 left-8"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    >
                        <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
                            {/* Bean Bag / Chair */}
                            <ellipse cx="70" cy="120" rx="45" ry="18" fill="#f97316" />
                            <ellipse cx="70" cy="100" rx="40" ry="35" fill="#fb923c" />

                            {/* Person Body */}
                            <ellipse cx="75" cy="75" rx="18" ry="25" fill="#1e3a5f" />

                            {/* Head */}
                            <circle cx="78" cy="45" r="15" fill="#fcd9bd" />

                            {/* Hair */}
                            <ellipse cx="78" cy="38" rx="12" ry="8" fill="#1e3a5f" />

                            {/* Arm pointing up */}
                            <path d="M55 65 L45 50 L50 45" stroke="#fcd9bd" strokeWidth="6" strokeLinecap="round" />

                            {/* Laptop */}
                            <rect x="85" y="80" width="35" height="25" rx="2" fill="#374151" />
                            <rect x="87" y="82" width="31" height="19" fill="#60a5fa" />
                            <rect x="80" y="105" width="45" height="4" rx="1" fill="#4b5563" />
                        </svg>
                    </motion.div>

                    {/* Plant Decoration - Bottom Right */}
                    <motion.div
                        className="absolute bottom-4 right-8"
                        animate={{ rotate: [-2, 2, -2] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
                            {/* Pot */}
                            <path d="M15 55 L20 75 L40 75 L45 55 Z" fill="#c2410c" />
                            <rect x="12" y="52" width="36" height="6" rx="2" fill="#ea580c" />
                            {/* Plant Stand */}
                            <path d="M18 75 L15 80 M42 75 L45 80 M30 75 L30 80" stroke="#92400e" strokeWidth="2" />
                            {/* Leaves */}
                            <ellipse cx="30" cy="35" rx="8" ry="15" fill="#0d9488" transform="rotate(-15 30 35)" />
                            <ellipse cx="22" cy="40" rx="7" ry="12" fill="#14b8a6" transform="rotate(-30 22 40)" />
                            <ellipse cx="38" cy="38" rx="7" ry="13" fill="#0d9488" transform="rotate(20 38 38)" />
                            <ellipse cx="30" cy="48" rx="6" ry="10" fill="#14b8a6" />
                            <ellipse cx="42" cy="45" rx="5" ry="10" fill="#0f766e" transform="rotate(30 42 45)" />
                        </svg>
                    </motion.div>

                    {/* Floating Particles */}
                    <motion.div
                        className="absolute top-32 left-6 w-3 h-3 rounded-full bg-blue-400/60"
                        animate={{ y: [0, -20, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute top-48 right-4 w-2 h-2 rounded-full bg-amber-400/60"
                        animate={{ y: [0, -15, 0], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    />
                    <motion.div
                        className="absolute bottom-32 left-4 w-2.5 h-2.5 rounded-full bg-primary/50"
                        animate={{ y: [0, -10, 0], opacity: [0.3, 0.8, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    />

                </div>
            </motion.div>
        </div>
    )
}
