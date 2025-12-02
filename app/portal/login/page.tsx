"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogIn, User, Lock, Loader2 } from "lucide-react";
import { employeeAuth } from "@/lib/utils/employeeAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EmployeeLogin() {
    const [formData, setFormData] = useState({
        employeeId: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
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
                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Need help?{" "}
                            <Link href="/contact" className="text-primary hover:underline">
                                Contact HR
                            </Link>
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
