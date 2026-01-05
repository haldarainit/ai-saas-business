"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowDown, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface TourStep {
    targetId: string;
    title: string;
    description: string;
    position: "top" | "bottom" | "left" | "right";
}

const tourSteps: TourStep[] = [
    {
        targetId: "join-button",
        title: "Create Your Account",
        description: "Click 'Join' to create your free account and unlock all AI-powered services.",
        position: "bottom",
    },
    {
        targetId: "get-started-button",
        title: "Explore Services",
        description: "Now click 'Get Started' to explore our powerful AI tools and services.",
        position: "bottom",
    },
];

export default function OnboardingTour() {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useAuth();

    // Detect when auth modal (dialog) opens/closes
    useEffect(() => {
        const checkForDialog = () => {
            const dialog = document.querySelector('[role="dialog"]');
            setIsModalOpen(!!dialog);
        };

        // Check initially
        checkForDialog();

        // Create observer to watch for dialog appearing/disappearing
        const observer = new MutationObserver(() => {
            checkForDialog();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        return () => observer.disconnect();
    }, []);

    // Check if user has seen onboarding
    useEffect(() => {
        setMounted(true);
        const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");

        if (!hasSeenOnboarding && !user) {
            // Small delay to let the page render first
            const timer = setTimeout(() => {
                setIsActive(true);
                setCurrentStep(0);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [user]);

    // When user logs in after step 1, show step 2
    useEffect(() => {
        if (user && currentStep === 0 && isActive) {
            // User just logged in, move to step 2
            setCurrentStep(1);
        }
    }, [user, currentStep, isActive]);

    // Update target element position
    const updateTargetPosition = useCallback(() => {
        const step = tourSteps[currentStep];
        if (!step) return;

        const targetElement = document.getElementById(step.targetId);
        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            setTargetRect(rect);
        }
    }, [currentStep]);

    useEffect(() => {
        if (!isActive) return;

        updateTargetPosition();

        // Update position on scroll and resize
        window.addEventListener("scroll", updateTargetPosition, true);
        window.addEventListener("resize", updateTargetPosition);

        return () => {
            window.removeEventListener("scroll", updateTargetPosition, true);
            window.removeEventListener("resize", updateTargetPosition);
        };
    }, [isActive, currentStep, updateTargetPosition]);

    const completeTour = useCallback(() => {
        localStorage.setItem("hasSeenOnboarding", "true");
        setIsActive(false);
    }, []);

    const skipTour = useCallback(() => {
        completeTour();
    }, [completeTour]);

    // Handle click on highlighted element
    useEffect(() => {
        if (!isActive || !targetRect) return;

        const step = tourSteps[currentStep];
        const targetElement = document.getElementById(step.targetId);

        if (!targetElement) return;

        const handleClick = () => {
            if (currentStep === tourSteps.length - 1) {
                // Last step - complete the tour
                completeTour();
            }
            // For step 0 (Join), the auth modal will open and user will log in
            // The useEffect watching for user will handle advancing to step 2
        };

        targetElement.addEventListener("click", handleClick);
        return () => targetElement.removeEventListener("click", handleClick);
    }, [isActive, currentStep, targetRect, completeTour]);

    if (!mounted || !isActive || isModalOpen) return null;

    const step = tourSteps[currentStep];

    // Calculate tooltip position
    const getTooltipStyle = () => {
        if (!targetRect) return {};

        const padding = 20;
        const tooltipWidth = 320;

        switch (step.position) {
            case "bottom":
                return {
                    top: targetRect.bottom + padding,
                    left: Math.max(16, Math.min(
                        targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
                        window.innerWidth - tooltipWidth - 16
                    )),
                };
            case "top":
                return {
                    bottom: window.innerHeight - targetRect.top + padding,
                    left: Math.max(16, Math.min(
                        targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
                        window.innerWidth - tooltipWidth - 16
                    )),
                };
            default:
                return {
                    top: targetRect.bottom + padding,
                    left: targetRect.left,
                };
        }
    };

    // Calculate arrow position
    const getArrowStyle = () => {
        if (!targetRect) return {};

        return {
            top: targetRect.top - 50,
            left: targetRect.left + targetRect.width / 2 - 16,
        };
    };

    return createPortal(
        <AnimatePresence>
            {isActive && targetRect && (
                <>
                    {/* Dark overlay with spotlight cutout */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[9998] pointer-events-none"
                        style={{
                            background: `radial-gradient(
                                ellipse ${targetRect.width + 40}px ${targetRect.height + 40}px at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px,
                                transparent 0%,
                                transparent 70%,
                                rgba(0, 0, 0, 0.85) 100%
                            )`,
                        }}
                    />

                    {/* Invisible overlay to block clicks outside spotlight - but allow target to be clicked */}
                    <div
                        className="fixed inset-0 z-[9997] cursor-not-allowed"
                        style={{
                            background: "transparent",
                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    />

                    {/* Make the target element clickable by placing an invisible clickable area */}
                    <div
                        className="fixed z-[10001] cursor-pointer"
                        style={{
                            top: targetRect.top,
                            left: targetRect.left,
                            width: targetRect.width,
                            height: targetRect.height,
                            background: "transparent",
                        }}
                        onClick={() => {
                            // Trigger click on the actual button
                            const targetElement = document.getElementById(step.targetId);
                            if (targetElement) {
                                targetElement.click();
                            }
                        }}
                    />

                    {/* Spotlight border/glow around target */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed z-[9999] pointer-events-none"
                        style={{
                            top: targetRect.top - 8,
                            left: targetRect.left - 8,
                            width: targetRect.width + 16,
                            height: targetRect.height + 16,
                            borderRadius: "16px",
                            border: "2px solid rgba(36, 101, 237, 0.8)",
                            boxShadow: "0 0 30px rgba(36, 101, 237, 0.5), 0 0 60px rgba(36, 101, 237, 0.3)",
                        }}
                    />

                    {/* Animated arrow pointing to target */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed z-[10000] pointer-events-none"
                        style={getArrowStyle()}
                    >
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <ArrowDown className="w-8 h-8 text-primary drop-shadow-[0_0_10px_rgba(36,101,237,0.8)]" />
                        </motion.div>
                    </motion.div>

                    {/* Tooltip */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="fixed z-[10000] w-80 pointer-events-auto"
                        style={getTooltipStyle()}
                    >
                        <div className="bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-4 border-b border-border/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl">
                                        <Sparkles className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground">{step.title}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            Step {currentStep + 1} of {tourSteps.length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-5 py-4">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {step.description}
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-3 bg-muted/30 border-t border-border/50 flex items-center justify-between">
                                <button
                                    onClick={skipTour}
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                                >
                                    <X className="w-3 h-3" />
                                    Skip Tour
                                </button>
                                <div className="flex gap-1.5">
                                    {tourSteps.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-2 h-2 rounded-full transition-colors ${idx === currentStep
                                                ? "bg-primary"
                                                : idx < currentStep
                                                    ? "bg-primary/50"
                                                    : "bg-muted-foreground/30"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
