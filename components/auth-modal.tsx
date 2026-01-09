"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { GoogleSignInButton } from "@/components/google-signin-button";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signup");

  const { signIn, signUp, loading, error, clearError } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      if (activeTab === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
      }

      onClose();

      const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
      if (hasSeenOnboarding) {
        router.push("/profile");
      }
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  const handleTabChange = (value: "signin" | "signup") => {
    setActiveTab(value);
    clearError();
    setEmail("");
    setPassword("");
    setName("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden border-0 bg-transparent">
        <div className="flex rounded-xl overflow-hidden shadow-2xl">

          {/* Left Side - Form */}
          <div className="flex-1 bg-background p-8 lg:p-10 relative">

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                {activeTab === "signup" ? (
                  <>Sign up for Business AI —<br />Start Growing Today</>
                ) : (
                  <>Welcome back to<br />Business AI</>
                )}
              </h1>
              <p className="text-muted-foreground text-sm lg:text-base">
                {activeTab === "signup"
                  ? "Access AI-powered business tools to automate invoices, presentations, emails and more."
                  : "Sign in to access your AI-powered business tools and continue where you left off."
                }
              </p>
            </div>

            {/* Terms notice for signup */}
            {activeTab === "signup" && (
              <div className="mb-6 p-3 bg-muted/50 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground">
                  By signing up, I agree to Business AI&apos;s{" "}
                  <Link href="/terms" className="text-primary underline hover:no-underline">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-primary underline hover:no-underline">Privacy Policy</Link>.
                </p>
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === "signup" && (
                <div>
                  <Input
                    type="text"
                    placeholder="Enter your name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 px-4 bg-background border-2 border-border focus:border-primary rounded-lg"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 h-12 px-4 bg-background border-2 border-border focus:border-primary rounded-lg"
                />
                <motion.button
                  type="submit"
                  disabled={loading || !email}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 h-12 bg-foreground text-background font-medium rounded-lg hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : activeTab === "signup" ? (
                    "Sign up for free"
                  ) : (
                    "Sign in"
                  )}
                </motion.button>
              </div>

              {activeTab === "signin" && (
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 px-4 pr-12 bg-background border-2 border-border focus:border-primary rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              )}

              {activeTab === "signup" && (
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-12 px-4 pr-12 bg-background border-2 border-border focus:border-primary rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-sm text-muted-foreground">or</span>
              </div>
            </div>

            {/* Social Login Info */}
            <p className="text-center text-sm text-muted-foreground mb-4">
              Verify your business email with Google
            </p>

            {/* Google Sign In */}
            <GoogleSignInButton />

            {/* Toggle between signin/signup */}
            <div className="mt-6 text-center">
              {activeTab === "signup" ? (
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    onClick={() => handleTabChange("signin")}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => handleTabChange("signup")}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign up for free
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* Right Side - Decorative Illustration */}
          <div className="hidden lg:flex w-[45%] bg-gradient-to-br from-blue-600 via-primary to-indigo-700 items-center justify-center p-8 relative overflow-hidden">
            {/* Close button for desktop */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Main content */}
            <div className="relative w-full max-w-sm text-center text-white">
              {/* Heading */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <h2 className="text-2xl font-bold mb-2">AI-Powered Business Tools</h2>
                <p className="text-white/80 text-sm">Everything you need to automate and scale</p>
              </motion.div>

              {/* Floating Service Cards */}
              <div className="space-y-3">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Smart Invoicing</p>
                    <p className="text-xs text-white/70">Generate professional invoices in seconds</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">AI Presentations</p>
                    <p className="text-xs text-white/70">Create stunning slides automatically</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Email Automation</p>
                    <p className="text-xs text-white/70">Launch campaigns at scale</p>
                  </div>
                </motion.div>
              </div>

              {/* Early Adopter Benefits */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
              >
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Early Adopter Benefits
                </p>
                <ul className="text-xs text-white/80 space-y-1">
                  <li className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    Free access to all premium features
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    Priority support & feature requests
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    Lock in founding member pricing
                  </li>
                </ul>
              </motion.div>
            </div>

            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
              <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-white/5" />
              <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
