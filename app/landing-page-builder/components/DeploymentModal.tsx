"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Globe, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface DeploymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
    currentSubdomain?: string;
    onDeploySuccess: (subdomain: string) => void;
}

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

    // Update state when prop changes
    if (currentSubdomain && !isDeployed && subdomain === "") {
        setSubdomain(currentSubdomain);
        setIsDeployed(true);
    }

    const handleDeploy = async () => {
        if (!subdomain) {
            setError("Please enter a subdomain");
            return;
        }

        setError(null);

        try {
            const response = await fetch("/api/deploy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ workspaceId, subdomain }),
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isDeployed ? "Deployment Settings" : "Deploy to Subdomain"}</DialogTitle>
                    <DialogDescription>
                        {isDeployed
                            ? "Your site is currently live. You can change the subdomain below."
                            : "Choose a unique subdomain to publish your site."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {isDeployed && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-900/50 mb-2">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <span className="font-medium text-green-900 dark:text-green-100">Live & Auto-Deploying</span>
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                                Changes are automatically reflected on your live site.
                            </p>
                            <a
                                href={fullUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:underline bg-white dark:bg-black/20 px-3 py-2 rounded border border-green-200 dark:border-green-800/50 w-full justify-center"
                            >
                                <Globe className="w-4 h-4" />
                                {subdomain}.{domain}
                            </a>
                        </div>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subdomain" className="text-right">
                            Subdomain
                        </Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <Input
                                id="subdomain"
                                value={subdomain}
                                onChange={(e) => {
                                    setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                                    setError(null);
                                    if (isDeployed) setIsDeployed(false); // Allow redeploying/updating
                                }}
                                placeholder="my-site"
                                className="flex-1"
                            />
                            <span className="text-sm text-gray-500">.{domain}</span>
                        </div>
                    </div>
                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm justify-end">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleDeploy} disabled={isLoading || !subdomain || (isDeployed && subdomain === currentSubdomain)}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isDeployed ? "Update Subdomain" : "Deploy Site"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
