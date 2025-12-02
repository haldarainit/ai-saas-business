"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmail() {
    const [verifying, setVerifying] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [employeeData, setEmployeeData] = useState<any>(null);

    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const token = searchParams.get("token");

        if (!token) {
            setError("Invalid verification link");
            setVerifying(false);
            return;
        }

        verifyEmail(token);
    }, [searchParams]);

    const verifyEmail = async (token: string) => {
        try {
            const response = await fetch(`/api/employee/verify-email?token=${token}`);
            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setEmployeeData(data.employee);

                toast({
                    title: "Email Verified!",
                    description: "Your email has been successfully verified.",
                });

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push("/portal/login");
                }, 3000);
            } else {
                setError(data.error || "Verification failed");
                toast({
                    title: "Verification Failed",
                    description: data.error || "Invalid or expired verification link",
                    variant: "destructive",
                });
            }
        } catch (err) {
            setError("Failed to verify email. Please try again.");
            toast({
                title: "Error",
                description: "Failed to verify email",
                variant: "destructive",
            });
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500/10 via-background to-cyan-500/10 p-4">
            <Card className="w-full max-w-md">
                <div className="p-8 text-center">
                    {verifying && (
                        <>
                            <Loader2 className="w-16 h-16 mx-auto mb-4 text-purple-500 animate-spin" />
                            <h1 className="text-2xl font-bold mb-2">Verifying Email...</h1>
                            <p className="text-muted-foreground">
                                Please wait while we verify your email address.
                            </p>
                        </>
                    )}

                    {!verifying && success && (
                        <>
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h1 className="text-2xl font-bold mb-2 text-green-600">
                                Email Verified!
                            </h1>
                            <p className="text-muted-foreground mb-6">
                                Your email has been successfully verified.
                            </p>
                            {employeeData && (
                                <div className="bg-muted p-4 rounded-lg mb-6">
                                    <p className="text-sm font-semibold">{employeeData.name}</p>
                                    <p className="text-xs text-muted-foreground">{employeeData.email}</p>
                                </div>
                            )}
                            <p className="text-sm text-muted-foreground mb-4">
                                Redirecting to login page in 3 seconds...
                            </p>
                            <Link href="/portal/login">
                                <Button>Go to Login</Button>
                            </Link>
                        </>
                    )}

                    {!verifying && error && (
                        <>
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                                <AlertCircle className="w-10 h-10 text-red-500" />
                            </div>
                            <h1 className="text-2xl font-bold mb-2 text-red-600">
                                Verification Failed
                            </h1>
                            <p className="text-muted-foreground mb-6">{error}</p>
                            <Link href="/portal/login">
                                <Button>Go to Login</Button>
                            </Link>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
}
