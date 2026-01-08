"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu, Zap, ChevronRight, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthModal } from "@/components/auth-modal";
import { OnboardingModal } from "@/components/onboarding-modal";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc =
    mounted && theme === "light" ? "/logo-white.png" : "/logo.png";

  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Guide", href: "/guide" },
  ];

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.[0]?.toUpperCase() || "U";
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleGetStartedClick = () => {
    if (user?.onboardingCompleted) {
      router.push("/get-started");
    } else {
      setOnboardingModalOpen(true);
    }
  };

  const handleMobileGetStartedClick = () => {
    setIsOpen(false);
    if (user?.onboardingCompleted) {
      router.push("/get-started");
    } else {
      setOnboardingModalOpen(true);
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled
          ? "bg-background/80 backdrop-blur-xl border-b shadow-sm"
          : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-transparent"
          }`}
      >
        <div className="container flex h-16 sm:h-18 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              href="/"
              className="flex items-center gap-2 group"
              aria-label="Enterprise AI Homepage"
            >
              <div className="relative">
                <Image
                  src={logoSrc}
                  alt="Business Accelerator Logo"
                  width={90}
                  height={90}
                  className="object-contain w-16 h-16 sm:w-18 sm:h-18 transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-base font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Business AI
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Navigation - Centered Pill Style */}
          <motion.nav
            className="hidden md:flex items-center gap-1 bg-muted/50 rounded-full px-2 py-1.5 border border-border/50"
            aria-label="Main Navigation"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${isActive(item.href)
                  ? "text-primary-foreground bg-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </motion.nav>

          {/* Desktop Actions */}
          <motion.div
            className="hidden md:flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <ThemeToggle />

            {user ? (
              <>
                <Button
                  onClick={handleGetStartedClick}
                  className="relative overflow-hidden flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-full border-0 h-auto shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 group"
                >
                  <Sparkles className="h-4 w-4 text-white transition-transform group-hover:rotate-12" />
                  <span className="text-sm font-semibold">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </Button>
                <Link href="/profile" aria-label="Go to profile">
                  <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-border hover:ring-primary/50 transition-all duration-300 hover:scale-105">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-semibold">
                      {getInitials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </>
            ) : (
              <Button
                onClick={() => setAuthModalOpen(true)}
                className="relative overflow-hidden flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-full border-0 h-auto shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 group"
                suppressHydrationWarning
              >
                <Zap className="h-4 w-4 text-white transition-transform group-hover:scale-110" />
                <span className="text-sm font-semibold">Join</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </Button>
            )}
          </motion.div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />

            {user && (
              <Link href="/profile" aria-label="Go to profile">
                <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-border hover:ring-primary/50 transition-all">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-semibold">
                    {getInitials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            )}

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open Menu"
                  suppressHydrationWarning
                  className="h-9 w-9 rounded-full hover:bg-muted"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 border-l-0 shadow-2xl">
                <SheetHeader className="p-5 border-b bg-gradient-to-r from-muted/50 to-muted/30">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <div className="flex items-center justify-between">
                    <Link
                      href="/"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3"
                    >
                      <Image
                        src={logoSrc}
                        alt="Business Accelerator Logo"
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                      <span className="text-base font-bold">Business AI</span>
                    </Link>
                  </div>
                </SheetHeader>

                {/* Mobile User Profile Section */}
                {user && (
                  <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                    <Link
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 group"
                    >
                      <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-base font-semibold">
                          {getInitials(user.name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1">
                        <span className="text-base font-semibold group-hover:text-primary transition-colors">
                          {user.name || "User"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          View Profile
                        </span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </Link>
                  </div>
                )}

                {/* Mobile Navigation Links */}
                <nav
                  className="flex flex-col py-3"
                  aria-label="Mobile Navigation"
                >
                  {navItems.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className={`flex items-center justify-between px-5 py-3.5 text-base font-medium transition-all ${isActive(item.href)
                        ? "bg-primary/10 text-primary border-l-4 border-primary"
                        : "hover:bg-muted hover:text-primary border-l-4 border-transparent"
                        }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <span>{item.label}</span>
                      <ChevronRight className={`h-4 w-4 transition-transform ${isActive(item.href) ? "text-primary" : "text-muted-foreground"}`} />
                    </Link>
                  ))}
                </nav>

                {/* Mobile CTA Section */}
                <div className="absolute bottom-0 left-0 right-0 p-5 border-t bg-gradient-to-t from-background to-background/80 backdrop-blur-sm">
                  {user ? (
                    <Button
                      onClick={handleMobileGetStartedClick}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl h-auto shadow-lg"
                    >
                      <Sparkles className="h-5 w-5 text-white" />
                      <span className="text-base font-semibold">Get Started</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setIsOpen(false);
                        setAuthModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl h-auto shadow-lg"
                    >
                      <Zap className="h-5 w-5 text-white" />
                      <span className="text-base font-semibold">Get Started</span>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <OnboardingModal
        isOpen={onboardingModalOpen}
        onClose={() => setOnboardingModalOpen(false)}
      />
    </>
  );
}

