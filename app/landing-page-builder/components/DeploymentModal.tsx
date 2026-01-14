"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Loader2, Globe, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft,
    User, Mail, Briefcase, Target, Building2, MapPin, Megaphone, Rocket,
    Sparkles, Users, ShoppingCart, Calendar, MailPlus, UserCircle,
    Zap, Store, Laptop, ShoppingBag, Heart, GraduationCap, Video,
    Building, Compass, Search, Instagram, Youtube, HelpCircle
} from "lucide-react";
import { toast } from "sonner";

interface DeploymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
    currentSubdomain?: string;
    onDeploySuccess: (subdomain: string) => void;
}

interface UserFormData {
    name: string;
    email: string;
    projectName: string;
    landingPageGoal: string;
    industry: string;
    country: string;
    referralSource: string;
}

const LANDING_PAGE_GOALS = [
    { value: "Generate leads", icon: Users },
    { value: "Sell a product", icon: ShoppingCart },
    { value: "Book appointments", icon: Calendar },
    { value: "Collect emails", icon: MailPlus },
    { value: "Personal portfolio", icon: UserCircle },
    { value: "Startup waitlist", icon: Rocket },
    { value: "Other", icon: Zap }
];

const INDUSTRIES = [
    { value: "Local Business", icon: Store },
    { value: "SaaS / Tech", icon: Laptop },
    { value: "Ecommerce", icon: ShoppingBag },
    { value: "Healthcare", icon: Heart },
    { value: "Education", icon: GraduationCap },
    { value: "Creator / Influencer", icon: Video },
    { value: "Agency", icon: Building },
    { value: "Other", icon: Compass }
];

const REFERRAL_SOURCES = [
    { value: "Google", icon: Search },
    { value: "Instagram", icon: Instagram },
    { value: "Friend", icon: Users },
    { value: "YouTube", icon: Youtube },
    { value: "Other", icon: HelpCircle }
];

export default function DeploymentModal({
    isOpen,
    onClose,
    workspaceId,
    currentSubdomain,
    onDeploySuccess
}: DeploymentModalProps) {
    const [subdomain, setSubdomain] = useState(currentSubdomain || "");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDeployed, setIsDeployed] = useState(!!currentSubdomain);
    const [step, setStep] = useState<1 | 2>(currentSubdomain ? 2 : 1);

    const [formData, setFormData] = useState<UserFormData>({
        name: "",
        email: "",
        projectName: "",
        landingPageGoal: "",
        industry: "",
        country: "",
        referralSource: ""
    });

    if (currentSubdomain && !isDeployed && subdomain === "") {
        setSubdomain(currentSubdomain);
        setIsDeployed(true);
        setStep(2);
    }

    const handleFormChange = (field: keyof UserFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const validateStep1 = (): boolean => {
        if (!formData.name.trim()) {
            setError("Please enter your name");
            return false;
        }
        if (!formData.email.trim()) {
            setError("Please enter your email");
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError("Please enter a valid email address");
            return false;
        }
        if (!formData.projectName.trim()) {
            setError("Please enter your project name");
            return false;
        }
        if (!formData.landingPageGoal) {
            setError("Please select your landing page goal");
            return false;
        }
        if (!formData.industry) {
            setError("Please select your industry");
            return false;
        }
        if (!formData.country.trim()) {
            setError("Please enter your country");
            return false;
        }
        return true;
    };

    const handleNextStep = () => {
        if (validateStep1()) {
            setStep(2);
            setError(null);
        }
    };

    const handleDeploy = async () => {
        if (!subdomain) {
            setError("Please enter a subdomain");
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch("/api/deploy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    workspaceId,
                    subdomain,
                    userData: formData
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsDeployed(true);
                onDeploySuccess(subdomain);
                toast.success("Site deployed successfully!");
            } else {
                setError(data.error || "Failed to deploy site");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const domain = typeof window !== 'undefined' ? window.location.host.split(':')[0] : 'localhost';
    const port = typeof window !== 'undefined' && window.location.port ? `:${window.location.port}` : '';
    const fullUrl = `http://${subdomain}.${domain}${port}`;

    const handleClose = () => {
        if (!isDeployed && !currentSubdomain) {
            setStep(1);
            setFormData({
                name: "",
                email: "",
                projectName: "",
                landingPageGoal: "",
                industry: "",
                country: "",
                referralSource: ""
            });
        }
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
                <div className="relative">
                    {/* Gradient Background Header */}
                    <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 px-8 py-6 text-white relative overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                {step === 1 ? (
                                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                ) : (
                                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <Rocket className="w-6 h-6" />
                                    </div>
                                )}
                                <h2 className="text-2xl font-bold">
                                    {isDeployed ? "Deployment Settings" : step === 1 ? "Tell Us About You" : "Launch Your Site"}
                                </h2>
                            </div>
                            <p className="text-white/80 text-sm">
                                {isDeployed
                                    ? "Your site is live! Manage your subdomain settings below."
                                    : step === 1
                                        ? "Help us personalize your experience and serve you better"
                                        : "Choose your unique subdomain and go live instantly"}
                            </p>
                        </div>

                        {/* Progress Indicator */}
                        {!isDeployed && (
                            <div className="flex items-center gap-2 mt-6 relative z-10">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${step >= 1 ? 'bg-white text-blue-600' : 'bg-white/30 text-white'
                                    }`}>
                                    1
                                </div>
                                <div className={`flex-1 h-1 rounded-full transition-all ${step >= 2 ? 'bg-white' : 'bg-white/30'
                                    }`} />
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${step >= 2 ? 'bg-white text-blue-600' : 'bg-white/30 text-white'
                                    }`}>
                                    2
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Form Content */}
                    <div className="bg-white dark:bg-gray-900 px-8 py-6 max-h-[60vh] overflow-y-auto">
                        {step === 1 && !isDeployed && (
                            <div className="space-y-5">
                                {/* Two Column Layout for Name & Email */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                                            <User className="w-4 h-4 text-blue-500" />
                                            Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => handleFormChange("name", e.target.value)}
                                            placeholder="John Doe"
                                            className="h-11 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                                            <Mail className="w-4 h-4 text-blue-500" />
                                            Email <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleFormChange("email", e.target.value)}
                                            placeholder="john@example.com"
                                            className="h-11 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Project Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="projectName" className="flex items-center gap-2 text-sm font-medium">
                                        <Briefcase className="w-4 h-4 text-blue-500" />
                                        Project Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="projectName"
                                        value={formData.projectName}
                                        onChange={(e) => handleFormChange("projectName", e.target.value)}
                                        placeholder="My Awesome Landing Page"
                                        className="h-11 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                                    />
                                </div>

                                {/* Landing Page Goal */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-sm font-medium">
                                        <Target className="w-4 h-4 text-blue-500" />
                                        Landing Page Goal <span className="text-red-500">*</span>
                                        <span className="text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-0.5 rounded-full font-medium">
                                            Important
                                        </span>
                                    </Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {LANDING_PAGE_GOALS.map((goal) => {
                                            const IconComponent = goal.icon;
                                            return (
                                                <button
                                                    key={goal.value}
                                                    type="button"
                                                    onClick={() => handleFormChange("landingPageGoal", goal.value)}
                                                    className={`p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${formData.landingPageGoal === goal.value
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                        }`}
                                                >
                                                    <IconComponent className={`w-5 h-5 mb-1.5 ${formData.landingPageGoal === goal.value
                                                            ? 'text-blue-600'
                                                            : 'text-gray-500'
                                                        }`} />
                                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 block leading-tight">{goal.value}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Industry */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-sm font-medium">
                                        <Building2 className="w-4 h-4 text-blue-500" />
                                        Industry / Category <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {INDUSTRIES.map((industry) => {
                                            const IconComponent = industry.icon;
                                            return (
                                                <button
                                                    key={industry.value}
                                                    type="button"
                                                    onClick={() => handleFormChange("industry", industry.value)}
                                                    className={`p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${formData.industry === industry.value
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                        }`}
                                                >
                                                    <IconComponent className={`w-5 h-5 mb-1.5 ${formData.industry === industry.value
                                                            ? 'text-blue-600'
                                                            : 'text-gray-500'
                                                        }`} />
                                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 block leading-tight">{industry.value}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Two Column for Country & Referral */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Country */}
                                    <div className="space-y-2">
                                        <Label htmlFor="country" className="flex items-center gap-2 text-sm font-medium">
                                            <MapPin className="w-4 h-4 text-blue-500" />
                                            Country <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="country"
                                            value={formData.country}
                                            onChange={(e) => handleFormChange("country", e.target.value)}
                                            placeholder="United States"
                                            className="h-11 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                                        />
                                    </div>

                                    {/* Referral Source */}
                                    <div className="space-y-2">
                                        <Label htmlFor="referralSource" className="flex items-center gap-2 text-sm font-medium">
                                            <Megaphone className="w-4 h-4 text-blue-500" />
                                            How did you hear about us?
                                            <span className="text-xs text-gray-400">(Optional)</span>
                                        </Label>
                                        <select
                                            id="referralSource"
                                            value={formData.referralSource}
                                            onChange={(e) => handleFormChange("referralSource", e.target.value)}
                                            className="flex h-11 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                                        >
                                            <option value="">Select an option...</option>
                                            {REFERRAL_SOURCES.map((source) => (
                                                <option key={source.value} value={source.value}>
                                                    {source.value}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                {isDeployed && (
                                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-emerald-500 rounded-xl">
                                                <CheckCircle2 className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <span className="font-semibold text-emerald-900 dark:text-emerald-100 block">Live & Auto-Deploying</span>
                                                <span className="text-sm text-emerald-700 dark:text-emerald-300">Changes sync automatically</span>
                                            </div>
                                        </div>
                                        <a
                                            href={fullUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-gray-700 px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-700 font-medium transition-all hover:shadow-md"
                                        >
                                            <Globe className="w-5 h-5" />
                                            {subdomain}.{domain}
                                            <ArrowRight className="w-4 h-4 ml-1" />
                                        </a>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <Label htmlFor="subdomain" className="flex items-center gap-2 text-sm font-medium">
                                        <Globe className="w-4 h-4 text-blue-500" />
                                        Choose Your Subdomain
                                    </Label>
                                    <div className="flex items-center gap-0 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                                        <div className="flex-1">
                                            <Input
                                                id="subdomain"
                                                value={subdomain}
                                                onChange={(e) => {
                                                    setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                                                    setError(null);
                                                    if (isDeployed) setIsDeployed(false);
                                                }}
                                                placeholder="my-awesome-site"
                                                className="h-12 border-0 bg-transparent text-lg font-medium focus:ring-0 focus:outline-none"
                                            />
                                        </div>
                                        <div className="px-4 py-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-700 dark:text-blue-300 font-medium text-sm">
                                            .{domain}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                        <HelpCircle className="w-3.5 h-3.5" />
                                        Use lowercase letters, numbers, and hyphens only
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-3 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 px-8 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                        {step === 2 && !isDeployed && !currentSubdomain ? (
                            <Button
                                variant="ghost"
                                onClick={() => setStep(1)}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        ) : (
                            <div />
                        )}

                        {step === 1 && !isDeployed ? (
                            <Button
                                onClick={handleNextStep}
                                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-8 h-11 rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30"
                            >
                                Continue
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleDeploy}
                                disabled={isLoading || !subdomain || (isDeployed && subdomain === currentSubdomain)}
                                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-8 h-11 rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none"
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isDeployed ? (
                                    <>Update Subdomain</>
                                ) : (
                                    <>
                                        <Rocket className="mr-2 h-4 w-4" />
                                        Deploy Now
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
