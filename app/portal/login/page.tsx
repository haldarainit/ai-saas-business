"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogIn, User, Lock, Loader2, KeyRound, Mail, Shield, ArrowLeft } from "lucide-react";
import { employeeAuth } from "@/lib/utils/employeeAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function EmployeeLogin() {
    const [formData, setFormData] = useState({
        employeeId: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: Enter ID, 2: Enter OTP, 3: New Password
    const [forgotData, setForgotData] = useState({
        employeeId: "",
        otp: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [maskedEmail, setMaskedEmail] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [otpAttempts, setOtpAttempts] = useState(0);
    const { toast } = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/employee/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                // Store token and employee data
                employeeAuth.setToken(data.token);
                employeeAuth.setEmployeeData(data.employee);

                toast({
                    title: "Login Successful",
                    description: `Welcome back, ${data.employee.name}!`,
                });

                // Redirect to attendance portal
                router.push("/portal/attendance");
            } else {
                toast({
                    title: "Login Failed",
                    description: data.error || "Invalid credentials",
                    variant: "destructive",
                });

                // Show email verification prompt if needed
                if (data.emailNotVerified) {
                    toast({
                        title: "Email Not Verified",
                        description: "Please check your email and verify your account first.",
                        variant: "destructive",
                    });
                }
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to login. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (forgotPasswordStep === 1) {
            // Step 1: Send OTP
            if (!forgotData.employeeId) {
                toast({
                    title: "Employee ID Required",
                    description: "Please enter your Employee ID",
                    variant: "destructive",
                });
                return;
            }

            setLoading(true);
            try {
                const response = await fetch("/api/employee/forgot-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        employeeId: forgotData.employeeId,
                        action: "send-otp",
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    setMaskedEmail(data.maskedEmail);
                    setForgotPasswordStep(2);
                    toast({
                        title: "✅ OTP Sent!",
                        description: `Verification code sent to ${data.maskedEmail}`,
                    });
                } else {
                    toast({
                        title: "Error",
                        description: data.error || "Failed to send OTP",
                        variant: "destructive",
                    });
                }
            } catch (error) {
                toast({
                    title: "Network Error",
                    description: "Failed to send OTP. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        } else if (forgotPasswordStep === 2) {
            // Step 2: Verify OTP
            if (!forgotData.otp || forgotData.otp.length !== 6) {
                toast({
                    title: "Invalid OTP",
                    description: "Please enter the 6-digit OTP",
                    variant: "destructive",
                });
                return;
            }

            setLoading(true);
            try {
                const response = await fetch("/api/employee/forgot-password", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        employeeId: forgotData.employeeId,
                        otp: forgotData.otp,
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    setResetToken(data.resetToken);
                    setForgotPasswordStep(3);
                    toast({
                        title: "✅ OTP Verified!",
                        description: "Now set your new password",
                    });
                } else {
                    setOtpAttempts(prev => prev + 1);
                    toast({
                        title: "Invalid OTP",
                        description: data.error || "Please try again",
                        variant: "destructive",
                    });
                }
            } catch (error) {
                toast({
                    title: "Network Error",
                    description: "Failed to verify OTP. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        } else if (forgotPasswordStep === 3) {
            // Step 3: Reset Password
            if (!forgotData.newPassword || forgotData.newPassword.length < 6) {
                toast({
                    title: "Weak Password",
                    description: "Password must be at least 6 characters",
                    variant: "destructive",
                });
                return;
            }

            if (forgotData.newPassword !== forgotData.confirmPassword) {
                toast({
                    title: "Passwords Don't Match",
                    description: "Please confirm your password correctly",
                    variant: "destructive",
                });
                return;
            }

            setLoading(true);
            try {
                const response = await fetch("/api/employee/reset-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        employeeId: forgotData.employeeId,
                        resetToken: resetToken,
                        newPassword: forgotData.newPassword,
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    toast({
                        title: "✅ Password Reset Successful!",
                        description: "You can now login with your new password",
                    });
                    setShowForgotPassword(false);
                    setForgotPasswordStep(1);
                    setForgotData({
                        employeeId: "",
                        otp: "",
                        newPassword: "",
                        confirmPassword: "",
                    });
                    setFormData({ ...formData, employeeId: forgotData.employeeId });
                } else {
                    toast({
                        title: "Error",
                        description: data.error || "Failed to reset password",
                        variant: "destructive",
                    });
                }
            } catch (error) {
                toast({
                    title: "Network Error",
                    description: "Failed to reset password. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/employee/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employeeId: forgotData.employeeId,
                    action: "send-otp",
                }),
            });

            const data = await response.json();

            if (data.success) {
                setOtpAttempts(0);
                toast({
                    title: "✅ OTP Resent!",
                    description: `New code sent to ${data.maskedEmail}`,
                });
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to resend OTP",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Network Error",
                description: "Failed to resend OTP",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500/10 via-background to-cyan-500/10 p-4">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <Card className="w-full max-w-md relative z-10 backdrop-blur-sm bg-background/95">
                <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 mb-4">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">
                            Employee Portal
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Sign in to access your attendance system
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label htmlFor="employeeId">Employee ID</Label>
                            <div className="relative mt-2">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="employeeId"
                                    placeholder="EMP001"
                                    value={formData.employeeId}
                                    onChange={(e) =>
                                        setFormData({ ...formData, employeeId: e.target.value })
                                    }
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="password">Password</Label>
                            <div className="relative mt-2">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5 mr-2" />
                                    Sign In
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center space-y-3">
                        <Button
                            variant="link"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-primary hover:underline"
                        >
                            <KeyRound className="w-4 h-4 mr-2" />
                            Forgot Password?
                        </Button>
                        <p className="text-sm text-muted-foreground">
                            Need help?{" "}
                            <Link href="/contact" className="text-primary hover:underline">
                                Contact HR
                            </Link>
                        </p>
                    </div>
                </div>
            </Card>

            {/* Forgot Password Modal */}
            <Dialog open={showForgotPassword} onOpenChange={(open) => {
                if (!open) {
                    setShowForgotPassword(false);
                    setForgotPasswordStep(1);
                    setForgotData({
                        employeeId: "",
                        otp: "",
                        newPassword: "",
                        confirmPassword: "",
                    });
                    setMaskedEmail("");
                    setResetToken("");
                    setOtpAttempts(0);
                }
            }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <KeyRound className="w-6 h-6 text-purple-500" />
                            Reset Password
                        </DialogTitle>
                        <DialogDescription>
                            {forgotPasswordStep === 1 && "Enter your Employee ID to receive an OTP"}
                            {forgotPasswordStep === 2 && `Enter the OTP sent to ${maskedEmail}`}
                            {forgotPasswordStep === 3 && "Create a new password for your account"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Step 1: Enter Employee ID */}
                        {forgotPasswordStep === 1 && (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="forgot-employee-id">Employee ID</Label>
                                    <div className="relative mt-2">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input
                                            id="forgot-employee-id"
                                            placeholder="EMP001"
                                            value={forgotData.employeeId}
                                            onChange={(e) =>
                                                setForgotData({ ...forgotData, employeeId: e.target.value })
                                            }
                                            className="pl-10"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <p className="text-sm text-muted-foreground flex items-start gap-2">
                                        <Mail className="w-4 h-4 mt-0.5 text-blue-500" />
                                        A 6-digit verification code will be sent to your registered email address
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Enter OTP */}
                        {forgotPasswordStep === 2 && (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                                    <Mail className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                    <p className="text-sm font-medium">OTP sent to</p>
                                    <p className="text-lg font-bold text-green-600">{maskedEmail}</p>
                                </div>

                                <div>
                                    <Label htmlFor="otp">Enter 6-Digit OTP</Label>
                                    <div className="relative mt-2">
                                        <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input
                                            id="otp"
                                            placeholder="000000"
                                            value={forgotData.otp}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                setForgotData({ ...forgotData, otp: value });
                                            }}
                                            className="pl-10 text-center text-2xl tracking-widest font-mono"
                                            maxLength={6}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                {otpAttempts > 0 && (
                                    <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                        <p className="text-sm text-orange-600">
                                            ⚠️ Invalid OTP. Attempts: {otpAttempts}/5
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-muted-foreground">Didn't receive OTP?</p>
                                    <Button
                                        variant="link"
                                        onClick={handleResendOTP}
                                        disabled={loading}
                                        className="text-primary"
                                    >
                                        Resend OTP
                                    </Button>
                                </div>

                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <p className="text-xs text-muted-foreground">
                                        💡 OTP is valid for 10 minutes. Check your spam folder if not received.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 3: New Password */}
                        {forgotPasswordStep === 3 && (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                                    <Shield className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                    <p className="text-sm font-medium text-green-600">✓ Identity Verified</p>
                                </div>

                                <div>
                                    <Label htmlFor="new-password">New Password</Label>
                                    <div className="relative mt-2">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input
                                            id="new-password"
                                            type="password"
                                            placeholder="Enter new password"
                                            value={forgotData.newPassword}
                                            onChange={(e) =>
                                                setForgotData({ ...forgotData, newPassword: e.target.value })
                                            }
                                            className="pl-10"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="confirm-password">Confirm Password</Label>
                                    <div className="relative mt-2">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            placeholder="Confirm new password"
                                            value={forgotData.confirmPassword}
                                            onChange={(e) =>
                                                setForgotData({ ...forgotData, confirmPassword: e.target.value })
                                            }
                                            className="pl-10"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <p className="text-xs text-muted-foreground">
                                        🔒 Password must be at least 6 characters long
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            {forgotPasswordStep > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={() => setForgotPasswordStep(prev => prev - 1)}
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>
                            )}
                            <Button
                                onClick={handleForgotPassword}
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        {forgotPasswordStep === 1 && "Send OTP"}
                                        {forgotPasswordStep === 2 && "Verify OTP"}
                                        {forgotPasswordStep === 3 && "Reset Password"}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
