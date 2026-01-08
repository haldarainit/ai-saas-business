"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    Mail,
    Key,
    Server,
    Check,
    X,
    Loader2,
    Settings2,
    AlertCircle,
    ExternalLink,
    Shield,
    Eye,
    EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface EmailProvider {
    id: string;
    name: string;
    host: string;
    port: number;
    helpUrl?: string;
    instructions?: string;
}

interface EmailSettings {
    emailProvider: string;
    emailUser: string;
    hasPassword: boolean;
    fromName: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    isConfigured: boolean;
    verificationStatus: "pending" | "verified" | "failed";
    lastVerifiedAt?: string;
}

interface EmailSettingsConfiguratorProps {
    onConfigured?: (isConfigured: boolean) => void;
}

export default function EmailSettingsConfigurator({
    onConfigured,
}: EmailSettingsConfiguratorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [providers, setProviders] = useState<EmailProvider[]>([]);
    const [settings, setSettings] = useState<EmailSettings | null>(null);
    const [isConfigured, setIsConfigured] = useState(false);

    // Form state
    const [emailProvider, setEmailProvider] = useState("gmail");
    const [emailUser, setEmailUser] = useState("");
    const [emailPassword, setEmailPassword] = useState("");
    const [fromName, setFromName] = useState("Email Campaign");
    const [smtpHost, setSmtpHost] = useState("");
    const [smtpPort, setSmtpPort] = useState(587);
    const [smtpSecure, setSmtpSecure] = useState(false);

    // Load settings on mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/email-settings");
            const result = await response.json();

            if (result.success) {
                setProviders(result.data.providers || []);
                setIsConfigured(result.data.isConfigured);

                if (result.data.settings) {
                    const s = result.data.settings;
                    setSettings(s);
                    setEmailProvider(s.emailProvider || "gmail");
                    setEmailUser(s.emailUser || "");
                    setFromName(s.fromName || "Email Campaign");
                    setSmtpHost(s.smtpHost || "");
                    setSmtpPort(s.smtpPort || 587);
                    setSmtpSecure(s.smtpSecure || false);
                }

                onConfigured?.(result.data.isConfigured);
            }
        } catch (error) {
            console.error("Error loading email settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!emailUser) {
            toast.error("Please enter your email address");
            return;
        }

        // Only require password if not already set
        if (!emailPassword && !settings?.hasPassword) {
            toast.error("Please enter your email password/app password");
            return;
        }

        if (emailProvider === "custom" && !smtpHost) {
            toast.error("Please enter SMTP host for custom provider");
            return;
        }

        try {
            setIsSaving(true);

            const response = await fetch("/api/email-settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    emailProvider,
                    emailUser,
                    emailPassword: emailPassword || undefined, // Only send if provided
                    fromName,
                    smtpHost,
                    smtpPort,
                    smtpSecure,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success("Email settings saved successfully!");
                setIsConfigured(result.data.isConfigured);
                onConfigured?.(result.data.isConfigured);
                await loadSettings();
            } else {
                toast.error(result.error || "Failed to save settings");
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const handleVerify = async () => {
        try {
            setIsVerifying(true);

            const response = await fetch("/api/email-settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "verify",
                    emailProvider,
                    emailUser,
                    emailPassword: emailPassword || undefined,
                    smtpHost,
                    smtpPort,
                    smtpSecure,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success("✅ SMTP connection verified successfully!");
                await loadSettings();
            } else {
                toast.error(result.error || "Verification failed");
            }
        } catch (error) {
            console.error("Error verifying connection:", error);
            toast.error("Verification failed");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleRemoveSettings = async () => {
        if (!confirm("Are you sure you want to remove your email settings?")) {
            return;
        }

        try {
            const response = await fetch("/api/email-settings", {
                method: "DELETE",
            });

            const result = await response.json();

            if (result.success) {
                toast.success("Email settings removed");
                setSettings(null);
                setIsConfigured(false);
                setEmailUser("");
                setEmailPassword("");
                setFromName("Email Campaign");
                onConfigured?.(false);
            } else {
                toast.error(result.error || "Failed to remove settings");
            }
        } catch (error) {
            console.error("Error removing settings:", error);
            toast.error("Failed to remove settings");
        }
    };

    const currentProvider = providers.find((p) => p.id === emailProvider);

    const VerificationBadge = () => {
        if (!settings) return null;

        switch (settings.verificationStatus) {
            case "verified":
                return (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        <Check className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                );
            case "failed":
                return (
                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                        <X className="w-3 h-3 mr-1" /> Failed
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                        <AlertCircle className="w-3 h-3 mr-1" /> Pending
                    </Badge>
                );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Card className="p-6 bg-background/60 backdrop-blur-sm border transition-all duration-300 hover:shadow-lg dark:bg-background/80 cursor-pointer">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${isConfigured
                                        ? "bg-green-500/10"
                                        : "bg-orange-500/10"
                                    }`}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                ) : isConfigured ? (
                                    <Mail className="w-5 h-5 text-green-500" />
                                ) : (
                                    <Settings2 className="w-5 h-5 text-orange-500" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Email Configuration</h3>
                                <p className="text-sm text-muted-foreground">
                                    {isLoading
                                        ? "Loading..."
                                        : isConfigured
                                            ? `Sending via ${settings?.emailUser || "configured email"}`
                                            : "Configure your SMTP settings"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isConfigured && settings && <VerificationBadge />}
                            <Button variant="outline" size="sm">
                                {isConfigured ? "Edit" : "Configure"}
                            </Button>
                        </div>
                    </div>
                </Card>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings2 className="w-5 h-5" />
                        Email Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Configure your email settings to send campaigns from your own email
                        address.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Provider Selection */}
                    <div className="space-y-2">
                        <Label>Email Provider</Label>
                        <Select value={emailProvider} onValueChange={setEmailProvider}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                                {providers.map((provider) => (
                                    <SelectItem key={provider.id} value={provider.id}>
                                        {provider.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {currentProvider?.instructions && (
                            <p className="text-xs text-muted-foreground">
                                {currentProvider.instructions}
                                {currentProvider.helpUrl && (
                                    <a
                                        href={currentProvider.helpUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-1 text-primary inline-flex items-center hover:underline"
                                    >
                                        Learn more <ExternalLink className="w-3 h-3 ml-1" />
                                    </a>
                                )}
                            </p>
                        )}
                    </div>

                    {/* Custom SMTP Settings */}
                    {emailProvider === "custom" && (
                        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Server className="w-4 h-4" />
                                Custom SMTP Settings
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>SMTP Host</Label>
                                    <Input
                                        value={smtpHost}
                                        onChange={(e) => setSmtpHost(e.target.value)}
                                        placeholder="smtp.example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Port</Label>
                                    <Input
                                        type="number"
                                        value={smtpPort}
                                        onChange={(e) => setSmtpPort(parseInt(e.target.value) || 587)}
                                        placeholder="587"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="smtpSecure"
                                    checked={smtpSecure}
                                    onChange={(e) => setSmtpSecure(e.target.checked)}
                                    className="rounded"
                                />
                                <Label htmlFor="smtpSecure" className="text-sm cursor-pointer">
                                    Use SSL/TLS (for port 465)
                                </Label>
                            </div>
                        </div>
                    )}

                    {/* Email Credentials */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={emailUser}
                                    onChange={(e) => setEmailUser(e.target.value)}
                                    placeholder="your-email@example.com"
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                Password / App Password
                                <Shield className="w-3 h-3 text-muted-foreground" />
                            </Label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={emailPassword}
                                    onChange={(e) => setEmailPassword(e.target.value)}
                                    placeholder={settings?.hasPassword ? "••••••••••" : "Enter password"}
                                    className="pl-10 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            {settings?.hasPassword && (
                                <p className="text-xs text-muted-foreground">
                                    Leave blank to keep existing password
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>From Name</Label>
                            <Input
                                value={fromName}
                                onChange={(e) => setFromName(e.target.value)}
                                placeholder="Your Company Name"
                            />
                            <p className="text-xs text-muted-foreground">
                                This will appear as the sender name in emails
                            </p>
                        </div>
                    </div>

                    {/* Security Info */}
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="security" className="border rounded-lg px-4">
                            <AccordionTrigger className="text-sm">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-primary" />
                                    Security Information
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground">
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Your credentials are stored securely and encrypted</li>
                                    <li>
                                        For Gmail/Outlook, use an App Password instead of your main
                                        password
                                    </li>
                                    <li>Never share your password with anyone</li>
                                    <li>You can remove your settings at any time</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Status */}
                    {settings && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Status:</span>
                                <VerificationBadge />
                            </div>
                            {settings.lastVerifiedAt && (
                                <span className="text-xs text-muted-foreground">
                                    Last verified:{" "}
                                    {new Date(settings.lastVerifiedAt).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-row">
                    {isConfigured && (
                        <Button
                            variant="ghost"
                            onClick={handleRemoveSettings}
                            className="text-destructive hover:text-destructive"
                        >
                            Remove Settings
                        </Button>
                    )}
                    <div className="flex gap-2 ml-auto">
                        <Button
                            variant="outline"
                            onClick={handleVerify}
                            disabled={isVerifying || !emailUser || (!emailPassword && !settings?.hasPassword)}
                        >
                            {isVerifying ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Test Connection
                                </>
                            )}
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Settings"
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
